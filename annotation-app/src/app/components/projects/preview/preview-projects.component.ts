/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
  enableProdMode,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { Observable, fromEvent } from 'rxjs';
import { AvaService } from '../../../services/ava.service';
import { UserAuthService } from '../../../services/user-auth.service';
import * as _ from 'lodash';
import { ActivatedRoute } from '@angular/router';
import { LabelStudioService } from 'app/services/label-studio.service';
import { EnvironmentsService } from 'app/services/environments.service';
import { ToolService } from 'app/services/common/tool.service';

enableProdMode();

declare function userChart(options: any): any;
declare function categoryChart(options: any): any;
declare function modelChart(options: any): any;

@Component({
  selector: 'app-preview-projects',
  templateUrl: './preview-projects.component.html',
  styleUrls: ['./preview-projects.component.scss'],
})
export class previewProjectsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dataGird', { static: false }) dataGird;
  @ViewChild('userChart', { static: false }) userChart: ElementRef;
  @ViewChild('categoryChart', { static: false }) categoryChart: ElementRef;
  @ViewChild('modelChart', { static: false }) modelChart: ElementRef;

  selectedDataset: any;
  previewHeadDatas: any;
  previewSrs: any;
  pageSize: number;
  totalItems: number;
  page: number;
  totalPages: number;
  previewSrsHeader: any;
  previewSrsContent: any;
  getALLSrsParam: any;

  user: string;
  loading: boolean;
  loadingFlag: boolean;
  loadingD3: boolean;
  loadingModelD3: boolean;
  noAnnotation: boolean;
  noModel: boolean;

  userChartDatas: any;
  categoryChartDatas: any;
  modelChartDatas: any = [];
  projectId: any;
  notLabeledYet: any;
  totalCase: any;
  chartWidth: any;
  modelChartWidth = 0;
  labelledCase: number;
  firstLoadTable: boolean;
  isInit = 1;
  isInitFlag = 1;

  firstLoadFlag: boolean;
  previewFlagHeader: any;
  previewFlagContent: any;
  pageSizeFlag: number;
  totalItemsFlag: number;
  pageFlag: number;
  totalPagesFlag: number;
  selected: any = [];
  selectedFlag;
  projectName;
  labelType: string;
  alEstimator: string;
  alFrequency: number;
  alThreshold: number;
  isMultipleLabel: any;
  projectType: string;
  innerTable: any;

  imagePolyLabelTemplate: any;
  imageRectLabelTemplate: any;
  imageHeader: any;

  selectedLogsToModify: any = [];
  selectAllStatus: boolean;
  categoryList: any = [];
  coloursRainbow = [
    '#00ffff',
    '#ff00ff',
    '#00ff7f',
    '#ff6347',
    '#9B0D54',
    '#00bfff',
    '#ffa500',
    '#ff69b4',
    '#7fffd4',
    '#ffd700',
    '#FBC1DA',
    '#4D007A',
    '#ffdab9',
    '#adff2f',
    '#d2b48c',
    '#dcdcdc',
    '#583fcf',
    '#A32100',
    '#0F1E82',
    '#F89997',
    '#003D79',
    '#00D4B8',
    '#6C5F59',
    '#AADB1E',
    '#36C9E1',
    '#D0ACE4',
    '#798893',
    '#ED186F',
    '#9DA3DB',
    '#ffff00',
  ];

  constructor(
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private route: ActivatedRoute,
    private el: ElementRef,
    private LabelStudioService: LabelStudioService,
    private renderer2: Renderer2,
    private env: EnvironmentsService,
    private toolService: ToolService,
  ) {
    this.user = this.userAuthService.loggedUser().email;
    this.page = 1;
    this.pageSize = 10;
    this.pageFlag = 1;
    this.pageSizeFlag = 10;
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.selectedDataset = params['name'];
      this.projectName = params['name'];
      this.labelType = params['labelType'];
      this.projectType = params['projectType'];
      this.projectId = params['id'];
      const al = params['estimator'];
      this.alFrequency = params['frequency'];
      this.alThreshold = params['threshold'];
      this.isMultipleLabel = params['isMultipleLabel'];
      this.isMultipleLabel === 'true'
        ? (this.isMultipleLabel = true)
        : (this.isMultipleLabel = false);
      if (al == 'GBC') {
        this.alEstimator = 'GradientBoostingClassifier';
      } else if (al == 'KNC') {
        this.alEstimator = 'KNeighborsClassifier';
      } else if (al == 'RFC' || al == undefined) {
        this.alEstimator = 'RandomForestClassifier ';
      }
      if (this.labelType != 'numericLabel' && !this.isMultipleLabel) {
        this.getAccuracy(this.projectId);
      }
      this.projectPreview();
    });

    this.isInit = 1;
    this.isInitFlag = 1;
    this.loading = true;
    this.loadingFlag = true;
    this.firstLoadTable = true;
    this.firstLoadFlag = true;
    this.innerTable =
      this.projectType == 'ner'
        ? ['Entity', 'Text', 'Start_idx', 'End_idx']
        : ['LineNumber', 'LineContent', 'Label', 'FreeText'];
    this.getALLSrs();
    this.getALLFlag();
  }

  ngAfterViewInit() {
    this.chartWidth = this.el.nativeElement.querySelector('.categoryChart').offsetWidth;
    if (this.labelType != 'numericLabel' && !this.isMultipleLabel) {
      this.modelChartWidth = this.el.nativeElement.querySelector('.modelChartBox').offsetWidth;
    }

    // Observable.fromEvent(window, 'resize').subscribe((event) => {
    fromEvent(window, 'resize').subscribe((event) => {
      if (this.labelledCase > 0) {
        this.chartWidth = this.el.nativeElement.querySelector('.categoryChart').offsetWidth;
        this.showUserChart(this.userChart.nativeElement, this.userChartDatas, this.chartWidth);
        this.showCategoryChart(
          this.categoryChart.nativeElement,
          this.categoryChartDatas,
          this.chartWidth,
        );
        if (this.labelType != 'numericLabel' && this.modelChartDatas.length > 0) {
          if (this.el.nativeElement.querySelector('.modelChartBox')) {
            this.modelChartWidth =
              this.el.nativeElement.querySelector('.modelChartBox').offsetWidth;
            this.showModelChart(
              this.modelChart.nativeElement,
              this.modelChartDatas,
              this.modelChartWidth,
              this.alEstimator,
              this.alThreshold,
              this.alFrequency,
            );
          }
        }
      }
    });
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }

  showUserChart(conf, data, width) {
    const items = [];
    for (const f in data) {
      items.push(data[f].name);
    }
    userChart({
      container: conf,
      data,
      labels: items,
      width,
    });
  }

  showCategoryChart(conf, data, width) {
    const items = [];
    for (const f in data) {
      items.push(data[f].name);
    }
    categoryChart({
      container: conf,
      data,
      labels: items,
      width,
    });
  }

  showModelChart(conf, data, width, estimator, threshold, frequency) {
    modelChart({
      container: conf,
      data,
      width,
      estimator,
      threshold,
      frequency,
    });
  }

  projectPreview() {
    this.loadingD3 = true;
    this.avaService.getProjectInfo(this.projectId).subscribe(
      (response) => {
        this.projectType = response.projectType;
        this.selectedDataset = response;
        this.projectId = response._id;
        this.totalCase = response.totalCase;
        this.categoryList = response.categoryList.split(',');
        this.getChartData();
        this.previewHeadDatas = ['Annotator', 'Annotate Time', 'Re-Label'];
        if (this.projectType === 'image') {
          this.sortLabelForImage(response.categoryList.split(','), response.annotationQuestion);
          this.previewHeadDatas = [];
        }
      },
      (error) => {
        this.loadingD3 = false;
        console.log('projectPreviewErr:', error);
      },
    );

    this.getALLSrsParam = {
      projectName: this.selectedDataset,
      pageNumber: this.page,
      limit: this.pageSize,
      id: this.projectId,
    };
  }

  getALLSrs() {
    this.loading = true;
    this.avaService.getALLSrs(this.getALLSrsParam).subscribe(
      (res) => {
        if (res) {
          const oldRes = JSON.parse(JSON.stringify(res.data));
          this.totalItems = res.pageInfo.totalRowss;
          this.totalPages = res.pageInfo.totalPages;
          const flag = [];
          const cellContent = [];
          res = res.data;
          for (const item of res) {
            flag.push(item.originalData);
          }
          if (this.projectType == 'image') {
            this.previewSrsHeader = ['Id', 'ImageName', 'ImageSize(KB)'];
            for (const item of res) {
              const flag = [
                item.id,
                item.originalData.fileName,
                (item.originalData.fileSize / 1024).toFixed(2),
              ];
              item.originalData = flag;
            }
          } else if (this.projectType == 'log') {
            this.previewSrsHeader = ['FileName', 'FileContent'];
            for (let w = 0; w < res.length; w++) {
              this.resetLoguserInputs(res[w]);
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
            if (flag.length > 0) {
              const pre = [];
              _.forIn(flag[0], function (value, key) {
                pre.push(key);
              });
              this.previewSrsHeader = pre;
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
            }
          }
          if (this.projectType == 'ner') {
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

          this.previewSrs = res;
          // console.log('this.previewSrs:::', this.previewSrs)
          // console.log('oldRes:::', oldRes)

          if (this.projectType == 'image') {
            setTimeout(() => {
              const detailRowDom = this.el.nativeElement.querySelectorAll(
                'clr-dg-row-detail.datagrid-row-detail',
              );
              if (detailRowDom && detailRowDom.length > 0) {
                for (let a = 0; a < detailRowDom.length; a++) {
                  detailRowDom[a].style.display = 'block';
                  detailRowDom[a].style.position = 'absolute';
                  detailRowDom[a].style.left = '-10000px';
                  detailRowDom[a].style.width = '100%';
                }
              } else {
                this.loading = false;
              }

              for (let i = 0; i < this.previewSrs.length; i++) {
                if (this.previewSrs[i].userInputs.length > 0) {
                  const option = {
                    dom: 'label-studio-' + i + '-0',
                    imageRectLabelTemplate: this.imageRectLabelTemplate,
                    imagePolyLabelTemplate: this.imagePolyLabelTemplate,
                    url: this.env.config.enableAWSS3
                      ? oldRes[i].originalData.location
                      : `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
                          oldRes[i].originalData.location
                        }&token=${
                          JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token
                            .access_token
                        }`,
                    historyCompletions: [
                      { result: this.previewSrs[i].userInputs[0].problemCategory },
                    ],
                    annotationQuestion: this.imageHeader,
                    from: 'preview',
                  };
                  // console.log('option:::', option)
                  this.toCallStudio(option);
                  const labelStudioDom = this.el.nativeElement.querySelector(
                    'div.label-studio-' + i + '-0',
                  );
                  const imgDom = labelStudioDom.getElementsByTagName('img');
                  const canvas = labelStudioDom.getElementsByTagName('canvas');

                  const img = new Image();
                  img.src = this.env.config.enableAWSS3
                    ? oldRes[i].originalData.location
                    : `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
                        oldRes[i].originalData.location
                      }&token=${
                        JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token
                          .access_token
                      }`;
                  const m = this;
                  img.onload = function () {
                    for (let k = 0; k < imgDom.length; k++) {
                      setTimeout(() => {
                        if (canvas.length > 0) {
                          canvas[0].style.width = imgDom[k].offsetWidth;
                          canvas[0].style.height = imgDom[k].offsetHeight;
                        }
                        detailRowDom[i].style.display = 'none';
                        detailRowDom[i].style.position = 'unset';
                        m.loading = false;
                      }, 0);
                    }
                  };
                }
              }
            }, 0);
          } else {
            this.loading = false;
          }
          if (this.isMultipleLabel && this.projectType != 'ner' && this.projectType != 'log') {
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

  getALLFlag() {
    this.loadingFlag = true;
    this.avaService.getAllFlagTickets(this.projectName, this.pageFlag, this.pageSizeFlag).subscribe(
      (res) => {
        this.totalItemsFlag = res.totalDocs;
        this.totalPagesFlag = res.totalPages;
        const flag = [];
        const cellContent = [];
        res = res.docs;
        for (let i = 0; i < res.length; i++) {
          flag.push(res[i].originalData);
        }
        if (this.projectType == 'image') {
          this.previewFlagHeader = ['Id', 'ImageName', 'ImageSize(KB)'];
          for (let w = 0; w < res.length; w++) {
            const flag = [
              res[w].id,
              res[w].originalData.fileName,
              (res[w].originalData.fileSize / 1024).toFixed(2),
            ];
            res[w].originalData = flag;
            res[w].flag = res[w].flag.users;
          }
        } else if (this.projectType == 'log') {
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

  getChartData() {
    this.loadingD3 = true;
    this.avaService.getChart(this.projectId).subscribe(
      (response) => {
        if (response) {
          this.notLabeledYet = response.notLabeledYet;
          this.userChartDatas = response.userCase;
          this.categoryChartDatas = response.labels;
          this.labelledCase = response.labelledCase;
          if (this.totalCase != this.notLabeledYet) {
            this.noAnnotation = false;
            try {
              this.showUserChart(
                this.userChart.nativeElement,
                this.userChartDatas,
                this.chartWidth,
              );
            } catch (err) {
              console.log('userChartErr:', err.message);
              this.loadingD3 = false;
            }
            try {
              this.showCategoryChart(
                this.categoryChart.nativeElement,
                this.categoryChartDatas,
                this.chartWidth,
              );
              this.loadingD3 = false;
            } catch (err) {
              console.log('categoryChartErr:', err.message);
              this.loadingD3 = false;
            }
          } else {
            this.loadingD3 = false;
            this.noAnnotation = true;
          }
        }
      },
      (error) => {
        console.log('getChartDataError:', error);
        this.loadingD3 = false;
        this.noAnnotation = false;
      },
    );
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
        pname: this.projectName,
        tids: this.selectedFlag,
      };
      type == 'multiple' ? (param.tids = this.selectedFlag) : (param.tids = [data.id]);
      this.avaService.deleteTicket(param).subscribe(
        (response) => {
          this.getALLFlag();
          this.selected = [];
        },
        (error) => {
          console.log('delete_error:', error);
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
        pid: this.projectId,
      };
      type == 'multiple' ? (param.tids = this.selectedFlag) : (param.tids = [data.id]);
      this.avaService.silenceTicket(param).subscribe(
        (response) => {
          this.getALLFlag();
          this.selected = [];
        },
        (error) => {
          console.log('silenceError:::', error);
        },
      );
    }
  }

  modify(data, type) {
    const param = {
      pid: this.projectId,
      review: true,
      tid: [],
    };
    if (type === 'single') {
      param.tid = [data._id];
    } else {
      // let aa = [];

      // this.selectedLogsToModify.forEach(element => {
      //     if (!element.reviewInfo.review && element.userInputsLength > 0) {
      //         aa.push(element._id)
      //     }

      // });
      param.tid = this.selectedLogsToModify;
    }
    if (param.tid.length > 0) {
      this.avaService.passTicket(param).subscribe((res) => {
        console.log('modify-in-preview:::', res);
        this.getALLSrsParam.pageNumber = this.page;
        this.getALLSrsParam.limit = this.pageSize;
        this.getALLSrs();
        this.selectedLogsToModify = [];
        this.selectAllStatus = false;
      });
    }
  }

  getAccuracy(id) {
    this.loadingModelD3 = true;
    this.avaService.getAccuracy(id).subscribe(
      (response) => {
        if (response.status) {
          this.modelChartDatas = response.accuracy;
          try {
            this.showModelChart(
              this.modelChart.nativeElement,
              this.modelChartDatas,
              this.modelChartWidth,
              this.alEstimator,
              this.alThreshold,
              this.alFrequency,
            );
            this.loadingModelD3 = false;
          } catch (err) {
            console.log('modelChartErr from getAccuracy:', err.message);
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
        console.log('getAccuracyErr:', error);
      },
    );
  }

  clickPerformance() {
    this.noModel = false;
    this.loadingModelD3 = true;
    this.getAccuracy(this.projectId);
  }

  toRenewPreviewSrs() {
    // to sort one user's data together
    for (let k = 0; k < this.previewSrs.length; k++) {
      const userInputsNew = [];
      let userList = [];
      for (let w = 0; w < this.previewSrs[k].userInputs.length; w++) {
        userList.push(this.previewSrs[k].userInputs[w].user);
      }

      userList = _.uniq(userList);
      for (let i = 0; i < userList.length; i++) {
        const labelList = [];
        const param = {
          problemCategory: labelList,
          timestamp: '',
          user: userList[i],
        };
        for (let j = 0; j < this.previewSrs[k].userInputs.length; j++) {
          if (userList[i] == this.previewSrs[k].userInputs[j].user) {
            param.problemCategory.push(this.previewSrs[k].userInputs[j].problemCategory);
            param.timestamp = this.previewSrs[k].userInputs[j].timestamp;
          }
        }

        userInputsNew.push(param);
      }
      this.previewSrs[k].userInputs = userInputsNew;
    }
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
      this.selectedLogsToModify.length == a
        ? (this.selectAllStatus = true)
        : (this.selectAllStatus = false);
    }
  }

  sortLabelForImage(categories, annotationQuestion) {
    categories.forEach((element, index) => {
      if (index >= 30) {
        index = index - 30;
      }
      this.imageRectLabelTemplate += `<Label value="${element}" background="${this.coloursRainbow[index]}" selectedColor="white"/>`;
      this.imagePolyLabelTemplate += `<Label value="${element}" background="${this.coloursRainbow[index]}" selectedColor="white"/>`;
    });
    this.imageHeader = `<Header style="display:none" value="${annotationQuestion}"/>`;
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
                that.coloursRainbow[
                  that.categoryList.indexOf(sr.userInputs[0].problemCategory[i].label)
                ];
              a['backgroundColorText'] = that.toolService.hexToRgb(
                that.coloursRainbow[
                  that.categoryList.indexOf(sr.userInputs[0].problemCategory[i].label)
                ],
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

  resetLoguserInputs(sr) {
    if (!sr.MSG) {
      sr.userInputs.forEach((element) => {
        element.problemCategory.forEach((element1) => {
          for (const key in sr.originalData) {
            if (element1.line == key) {
              element1.text = sr.originalData[key];
              break;
            }
          }
        });
      });
    } else {
      return sr;
    }
  }
}
