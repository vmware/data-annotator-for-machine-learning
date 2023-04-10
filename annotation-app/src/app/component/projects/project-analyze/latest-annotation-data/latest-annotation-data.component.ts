/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ViewChild, ElementRef, Input, enableProdMode, Renderer2 } from '@angular/core';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { ToolService } from 'src/app/services/common/tool.service';
import { ApiService } from 'src/app/services/api.service';
import { ColorsRainbow } from '../../../../model/constant';
import * as _ from 'lodash';
import { LabelStudioService } from 'src/app/services/label-studio.service';

enableProdMode();

declare function modelChart(options: any): any;

@Component({
  selector: 'app-latest-annotation-data',
  templateUrl: './latest-annotation-data.component.html',
  styleUrls: ['./latest-annotation-data.component.scss'],
})
export class LatestAnnotationDataComponent implements OnInit {
  @ViewChild('modelChart') modelChart: ElementRef;
  @Input() msg: any;
  modelChartDatas: any = [];
  user;
  page;
  pageSize;
  pageFlag;
  pageSizeFlag;
  loadingModelD3: boolean;
  noModel: boolean;
  modelChartWidth = 0;
  isInit: Number;
  isInitFlag: Number;
  loading: boolean;
  loadingFlag: boolean;
  firstLoadTable: boolean;
  firstLoadFlag: boolean;
  innerTable: any = [];
  previewSrsHeader: any = [];
  totalItems: Number;
  totalPages: Number;
  categoryList: any = [];
  colorsRainbow = ColorsRainbow;
  previewSrs: any = [];
  getALLSrsParam;
  previewHeadDatas: any = [];
  imagePolyLabelTemplate: any;
  imageRectLabelTemplate: any;
  imageHeader: any;
  selectedLogsToModify: any = [];
  selectAllStatus: boolean;
  previewFlagHeader: any;
  previewFlagContent: any;
  totalItemsFlag: number;
  totalPagesFlag: number;
  selected: any = [];
  selectedFlag;
  formerFilenameFilter: string;
  showTreeView: boolean;
  treeData: any;

  constructor(
    private apiService: ApiService,
    private el: ElementRef,
    public env: EnvironmentsService,
    private toolService: ToolService,
    private LabelStudioService: LabelStudioService,
    private renderer2: Renderer2,
  ) {
    this.page = 1;
    this.pageSize = 10;
    this.pageFlag = 1;
    this.pageSizeFlag = 10;
  }

  ngOnInit(): void {
    if (this.msg?.labelType != 'numericLabel' && !this.msg?.isMultipleLabel) {
      this.getAccuracy(this.msg._id);
    }
    // this.categoryList = this.msg?.categoryList?.split(',');
    this.previewHeadDatas = ['Annotator', 'Annotate Time', 'Re-Label'];
    if (this.msg?.projectType === 'image') {
      this.sortLabelForImage(this.msg?.categoryList?.split(','), this.msg?.annotationQuestion);
      this.previewHeadDatas = [];
    }
    this.getALLSrsParam = {
      projectName: this.msg?.projectName,
      pageNumber: this.page,
      limit: this.pageSize,
      id: this.msg?._id,
      fname: '',
    };
    this.isInit = 1;
    this.isInitFlag = 1;
    this.loading = true;
    this.loadingFlag = true;
    this.firstLoadTable = true;
    this.firstLoadFlag = true;
    this.innerTable =
      this.msg.projectType == 'ner'
        ? ['Entity', 'Text', 'Start_idx', 'End_idx']
        : ['LineNumber', 'LineContent', 'Label', 'FreeText'];
    setTimeout(() => {
      this.getALLSrs();
      this.getALLFlag();
    }, 1000);
  }

  ngAfterViewInit() {
    if (this.msg.labelType != 'numericLabel' && !this.msg.isMultipleLabel) {
      this.modelChartWidth = this.el.nativeElement.querySelector('.modelChartBox').offsetWidth;
      const onresize = (dom_elem, callback) => {
        const resizeObserver = new ResizeObserver(() => callback());
        resizeObserver.observe(dom_elem);
      };
      const chartEL = document.getElementById('modelChart');
      let that = this;
      onresize(chartEL, function () {
        if (
          that.msg.labelType != 'numericLabel' &&
          that.modelChartDatas.length > 0 &&
          that.el.nativeElement.querySelector('.modelChartBox') &&
          chartEL.offsetWidth > 0
        ) {
          that.modelChartWidth = that.el.nativeElement.querySelector('.modelChartBox').offsetWidth;
          that.showModelChart(
            that.modelChart.nativeElement,
            that.modelChartDatas,
            that.modelChartWidth,
            that.msg.al.estimator === 'GBC'
              ? 'GradientBoostingClassifier'
              : that.msg.al.estimator === 'KNC'
              ? 'KNeighborsClassifier'
              : 'RandomForestClassifier',
            that.msg.al.trigger,
            that.msg.al.frequency,
            that.getSamplingStrategy(that.msg.al.queryStrategy),
          );
        }
      });
    }
  }

  sortLabelForImage(categories, annotationQuestion) {
    categories.forEach((element, index) => {
      if (index >= 30) {
        index = index - 30;
      }
      this.imageRectLabelTemplate += `<Label value="${element}" background="${this.colorsRainbow[index]}" selectedColor="white"/>`;
      this.imagePolyLabelTemplate += `<Label value="${element}" background="${this.colorsRainbow[index]}" selectedColor="white"/>`;
    });
    this.imageHeader = `<Header style="display:none" value="${annotationQuestion}"/>`;
  }

  getSamplingStrategy(queryStrategy: any) {
    if (queryStrategy) {
      const sampling = {
        PB_UNS: 'Pool-based uncertainty_sampling',
        PB_MS: 'Pool-based margin_sampling',
        PB_ES: 'Pool-based entropy_sampling',
        RBM_UNBS: 'Ranked batch mode uncertainty_batch_sampling',
      };
      return sampling[queryStrategy];
    }
    return 'Pool-based uncertainty_sampling';
  }

  getAccuracy(id) {
    this.loadingModelD3 = true;
    this.apiService.getAccuracy(id).subscribe(
      (response) => {
        if (response.status) {
          this.modelChartDatas = response.accuracy;
          try {
            this.showModelChart(
              this.modelChart.nativeElement,
              this.modelChartDatas,
              this.modelChartWidth,
              this.msg.al.estimator === 'GBC'
                ? 'GradientBoostingClassifier'
                : this.msg.al.estimator === 'KNC'
                ? 'KNeighborsClassifier'
                : 'RandomForestClassifier',
              this.msg.al.trigger,
              this.msg.al.frequency,
              this.getSamplingStrategy(this.msg.al.queryStrategy),
            );
            this.loadingModelD3 = false;
          } catch (err) {
            this.loadingModelD3 = false;
          }
        } else {
          this.noModel = true;
          this.loadingModelD3 = false;
          this.modelChartDatas = [];
        }
      },
      (error) => {
        this.loadingModelD3 = false;
      },
    );
  }

  showModelChart(conf, data, width, estimator, threshold, frequency, samplingStrategy) {
    modelChart({
      container: conf,
      data,
      width,
      estimator,
      threshold,
      frequency,
      samplingStrategy,
    });
  }

  resetLoguserInputs(sr, originalData?) {
    if (!sr.MSG) {
      let originalText = originalData ? originalData : sr.originalData;
      sr.userInputs.forEach((element) => {
        element.problemCategory?.forEach((element1) => {
          for (const key in originalText) {
            if (element1.line == key) {
              element1.text = originalText[key];
              break;
            }
          }
        });
      });
    } else {
      return sr;
    }
  }

  resetLogOriginalData(sr) {
    if (!sr.MSG) {
      const flag = [];
      let preview = '';
      let res;
      let that = this;
      _.forIn(sr.originalData, function (value, key) {
        const a = { index: key, text: value };
        preview = preview + (key + '. ' + value);
        // to add label to resetLogOriginalData
        if (sr.userInputs.length > 0 && sr.userInputs[0].problemCategory) {
          for (let i = 0; i < sr.userInputs[0].problemCategory.length; i++) {
            if (key === sr.userInputs[0].problemCategory[i].line) {
              a['label'] = sr.userInputs[0].problemCategory[i].label;
              a['backgroundColorLabel'] =
                that.colorsRainbow[that.categoryList.indexOf(sr.userInputs[0].problemCategory[i].label)];
              a['backgroundColorText'] = that.toolService.hexToRgb(
                that.colorsRainbow[that.categoryList.indexOf(sr.userInputs[0].problemCategory[i].label)],
              );
            }
          }
        }
        flag.push(a);
      });
      sr.originalData = flag;
      res = { originalData: sr.originalData, preview };
      return res;
    } else {
      return sr;
    }
  }

  toCombineProblemCategory(item) {
    const userInputsNew = [];
    let userList = [];
    for (let w = 0; w < item.userInputs.length; w++) {
      userList.push(item.userInputs[w].user);
    }

    userList = _.uniq(userList);
    for (let i = 0; i < userList.length; i++) {
      const labelList = [];
      const param = {
        problemCategory: labelList,
        timestamp: '',
        user: userList[i],
        reducedCategory: [],
      };
      for (let j = 0; j < item.userInputs.length; j++) {
        if (userList[i] == item.userInputs[j].user) {
          if (this.msg.labelType === 'numericLabel' && this.msg.isMultipleLabel) {
            if (item.userInputs[j].problemCategory) {
              param.problemCategory.push(
                item.userInputs[j].problemCategory.label + '[' + item.userInputs[j].problemCategory.value + ']',
              );
            } else {
              param.problemCategory = undefined;
            }
          } else {
            if (item.userInputs[j].problemCategory) {
              param.problemCategory.push(item.userInputs[j].problemCategory);
              param.reducedCategory = item.userInputs[j].reducedCategory;
            } else {
              param.problemCategory = undefined;
              param.reducedCategory = undefined;
            }
          }
          param.timestamp = item.userInputs[j].timestamp;
        }
      }

      userInputsNew.push(param);
    }
    item.userInputs = userInputsNew;
  }

  toCallStudio(option) {
    this.LabelStudioService.initLabelStudio(option);
    const h4Dom = this.el.nativeElement.querySelectorAll('.ant-typography');
    h4Dom.forEach((element) => {
      this.renderer2.setStyle(element.nextElementSibling.nextElementSibling, 'display', 'none');
      this.renderer2.setStyle(element.nextElementSibling, 'display', 'none');
    });
  }

  selectionLogsChanged(e, from, data) {
    if (from == 'multiple') {
      if (e.target.checked) {
        this.selectedLogsToModify = [];
        this.previewSrs.forEach((element) => {
          if (!(element.reviewInfo.review || element.userInputsLength <= 0)) {
            element.selected = true;
            this.selectedLogsToModify.push(element._id);
          }
        });
      } else {
        this.previewSrs.forEach((element) => {
          element.selected = false;
          this.selectedLogsToModify = [];
        });
      }
    } else {
      if (e) {
        if (this.selectedLogsToModify.indexOf(data._id) == -1) {
          this.selectedLogsToModify.push(data._id);
        }
      } else {
        if (this.selectedLogsToModify.indexOf(data._id) > -1) {
          this.selectedLogsToModify.splice(this.selectedLogsToModify.indexOf(data._id), 1);
        }
      }
      let a = 0;
      this.previewSrs.forEach((element) => {
        if (!(element.reviewInfo.review || element.userInputsLength <= 0)) {
          a++;
        }
      });
      this.selectedLogsToModify.length == a ? (this.selectAllStatus = true) : (this.selectAllStatus = false);
    }
  }

  toRenewPreviewSrs() {
    // to sort one user's data together
    for (let k = 0; k < this.previewSrs.length; k++) {
      this.toCombineProblemCategory(this.previewSrs[k]);
      this.toCombineProblemCategory(this.previewSrs[k].reviewInfo);
    }
  }

  getALLSrs() {
    this.loading = true;
    this.apiService.getALLSrs(this.getALLSrsParam).subscribe(
      (res) => {
        if (res) {
          const resCopy = JSON.parse(JSON.stringify(res));
          const oldRes = JSON.parse(JSON.stringify(res.data));
          this.totalItems = res.pageInfo.totalRowss;
          this.totalPages = res.pageInfo.totalPages;
          const flag = [];
          const cellContent = [];
          res = res.data;
          for (const item of res) {
            flag.push(item.originalData);
          }
          if (this.msg.projectType == 'image') {
            this.previewSrsHeader = ['Id', 'ImageName', 'ImageSize(KB)'];
            for (const item of res) {
              const flag = [item.id, item.originalData.fileName, (item.originalData.fileSize / 1024).toFixed(2)];
              item.originalData = flag;
            }
          } else if (this.msg.projectType == 'log') {
            this.previewSrsHeader = ['FileName', 'FileContent'];
            for (let w = 0; w < res.length; w++) {
              this.resetLoguserInputs(res[w]);
              this.resetLoguserInputs(res[w].reviewInfo, res[w].originalData);
              const file = this.resetLogOriginalData(res[w]);
              const flag = {
                fileName: res[w].fileInfo.fileName,
                fileContent: file.originalData,
                filePreview: file.preview,
              };
              res[w].originalData = flag;
              res[w].projectType = 'log';
              res[w].selected = false;
            }
          } else {
            if (flag.length > 0 && resCopy.pageInfo.currentPage === 1) {
              const pre = [];
              _.forIn(flag[0], function (value, key) {
                pre.push(key);
              });
              this.previewSrsHeader = pre;
            }
            for (let j = 0; j < flag.length; j++) {
              const a = flag[j];
              const cell = [];
              for (const index in this.previewSrsHeader) {
                let key = this.previewSrsHeader[index];
                cell.push(a[key]);
              }

              cellContent.push(cell);
            }

            for (let k = 0; k < res.length; k++) {
              res[k].originalData = cellContent[k];
            }
          }
          if (this.msg.projectType == 'ner') {
            res.forEach((element) => {
              if (
                element.userInputs.length > 0 &&
                element.userInputs[0].problemCategory.length > 0 &&
                element.userInputsLength == 0
              ) {
                element.originalInputs = 1;
              }
            });
          }
          setTimeout(() => {
            this.previewSrs = res;
            // console.log('this.previewSrs:::', this.previewSrs);
            // console.log('oldRes:::', oldRes);
          }, 100);

          if (this.msg.projectType == 'image') {
            this.previewSrs = res;
            setTimeout(() => {
              for (let i = 0; i < this.previewSrs.length; i++) {
                if (this.previewSrs[i].userInputs.length > 0 || this.previewSrs[i].reviewInfo.userInputs.length > 0) {
                  if (this.previewSrs[i].userInputs.length > 0) {
                    this.addDomStyle(this.el.nativeElement.querySelector('.annotateDetail' + i));
                    let dom = 'label-studio-' + i + '-0';
                    this.loadImg(dom, oldRes[i], this.previewSrs[i], i);
                  }
                  if (
                    this.previewSrs[i].reviewInfo.userInputs.length > 0 &&
                    this.previewSrs[i].reviewInfo.userInputs[0].problemCategory
                  ) {
                    this.addDomStyle(this.el.nativeElement.querySelector('.reviewDetail' + i));
                    let domReview = 'label-studio-review-' + i + '-0';
                    this.loadImg(domReview, oldRes[i], this.previewSrs[i].reviewInfo, i);
                  }
                }
              }
            }, 0);
          } else {
            this.loading = false;
          }
          if (this.msg.isMultipleLabel && this.msg.projectType != 'ner' && this.msg.projectType != 'log') {
            this.previewSrs = res;
            this.toRenewPreviewSrs();
          }
          this.firstLoadTable = false;
        }
      },
      (error: any) => {
        this.loading = false;
      },
    );
  }

  addDomStyle(dom) {
    dom.style.display = 'block';
    dom.style.position = 'absolute';
    dom.style.left = '-10000px';
    dom.style.width = '100%';
  }

  loadImg(dom, oldSr, previewSr, i) {
    const m = this;
    m.loading = true;
    const option = {
      dom,
      imageRectLabelTemplate: this.imageRectLabelTemplate,
      imagePolyLabelTemplate: this.imagePolyLabelTemplate,
      url: this.env.config.enableAWSS3
        ? oldSr.originalData.location
        : `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${oldSr.originalData.location}&token=${
            JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token
          }`,
      historyCompletions: [{ result: previewSr.userInputs[0].problemCategory }],
      annotationQuestion: this.imageHeader,
      from: 'preview',
    };
    // console.log('option:::', option,optionReview)
    this.toCallStudio(option);

    const labelStudioDom = this.el.nativeElement.querySelector('div.' + dom);
    const imgDom = labelStudioDom.getElementsByTagName('img');
    const canvas = labelStudioDom.getElementsByTagName('canvas');

    const img = new Image();
    img.src = this.env.config.enableAWSS3
      ? oldSr.originalData.location
      : `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${oldSr.originalData.location}&token=${
          JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token
        }`;
    img.onload = function () {
      for (let k = 0; k < imgDom.length; k++) {
        setTimeout(() => {
          if (canvas.length > 0) {
            canvas[0].style.width = imgDom[k].width;
            canvas[0].style.height = imgDom[k].height;
          }
          m.el.nativeElement.querySelector('.annotateDetail' + i).style.display = 'none';
          m.el.nativeElement.querySelector('.annotateDetail' + i).style.position = 'unset';
          m.el.nativeElement.querySelector('.reviewDetail' + i).style.display = 'none';
          m.el.nativeElement.querySelector('.reviewDetail' + i).style.position = 'unset';
          m.loading = false;
        }, 10);
      }
    };
  }

  getALLFlag() {
    this.loadingFlag = true;
    this.apiService.getAllFlagTickets(this.msg.projectName, this.pageFlag, this.pageSizeFlag).subscribe(
      (res) => {
        this.totalItemsFlag = res.totalDocs;
        this.totalPagesFlag = res.totalPages;
        const flag = [];
        const cellContent = [];
        res = res.docs;
        for (let i = 0; i < res.length; i++) {
          flag.push(res[i].originalData);
        }
        if (this.msg.projectType == 'image') {
          this.previewFlagHeader = ['Id', 'ImageName', 'ImageSize(KB)'];
          for (let w = 0; w < res.length; w++) {
            const flag = [res[w].id, res[w].originalData.fileName, (res[w].originalData.fileSize / 1024).toFixed(2)];
            res[w].originalData = flag;
            res[w].flag = res[w].flag.users;
          }
        } else if (this.msg.projectType == 'log') {
          this.previewFlagHeader = ['FileName', 'FileContent'];
          for (let w = 0; w < res.length; w++) {
            const file = this.resetLogOriginalData(res[w]);
            const flag = {
              fileName: res[w].fileInfo.fileName,
              fileContent: file.originalData,
              filePreview: file.preview.slice(0, 100) + '...',
            };
            res[w].originalData = flag;
            res[w].flag = res[w].flag.users;
            res[w].projectType = 'log';
          }
        } else {
          if (flag.length > 0) {
            const pre = [];
            _.forIn(flag[0], function (value, key) {
              pre.push(key);
            });
            this.previewFlagHeader = pre;
          }
          for (let j = 0; j < flag.length; j++) {
            const a = flag[j];
            const cell = [];
            for (const key in a) {
              cell.push(a[key]);
            }
            cellContent.push(cell);
          }
          for (let k = 0; k < res.length; k++) {
            res[k].originalData = cellContent[k];
            res[k].flag = res[k].flag.users;
          }
        }

        this.previewFlagContent = res;
        this.firstLoadFlag = false;
        this.loadingFlag = false;
      },
      (error: any) => {
        this.loadingFlag = false;
      },
    );
  }

  refresh(event) {
    if (event && event.page && this.isInit != 1) {
      this.getALLSrsParam.pageNumber = event.page.from / event.page.size + 1;
      this.getALLSrsParam.limit = event.page.size;
      this.getALLSrs();
    }
    this.isInit = 0;
    this.selectedLogsToModify = [];
    this.selectAllStatus = false;
  }

  refreshFlag(event) {
    if (event && event.page && this.isInitFlag != 1) {
      this.getALLSrsParam.pageNumber = event.page.from / event.page.size + 1;
      this.getALLSrsParam.limit = event.page.size;
      this.getALLFlag();
    }
    this.isInitFlag = 0;
    this.selected = [];
    this.selectedFlag = [];
  }

  selectionChanged(e) {
    this.selectedFlag = [];
    for (let i = 0; i < e.length; i++) {
      this.selectedFlag.push(e[i].id);
    }
  }

  delete(data, type) {
    if (this.selectedFlag.length > 0 || data != undefined) {
      this.loadingFlag = true;
      const param = {
        pname: this.msg.projectName,
        tids: this.selectedFlag,
      };
      type == 'multiple' ? (param.tids = this.selectedFlag) : (param.tids = [data.id]);
      this.apiService.deleteTicket(param).subscribe(
        (response) => {
          this.getALLFlag();
          this.selected = [];
        },
        (error) => {
          this.loadingFlag = false;
        },
      );
    }
  }

  silence(data, type) {
    if (this.selectedFlag.length > 0 || data != undefined) {
      this.loadingFlag = true;
      const param = {
        tids: this.selectedFlag,
        pid: this.msg._id,
      };
      type == 'multiple' ? (param.tids = this.selectedFlag) : (param.tids = [data.id]);
      this.apiService.silenceTicket(param).subscribe(
        (response) => {
          this.getALLFlag();
          this.selected = [];
        },
        (error) => {},
      );
    }
  }

  modify(data, type) {
    const param = {
      pid: this.msg._id,
      review: true,
      tid: [],
    };
    if (type === 'single') {
      param.tid = data._id;
    } else {
      param.tid = this.selectedLogsToModify;
    }
    if (param.tid.length > 0) {
      this.apiService.passTicket(param).subscribe((res) => {
        // console.log('modify-in-preview:::', res);
        this.getALLSrsParam.pageNumber = this.page;
        this.getALLSrsParam.limit = this.pageSize;
        this.getALLSrs();
        this.selectedLogsToModify = [];
        this.selectAllStatus = false;
      });
    }
  }

  receiveFilename(data) {
    if (this.formerFilenameFilter !== data) {
      this.formerFilenameFilter = data;
      this.getALLSrsParam.pageNumber = 1;
    }
    this.getALLSrsParam.fname = data;
    this.getALLSrs();
  }

  clickFlagTab() {
    this.formerFilenameFilter = '';
    this.getALLSrsParam.fname = '';
  }

  getChildren = (folder) => folder.children;

  clickTreeView(data) {
    this.showTreeView = true;
    this.treeData = data;
  }

  onCloseTreeDialog() {
    this.showTreeView = false;
  }
}
