/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ElementRef, Renderer2, ViewChild, HostListener } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { SR, SrUserInput } from '../../../model/sr';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { LabelStudioService } from 'src/app/services/label-studio.service';
import { GetElementService } from 'src/app/services/common/dom.service';
import { ToolService } from 'src/app/services/common/tool.service';
import { UserAuthService } from 'src/app/services/user-auth.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { MarkdownParserService } from 'src/app/services/common/markdown-parser.service';
import { Options } from '@angular-slider/ngx-slider';
import {
  highlightRange,
  removeSpans,
  splitBoundaries,
  toGlobalOffset,
  findClosestTextNode,
} from 'src/app/shared/utils/html';
import { filterTreeLabel } from 'src/app/shared/utils/treeView';
import { PopLabelColors, ColorsRainbow } from '../../../model/constant';
import { ClrLoadingState } from '@clr/angular';

@Component({
  selector: 'app-project-analyze',
  templateUrl: './project-analyze.component.html',
  styleUrls: ['./project-analyze.component.scss'],
})
export class ProjectAnalyzeComponent implements OnInit {
  @ViewChild('numericInput') numericInput;
  errorMessage = '';
  infoMessage = '';
  user: any;
  questionForm: FormGroup;
  sr: SR;
  originLogList: any = [];
  logTotalSize: number;
  filterLogData = [];
  isFilterLog: boolean = false;
  categories: string[];
  loading: boolean;
  error: string;
  actionError: string;
  maxAnnotationError: string;
  isEndingGameDialog: boolean;
  isSkippingGameDialog: boolean;
  selectParam: string;
  projectInfo: any;
  progressInfo: any;
  annotationHistory = [];
  percentage: number;
  max: number;
  active: number;
  labelChoose: any;
  idName: string;
  isShowDropDown: boolean;
  projectId: any;
  silenceStatus: boolean;
  isNumeric: boolean;
  numericMessage: string;
  clrErrorTip: boolean;
  minLabel: number;
  maxLabel: number;
  isMultipleLabel: boolean;
  isMultipleNumericLabel: boolean;
  multipleLabelList = [];
  spanStart: any;
  spanEnd: any;
  selectedEntityID = 0;
  spansList = [];
  onLabelStudioLoadInfo: any;
  imagePolyLabelTemplate: any;
  imageRectLabelTemplate: any;
  rectLabelDom: Element;
  polygonLabelDom: Element;
  rectSelected = true;
  currentBoundingData: any = [];
  highlightedNode: any;
  projectType: string;
  historyTask: any = [];
  labelType: any;
  logCategories: any = [];
  filterList: any = [];
  filterType = 'keyword';
  regexErr = false;
  isDrawer = false;
  totalLen: number = 0;
  labelColor: any;
  selectedEntityColor: any = '';
  startFrom: string;
  annotationPrevious: any = [];
  reviewOrder: string;
  reviewee: string;
  selectedFile: number;
  currentLogFile: string;
  logFiles: any = [];
  wrapText: boolean;
  cloneSpanslist: any = [];
  convertedText: string;
  renderFormat: string = 'md';
  numericValue: number;
  numericOptions: Options = {
    floor: 0,
    step: 1,
    ceil: 100,
  };
  stepLen: number = 0;
  scores: any = [];
  scoreMessage: any = [];
  isShowPopLabel: boolean;
  isShowPopOver: boolean = false;
  xAxis: number = 0;
  yAxis: number = 0;
  targetSpans: any;
  popLabels: any;
  disabledSkip: boolean = false;
  moreReviewInfo: any = [];
  submitMessage: string;
  tipMessage: string;
  initReview: string;
  treeLabels: any = [];
  originTreeLabels: any = [];
  selectedTreeLabels: any = [];
  showTreeView: boolean = false;
  treeData: any;
  expandValue: boolean = false;
  expandName: string = 'Expand';
  textBoxResizedHeight: string;
  colorsRainbow = ColorsRainbow;
  popLabelColors = PopLabelColors;
  annotateProgressMsg;
  msgLatestData;
  msgUserCategoryData;
  msgAppend;
  currentTabIndex: number;
  isAllowedAnnotate: boolean;
  loadingViewData: ClrLoadingState = ClrLoadingState.DEFAULT;

  constructor(
    private renderer2: Renderer2,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private el: ElementRef,
    private LabelStudioService: LabelStudioService,
    private getElementService: GetElementService,
    private toolService: ToolService,
    private userAuthService: UserAuthService,
    private env: EnvironmentsService,
    private md: MarkdownParserService,
  ) {
    this.user = this.userAuthService.loggedUser().user;
    this.currentTabIndex = 1;
  }

  ngOnInit(): void {
    this.loading = true;
    this.projectInfo = {};
    this.route.queryParams.subscribe((data: any) => {
      data = JSON.parse(data.data);
      data.taskInstructions = data.taskInstructions.replace(/(\r\n|\n|\r)/gm, '<br/>');
      this.projectInfo = data;
      this.isAllowedAnnotate = data.annotator.indexOf(this.user.email) > -1 ? true : false;
      this.selectParam = data.projectName;
      this.createForm();
      this.max = data.maxAnnotation;
      this.labelType = data.labelType;
      this.projectId = data._id;
      this.projectType = data.projectType;
      this.startFrom = data.from;
      this.initReview = data.reviewee;
      this.toGetProjectInfo(this.projectId);
    });
    if (this.isAllowedAnnotate || this.startFrom == 'review') {
      this.getProgress();
    }
    window.addEventListener('scroll', this.handleScroll, true);
    // console.log(177, this.projectType, this.startFrom, this.moreReviewInfo);
  }

  ngDoCheck(change) {
    this.annotateProgressMsg = {
      from: this.startFrom,
      projectInfo: this.projectInfo,
      history: this.annotationHistory,
      percentage: this.percentage,
      progressInfo: this.progressInfo,
      sr: this.sr,
      reviewOrder: this.reviewOrder,
      reviewee: this.initReview,
    };
    this.msgLatestData = this.projectInfo;
    this.msgUserCategoryData = this.projectInfo;
    this.msgAppend = this.projectInfo;
  }

  sliderEvent() {
    if (this.numericOptions.step === 1) {
      if (parseInt(this.labelChoose) !== this.numericValue) {
        this.labelChoose = this.numericValue;
      }
    } else {
      if (Number(this.formatDecimal(this.labelChoose, this.stepLen)) !== this.numericValue) {
        this.labelChoose = this.numericValue;
      }
    }
  }

  scoreSliderEvent(i) {
    this.scores.forEach((item, index) => {
      if (index === i) {
        if (Number(this.formatDecimal(item.scoreInputValue, item.stepLen)) !== item.scoreValue) {
          item.clrErrorTip = false;
          item.scoreInputValue = item.scoreValue;
        }
      }
    });
  }

  handleScroll() {
    const popDialog = document.getElementById('popDialog');
    if (popDialog) {
      popDialog.style.display = 'none';
      this.targetSpans = '';
    }
  }

  createForm(): void {
    if (!this.sr) {
      this.sr = {
        _id: 0,
        caseNumber: '',
        originalData: null,
        problemCategory: [],
        issueType: '',
        resoltionCode: '',
        resolution: '',
        userInputs: [],
      };
    }
    this.questionForm = this.formBuilder.group({
      category: this.sr.problemCategory,
      logFreeText: [null],
      answer: [null],
      renderFormat: [this.renderFormat],
      filterText: [null],
    });
  }

  fetchData(): void {
    this.silenceStatus = false;
    this.error = null;
    const paramSr = {
      id: this.projectId,
    };
    this.loading = true;
    this.apiService.getRandomSr(paramSr).subscribe(
      (response) => {
        this.sr = response;
        if (this.sr.MSG) {
          this.error = this.sr.MSG;
          this.loading = false;
          return;
        } else {
          if (this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'regression') {
            this.sr = this.resetTabularSrData(this.sr);
            this.toReadStorageSetting('display');
          }
          if (this.projectType == 'ner') {
            this.sr = this.resetNerSrData(this.sr);
            this.toShowExistingLabel();
          }
          if (this.projectType == 'image') {
            this.sr = this.resetImageSrData(this.sr);
            setTimeout(() => {
              this.sortLabelForColor(this.categories);
              const option = {
                dom: 'label-studio',
                imageRectLabelTemplate: this.imageRectLabelTemplate,
                imagePolyLabelTemplate: this.imagePolyLabelTemplate,
                url: this.env.config.enableAWSS3
                  ? this.sr.originalData.location
                  : `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
                      this.sr.originalData.location
                    }&token=${JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token}`,
                historyCompletions: this.historyTask,
                annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
                from: 'annotate',
              };
              this.toCallStudio(option);
            }, 0);
          }
          if (this.projectType == 'log') {
            this.sr = this.resetLogSrData(this.sr);
            this.showPreLogLable();
            this.currentLogFile =
              this.projectInfo.isShowFilename || this.startFrom === 'review' ? this.sr.fileInfo.fileName : '';
          }
          if (this.sr && this.sr.flag && this.sr.flag.silence) {
            this.silenceStatus = true;
          }
          this.initInfo();
        }
      },
      (error) => {
        this.error = JSON.stringify(error);
        this.loading = false;
      },
      () => {
        if (this.sr && !this.sr.MSG) {
          this.loading = false;
        }

        if (this.projectType == 'log' && !this.error) {
          setTimeout(() => {
            this.el.nativeElement.querySelector('.logCategories' + this.selectedEntityID).style.backgroundColor =
              this.colorsRainbow[this.selectedEntityID];
            // to read the filterList from localStorage
            this.toReadStorageSetting('logFilter');
          }, 5);
        }
      },
    );
  }

  initInfo() {
    if (this.labelType == 'numericLabel' && !this.isMultipleLabel) {
      this.isNumeric = true;
      this.numericMessage = 'Allowed values are between ' + this.minLabel + ' and ' + this.maxLabel + ' .';
      setTimeout(() => {
        this.numericInput.nativeElement.focus();
      }, 500);
    } else {
      if (this.projectType == 'log' || (this.projectType == 'image' && this.startFrom == 'review')) {
        this.sortLabelForColor(this.categories);
      }
      if (this.projectType == 'ner') {
        this.nerLabelForColor(this.categories);
      }
      this.isShowDropDown = false;
      if (
        this.categories &&
        this.categories.length > 6 &&
        this.projectType != 'ner' &&
        this.projectType != 'image' &&
        this.projectType != 'log'
      ) {
        this.isShowDropDown = true;
      }
    }
  }

  addLogScrollListener() {
    setTimeout(() => {
      let dom = this.el.nativeElement.querySelector('.txtBox');
      let $this = this;
      dom.addEventListener('scroll', function () {
        const scrollDistance = dom.scrollHeight - dom.scrollTop - dom.clientHeight;
        if (scrollDistance <= 10) {
          let a = $this.sr.originalData.length;
          if (a < $this.logTotalSize) {
            let b = a + 400 < $this.logTotalSize ? a + 400 : $this.logTotalSize;
            $this.originLogList.forEach((element, index) => {
              if (a < b && a <= index) {
                $this.sr.originalData.push(element);
                a++;
              }
            });
          }
          setTimeout(() => {
            if ($this.spansList.length > 0) {
              $this.spansList.forEach((data) => {
                $this.onMouseDownTxt(
                  {
                    line: data.line,
                    label: data.label,
                    freeText: data.freeText,
                  },
                  data.index,
                );
                $this.onMouseUpTxt(
                  {
                    line: data.line,
                    label: data.label,
                    freeText: data.freeText,
                  },
                  data.index,
                  'historyBack',
                );
              });
            }
          }, 5);
        }
      });
    }, 5);
  }

  showPreLogLable() {
    this.addLogScrollListener();
    this.spansList = [];
    setTimeout(() => {
      if (this.sr.userInputs && this.sr.userInputs.length > 0) {
        this.sr.userInputs[0].problemCategory.forEach((element) => {
          for (let i = 0; i < this.originLogList.length; i++) {
            if (element.line == this.originLogList[i].line) {
              this.onMouseDownTxt(element, this.originLogList[i].index);
              this.onMouseUpTxt(element, this.originLogList[i].index, 'historyBack');
              break;
            }
          }
        });
        this.questionForm
          .get('logFreeText')
          .setValue(this.sr.userInputs[0].logFreeText !== '' ? this.sr.userInputs[0].logFreeText : null);
      }
    }, 10);
  }

  toReadStorageSetting(set) {
    if (localStorage.getItem('annotate-setting')) {
      const settings = JSON.parse(localStorage.getItem('annotate-setting'));
      for (let i = 0; i < settings.length; i++) {
        if (this.projectId == settings[i].pId) {
          if (set === 'logFilter' && settings[i].filter !== '') {
            this.filterList = settings[i].filter;
            this.toFilterLog(this.filterList);
            break;
          }
          if (set === 'display' && settings[i].display !== '') {
            this.renderFormat = settings[i].display;
            this.questionForm.get('renderFormat').setValue(settings[i].display);
            break;
          }
        }
      }
    }
  }

  getOneReview(from?) {
    this.loading = true;
    this.apiService.getOneReview(this.projectId, this.reviewee, this.reviewOrder).subscribe(
      (res) => {
        this.loading = false;
        this.submitAndHistory(res, from);
        if (res && res.MSG) {
          // const reviewee = this.reviewee;
          // if (reviewee) {
          //   this.error = res.MSG;
          // } else {
          //   this.error = 'All cases have been completely reviewed.';
          // }
          this.error = res.MSG;
          this.loading = false;
          return;
        } else {
          this.disabledSkip = res[0].reviewInfo.review;
          if (this.projectType === 'log') {
            this.currentLogFile = this.sr.fileInfo.fileName;
            if (this.sr && this.sr.flag && this.sr.flag.silence) {
              this.silenceStatus = true;
            }
            this.getAllLogFilename();
          }
          this.initInfo();
          this.categoryBackFunc();
          this.getProgress();
          this.toReadStorageSetting('logFilter');
        }
      },
      (error) => {
        this.loading = false;
      },
      () => {
        this.loading = false;
      },
    );
  }

  onSelectingCategory(label, index) {
    this.active = index;
    this.labelChoose = label;
  }

  onSelectingDropDown(e) {
    this.onSubmit();
  }

  pass() {
    if (this.moreReviewInfo.length !== 0) {
      if (!this.checkMoreReviewChanged()) {
        return false;
      }
      this.submitReview('pass');
    } else {
      this.isSkipOrBack('pass');
    }
  }

  dropDownSubmit() {
    this.questionForm.get('category').reset();
  }

  isInValidateNumber() {
    if (this.labelChoose === '' || this.labelChoose === null || this.clrErrorTip) {
      return true;
    }
    return false;
  }

  onSubmit(from?): void {
    if (this.isNumeric && this.isInValidateNumber()) {
      this.clrErrorTip = true;
      return;
    }
    if (this.isMultipleNumericLabel) {
      if (this.scores.some((item) => item.clrErrorTip)) {
        return;
      }
    }
    this.clearCheckbox();
    this.silenceStatus = false;
    this.error = null;
    this.actionError = null;
    this.maxAnnotationError = null;
    if (this.startFrom === 'review') {
      this.submitReview(from);
    } else {
      const srUserInput: SrUserInput = {
        pid: this.projectId,
        userInput: [
          {
            problemCategory: this.categoryFunc(),
            tid: this.sr._id,
          },
        ],
      };

      if (
        this.isMultipleLabel &&
        this.projectType !== 'ner' &&
        this.projectType !== 'image' &&
        this.projectType !== 'log'
      ) {
        // case multiple checkbox
        if (this.sr.userInputs) {
          let originalLabel = [];
          if (this.sr.userInputs.length > 0) {
            for (let j = 0; j < this.sr.userInputs.length; j++) {
              if (this.sr.userInputs[j].user === this.user.email) {
                originalLabel.push(this.sr.userInputs[j].problemCategory);
              }
            }
          } else if (this.sr.userInputs.length == 0) {
            originalLabel = [];
          }
          this.modifyChangeHistory(originalLabel);
        }
      } else if (this.projectType == 'ner') {
        this.modifyChangeHistory();
      } else if (this.projectType == 'image') {
        srUserInput.userInput[0].problemCategory = this.currentBoundingData;
        this.sr.images = this.currentBoundingData;
        this.modifyChangeHistory();
      } else if (this.projectType == 'log') {
        this.modifyChangeHistory();
        srUserInput.userInput[0]['logFreeText'] = this.questionForm.get('logFreeText').value;
      } else {
        if (this.sr.userInputs) {
          let originalLabel;
          if (this.sr.userInputs.length > 0) {
            for (let j = 0; j < this.sr.userInputs.length; j++) {
              if (this.sr.userInputs[j].user === this.user.email) {
                originalLabel = this.sr.userInputs[j].problemCategory;
                this.modifyChangeHistory(originalLabel);
                break;
              }
            }
          } else if (this.sr.userInputs.length == 0) {
            originalLabel = '';
            this.modifyChangeHistory(originalLabel);
          }
        }
      }
      this.loading = true;
      this.apiService.putSrUserInput(srUserInput).subscribe(
        (response) => {
          if (response && response.MSG) {
            this.getOne();
            this.maxAnnotationError =
              'Annotate invalid because the previous ticket has already meet the maxAnnotation.';
            setTimeout(() => {
              this.maxAnnotationError = null;
            }, 10000);
          } else {
            this.maxAnnotationError = null;
            this.getOne();
          }
        },
        (error) => {
          this.getOne();
        },
      );
    }
  }

  submitReview(from?) {
    this.loading = true;
    this.modifyChangeHistory(null, from);
    const param = {
      pid: this.projectId,
      tid: this.sr._id,
    };
    if (from === 'pass') {
      param['modify'] = false;
    } else {
      param['modify'] = true;
      if (this.projectType === 'log' || this.projectType === 'ner') {
        param['problemCategory'] = this.spansList;
        param['logFreeText'] = this.questionForm.get('logFreeText').value;
      } else if (this.isMultipleNumericLabel || this.isNumeric) {
        if (this.moreReviewInfo.length !== 0 && this.categoryFunc().length === 0) {
          param['modify'] = false;
        } else {
          param['problemCategory'] = this.categoryFunc();
        }
      } else if ((this.projectType === 'text' || this.projectType === 'tabular') && this.labelType !== 'HTL') {
        if (this.isShowDropDown || this.isMultipleLabel) {
          if (this.moreReviewInfo.length !== 0 && this.categoryFunc().length === 0) {
            param['modify'] = false;
          } else {
            param['problemCategory'] = this.categoryFunc();
          }
        } else {
          param['problemCategory'] = [this.labelChoose];
        }
      } else if ((this.projectType === 'text' || this.projectType === 'tabular') && this.labelType === 'HTL') {
        param['problemCategory'] = this.categoryFunc();
      } else if (this.projectType === 'image') {
        param['problemCategory'] = this.categoryFunc();
      }
    }
    this.apiService.passTicket(param).subscribe((res) => {
      this.getOneReview(from);
    });
  }

  srInHistory() {
    // if user doesn't modify the history ticket then should keep the annotationhistory not change
    let a = 0;
    if (this.annotationHistory.length > 0) {
      for (let i = 0; i < this.annotationHistory.length; i++) {
        if (this.annotationHistory[i].srId === this.sr._id) {
          a++;
          break;
        }
      }
      return a > 0 ? true : false;
    }
  }

  modifyChangeHistory(originalLabel?, from?) {
    for (let i = 0; i < this.annotationHistory.length; i++) {
      if (this.isShowDropDown && !this.isMultipleLabel) {
        // case dropdown
        if (
          this.annotationHistory[i].srId === this.sr._id &&
          originalLabel !== this.questionForm.get('category').value
        ) {
          this.annotationHistory.splice(i, 1);
          this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
          break;
        }
      } else if (
        !this.isShowDropDown &&
        !this.isMultipleLabel &&
        (this.projectType == 'text' || this.projectType == 'tabular')
      ) {
        // case 6 labels or numeric
        if (this.annotationHistory[i].srId === this.sr._id && originalLabel !== this.labelChoose) {
          this.annotationHistory.splice(i, 1);
          this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
          break;
        }
      } else if (this.isMultipleLabel && (this.projectType == 'text' || this.projectType == 'tabular')) {
        // case multiple
        for (let i = 0; i < this.annotationHistory.length; i++) {
          if (this.isMultipleNumericLabel) {
            if (this.annotationHistory[i].srId === this.sr._id) {
              let labelScore = [];
              this.scores.forEach((item) => {
                if (item.checked) {
                  labelScore.push({ [item.label]: item.scoreInputValue });
                }
              });
              this.annotationHistory[i].category = labelScore;
              this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
              break;
            }
          } else if (this.labelType === 'HTL') {
            if (this.annotationHistory[i].srId === this.sr._id) {
              this.annotationHistory.splice(i, 1);
              this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
              break;
            }
          } else {
            let difference = [];
            if (originalLabel) {
              if (originalLabel.length - this.multipleLabelList.length >= 0) {
                difference = _.difference(originalLabel, this.multipleLabelList);
              } else {
                difference = _.difference(this.multipleLabelList, originalLabel);
              }
            }
            if (this.startFrom === 'review' && this.annotationHistory[i].srId === this.sr._id && !originalLabel) {
              this.annotationHistory[i].category = this.multipleLabelList;
              this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
              break;
            }
            if (this.annotationHistory[i].srId === this.sr._id && difference.length > 0) {
              this.annotationHistory.splice(i, 1);
              this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
              break;
            }
          }
        }
      } else if (this.projectType === 'ner' || this.projectType === 'log' || this.projectType === 'image') {
        const isCategory = this.categoryFunc();
        for (let i = 0; i < this.annotationHistory.length; i++) {
          if (this.annotationHistory[i].srId === this.sr._id) {
            if (this.annotationHistory[i].category.length === isCategory.length) {
              if (this.projectType === 'image') {
                this.annotationHistory[i].category.forEach((element) => {
                  if (element.type === 'rectanglelabels') {
                    element.valueInfo = JSON.stringify(element.value);
                    element.sort = element.value.x;
                  } else if (element.type === 'polygonlabels') {
                    element.valueInfo = JSON.stringify(element.value.points);
                    element.sort = element.value.points[0][0];
                  }
                });
                isCategory.forEach((element) => {
                  if (element.type === 'rectanglelabels') {
                    element.valueInfo = JSON.stringify(element.value);
                    element.sort = element.value.x;
                  } else if (element.type === 'polygonlabels') {
                    element.valueInfo = JSON.stringify(element.value.points);
                    element.sort = element.value.points[0][0];
                  }
                });
              }
              const aa = this.annotationHistory[i].category.sort(
                this.toolService.sortBy(
                  this.projectType === 'ner' ? 'start' : this.projectType === 'log' ? 'line' : 'sort',
                  'ascending',
                ),
              );
              const bb = isCategory.sort(
                this.toolService.sortBy(
                  this.projectType === 'ner' ? 'start' : this.projectType === 'log' ? 'line' : 'sort',
                  'ascending',
                ),
              );

              for (let n = 0; n < aa.length; n++) {
                let aaString;
                let bbString;
                if (this.projectType === 'ner') {
                  aaString = aa[n].text + aa[n].start + aa[n].end + aa[n].label;
                  bbString = bb[n].text + bb[n].start + bb[n].end + bb[n].label;
                } else if (this.projectType === 'log') {
                  aaString = aa[n].line + aa[n].label + aa[n].freeText;
                  bbString = bb[n].line + bb[n].label + bb[n].freeText;
                } else if (this.projectType === 'image') {
                  aaString = aa[n].valueInfo;
                  bbString = bb[n].valueInfo;
                }
                if (aaString !== bbString) {
                  this.annotationHistory.splice(i, 1);
                  this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
                  return;
                }
                // all userInputs are same no any changes there
                if (this.projectType === 'log' && n >= aa.length - 1) {
                  if (from === 'pass') {
                    this.annotationHistory.splice(i, 1);
                    this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
                  }
                }
              }
            } else {
              this.annotationHistory.splice(i, 1);
              this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
            }
          }
        }
      }
    }
  }

  getOne() {
    const paramSr = {
      id: this.projectId,
    };
    this.apiService.getRandomSr(paramSr).subscribe(
      (newSr) => {
        this.getProgress();
        if (newSr && newSr.MSG) {
          this.error = newSr.MSG;
          this.loading = false;
        }
        this.submitAndHistory(newSr);
      },
      (error) => {
        this.error = JSON.stringify(error);
        this.loading = false;
      },
      () => {
        this.loading = false;
        if (this.projectType == 'log' && !this.error && !this.sr.MSG) {
          setTimeout(() => {
            this.el.nativeElement.querySelector('.logCategories' + this.selectedEntityID).style.backgroundColor =
              this.colorsRainbow[this.selectedEntityID];
          }, 5);
        }
      },
    );
  }

  submitAndHistory(newSr, from?) {
    // add to the history
    if (this.maxAnnotationError == null && this.sr._id !== 0 && from !== 'review') {
      const OldSr = JSON.parse(JSON.stringify(this.sr));
      const addSubmit = {
        srId: OldSr._id,
        type: from === 'pass' ? 'pass' : 'submit',
        category: this.categoryFunc(),
        rewrite: '',
        solution: '',
        activeClass: this.active,
        images: OldSr.images,
      };
      if (this.projectType == 'ner' || this.projectType == 'image') {
        if (!this.env.config.enableAWSS3 && this.projectType === 'image') {
          OldSr.originalData.location = `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
            OldSr.originalData.location
          }&token=${JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token}`;
        }
        addSubmit['historyDescription'] = [OldSr.originalData];
      } else if (this.projectType == 'log') {
        if (addSubmit.category.length > 0) {
          addSubmit.category.forEach((element) => {
            for (let i = 0; i < OldSr.originalData.length; i++) {
              if (element.line == OldSr.originalData[i].line) {
                element.text = OldSr.originalData[i].text;
                break;
              }
            }
          });
          addSubmit['historyDescription'] = addSubmit.category;
        } else {
          addSubmit['historyDescription'] = [{ text: OldSr.originalData[0].text }];
        }
      } else {
        addSubmit['historyDescription'] = OldSr.originalData?.slice(0, 10);
      }
      if (from !== 'order') {
        if (!this.srInHistory()) {
          this.annotationHistory.unshift(addSubmit);
        }
        this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
      }
      this.clearScores(false);
      // console.log('getOne.annotationHistory:::', this.annotationHistory, this.annotationPrevious);
    }
    this.sr = newSr;
    if (this.labelType === 'HTL') {
      this.treeLabels = this.originTreeLabels ? JSON.parse(JSON.stringify(this.originTreeLabels)) : [];
    }
    this.currentBoundingData = [];
    if (this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'regression') {
      this.sr = this.resetTabularSrData(this.sr);
    }
    if (this.projectType == 'ner') {
      this.sr = this.resetNerSrData(this.sr);
      if (from !== 'review' && from !== 'pass' && this.startFrom !== 'review') {
        this.toShowExistingLabel();
      }
    }
    if (this.projectType == 'image') {
      this.sr = this.resetImageSrData(this.sr);
      // console.log("getOne.this.sr:::", this.sr)
      if (this.startFrom === 'review') {
        const images = [];
        this.sr.userInputs?.forEach((item) => {
          images.push(item.problemCategory);
        });
        this.historyTask = [{ result: images }];
        this.currentBoundingData = images;
      }
      setTimeout(() => {
        const option = {
          dom: 'label-studio',
          imageRectLabelTemplate: this.imageRectLabelTemplate,
          imagePolyLabelTemplate: this.imagePolyLabelTemplate,
          url: this.env.config.enableAWSS3
            ? this.sr.originalData.location
            : `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
                this.sr.originalData.location
              }&token=${JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token}`,
          historyCompletions: this.historyTask,
          annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
          from: 'annotate',
        };
        this.toCallStudio(option);
      }, 0);
    }
    if (this.projectType == 'log') {
      this.sr = this.resetLogSrData(this.sr);
      if (this.sr.MSG) {
        return;
      }
      this.showPreLogLable();
      this.currentLogFile =
        this.projectInfo.isShowFilename || this.startFrom === 'review' ? this.sr.fileInfo?.fileName : '';
      this.toFilterLog(this.filterList);
    }
    if (this.sr && this.sr.flag && this.sr.flag.silence) {
      this.silenceStatus = true;
    }
    if (this.isNumeric) {
      setTimeout(() => {
        this.numericInput.nativeElement.focus();
      }, 500);
    }
    if (from !== 'review') {
      this.clearUserInput();
    }
  }

  onEndGame(): void {
    if (this.sr.MSG && this.error) {
      this.router.navigate(['/loop/project/list']);
      return;
    }
    if (this.isFormPrestine() || !this.isAllowedAnnotate) {
      this.router.navigate(['/loop/project/list']);
    } else {
      if (this.labelType == 'HTL' && this.selectedTreeLabels.length === 0) {
        this.router.navigate(['/loop/project/list']);
      } else {
        this.isEndingGameDialog = true;
      }
    }
  }

  onSkipGame(): void {
    if (this.isFormPrestine() && !this.actionError) {
      this.clearCheckbox();
      this.labelChoose = null;
      this.active = -1;
      this.skipAndFetchNewQuestion();
    } else {
      if (
        this.isNumeric ||
        this.isMultipleNumericLabel ||
        (this.isMultipleLabel &&
          this.labelType !== 'HTL' &&
          this.projectType !== 'ner' &&
          this.projectType !== 'image' &&
          this.projectType !== 'log')
      ) {
        const isCategory = this.categoryFunc();
        this.isActionErr(isCategory, null, 'skip');
      } else if (this.projectType == 'ner') {
        this.isSkipOrBack('skip');
      } else if (this.projectType == 'image') {
        this.isSkipOrBack('skip');
      } else if (this.projectType == 'log') {
        this.isSkipOrBack('skip');
      } else if (this.labelType == 'HTL') {
        this.checkHTL('skip');
      } else {
        this.skipAndFetchNewQuestion();
      }
    }
  }

  checkHTL(from?: string, id?: string) {
    let inputTreeArr = [];
    if (this.moreReviewInfo.length !== 0 && this.selectedTreeLabels.length === 0) {
      this.checkTextProject(from, id);
    } else if (this.moreReviewInfo.length !== 0 && this.selectedTreeLabels.length > 0) {
      this.actionError = this.tipMessage;
      this.loading = false;
      return false;
    } else {
      if (this.sr.userInputs && this.sr.userInputs.length > 0) {
        inputTreeArr = this.sr.userInputs[0].problemCategory;
      }
      if (inputTreeArr.length === 0 && this.selectedTreeLabels.length === 0) {
        this.checkTextProject(from, id);
      } else {
        const difference = JSON.stringify(this.treeLabels) === JSON.stringify(inputTreeArr);
        if (!difference) {
          this.actionError = this.tipMessage;
          this.loading = false;
          return false;
        }
        this.checkTextProject(from, id);
      }
    }
  }

  checkMutilLabel(from?: string, id?: string) {
    let multiLabels = [];
    this.sr.userInputs.forEach((item) => {
      if (this.startFrom === 'review') {
        multiLabels.push(item.problemCategory);
      } else {
        if (item.user === this.user.email) {
          multiLabels.push(item.problemCategory);
        }
      }
    });
    let difference = [];
    if (multiLabels.length > this.multipleLabelList.length) {
      difference = _.difference(multiLabels, this.multipleLabelList);
    } else {
      difference = _.difference(this.multipleLabelList, multiLabels);
    }
    if (difference.length > 0) {
      this.actionError = this.tipMessage;
      this.loading = false;
      return false;
    }
    this.checkTextProject(from, id);
  }

  checkNumeric(isCategory?: any, from?: string, id?: string) {
    let multiLabels = [];
    this.sr.userInputs.forEach((item) => {
      if (this.startFrom === 'review') {
        multiLabels.push(item.problemCategory);
      } else {
        if (item.user === this.user.email) {
          multiLabels.push(item.problemCategory);
        }
      }
    });
    let difference = [];
    if (multiLabels.length > isCategory.length) {
      difference = _.difference(multiLabels, isCategory);
    } else {
      difference = _.difference(isCategory, multiLabels);
    }
    if (difference.length > 0) {
      this.actionError = this.tipMessage;
      this.loading = false;
      return;
    }
    this.checkTextProject(from, id);
  }

  checkMoreReviewChanged() {
    if (this.startFrom === 'review' && this.moreReviewInfo.length !== 0) {
      if (this.labelType === 'HTL' && this.selectedTreeLabels.length > 0) {
        this.actionError = this.tipMessage;
        this.loading = false;
        return false;
      }
      if (this.labelType !== 'HTL' && this.categoryFunc().length > 0) {
        this.actionError = this.tipMessage;
        this.loading = false;
        return false;
      }
    }
    return true;
  }

  skipAndFetchNewQuestion(): void {
    this.clearCheckbox();
    this.clearScores(false);
    this.silenceStatus = false;
    this.clrErrorTip = false;
    this.loading = true;
    const paramSr = {
      pid: this.projectId,
      tid: this.sr._id,
    };
    if (this.startFrom === 'review') {
      paramSr['review'] = true;
      paramSr['order'] = this.reviewOrder;
      if (this.reviewee) {
        paramSr['user'] = this.reviewee;
      }
    }
    this.apiService.skipToNext(paramSr).subscribe(
      (responseSr) => {
        if (responseSr && responseSr.MSG) {
          this.error = this.sr.MSG;
          this.loading = false;
          return;
        }
        // skip to the history
        const OldSr = JSON.parse(JSON.stringify(this.sr));
        if (!this.env.config.enableAWSS3 && this.projectType === 'image') {
          OldSr.originalData.location = `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
            OldSr.originalData.location
          }&token=${JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token}`;
        }
        let category = [];
        if (this.projectType === 'ner' || this.projectType === 'log') {
          category = this.spansList;
        } else if (this.startFrom === 'review' && this.isMultipleLabel && !this.isNumeric) {
          if (OldSr.userInputs && OldSr.userInputs.length > 0) {
            for (let j = 0; j < OldSr.userInputs.length; j++) {
              if (OldSr.userInputs[j].user === this.user.email) {
                category.push(this.sr.userInputs[j].problemCategory);
              }
            }
          }
        }
        const addSkip = {
          srId: OldSr._id,
          historyDescription:
            this.projectType === 'ner' || this.projectType === 'image'
              ? [OldSr.originalData]
              : OldSr.originalData.slice(0, 10),
          type: 'skip',
          category,
          rewrite: '',
          solution: '',
          activeClass: -1,
          images: [],
        };
        if (!this.srInHistory()) {
          this.annotationHistory.unshift(addSkip);
        }
        this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));

        this.sr = responseSr;
        if (this.startFrom !== 'review') {
          this.currentBoundingData = [];
        }
        if (this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'regression') {
          this.sr = this.resetTabularSrData(this.sr);
        }
        if (this.projectType == 'ner') {
          this.sr = this.resetNerSrData(this.sr);
          this.toShowExistingLabel();
        }
        if (this.projectType == 'image') {
          this.sr = this.resetImageSrData(this.sr);
          if (this.startFrom === 'review') {
            const images = [];
            this.sr.userInputs.forEach((item) => {
              images.push(item.problemCategory);
            });
            this.historyTask = [{ result: images }];
          }
          setTimeout(() => {
            const option = {
              dom: 'label-studio',
              imageRectLabelTemplate: this.imageRectLabelTemplate,
              imagePolyLabelTemplate: this.imagePolyLabelTemplate,
              url: this.env.config.enableAWSS3
                ? this.sr.originalData.location
                : `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
                    this.sr.originalData.location
                  }&token=${JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token}`,
              historyCompletions: this.historyTask,
              annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
              from: 'annotate',
            };
            this.toCallStudio(option);
          }, 0);
        }
        if (this.projectType == 'log') {
          this.sr = this.resetLogSrData(this.sr);
          this.showPreLogLable();
          this.currentLogFile =
            this.projectInfo.isShowFilename || this.startFrom === 'review' ? this.sr.fileInfo.fileName : '';
          this.setSelectedFile();
          this.toFilterLog(this.filterList);
        }
        if (this.sr.userInputsLength > 0) {
          if (this.projectType !== 'ner') {
            this.categoryBackFunc();
          }
          if (this.projectType !== 'image') {
            this.sortLabelForColor(this.categories);
          }
          this.getProgress();
        }
        if (this.sr && this.sr.flag && this.sr.flag.silence) {
          this.silenceStatus = true;
        }
        if (this.labelType === 'HTL' && this.startFrom !== 'review') {
          this.treeLabels = JSON.parse(JSON.stringify(this.originTreeLabels));
        }
        this.loading = false;
        this.isSkippingGameDialog = false;
        if (this.isNumeric) {
          setTimeout(() => {
            this.numericInput.nativeElement.focus();
          }, 500);
        }
        if (this.startFrom !== 'review' || this.projectType === 'ner') {
          this.clearUserInput();
        }
      },
      (error) => {
        this.error = JSON.stringify(error);
        this.loading = false;
        this.isSkippingGameDialog = false;
      },
      () => {
        this.loading = false;
        if (this.projectType == 'log') {
          setTimeout(() => {
            this.el.nativeElement.querySelector('.logCategories' + this.selectedEntityID).style.backgroundColor =
              this.colorsRainbow[this.selectedEntityID];
          }, 5);
        }
        this.isSkippingGameDialog = false;
      },
    );
  }

  isFormPrestine(): boolean {
    const category = this.categoryFunc();
    if (this.isNumeric) {
      setTimeout(() => {
        this.numericInput.nativeElement.focus();
      }, 500);
    }
    const logFreeText = this.questionForm.get('logFreeText').value;
    const answer = this.questionForm.get('answer').value;
    return !(category.length > 0 || logFreeText || answer);
  }

  toGetProjectInfo(pid) {
    this.apiService.getProjectInfo(pid).subscribe(
      (response) => {
        response.taskInstructions = response.taskInstructions.replace(/(\r\n|\n|\r)/gm, '<br/>');
        this.projectInfo = { ...response };
        if (this.startFrom === 'review') {
          this.projectInfo.annotationQuestion = "What's the final label?";
        }
        // if the current user has no permission to annotate should hide the tab and stop the api call
        if (!this.isAllowedAnnotate && this.startFrom !== 'review') {
          return;
        }
        this.max = response.maxAnnotation;
        this.isMultipleLabel = response.isMultipleLabel;
        this.projectType = response.projectType;
        this.labelType = response.labelType;
        this.selectParam = response.projectName;
        this.createForm();
        this.isMultipleNumericLabel = this.isMultipleLabel && this.labelType === 'numericLabel';
        if (this.labelType === 'numericLabel' && !this.isMultipleLabel) {
          this.minLabel = response.min;
          this.maxLabel = response.max;
          this.numericValue = this.minLabel;
          this.labelChoose = this.minLabel;
          let minStep = 0;
          if (response.min.toString().includes('.')) {
            minStep = response.min.toString().split('.')[1].length;
          }
          let maxStep = 0;
          if (response.max.toString().includes('.')) {
            maxStep = response.max.toString().split('.')[1].length;
          }
          let step = '1';
          this.stepLen = Number(maxStep) > Number(minStep) ? maxStep : minStep;
          if (this.stepLen > 0) {
            for (let i = 0; i < this.stepLen; i++) {
              step += '0';
            }
          }
          this.numericOptions.step = Number(1 / Number(step));
          this.numericOptions.floor = response.min;
          this.numericOptions.ceil = response.max;
        } else if (this.isMultipleNumericLabel) {
          let categoryList = JSON.parse(response.categoryList);
          categoryList.forEach((element) => {
            const labels = Object.keys(element);
            const itemKey = labels[0];
            const values = element[itemKey];
            const minVal = values[0];
            const maxVal = values[1];
            let minStep = 0;
            if (minVal.toString().includes('.')) {
              minStep = minVal.toString().split('.')[1].length;
            }
            let maxStep = 0;
            if (maxVal.toString().includes('.')) {
              maxStep = maxVal.toString().split('.')[1].length;
            }
            let step = '1';
            const stepLen = Number(maxStep) > Number(minStep) ? maxStep : minStep;
            if (stepLen > 0) {
              for (let i = 0; i < stepLen; i++) {
                step += '0';
              }
            }
            this.numericOptions.step = Number(1 / Number(step));
            this.scores.push({
              label: itemKey,
              checked: false,
              scoreValue: minVal,
              scoreInputValue: minVal,
              stepLen,
              clrErrorTip: false,
              scoreOptions: {
                floor: minVal,
                step: Number(1 / Number(step)),
                ceil: maxVal,
              },
            });
            this.scoreMessage.push('Allowed values are between ' + minVal + ' and ' + maxVal + ' .');
          });
        } else if (this.labelType === 'HTL') {
          this.originTreeLabels = JSON.parse(response.categoryList);
          this.treeLabels = this.originTreeLabels ? JSON.parse(JSON.stringify(this.originTreeLabels)) : [];
        } else {
          this.categories = response.categoryList.split(',');
          this.popLabels = response.popUpLabels;
          this.isShowPopLabel = response.popUpLabels && response.popUpLabels.length;
        }
        if (response.maxAnnotation > 1) {
          this.reviewee = '';
          if (this.labelType !== 'numericLabel') {
            this.reviewOrder = 'most_uncertain';
          }
        } else {
          this.reviewee = this.initReview;
          this.reviewOrder = 'random';
        }
        if (this.startFrom === 'review') {
          this.submitMessage = 'modify';
          this.getOneReview('review');
        } else {
          this.submitMessage = 'submit';
          this.fetchData();
        }
        this.tipMessage = `The current label is different from the original existing label, please do ${this.submitMessage} first.`;
      },
      (error) => {
        this.loading = false;
      },
    );
  }

  getProgress() {
    const param = {
      id: this.projectId,
      review: this.startFrom === 'review' ? true : null,
    };
    this.apiService.getProgress(param).subscribe(
      (response) => {
        if (this.startFrom === 'review') {
          response.userCompleteCase = response.userCompleteCase.sort(
            this.toolService.sortBy('completeCase', 'descending'),
          );
        }
        this.progressInfo = response;
        this.percentage =
          Math.round(
            (this.progressInfo.completeCase /
              (this.startFrom === 'review'
                ? this.progressInfo.totalCase
                : this.progressInfo.assignedCase == 0
                ? 1
                : this.progressInfo.assignedCase)) *
              10000,
          ) / 100;
      },
      (error) => {},
    );
  }

  isActionErr(isCategory, id?, from?) {
    if (!this.sr.userInputsLength && !this.sr.userInputs && !this.isNumeric) {
      this.actionError = this.tipMessage;
      this.loading = false;
      return;
    } else if (!this.sr.userInputsLength && !this.sr.userInputs && this.isNumeric && isCategory[0] !== this.minLabel) {
      this.actionError = this.tipMessage;
      this.loading = false;
      return;
    } else {
      for (let i = 0; i < this.annotationHistory.length; i++) {
        if (this.annotationHistory[i].srId === this.sr._id) {
          let difference = [];
          if (this.isMultipleNumericLabel) {
            if (this.annotationHistory[i].category.length !== this.scores.filter((item) => item.checked).length) {
              this.actionError = this.tipMessage;
              this.loading = false;
              return;
            }
            for (const item of this.scores) {
              for (const ele of this.annotationHistory[i].category) {
                const key = Object.keys(ele)[0];
                if (item.label === key && item.scoreInputValue !== ele[key]) {
                  this.actionError = this.tipMessage;
                  this.loading = false;
                  return;
                }
              }
            }
          } else if (!this.isNumeric && this.isMultipleLabel && !this.isMultipleNumericLabel) {
            if (this.annotationHistory[i].category.length === 0) {
              if (from == 'skip') {
                this.skipAndFetchNewQuestion();
                return;
              } else if (from == 'pass') {
                this.onSubmit(from);
                return;
              } else {
                this.getNextSrc(from, id);
                return;
              }
            } else if (this.annotationHistory[i].category.length - this.multipleLabelList.length >= 0) {
              difference = _.difference(this.annotationHistory[i].category, this.multipleLabelList);
            } else {
              difference = _.difference(this.multipleLabelList, this.annotationHistory[i].category);
            }
            if (difference.length > 0) {
              this.actionError = this.tipMessage;
              this.loading = false;
              return;
            }
          } else {
            if (this.annotationHistory[i].category.length === 0) {
              if (from == 'skip') {
                this.skipAndFetchNewQuestion();
                return;
              } else if (from == 'pass') {
                this.onSubmit(from);
                return;
              } else {
                this.getNextSrc(from, id);
                return;
              }
            }
            if (this.annotationHistory[i].category.length - isCategory.length >= 0) {
              difference = _.difference(this.annotationHistory[i].category, isCategory);
            } else {
              difference = _.difference(isCategory, this.annotationHistory[i].category);
            }
            if (this.annotationHistory[i].srId === this.sr._id && difference.length > 0) {
              this.actionError = this.tipMessage;
              this.loading = false;
              return;
            }
          }
        }
      }
      if (this.startFrom === 'review' && this.isMultipleNumericLabel) {
        this.checkMutilNumbericDiff(isCategory, from, id);
        return;
      }
      if (this.startFrom === 'review' && !this.isMultipleNumericLabel && this.isMultipleLabel) {
        this.checkMutilLabel(from, id);
        return;
      }
      if (this.startFrom === 'review' && !this.isMultipleNumericLabel && this.isNumeric) {
        this.checkNumeric(isCategory, from, id);
        return;
      }
      if (from == 'skip') {
        this.skipAndFetchNewQuestion();
      } else if (from == 'pass') {
        this.onSubmit(from);
      } else {
        this.getNextSrc(from, id);
      }
    }
  }

  checkMutilNumbericDiff(isCategory: any, from?: string, id?: string) {
    let inputMultipleNumericLabels = [];
    this.sr.userInputs.forEach((item) => {
      if (this.startFrom === 'review') {
        inputMultipleNumericLabels.push({
          [item.problemCategory.label]: item.problemCategory.value,
        });
      } else {
        if (item.user === this.user.email) {
          inputMultipleNumericLabels.push({
            [item.problemCategory.label]: item.problemCategory.value,
          });
        }
      }
    });
    if (isCategory.length !== inputMultipleNumericLabels.length) {
      this.actionError = this.tipMessage;
      this.loading = false;
      return;
    }
    if (
      isCategory.length > 0 &&
      inputMultipleNumericLabels.length > 0 &&
      isCategory.length === inputMultipleNumericLabels.length
    ) {
      let inputKeys = [];
      for (const item of isCategory) {
        inputKeys.push(Object.keys(item)[0]);
      }
      let originKeys = [];
      for (const ele of inputMultipleNumericLabels) {
        originKeys.push(Object.keys(ele)[0]);
      }
      if (_.difference(inputKeys, originKeys).length > 0 || _.difference(originKeys, inputKeys).length > 0) {
        this.actionError = this.tipMessage;
        this.loading = false;
        return;
      }
      for (const item of isCategory) {
        for (const ele of inputMultipleNumericLabels) {
          const key = Object.keys(ele)[0];
          if (Object.keys(item)[0] === key && item[key] !== ele[key]) {
            this.actionError = this.tipMessage;
            this.loading = false;
            return;
          }
        }
      }
    }
    this.checkTextProject(from, id);
  }

  checkTextProject(from?: any, id?: string) {
    if (!this.checkMoreReviewChanged()) {
      return false;
    }
    if (from === 'skip') {
      this.skipAndFetchNewQuestion();
    } else if (from == 'pass') {
      this.onSubmit(from);
    } else {
      this.getNextSrc(from, id);
    }
  }

  getNextSrc(from, id: string) {
    if (!this.actionError) {
      this.clearCheckbox();
      this.multipleLabelList = [];
      const param = {
        id,
        pid: this.projectId,
      };
      this.getSrById(param, 0, from === 'history' ? from : 'previous');
    }
  }

  receiveOutClickHistory(value) {
    // this.loading = false;
    // this.sr.MSG = null;
    // this.error = null;
    if (this.currentTabIndex !== 1) {
      this.currentTabIndex = 1;
    }
    this.historyBack(value.index, value.id);
  }

  historyBack(index, id) {
    this.actionError = null;
    this.silenceStatus = false;
    const isCategory = this.categoryFunc();

    // to update the annotationprevious list from the index
    if (this.projectType !== 'image') {
      this.annotationPrevious = this.annotationHistory.slice(index + 1);
    }
    if (isCategory.length > 0) {
      // under assign tab if the error alert then call sr by id for the current sr has been null
      if (this.sr.MSG || this.error) {
        const param = {
          id,
          pid: this.projectId,
        };
        this.getSrById(param, index, 'history');
        return;
      }
      if (
        this.isNumeric ||
        this.isMultipleNumericLabel ||
        (this.isMultipleLabel &&
          this.labelType !== 'HTL' &&
          this.projectType !== 'ner' &&
          this.projectType !== 'image' &&
          this.projectType !== 'log')
      ) {
        this.isActionErr(isCategory, id, 'history');
      } else if (this.projectType == 'ner') {
        this.isSkipOrBack('history', id);
      } else if (this.projectType == 'image') {
        this.isSkipOrBack('history', id, index);
      } else if (this.projectType == 'log') {
        this.isSkipOrBack('history', id);
      } else {
        const param = {
          id,
          pid: this.projectId,
        };
        this.getSrById(param, index, 'history');
      }
    } else {
      this.clearCheckbox();
      const param = {
        id,
        pid: this.projectId,
      };
      this.getSrById(param, index, 'history');
    }
  }

  isSkipOrBack(type, id?, index?) {
    const isCategory = this.categoryFunc();
    let flag1;
    let flag2;
    if (this.projectType == 'ner' || this.projectType == 'log') {
      flag1 = this.sr.userInputs && this.sr.userInputs.length > 0 && this.sr.userInputs[0].problemCategory.length >= 0;
    } else {
      flag1 = this.sr.userInputs && this.sr.userInputs.length > 0;
    }
    if (flag1) {
      const a = [];
      if (this.projectType === 'image') {
        this.sr.userInputs.forEach((e) => {
          if (this.startFrom === 'review') {
            a.push(e.problemCategory);
          } else {
            if (e.user == this.user.email) {
              a.push(e.problemCategory);
            }
          }
        });
        flag2 = isCategory.length == a.length;
      } else if (this.projectType == 'text' || this.projectType == 'tabular') {
        if (this.labelType === 'HTL') {
          this.checkHTL(type);
          return false;
        } else if (
          this.isMultipleLabel &&
          !this.isNumeric &&
          !this.isMultipleNumericLabel &&
          this.labelType !== 'HTL'
        ) {
          flag2 = this.checkMutilLabel(type);
          return false;
        } else if (isCategory.length > 1) {
          flag2 = isCategory.length == this.sr.userInputs.length;
        } else {
          flag2 = isCategory[0] == this.sr.userInputs[0].problemCategory;
        }
      } else {
        flag2 = isCategory.length == this.sr.userInputs[0].problemCategory.length;
      }
      if (flag2) {
        if (this.projectType === 'image') {
          a.forEach((element) => {
            if (element.type === 'rectanglelabels') {
              element.valueInfo = JSON.stringify(element.value);
              element.sort = element.value.x;
            } else if (element.type === 'polygonlabels') {
              element.valueInfo = JSON.stringify(element.value.points);
              element.sort = element.value.points[0][0];
            }
          });
          isCategory.forEach((element) => {
            if (element.type === 'rectanglelabels') {
              element.valueInfo = JSON.stringify(element.value);
              element.sort = element.value.x;
            } else if (element.type === 'polygonlabels') {
              element.valueInfo = JSON.stringify(element.value.points);
              element.sort = element.value.points[0][0];
            }
          });
        }
        if (this.projectType !== 'text' && this.projectType !== 'tabular') {
          const aa = isCategory.sort(
            this.toolService.sortBy(
              this.projectType === 'ner' ? 'start' : this.projectType === 'log' ? 'line' : 'sort',
              'ascending',
            ),
          );
          let bb;
          if (this.projectType === 'image') {
            bb = a.sort(this.toolService.sortBy('sort', 'ascending'));
          } else {
            bb = this.sr.userInputs[0].problemCategory.sort(
              this.toolService.sortBy(this.projectType === 'ner' ? 'start' : 'line', 'ascending'),
            );
          }

          for (let i = 0; i < aa.length; i++) {
            let aaString;
            let bbString;
            if (this.projectType === 'ner') {
              const aaPopupLabel = aa[i].popUpLabel ? aa[i].popUpLabel : '';
              const bbPopupLabel = bb[i].popUpLabel ? bb[i].popUpLabel : '';
              aaString = aa[i].text + aa[i].start + aa[i].end + aa[i].label + aaPopupLabel;
              bbString = bb[i].text + bb[i].start + bb[i].end + bb[i].label + bbPopupLabel;
            } else if (this.projectType === 'log') {
              const logFreeText = this.questionForm.get('logFreeText').value
                ? this.questionForm.get('logFreeText').value
                : '';
              const srlogFreeText = this.sr.userInputs[0].logFreeText ? this.sr.userInputs[0].logFreeText : '';
              aaString = aa[i].line + aa[i].label + aa[i].freeText + logFreeText;
              bbString = bb[i].line + bb[i].label + bb[i].freeText + srlogFreeText;
            } else if (this.projectType === 'image') {
              aaString = aa[i].valueInfo;
              bbString = bb[i].valueInfo;
            }
            if (aaString !== bbString) {
              this.actionError = this.tipMessage;
              this.loading = false;
              return false;
            }
          }
        }
        this.loading = true;
        if (type === 'previous') {
          const param = {
            id: this.annotationPrevious.length > 0 ? this.annotationPrevious[0].srId : this.sr._id,
            pid: this.projectId,
          };
          this.getSrById(param, 0, 'previous');
        } else if (type === 'history') {
          const param = {
            id,
            pid: this.projectId,
          };
          this.getSrById(param, index, 'history');
        } else if (type === 'skip') {
          this.skipAndFetchNewQuestion();
        } else if (type === 'pass') {
          this.onSubmit(type);
        }
      } else {
        this.actionError = this.tipMessage;
        this.loading = false;
        return false;
      }
    } else {
      this.actionError = this.tipMessage;
      this.loading = false;
      return;
    }
  }

  isBack() {
    if (this.annotationPrevious.length > 0) {
      this.loading = true;
      this.silenceStatus = false;
      this.clrErrorTip = false;
      const isCategory = this.categoryFunc();
      if (isCategory.length > 0) {
        if (
          this.isNumeric ||
          this.isMultipleNumericLabel ||
          (this.isMultipleLabel &&
            this.labelType !== 'HTL' &&
            this.projectType !== 'ner' &&
            this.projectType !== 'image' &&
            this.projectType !== 'log')
        ) {
          this.isActionErr(isCategory, this.annotationPrevious[0].srId);
        } else if (this.projectType == 'ner' || this.projectType == 'log' || this.projectType == 'image') {
          let flag = false;
          for (let i = 0; i < this.annotationHistory.length; i++) {
            if (this.annotationHistory[i].srId === this.sr._id) {
              flag = true;
              if (this.annotationHistory[i].category.length == isCategory.length) {
                if (this.projectType === 'image') {
                  this.annotationHistory[i].category.forEach((element) => {
                    if (element.type === 'rectanglelabels') {
                      element.valueInfo = JSON.stringify(element.value);
                      element.sort = element.value.x;
                    } else if (element.type === 'polygonlabels') {
                      element.valueInfo = JSON.stringify(element.value.points);
                      element.sort = element.value.points[0][0];
                    }
                  });
                  isCategory.forEach((element) => {
                    if (element.type === 'rectanglelabels') {
                      element.valueInfo = JSON.stringify(element.value);
                      element.sort = element.value.x;
                    } else if (element.type === 'polygonlabels') {
                      element.valueInfo = JSON.stringify(element.value.points);
                      element.sort = element.value.points[0][0];
                    }
                  });
                }
                const aa = this.annotationHistory[i].category.sort(
                  this.toolService.sortBy(
                    this.projectType === 'ner' ? 'start' : this.projectType === 'log' ? 'line' : 'sort',
                    'ascending',
                  ),
                );
                const bb = isCategory.sort(
                  this.toolService.sortBy(
                    this.projectType === 'ner' ? 'start' : this.projectType === 'log' ? 'line' : 'sort',
                    'ascending',
                  ),
                );
                for (let i = 0; i < aa.length; i++) {
                  let aaString;
                  let bbString;
                  if (this.projectType === 'ner') {
                    const aaPopupLabel = aa[i].popUpLabel ? aa[i].popUpLabel : '';
                    const bbPopupLabel = bb[i].popUpLabel ? bb[i].popUpLabel : '';
                    aaString = aa[i].text + aa[i].start + aa[i].end + aa[i].label + aaPopupLabel;
                    bbString = bb[i].text + bb[i].start + bb[i].end + bb[i].label + bbPopupLabel;
                  } else if (this.projectType === 'log') {
                    const logFreeText = this.questionForm.get('logFreeText').value
                      ? this.questionForm.get('logFreeText').value
                      : '';
                    const srlogFreeText = this.annotationHistory[i].logFreeText
                      ? this.annotationHistory[i].logFreeText
                      : '';
                    aaString = aa[i].line + aa[i].label + aa[i].freeText + srlogFreeText;
                    bbString = bb[i].line + bb[i].label + bb[i].freeText + logFreeText;
                  } else if (this.projectType === 'image') {
                    aaString = aa[i].valueInfo;
                    bbString = bb[i].valueInfo;
                  }
                  if (aaString !== bbString) {
                    this.actionError = this.tipMessage;
                    this.loading = false;
                    return false;
                  }
                }
                this.loading = true;
                const param = {
                  id: this.annotationPrevious[0].srId,
                  pid: this.projectId,
                };
                this.getSrById(param, 0, 'previous');
              } else {
                this.actionError = this.tipMessage;
                this.loading = false;
                return;
              }
            }
          }
          if (!flag) {
            this.isSkipOrBack('previous');
          }
        } else if (this.labelType === 'HTL') {
          this.checkHTL('previous', this.annotationPrevious[0].srId);
        } else {
          const param = {
            id: this.annotationPrevious[0].srId,
            pid: this.projectId,
          };
          this.getSrById(param, 0, 'previous');
        }
      } else {
        const param = {
          id: this.annotationPrevious[0].srId,
          pid: this.projectId,
        };
        this.getSrById(param, 0, 'previous');
      }
    } else {
      this.actionError = 'There has no previous ticket.';
    }
  }

  flagTicket() {
    this.loading = true;
    this.clrErrorTip = false;
    this.clearUserInput();
    this.silenceStatus = false;
    if (this.annotationHistory.length > 0) {
      for (let i = 0; i < this.annotationHistory.length; i++) {
        if (this.annotationHistory[i].srId == this.sr._id) {
          this.annotationHistory.splice(i, 1);
          this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
        }
      }
    }
    const param = {
      tid: this.sr._id,
      pid: this.projectId,
    };
    if (this.startFrom === 'review') {
      param['review'] = true;
      param['order'] = this.reviewOrder;
      if (this.reviewee) {
        param['user'] = this.reviewee;
      }
    }
    const aa = this.apiService.toFlagTicket(param).subscribe(
      (response) => {
        this.sr = response;
        if (this.sr.MSG) {
          // if (this.startFrom === 'review') {
          //   const reviewee = this.questionForm.get('reviewee').value;
          //   if (reviewee) {
          //     this.error = `${
          //       this.questionForm.get('reviewee').value
          //     } cases have been completely reviewed.`;
          //   } else {
          //     this.error = 'All cases have been completely reviewed.';
          //   }
          // } else {
          //   this.error = 'All cases have been completely annotated.';
          // }
          this.error = this.sr.MSG;
          this.loading = false;
          return;
        }
        if (this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'regression') {
          this.sr = this.resetTabularSrData(this.sr);
          if (this.sr.userInputsLength > 0) {
            this.categoryBackFunc();
            this.sortLabelForColor(this.categories);
            this.getProgress();
          }
        }
        if (this.projectType == 'ner') {
          this.sr = this.resetNerSrData(this.sr);
          this.toShowExistingLabel();
        }
        if (this.projectType == 'image') {
          this.sr = this.resetImageSrData(this.sr);
          if (this.startFrom === 'review') {
            const images = [];
            this.sr.userInputs.forEach((item) => {
              images.push(item.problemCategory);
            });
            this.historyTask = [{ result: images }];
            this.currentBoundingData = images;
          }
          setTimeout(() => {
            const option = {
              dom: 'label-studio',
              imageRectLabelTemplate: this.imageRectLabelTemplate,
              imagePolyLabelTemplate: this.imagePolyLabelTemplate,
              url: this.env.config.enableAWSS3
                ? this.sr.originalData.location
                : `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
                    this.sr.originalData.location
                  }&token=${JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token}`,
              historyCompletions: this.historyTask,
              annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
              from: 'annotate',
            };

            this.toCallStudio(option);
          }, 0);
        }
        if (this.projectType == 'log') {
          this.sr = this.resetLogSrData(this.sr);
          this.showPreLogLable();
          this.currentLogFile =
            this.projectInfo.isShowFilename || this.startFrom === 'review' ? this.sr.fileInfo.fileName : '';
          this.setSelectedFile();
          this.toFilterLog(this.filterList);
          if (this.sr.userInputsLength > 0) {
            this.categoryBackFunc();
            this.sortLabelForColor(this.categories);
            this.getProgress();
          }
        }
        if (this.sr && this.sr.flag && this.sr.flag.silence) {
          this.silenceStatus = true;
        }
        this.loading = false;
        if (this.projectType == 'log') {
          setTimeout(() => {
            this.el.nativeElement.querySelector('.logCategories' + this.selectedEntityID).style.backgroundColor =
              this.colorsRainbow[this.selectedEntityID];
          }, 5);
        }
        if (this.isNumeric) {
          setTimeout(() => {
            this.numericInput.nativeElement.focus();
          }, 500);
        }
      },
      (error) => {
        this.loading = false;
      },
      () => {
        aa.unsubscribe();
      },
    );
  }

  enterNumeric(e) {
    if (e.target.value == '' || this.clrErrorTip == true) {
      e.preventDefault();
      this.clrErrorTip = true;
    } else {
      this.labelChoose = e.target.value;
      this.clrErrorTip = false;
      this.onSubmit();
    }
  }

  enterNumericUp(e) {
    if (this.validNumeric(e.target.value)) {
      this.labelChoose = e.target.value;
      this.numericValue =
        this.numericOptions.step === 1
          ? parseInt(this.labelChoose)
          : Number(this.formatDecimal(this.labelChoose, this.stepLen));
      this.clrErrorTip = false;
    } else {
      this.clrErrorTip = true;
    }
  }

  enterScoreUp(e, i) {
    this.scores.forEach((item, index) => {
      if (index === i) {
        const isNumScope = e.target.value >= item.scoreOptions.floor && e.target.value <= item.scoreOptions.ceil;
        if (this.isNumber(e.target.value) && isNumScope) {
          item.clrErrorTip = false;
          item.scoreInputValue = e.target.value;
          item.scoreValue =
            item.scoreOptions.step === 1
              ? parseInt(item.scoreInputValue)
              : Number(this.formatDecimal(item.scoreInputValue, item.stepLen));
        } else {
          item.clrErrorTip = true;
        }
      }
    });
  }

  selectLabel(e, i) {
    this.actionError = null;
    const isChecked = e.target.checked;
    const checkedValue = e.target.value;
    if (isChecked) {
      if (this.isMultipleNumericLabel) {
        e.target.parentElement.parentElement.style.backgroundColor = '#fafafa';
        e.target.parentElement.parentElement.style.borderColor = '#ccc';
        e.target.parentElement.parentElement.style.borderBottomWidth = 'medium';
      } else {
        e.target.parentElement.style.backgroundColor = '#fafafa';
        e.target.parentElement.style.borderColor = '#ccc';
        e.target.parentElement.style.borderBottomWidth = 'medium';
      }
      e.target.nextElementSibling.style.fontWeight = 'bold';
      this.multipleLabelList.push(checkedValue);
    } else {
      if (this.isMultipleNumericLabel) {
        e.target.parentElement.parentElement.style.backgroundColor = '#fafafa';
        e.target.parentElement.parentElement.style.borderColor = '#ccc';
        e.target.parentElement.parentElement.style.borderBottomWidth = 'medium';
      } else {
        e.target.parentElement.style.backgroundColor = '';
        e.target.parentElement.style.borderBottomWidth = '';
        e.target.parentElement.style.borderColor = '#eee';
      }
      e.target.nextElementSibling.style.fontWeight = '';
      this.multipleLabelList.splice(
        this.multipleLabelList.findIndex((item) => item == checkedValue),
        1,
      );
    }
    if (this.isMultipleNumericLabel) {
      this.scores.forEach((item, index) => {
        if (index === i) {
          item.checked = isChecked;
        }
      });
    }
  }

  validNumeric(data) {
    const isNum = /^(\-|\+)?\d+(\.\d+)?$/.test(data);
    const isNumScope = data >= this.minLabel && data <= this.maxLabel;
    if (isNum && isNumScope) {
      return true;
    } else {
      return false;
    }
  }

  isNumber(data) {
    return /^(\-|\+)?\d+(\.\d+)?$/.test(data);
  }

  categoryFunc() {
    let category = [];
    if (
      this.isShowDropDown &&
      !this.isMultipleLabel &&
      !this.isNumeric &&
      this.projectType !== 'ner' &&
      this.projectType !== 'image'
    ) {
      if (this.questionForm.get('category').value) {
        category.push(this.questionForm.get('category').value);
      }
      return category;
    } else if (
      (!this.isShowDropDown &&
        !this.isMultipleLabel &&
        this.projectType !== 'ner' &&
        this.projectType !== 'image' &&
        this.projectType !== 'log') ||
      this.isNumeric
    ) {
      if (this.moreReviewInfo.length !== 0 && this.isNumeric && this.labelChoose !== this.minLabel) {
        category.push(Number(this.labelChoose));
      }
      if (this.moreReviewInfo.length === 0 && this.isNumeric && this.labelChoose !== '' && this.labelChoose !== null) {
        category.push(Number(this.labelChoose));
      }
      if (this.labelChoose && !this.isNumeric) {
        category.push(this.labelChoose);
      }
      return category;
    } else if (this.isMultipleNumericLabel) {
      const labelScore = [];
      this.scores.forEach((item) => {
        if (item.checked) {
          labelScore.push({ [item.label]: item.scoreInputValue });
        }
      });
      category = labelScore;
      return category;
    } else if (
      !this.isNumeric &&
      this.isMultipleLabel &&
      this.labelType !== 'HTL' &&
      this.projectType !== 'ner' &&
      this.projectType !== 'image' &&
      this.projectType !== 'log'
    ) {
      category = this.multipleLabelList;
      return category;
    } else if (this.projectType == 'ner') {
      category = this.spansList;
      return category;
    } else if (this.projectType == 'log') {
      const a = [];
      this.spansList.forEach((e) => {
        a.push({ line: e.line, label: e.label, freeText: e.freeText });
      });
      category = a;
      return category;
    } else if (this.projectType == 'image') {
      category = this.currentBoundingData;
      return category;
    } else if (this.labelType === 'HTL') {
      category = this.treeLabels;
      return category;
    }
  }

  getProblemCategory() {
    if (this.moreReviewInfo.length !== 0) {
      return;
    }
    if (this.sr.userInputs.length > 0) {
      for (let i = 0; i < this.sr.userInputs.length; i++) {
        if (this.startFrom === 'review') {
          return this.sr.userInputs[i].problemCategory;
        } else {
          if (this.sr.userInputs[i].user == this.user.email) {
            return this.sr.userInputs[i].problemCategory;
          }
        }
      }
    } else if (this.sr.userInputs.length == 0 && this.isNumeric) {
      return 0;
    } else if (this.sr.userInputs.length == 0) {
      return;
    }
  }

  setReviewInfo() {
    if (this.sr?.userInputs?.length && (this.projectType === 'text' || this.projectType === 'tabular')) {
      this.moreReviewInfo = [];
      this.sr.userInputs.forEach((item, index) => {
        let annotationInfo = '';
        let reducedCategory = [];
        if ((this.projectType === 'text' || this.projectType === 'tabular') && this.isMultipleNumericLabel) {
          annotationInfo = `${item.problemCategory.label}[${item.problemCategory.value}]`;
        } else {
          annotationInfo = item.problemCategory;
          if (this.labelType === 'HTL') {
            reducedCategory = item['reducedCategory'];
          }
        }
        if (!index) {
          this.moreReviewInfo.push({
            annotator: item.user,
            annotationInfo,
            time: item.timestamp,
            reducedCategory,
          });
        } else {
          let existInfo = this.moreReviewInfo.find((info) => info.annotator === item.user);
          if (existInfo) {
            existInfo.annotationInfo += `,${annotationInfo}`;
          } else {
            this.moreReviewInfo.push({
              annotator: item.user,
              annotationInfo,
              time: item.timestamp,
              reducedCategory,
            });
          }
        }
      });
      if (this.moreReviewInfo.length !== 0) {
        this.labelChoose = null;
        this.el.nativeElement.querySelectorAll('.cleanColor').forEach((element) => {
          this.renderer2.setStyle(element, 'background-color', 'unset');
        });
        this.treeLabels = JSON.parse(JSON.stringify(this.originTreeLabels));
      }
    } else {
      this.moreReviewInfo = [];
    }
  }

  categoryBackFunc(index?, from?) {
    if (this.startFrom === 'review') {
      this.setReviewInfo();
    }
    if (this.isShowDropDown && !this.isMultipleLabel && !this.isNumeric) {
      this.questionForm.get('category').setValue(this.getProblemCategory());
    } else if (
      !this.isNumeric &&
      !this.isShowDropDown &&
      !this.isMultipleLabel &&
      this.projectType != 'ner' &&
      this.projectType !== 'image'
    ) {
      // to storage the ticket label
      this.el.nativeElement.querySelectorAll('.cleanColor').forEach((element) => {
        this.renderer2.setStyle(element, 'background-color', 'unset');
      });
      this.labelChoose = this.getProblemCategory();
      // get the previous label color
      const labelIndex = this.categories.indexOf(this.labelChoose);
      this.idName = 'label' + labelIndex;
      setTimeout(() => {
        switch (labelIndex) {
          case 0:
            this.renderer2.setStyle(
              this.el.nativeElement.querySelector('.' + this.idName),
              'background-color',
              '#60b515',
            );
            break;
          case 1:
            this.renderer2.setStyle(
              this.el.nativeElement.querySelector('.' + this.idName),
              'background-color',
              '#ff681c',
            );
            break;
          case 2:
            this.renderer2.setStyle(
              this.el.nativeElement.querySelector('.' + this.idName),
              'background-color',
              '#efd603',
            );
            break;
          case 3:
            this.renderer2.setStyle(
              this.el.nativeElement.querySelector('.' + this.idName),
              'background-color',
              '#00bfa9',
            );
            break;
          case 4:
            this.renderer2.setStyle(
              this.el.nativeElement.querySelector('.' + this.idName),
              'background-color',
              '#6870c4',
            );
            break;
          case 5:
            this.renderer2.setStyle(
              this.el.nativeElement.querySelector('.' + this.idName),
              'background-color',
              '#ff9c32',
            );
            break;
        }
      }, 10);
    } else if (this.isNumeric) {
      if (this.moreReviewInfo.length !== 0) {
        this.labelChoose = this.minLabel;
        this.numericValue = this.minLabel;
      } else {
        this.labelChoose = this.getProblemCategory();
        this.numericValue =
          this.numericOptions.step === 1
            ? parseInt(this.labelChoose)
            : Number(this.formatDecimal(this.labelChoose, this.stepLen));
      }
    } else if (
      !this.isNumeric &&
      this.isMultipleLabel &&
      this.labelType !== 'HTL' &&
      this.projectType != 'ner' &&
      this.projectType !== 'image' &&
      this.projectType !== 'log'
    ) {
      this.el.nativeElement.querySelectorAll('.labelCheckbox').forEach((element) => {
        this.renderer2.setStyle(element, 'background-color', 'unset');
        this.renderer2.setStyle(element, 'border-color', '#eee');
        this.renderer2.setStyle(element, 'border-bottom-width', '1px');
        this.renderer2.setStyle(element.lastChild, 'font-weight', '400');
      });
      if (this.sr.userInputs) {
        let originalLabel = [];
        if (this.sr.userInputs.length > 0) {
          for (let j = 0; j < this.sr.userInputs.length; j++) {
            if (this.startFrom === 'review') {
              originalLabel.push(this.sr.userInputs[j].problemCategory);
            } else {
              if (this.sr.userInputs[j].user === this.user.email) {
                originalLabel.push(this.sr.userInputs[j].problemCategory);
              }
            }
          }
        } else if (this.sr.userInputs.length == 0) {
          originalLabel = [];
        }
        if (this.moreReviewInfo.length === 0) {
          this.multipleLabelList = originalLabel;
        }
      }
      this.clearScores(true);
      if (this.moreReviewInfo.length === 0) {
        setTimeout(() => {
          this.multipleLabelList.forEach((e) => {
            let multiLabelClass = '';
            if (this.isMultipleNumericLabel) {
              const checkedIndex = this.scores.findIndex((item) => item.label === e.label);
              if (checkedIndex !== -1) {
                multiLabelClass = 'multiLabel' + checkedIndex;
                this.el.nativeElement.querySelector('.' + multiLabelClass).children[0].children[0].checked = true;
                this.scores.forEach((item) => {
                  if (item.label === e.label) {
                    item.checked = true;
                    item.scoreInputValue = e.value;
                    item.scoreValue = Number(this.formatDecimal(item.scoreInputValue, item.stepLen));
                  }
                });
              }
            } else {
              multiLabelClass = 'multiLabel' + this.categories.indexOf(e);
              this.el.nativeElement.querySelector('.' + multiLabelClass).children[0].checked = true;
            }
            this.renderer2.setStyle(
              this.el.nativeElement.querySelector('.' + multiLabelClass),
              'background-color',
              '#fafafa',
            );
            this.renderer2.setStyle(this.el.nativeElement.querySelector('.' + multiLabelClass), 'border-color', '#ccc');
            this.renderer2.setStyle(
              this.el.nativeElement.querySelector('.' + multiLabelClass),
              'border-bottom-width',
              'medium',
            );
            this.renderer2.setStyle(
              this.el.nativeElement.querySelector('.' + multiLabelClass + ' label'),
              'font-weight',
              'bold',
            );
          });
        }, 10);
      }
    } else if (!this.isShowDropDown && !this.isNumeric && this.isMultipleLabel && this.projectType == 'ner') {
      this.spansList = [];
      const annotations = this.sr.userInputs;
      setTimeout(() => {
        annotations.forEach((element) => {
          element.problemCategory.forEach((element2) => {
            this.initNerPassage(element2, this.categories.indexOf(element2.label));
          });
        });
      }, 10);
    } else if (this.projectType == 'log') {
      this.spansList = [];
      setTimeout(() => {
        if (this.sr.userInputs.length > 0) {
          this.sr.userInputs[0].problemCategory.forEach((element) => {
            for (let i = 0; i < this.sr.originalData.length; i++) {
              if (element.line == this.sr.originalData[i].line) {
                this.onMouseDownTxt(element, this.sr.originalData[i].index);
                this.onMouseUpTxt(element, this.sr.originalData[i].index, 'historyBack');
                break;
              }
            }
          });
          this.questionForm
            .get('logFreeText')
            .setValue(this.sr.userInputs[0].logFreeText !== '' ? this.sr.userInputs[0].logFreeText : null);
        }
      }, 10);
    } else if (
      this.labelType === 'HTL' &&
      this.sr.userInputs &&
      this.sr.userInputs.length &&
      this.moreReviewInfo.length === 0
    ) {
      this.treeLabels = JSON.parse(JSON.stringify(this.sr.userInputs[0].problemCategory));
    }

    if (from == 'previous') {
      this.annotationPrevious.splice(index, 1);
    }
  }

  clearUserInput() {
    this.isShowDropDown ? this.questionForm.get('category').reset() : (this.labelChoose = null);
    if (this.isNumeric) {
      this.labelChoose = this.minLabel;
      this.numericValue = this.minLabel;
    }
    this.active = -1;
    this.questionForm.get('logFreeText').reset();
    this.questionForm.get('answer').reset();
    this.multipleLabelList = [];
    this.spansList = [];
    if (this.projectType === 'log') {
      this.questionForm.get('filterText').reset();
    }
    this.regexErr = false;
  }

  clearCheckbox() {
    if (!this.isMultipleNumericLabel && this.labelType !== 'HTL') {
      this.multipleLabelList.forEach((e) => {
        const multiLabelClass = 'multiLabel' + this.categories.indexOf(e);
        this.el.nativeElement.querySelector('.' + multiLabelClass).children[0].checked = false;
      });
    }
  }

  clearScores(isClearChecked) {
    this.scores.forEach((item, index) => {
      item.scoreValue = item.scoreOptions.floor;
      item.scoreInputValue = item.scoreOptions.floor;
      item.checked = false;
      if (isClearChecked) {
        const multiLabelClass = 'multiLabel' + index;
        setTimeout(() => {
          this.el.nativeElement.querySelector('.' + multiLabelClass).children[0].children[0].checked = false;
          this.el.nativeElement.querySelector(
            '.' + multiLabelClass,
          ).children[0].children[0].nextElementSibling.style.fontWeight = '';
        }, 10);
      }
    });
  }

  colorToRgb(color) {
    const div = document.createElement('setColorDiv');
    div.style.backgroundColor = color;
    document.body.append(div);
    const rgbColor = window.getComputedStyle(div).backgroundColor;
    document.body.removeChild(div);
    return rgbColor;
  }

  fromRange(range, root) {
    let sc = range.startContainer;
    let so = range.startOffset;
    let ec = range.endContainer;
    let eo = range.endOffset;

    let start = this.fromNode(sc, root);
    let end = this.fromNode(ec, root);

    return {
      start: start,
      end: end,
      startOffset: so,
      endOffset: eo,
      _range: range,
      text: '',
    };
  }

  fromNode(node, root) {
    if (node === undefined) {
      throw new Error('missing required parameter "node"');
    }

    let path = '/';
    while (node !== root) {
      if (!node) {
        let message = 'The supplied node is not contained by the root node.';
        let name = 'InvalidNodeTypeError';
        throw new DOMException(message, name);
      }
      path = `/${this.nodeName(node)}[${this.nodePosition(node)}]${path}`;
      node = node.parentNode;
    }
    return path.replace(/\/$/, '');
  }

  nodeName(node) {
    switch (node.nodeName) {
      case '#text':
        return 'text()';
      case '#comment':
        return 'comment()';
      case '#cdata-section':
        return 'cdata-section()';
      default:
        return node.nodeName.toLowerCase();
    }
  }

  nodePosition(node) {
    let name = node.nodeName;
    let position = 1;
    while ((node = node.previousSibling)) {
      if (node.nodeName === name) position += 1;
    }
    return position;
  }

  captureDocSelection() {
    let i,
      ranges = [],
      rangesToIgnore = [],
      selection = window.getSelection();

    if (selection.isCollapsed) return [];
    const mySelf = document.getElementsByClassName('nerPassage')[0];

    for (i = 0; i < selection.rangeCount; i++) {
      let r = selection.getRangeAt(0);

      if (r.startContainer.nodeName !== '#text') {
        const start = r.startContainer.childNodes[r.startOffset];
        const node = findClosestTextNode(start);
        if (!node) continue;
        r.setStart(node, 0);
      }

      if (r.endContainer.nodeName !== '#text') {
        const end = r.endContainer.childNodes[r.endOffset];
        const node = findClosestTextNode(end.previousSibling, true);
        if (!node) continue;
        r.setEnd(node, node.length);
      }

      if (r.collapsed || /^\s*$/.test(r.toString())) continue;

      try {
        let normedRange = this.fromRange(r, mySelf);

        splitBoundaries(r);

        normedRange._range = r;

        const tags = Array.from(r.cloneContents().childNodes);

        const text = tags.reduce((str, node) => (str += node.textContent), '');
        normedRange.text = text;

        const ss = toGlobalOffset(mySelf, r.startContainer, r.startOffset);
        const ee = toGlobalOffset(mySelf, r.endContainer, r.endOffset);

        normedRange.startOffset = ss;
        normedRange.endOffset = ee;

        if (normedRange === null) {
          rangesToIgnore.push(r);
        } else {
          ranges.push(normedRange);
        }
      } catch (err) {}
    }

    selection.removeAllRanges();

    return ranges;
  }

  initNerPassage(element, selectedEntityID0) {
    if (element.start === element.end) return;
    this.createNewRange(element, selectedEntityID0);
    this.actionError = null;
  }

  findNode(mySelf, start) {
    const childs = mySelf.childNodes;
    for (let i = 0; i < childs.length; i++) {
      if (childs[i].childNodes && childs[i].childNodes.length > 1) {
        const result = this.findNode(childs[i], start);
        if (result) {
          return result;
        }
      } else {
        const node = childs[i].nodeName !== '#text' ? findClosestTextNode(childs[i]) : childs[i];
        const offset = start - this.totalLen;
        if (node) {
          this.totalLen += node.length;
          if (start <= this.totalLen) {
            return { node, offset };
          }
        }
      }
    }
  }

  setRangStart(mySelf, r, element) {
    this.totalLen = 0;
    const { node, offset } = this.findNode(mySelf, element.start);
    r.setStart(node, offset);
  }

  setRangEnd(mySelf, r, element) {
    this.totalLen = 0;
    const { node, offset } = this.findNode(mySelf, element.end);
    r.setEnd(node, offset);
  }

  createNewRange(element, selectedEntityID) {
    let r = document.createRange();
    const mySelf = document.getElementById('mainText');
    if (mySelf.childNodes.length == 1) {
      r.setStart(mySelf.firstChild, element.start);
      r.setEnd(mySelf.firstChild, element.end);
    } else {
      this.setRangStart(mySelf, r, element);
      this.setRangEnd(mySelf, r, element);
    }

    let normedRange = this.fromRange(r, mySelf);

    splitBoundaries(r);

    normedRange._range = r;

    const tags = Array.from(r.cloneContents().childNodes);

    const text = tags.reduce((str, node) => (str += node.textContent), '');
    normedRange.text = text;

    const ss = toGlobalOffset(mySelf, r.startContainer, r.startOffset);
    const ee = toGlobalOffset(mySelf, r.endContainer, r.endOffset);

    normedRange.startOffset = ss;
    normedRange.endOffset = ee;
    this.createSpans(normedRange, selectedEntityID, element);
  }

  onMouseUp() {
    this.handleScroll();
    var selectedRanges = this.captureDocSelection();
    if (selectedRanges.length === 0) return;
    const range = selectedRanges[0];
    this.createSpans(range, this.selectedEntityID, '');
  }

  showPopLabel(spans, event) {
    const popDialog = document.getElementById('popDialog');
    if (popDialog.style.display === 'block') {
      return false;
    }
    this.targetSpans = spans;
    popDialog.style.display = 'block';
    let domLoc = event.target.getBoundingClientRect();
    this.isShowPopOver = !this.isShowPopOver;
    this.xAxis = domLoc.x;
    popDialog.style.left = this.xAxis + 'px';
    this.yAxis = domLoc.y - popDialog.clientHeight - 10;
    popDialog.style.top = this.yAxis + 'px';
  }

  clearPopDialog() {
    this.handleScroll();
  }

  clickPopLabel(e, selectedPopLabel, popLabelColor) {
    const popDialog = document.getElementById('popDialog');
    popDialog.style.display = 'none';
    this.spansList.forEach((ele) => {
      if (ele.spans === this.targetSpans) {
        ele.popUpLabel = selectedPopLabel;
        ele.popLabelColor = popLabelColor;
      }
    });
    this.targetSpans.forEach((element, index) => {
      this.renderer2.removeStyle(element, 'backgroundColor');
      this.renderer2.setStyle(element, 'background-color', e.target.style.backgroundColor);
    });
  }

  createSpans(self, selectedEntityID, element) {
    let spans;
    if (element.popLabelColor) {
      spans = highlightRange(self, 'spanMarked', {
        backgroundColor: element.popLabelColor,
      });
    } else {
      spans = highlightRange(self, 'spanMarked', {
        backgroundColor: this.toolService.hexToRgb(this.labelColor.get(this.categories[selectedEntityID])),
      });
    }

    const lastSpan = spans[spans.length - 1];
    lastSpan.setAttribute('data-label', this.categories[selectedEntityID]);
    if (this.isShowPopLabel) {
      lastSpan.addEventListener('click', this.showPopLabel.bind(this, spans));
    }
    const part = {
      text: '',
      start: 0,
      end: 0,
      label: '',
      spans: [],
      popLabelColor: '',
      popUpLabel: '',
    };
    part.text = self.text;
    part.start = self.startOffset;
    part.end = self.endOffset;
    part.label = this.categories[selectedEntityID];
    part.spans = spans;
    if (element.popLabelColor) {
      part.popLabelColor = element.popLabelColor;
      part.popUpLabel = element.popUpLabel;
    }
    this.spansList.push(part);
    this.actionError = null;
  }

  clickShowMark(e, data) {
    const alllabeledDom = this.el.nativeElement.querySelectorAll('.annotateLabel .spanSelected');
    alllabeledDom.forEach((ele) => {
      this.renderer2.removeStyle(ele, 'backgroundColor');
    });
    e.target.parentNode.style.backgroundColor = '#b4d2e3';

    if (data && data.spans) {
      const allSpanDom = this.el.nativeElement.querySelectorAll('.nerPassage span');
      allSpanDom.forEach((element) => {
        this.renderer2.removeStyle(element, 'font-weight');
      });
      data.spans.forEach((element, index) => {
        if (index === 0) {
          element.scrollIntoView({ block: 'center' });
        }
        this.renderer2.setStyle(element, 'font-weight', 'bold');
      });
    }
  }

  mouseenterMark(e, data) {
    e.target.lastChild.style.backgroundColor = '#444';
    e.target.lastChild.style.color = '#fff';
    if (data && data.spans) {
      const labelColor = this.getLabelColor(data.label);
      data.spans.forEach((element, index) => {
        this.renderer2.setStyle(element, 'border-top', '2px solid' + labelColor);
        this.renderer2.setStyle(element, 'border-bottom', '2px solid' + labelColor);
        this.renderer2.setStyle(element, 'background-color', this.toolService.highToRgb(labelColor));
        this.renderer2.setStyle(element, 'padding', '0.25em');
        if (index == 0) {
          this.renderer2.setStyle(element, 'border-left', '2px solid' + labelColor);
          this.renderer2.setStyle(element, 'border-top-left-radius', '0.5em');
          this.renderer2.setStyle(element, 'border-bottom-left-radius', '0.5em');
        }

        if (index == data.spans.length - 1) {
          this.renderer2.setStyle(element, 'border-right', '2px solid' + labelColor);
          this.renderer2.setStyle(element, 'border-top-right-radius', '0.5em');
          this.renderer2.setStyle(element, 'border-bottom-right-radius', '0.5em');
        }
      });
      if (e.target.style.backgroundColor !== this.colorToRgb('#b4d2e3')) {
        e.target.style.backgroundColor = 'aliceblue';
      }
    }
  }

  mouseleaveMark(e, data) {
    e.target.lastChild.style.backgroundColor = 'transparent';
    e.target.lastChild.style.color = 'transparent';
    if (e.target.style.backgroundColor === 'aliceblue') {
      e.target.style.backgroundColor = '';
    }
    if (data && data.spans) {
      const labelColor = this.toolService.hexToRgb(this.getLabelColor(data.label));
      data.spans.forEach((element) => {
        this.renderer2.removeStyle(element, 'border');
        this.renderer2.removeStyle(element, 'padding');
        this.renderer2.removeStyle(element, 'border-radius');
        if (data.popUpLabel) {
          this.renderer2.setStyle(element, 'background-color', data.popLabelColor);
        } else {
          this.renderer2.setStyle(element, 'background-color', labelColor);
        }
      });
    }
  }

  clickClearMark(event, data) {
    this.spansList.forEach((ele, index) => {
      if (ele.spans == data.spans) {
        this.spansList.splice(index, 1);
      }
    });
    if (data && data.spans) {
      removeSpans(data.spans);
    }
    const popDialog = document.getElementById('popDialog');
    if (this.targetSpans && popDialog && this.targetSpans === data.spans) {
      popDialog.style.display = 'none';
      this.targetSpans = '';
    }
    this.actionError = null;
  }

  onSelectingEntity(e, data, index) {
    e.preventDefault();
    this.selectedEntityID = index;
    if (this.projectType == 'log') {
      const logLabelDoms = this.el.nativeElement.querySelectorAll('.logCategories');
      // console.log('logLabelDoms:::', logLabelDoms);
      logLabelDoms.forEach((element, i) => {
        if (index == i) {
          element.style.backgroundColor = element.style.borderLeftColor;
          element.style.color = 'white';
        } else {
          element.style.backgroundColor = '';
          element.style.color = 'black';
        }
      });
    }
    if (this.projectType == 'ner') {
      this.selectedEntityColor = e.target.style.color;
    }
  }

  getLabelColor(lable) {
    if (this.labelColor) {
      return this.labelColor.get(lable);
    }
  }

  getSrById(data, index, from) {
    this.loading = true;
    this.apiService.getSrById(data).subscribe(
      (responseSr) => {
        if (responseSr) {
          this.loading = false;
          this.sr.MSG = null;
          this.error = null;

          const flag = [];
          if (this.projectType != 'ner' && this.projectType != 'image' && this.projectType != 'log') {
            let that = this;
            _.forIn(responseSr.originalData, function (value, key) {
              that.updateOutput(value).then((e) => {
                flag.push({ key, value, html: e });
                responseSr.originalData = flag;
                that.sr.originalData = responseSr.originalData;
              });
            });
          }
          if (this.projectType == 'image') {
            this.historyTask = [
              {
                result:
                  from == 'previous' ? this.annotationPrevious[index].images : this.annotationHistory[index].images,
              },
            ];
            if (this.startFrom == 'review') {
              const images = [];
              responseSr.userInputs.forEach((item) => {
                images.push(item.problemCategory);
              });
              this.historyTask = [{ result: images }];
              this.currentBoundingData = images;
            }
            setTimeout(() => {
              const option = {
                dom: 'label-studio',
                imageRectLabelTemplate: this.imageRectLabelTemplate,
                imagePolyLabelTemplate: this.imagePolyLabelTemplate,
                url:
                  from == 'previous'
                    ? this.annotationPrevious[index].historyDescription[0].location
                    : this.annotationHistory[index].historyDescription[0].location,
                historyCompletions: this.historyTask,
                annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
                from: 'annotate',
              };
              this.toCallStudio(option);
              if (this.startFrom !== 'review') {
                this.historyTask = [];
                this.currentBoundingData =
                  from == 'previous' ? this.annotationPrevious[index].images : this.annotationHistory[index].images;
              }
              if (from == 'previous') {
                this.annotationPrevious.splice(index, 1);
              } else if (from == 'history') {
                this.annotationPrevious = this.annotationHistory.slice(index + 1);
              }
            }, 0);
          }
          if (this.projectType == 'log') {
            responseSr.originalData = this.resetLogSrData([responseSr]).originalData;
            this.showPreLogLable();
            setTimeout(() => {
              this.toFilterLog(this.filterList);
            }, 10);
          }
          if (responseSr.flag && responseSr.flag.silence) {
            this.silenceStatus = true;
          }
          if (this.projectType === 'ner') {
            this.resetNerSrData([responseSr]);
          }
          this.sr._id = responseSr._id;
          this.sr.originalData = responseSr.originalData;
          this.sr.flag = responseSr.flag;
          this.sr.userInputs = responseSr.userInputs;
          if (!this.sr.userInputs.length && this.labelType === 'HTL') {
            this.treeLabels = JSON.parse(JSON.stringify(this.originTreeLabels));
          }
          this.sr.ticketQuestions = responseSr.ticketQuestions;
          if (this.projectType === 'log') {
            this.currentLogFile =
              this.projectInfo.isShowFilename || this.startFrom === 'review' ? responseSr.fileInfo.fileName : '';
            this.setSelectedFile();
          }
          if (this.projectType !== 'image') {
            this.categoryBackFunc(index, from);
          }
          if (this.isNumeric) {
            if (isNaN(this.numericValue)) {
              this.numericValue = this.minLabel;
              this.labelChoose = this.minLabel;
            }
            setTimeout(() => {
              this.numericInput.nativeElement.focus();
            }, 500);
          }
        } else {
        }
      },
      (error) => {
        this.loading = false;
      },
    );
  }

  resetNerSrData(sr) {
    if (!sr.MSG) {
      if (sr[0].ticketQuestions) {
        let vv = [];
        _.forIn(sr[0].ticketQuestions, function (value, key) {
          value = JSON.stringify(value);
          vv.push({ key, value });
        });
        sr[0].ticketQuestions = vv;
      }
      sr[0].originalData.text = Object.values(sr[0].originalData)[0];
      return sr[0];
    } else {
      return sr;
    }
  }

  resetTabularSrData(sr) {
    const vv = [];
    let that = this;
    if (!sr.MSG) {
      sr = sr[0];
      _.forIn(sr.originalData, function (value, key) {
        that.updateOutput(value).then((e) => {
          vv.push({ key, value, html: e });
        });
      });
      sr.originalData = vv;
      this.sr = sr;
      if (this.sr && this.sr.flag && this.sr.flag.silence) {
        this.silenceStatus = true;
      }
      if (this.sr && !this.sr.MSG) {
        this.loading = false;
      }
      return sr;
    } else {
      return sr;
    }
  }

  resetImageSrData(sr) {
    if (!sr.MSG) {
      return sr[0];
    } else {
      return sr;
    }
  }

  resetLogSrData(sr) {
    if (!sr.MSG) {
      sr = sr[0];
      const flag = [];
      const $this = this;
      $this.originLogList = [];
      if (Object.prototype.toString.call(sr.originalData) !== '[object Array]') {
        let a = 0;
        _.forIn(sr.originalData, function (value, key) {
          $this.originLogList.push({
            index: a,
            line: key,
            text: value,
            freeText: '',
          });
          if (a < 400) {
            flag.push({ index: a, line: key, text: value, freeText: '' });
          }
          a++;
        });
        $this.logTotalSize = $this.originLogList.length;
        sr.originalData = flag;
      }
      return sr;
    } else {
      return sr;
    }
  }

  toCallStudio(option) {
    this.LabelStudioService.initLabelStudio(option);
    const h4Dom = this.el.nativeElement.querySelector('.ant-typography');
    this.rectLabelDom = h4Dom.nextElementSibling;
    this.polygonLabelDom = this.rectLabelDom.nextElementSibling;
    this.renderer2.setStyle(this.polygonLabelDom, 'display', 'none');
    this.renderer2.setStyle(this.rectLabelDom, 'display', 'block');
  }

  deletePolygon() {
    // console.log("deletePolygon:::", this.LabelStudioService.imageLabelInfo.completionStore.completions[0].highlightedNode)
    if (
      this.LabelStudioService.imageLabelInfo.completionStore &&
      this.LabelStudioService.imageLabelInfo.completionStore.completions[0].highlightedNode
    ) {
      this.LabelStudioService.imageLabelInfo.completionStore.completions[0].highlightedNode.deleteRegion();
    }
  }

  deleteAllPolygon() {
    this.LabelStudioService.imageLabelInfo.completionStore.selected.history.reset();
  }

  onPolygon() {
    this.rectSelected = false;
    this.renderer2.setStyle(this.polygonLabelDom, 'display', 'block');
    this.renderer2.setStyle(this.rectLabelDom, 'display', 'none');
  }

  onRects() {
    this.rectSelected = true;
    this.renderer2.setStyle(this.polygonLabelDom, 'display', 'none');
    this.renderer2.setStyle(this.rectLabelDom, 'display', 'block');
  }

  sortLabelForColor(categories) {
    this.logCategories = [];
    this.imageRectLabelTemplate = [];
    this.imagePolyLabelTemplate = [];
    if (categories) {
      categories.forEach((element, index) => {
        if (index >= 30) {
          index = index - 30;
        }
        if (this.projectType == 'log') {
          this.logCategories.push({
            label: element,
            color: this.colorsRainbow[index],
          });
        } else {
          this.imageRectLabelTemplate += `<Label value="${element}" background="${this.colorsRainbow[index]}" selectedColor="white"/>`;
          this.imagePolyLabelTemplate += `<Label value="${element}" background="${this.colorsRainbow[index]}" selectedColor="white"/>`;
        }
      });
    }
  }

  nerLabelForColor(categories) {
    this.labelColor = new Map();
    categories.forEach((ele, index) => {
      this.labelColor.set(ele, this.colorsRainbow[index]);
    });
  }

  @HostListener('click', ['$event.target'])
  public onClick() {
    if (this.LabelStudioService.imageLabelInfo && this.LabelStudioService.imageLabelInfo.completionStore) {
      this.currentBoundingData = this.LabelStudioService.imageLabelInfo.completionStore.selected.serializeCompletion();
      this.highlightedNode = this.LabelStudioService.imageLabelInfo.completionStore.selected.highlightedNode;
      if (this.highlightedNode && this.highlightedNode.type === 'rectangleregion') {
        this.onRects();
      } else if (this.highlightedNode && this.highlightedNode.type === 'polygonregion') {
        this.onPolygon();
      }
    }
  }

  onMouseDownTxt(data, row) {
    this.spanStart = row;
  }

  setFreeText(index, data, from, annotate) {
    if (this.isFilterLog) {
      const filterTxt = this.sr.originalData.filter((item) => item.index === index);
      if (filterTxt.length) {
        filterTxt[0].annotate = annotate;
        if (annotate) {
          filterTxt[0].freeText = from == 'historyBack' ? data.freeText : '';
        } else {
          filterTxt[0].freeText = '';
        }
      }
    } else {
      if (this.sr.originalData[index]) {
        this.sr.originalData[index].annotate = annotate;
        this.sr.originalData[index].freeText = from == 'historyBack' ? data.freeText : '';
        if (annotate) {
          this.sr.originalData[index].freeText = from == 'historyBack' ? data.freeText : '';
        } else {
          this.sr.originalData[index].freeText = '';
        }
      }
    }
  }

  onMouseUpTxt(data, row, from) {
    this.spanEnd = row;
    let spanslistPromise;

    if (this.spanEnd == this.spanStart) {
      const pDom = this.el.nativeElement.querySelector('.txtRowContent' + this.spanEnd);
      this.getElementService.toFindDomAddClass(pDom, 'selectedTxtRow');
      // to give label's color to text
      if (pDom) {
        pDom.style.backgroundColor = this.toolService.hexToRgb(
          this.colorsRainbow[from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID],
        );
      }
      // update the this.spansList
      if (_.indexOf(this.toGetLogLines(this.spansList), data.line) < 0) {
        this.spansList.push({
          line: data.line,
          label: from == 'historyBack' ? data.label : this.categories[this.selectedEntityID],
          freeText: from == 'historyBack' ? data.freeText : '',
          index: this.spanEnd,
        });
        this.setFreeText(this.spanEnd, data, from, true);
      } else {
        if (from !== 'historyBack') {
          this.setFreeText(this.spanEnd, data, from, false);
        } else {
          this.setFreeText(this.spanEnd, data, from, true);
        }
      }
      const txtRowEntityDom = this.el.nativeElement.querySelector('.txtRowEntity' + this.spanEnd);
      // to give label's color to entity
      if (txtRowEntityDom) {
        txtRowEntityDom.style.backgroundColor =
          this.colorsRainbow[from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID];
        this.getElementService.toFindDomAddText(
          txtRowEntityDom,
          from == 'historyBack' ? data.label : this.categories[this.selectedEntityID],
          'txtEntityLabel',
        );
        this.getElementService
          .toCreateClear(txtRowEntityDom, pDom, 'clear-' + this.spanEnd, 'clearTxt', this.spansList)
          .then((data) => {
            spanslistPromise = data;
            this.spansList = spanslistPromise;

            if (this.cloneSpanslist.length > this.spansList.length) {
              let flag = _.difference(_.map(this.cloneSpanslist, 'index'), _.map(this.spansList, 'index'));
              this.setFreeText(flag[0], data, from, false);
            }
            this.cloneSpanslist = _.cloneDeep(this.spansList);
          });
        this.getElementService.toListenMouseIn(pDom, this.el.nativeElement.querySelector('.clear-' + this.spanEnd));
        this.getElementService.toListenMouseOut(pDom, this.el.nativeElement.querySelector('.clear-' + this.spanEnd));

        this.getElementService
          .toClearSelected(
            txtRowEntityDom,
            pDom,
            this.el.nativeElement.querySelector('.clear-' + this.spanEnd),
            this.spansList,
          )
          .then((data) => {
            spanslistPromise = data;
            this.spansList = spanslistPromise;

            if (this.cloneSpanslist.length > this.spansList.length) {
              let flag = _.difference(_.map(this.cloneSpanslist, 'index'), _.map(this.spansList, 'index'));
              this.setFreeText(flag[0], data, from, false);
            }
            this.cloneSpanslist = _.cloneDeep(this.spansList);
          });
      }
    } else if (this.spanEnd > this.spanStart) {
      for (let a = this.spanStart; a < this.spanEnd + 1; a++) {
        const pDom = this.el.nativeElement.querySelector('.txtRowContent' + a);
        const txtRowEntityDom = this.el.nativeElement.querySelector('.txtRowEntity' + a);
        this.getElementService.toFindDomAddClass(pDom, 'selectedTxtRow');
        if (pDom) {
          pDom.style.backgroundColor = this.toolService.hexToRgb(
            this.colorsRainbow[from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID],
          );
          if (_.indexOf(this.toGetLogLines(this.spansList), pDom.classList[0].split('-').pop()) < 0) {
            this.spansList.push({
              line: pDom.classList[0].split('-').pop(),
              label: this.categories[this.selectedEntityID],
              freeText: '',
              index: a,
            });
            this.sr.originalData[a].annotate = true;
          } else {
            for (let i = 0; i < this.spansList.length; i++) {
              if (this.spansList[i].line == pDom.classList[0].split('-').pop()) {
                this.spansList[i].label = this.categories[this.selectedEntityID];
                this.spansList[i].index = a;
                break;
              }
            }
          }
        }

        if (txtRowEntityDom) {
          txtRowEntityDom.style.backgroundColor =
            this.colorsRainbow[from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID];
          this.getElementService.toFindDomAddText(
            txtRowEntityDom,
            this.categories[this.selectedEntityID],
            'txtEntityLabel',
          );
          this.getElementService
            .toCreateClear(txtRowEntityDom, pDom, 'clear-' + a, 'clearTxt', this.spansList)
            .then((data) => {
              spanslistPromise = data;
              this.spansList = spanslistPromise;

              if (this.cloneSpanslist.length > this.spansList.length) {
                let flag = _.difference(_.map(this.cloneSpanslist, 'index'), _.map(this.spansList, 'index'));
                this.setFreeText(flag[0], data, from, false);
              }
              this.cloneSpanslist = _.cloneDeep(this.spansList);
            });
          this.getElementService.toListenMouseIn(pDom, this.el.nativeElement.querySelector('.clear-' + a));
          this.getElementService.toListenMouseOut(pDom, this.el.nativeElement.querySelector('.clear-' + a));
          this.getElementService
            .toClearSelected(txtRowEntityDom, pDom, this.el.nativeElement.querySelector('.clear-' + a), this.spansList)
            .then((data) => {
              spanslistPromise = data;
              this.spansList = spanslistPromise;
            });
        }
      }
    } else {
      for (let a = this.spanEnd; a < this.spanStart + 1; a++) {
        const pDom = this.el.nativeElement.querySelector('.txtRowContent' + a);
        this.getElementService.toFindDomAddClass(pDom, 'selectedTxtRow');
        if (pDom) {
          pDom.style.backgroundColor = this.toolService.hexToRgb(
            this.colorsRainbow[from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID],
          );
          if (_.indexOf(this.toGetLogLines(this.spansList), pDom.classList[0].split('-').pop()) < 0) {
            this.spansList.push({
              line: pDom.classList[0].split('-').pop(),
              label: this.categories[this.selectedEntityID],
              freeText: '',
              index: a,
            });
            this.sr.originalData[a].annotate = true;
          } else {
            for (let i = 0; i < this.spansList.length; i++) {
              if (this.spansList[i].line == pDom.classList[0].split('-').pop()) {
                this.spansList[i].label = this.categories[this.selectedEntityID];
                this.spansList[i].index = a;
                break;
              }
            }
          }
        }

        const txtRowEntityDom = this.el.nativeElement.querySelector('.txtRowEntity' + a);
        if (txtRowEntityDom) {
          txtRowEntityDom.style.backgroundColor =
            this.colorsRainbow[from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID];
          this.getElementService.toFindDomAddText(
            txtRowEntityDom,
            this.categories[this.selectedEntityID],
            'txtEntityLabel',
          );
          this.getElementService
            .toCreateClear(txtRowEntityDom, pDom, 'clear-' + a, 'clearTxt', this.spansList)
            .then((data) => {
              spanslistPromise = data;
              this.spansList = spanslistPromise;

              if (this.cloneSpanslist.length > this.spansList.length) {
                let flag = _.difference(_.map(this.cloneSpanslist, 'index'), _.map(this.spansList, 'index'));
                this.setFreeText(flag[0], data, from, false);
              }
              this.cloneSpanslist = _.cloneDeep(this.spansList);
            });
          this.getElementService.toListenMouseIn(pDom, this.el.nativeElement.querySelector('.clear-' + a));
          this.getElementService.toListenMouseOut(pDom, this.el.nativeElement.querySelector('.clear-' + a));
          this.getElementService
            .toClearSelected(txtRowEntityDom, pDom, this.el.nativeElement.querySelector('.clear-' + a), this.spansList)
            .then((data) => {
              spanslistPromise = data;
              this.spansList = spanslistPromise;
            });
        }
      }
    }
    // console.log('this.spansList:::', this.spansList);
    this.cloneSpanslist = _.cloneDeep(this.spansList);
    this.actionError = null;
  }

  toGetLogLines(spansList) {
    const x = [];
    spansList.forEach((e) => {
      x.push(e.line);
    });
    return x;
  }

  updateFreeText(e, index) {
    if (this.spansList.length > 0) {
      for (let i = 0; i < this.spansList.length; i++) {
        if (this.spansList[i].index === index) {
          this.spansList[i].freeText = e.trim() !== '' ? e : '';
          return;
        }
      }
    }
  }

  logFilterScrollListener(filterRowsIndex) {
    setTimeout(() => {
      let dom = this.el.nativeElement.querySelector('.txtBox');
      let $this = this;
      dom.addEventListener('scroll', function () {
        const scrollDistance = dom.scrollHeight - dom.scrollTop - dom.clientHeight;
        if (scrollDistance <= 10) {
          let filterLogDataSize = $this.filterLogData.length;
          let start = $this.sr.originalData.length;
          if (start < filterLogDataSize) {
            let end = start + 400 < filterLogDataSize ? start + 400 : filterLogDataSize;
            $this.filterLogData.forEach((elem, index) => {
              if (start < end && start <= index) {
                $this.sr.originalData.push(elem);
                $this.getElementService.setFilterHighLight('txtRowContent' + elem.index, elem.text, elem.matchResult);
                start++;
              }
            });
          }
        }
      });
    }, 5);
    this.showSpanListLog(filterRowsIndex, '');
  }

  showSpanListLog(filterRowsIndex, e) {
    let condition = false;
    if (e && e.length == 0) {
      condition = true;
    }
    setTimeout(() => {
      if (this.spansList.length > 0) {
        this.spansList.forEach((data) => {
          if (condition || (filterRowsIndex.length > 0 && filterRowsIndex.indexOf(data.index) > -1)) {
            this.onMouseDownTxt({ line: data.line, label: data.label, freeText: data.freeText }, data.index);
            this.onMouseUpTxt(
              { line: data.line, label: data.label, freeText: data.freeText },
              data.index,
              'historyBack',
            );
          }
        });
      }
    }, 20);
  }

  setFilterLogData(e, filterRowsIndex) {
    this.originLogList.forEach((element, index) => {
      let arr = [];
      let existLine = true;
      e.forEach((filter) => {
        let matchResult = [];
        if (filter.filterType == 'keyword') {
          matchResult = [...element.text.matchAll(RegExp(filter.filterText, 'gi'))];
        } else {
          matchResult = this.toolService.regexExec(filter.filterText, element.text);
        }
        if (matchResult.length) {
          arr = [...arr, ...matchResult];
        } else {
          existLine = false;
        }
      });
      if (existLine) {
        this.filterLogData.push({
          index: index,
          line: element.line,
          text: element.text,
          freeText: '',
          filter: true,
          matchResult: arr,
        });
        filterRowsIndex.push(index);
      }
    });
  }

  filterAllLogTxt(e, filterRowsIndex) {
    const len = this.originLogList.length < 400 ? this.originLogList.length : 400;
    this.filterLogData = [];
    if (e.length > 0) {
      this.isFilterLog = true;
      this.setFilterLogData(e, filterRowsIndex);
      this.sr.originalData = [];
      this.filterLogData.forEach((elem, index) => {
        if (index < len) {
          this.sr.originalData.push(elem);
          this.getElementService.setFilterHighLight('txtRowContent' + elem.index, elem.text, elem.matchResult);
        }
      });
      this.logFilterScrollListener(filterRowsIndex);
    } else {
      this.isFilterLog = false;
      const flag = [];
      this.originLogList.forEach((element, index) => {
        if (index < 400) {
          flag.push(element);
        }
      });
      this.sr.originalData = flag;
      this.addLogScrollListener();
    }
    this.showSpanListLog(filterRowsIndex, e);
  }

  toFilterLog(e) {
    const filterRowsIndex = [];
    this.filterAllLogTxt(e, filterRowsIndex);
  }

  updateFilterSelect(e) {
    this.regexErr = false;
    this.filterType = e.target.value;
  }

  updateFilterText(e) {
    this.regexErr = false;
  }

  overFilter(index) {
    this.active = index;
  }

  outFilter(index) {
    this.active = null;
  }

  deleteFilter(index) {
    this.filterList.splice(index, 1);
    this.toFilterLog(this.filterList);
  }

  onEnterFilter(e) {
    if (e.value) {
      if (this.filterType == 'regex') {
        try {
          this.toolService.regexExec(e.value, 'test');
          this.regexErr = false;
        } catch (err) {
          this.regexErr = true;
          return;
        }
      } else {
        this.regexErr = false;
      }
      this.filterList.push({
        filterType: this.filterType,
        filterText: e.value,
      });
      this.questionForm.get('filterText').reset();
      this.toFilterLog(this.filterList);
    }
  }

  blurFilter(e) {
    if (e.target.value) {
      if (this.filterType == 'regex') {
        try {
          this.toolService.regexExec(e.target.value, 'test');
          this.regexErr = false;
        } catch (err) {
          this.regexErr = true;
          return;
        }
      } else {
        this.regexErr = false;
      }
      this.filterList.push({
        filterType: this.filterType,
        filterText: e.target.value,
      });
      this.questionForm.get('filterText').reset();
      this.toFilterLog(this.filterList);
    }
  }

  toStorageFilter() {
    if (this.filterList.length > 0) {
      this.saveAnnotateSetting('filter', this.filterList);
    } else {
      if (localStorage.getItem('annotate-setting')) {
        const logFilter = JSON.parse(localStorage.getItem('annotate-setting'));
        for (let i = 0; i < logFilter.length; i++) {
          if (this.projectId == logFilter[i].pId) {
            logFilter.splice(i, 1);
            if (logFilter.length > 0) {
              localStorage.setItem('annotate-setting', JSON.stringify(logFilter));
              break;
            } else {
              localStorage.removeItem('annotate-setting');
              break;
            }
          }
        }
      }
    }
  }

  detailDrawer() {
    if (this.isDrawer) {
      this.isDrawer = false;
    } else {
      this.isDrawer = true;
    }
    this.clearPopDialog();
  }

  toShowExistingLabel() {
    if (this.sr.userInputs) {
      const annotations = this.sr.userInputs;
      let errLabel = [];
      setTimeout(() => {
        annotations.forEach((element) => {
          element.problemCategory.forEach((element2) => {
            if (element2.start !== element2.end) {
              this.initNerPassage(element2, this.categories.indexOf(element2.label));
            } else {
              errLabel.push(element2);
            }
          });
        });
        if (errLabel.length > 0) {
          let stringA = '';
          errLabel.forEach((label) => {
            stringA += JSON.stringify(label) + ',';
          });
          stringA = stringA.slice(0, stringA.length - 1);
          this.actionError = `The existing label [${stringA}] hasn't found matched token id, please re-label and then submit.`;
        }
      }, 10);
    }
  }

  getAllLogFilename() {
    this.apiService.getAllLogFilename(this.projectId).subscribe(
      (response) => {
        if (response) {
          response.forEach((element, index) => {
            element.index = index;
            if (element.fileName === this.currentLogFile) {
              this.selectedFile = index;
            }
          });
          this.logFiles = response.sort((a, b) => a['fileName'].localeCompare(b['fileName']));
        } else {
        }
      },
      (error) => {},
    );
  }

  getTargetFile(file) {
    if (file && file.fileName && file.fileName !== this.currentLogFile) {
      const param = {
        pid: this.projectId,
        fname: file.fileName,
      };
      this.loading = true;
      this.apiService.getSrByFilename(param).subscribe(
        (response) => {
          if (response) {
            if (response && response.MSG) {
              this.error = this.sr.MSG;
              this.loading = false;
              return;
            }
            this.sr = this.resetLogSrData(response);
            this.showPreLogLable();
            this.currentLogFile = this.sr.fileInfo.fileName;
            this.toFilterLog(this.filterList);
            if (this.sr.userInputsLength > 0) {
              this.categoryBackFunc();
              this.sortLabelForColor(this.categories);
              this.getProgress();
              this.reviewee = this.sr.userInputs[0].user;
            }

            if (this.sr && this.sr.flag && this.sr.flag.silence) {
              this.silenceStatus = true;
            }
            this.loading = false;
            this.isSkippingGameDialog = false;
            this.clearUserInput();
          }
        },
        (error) => {},
      );
    }
  }

  blurFilename() {
    this.setSelectedFile();
  }

  focusFilename(e) {
    this.selectedFile = null;
  }

  setSelectedFile() {
    for (let i = 0; i < this.logFiles.length; i++) {
      if (this.currentLogFile === this.logFiles[i].fileName) {
        this.selectedFile = this.logFiles[i].index;
        break;
      }
    }
  }

  toWrapText() {
    this.wrapText = !this.wrapText;
  }

  changeRenderFormat(e) {
    this.renderFormat = e.target.value;
    this.saveAnnotateSetting('display', this.renderFormat);
  }

  saveAnnotateSetting(set, value) {
    if (localStorage.getItem('annotate-setting')) {
      const settings = JSON.parse(localStorage.getItem('annotate-setting'));
      const pIds = [];
      settings.forEach((element) => {
        pIds.push(element.pId);
      });
      if (pIds.indexOf(this.projectId) > -1) {
        settings[pIds.indexOf(this.projectId)][set] = value;
        localStorage.setItem('annotate-setting', JSON.stringify(settings));
      } else {
        settings.push({
          pId: this.projectId,
          filter: set === 'display' ? '' : value,
          display: set === 'display' ? value : '',
        });
        localStorage.setItem('annotate-setting', JSON.stringify(settings));
      }
    } else {
      const obj = {
        pId: this.projectId,
        filter: set === 'display' ? '' : value,
        display: set === 'display' ? value : '',
      };
      localStorage.setItem('annotate-setting', JSON.stringify([obj]));
    }
  }

  updateOutput(mdText) {
    let source = String(mdText);
    return new Promise((resolve) => {
      this.convertedText = this.md.convert(source);
      resolve(this.convertedText);
    });
  }

  outOfPage() {
    this.error = null;
    this.router.navigate(['loop/project/list']);
  }

  ngOnDestroy() {
    this.toStorageFilter();
    if (
      this.projectType !== 'image' &&
      this.projectType !== 'log' &&
      this.projectType !== 'ner' &&
      this.renderFormat === 'html'
    ) {
      this.saveAnnotateSetting('display', this.renderFormat);
    }

    window.removeEventListener('scroll', this.handleScroll, true);
  }

  formatDecimal(num, decimal) {
    num = num.toString();
    let index = num.indexOf('.');
    if (index !== -1) {
      num = num.substring(0, decimal + index + 1);
    }
    return parseFloat(num).toFixed(decimal);
  }

  getChildren = (folder) => folder.children;

  changeSelectedlabel(label, data) {
    label.enable = data;
    const treeLabels = this.treeLabels ? JSON.parse(JSON.stringify(this.treeLabels)) : [];
    this.selectedTreeLabels = treeLabels ? filterTreeLabel(treeLabels) : [];
  }

  clickTreeView(data) {
    this.showTreeView = true;
    this.treeData = data;
  }

  onCloseTreeDialog() {
    this.showTreeView = false;
  }

  ExpandChanged() {
    this.expandValue = !this.expandValue;
    if (this.expandValue) {
      this.expandName = 'Collapse';
    } else {
      this.expandName = 'Expand';
    }
  }

  resizeBox() {
    let target = document.querySelector('.textBox');
    if (target) {
      const config = { attributes: true, childList: true, subtree: true };
      let that = this;
      const callback = function (mutationList) {
        that.textBoxResizedHeight = `${mutationList[0].target.clientHeight}px`;
      };
      const observer = new MutationObserver(callback);
      observer.observe(target, config);
    }
  }

  clickAssignTab() {
    this.loading = true;
    this.multipleLabelList = [];
    this.spansList = [];
    this.currentBoundingData = [];
    this.selectedTreeLabels = [];
    this.categories = [];
    this.scores = [];
    this.treeLabels = [];
    this.logCategories = [];
    this.toGetProjectInfo(this.projectId);
    this.getProgress();
  }

  clickTab(tabIndex?) {
    this.currentTabIndex = tabIndex;
    if (tabIndex === 1) {
      this.clickAssignTab();
    }
  }

  receiveOutClickReviewOrder(order) {
    this.reviewOrder = order;
    this.getOneReview('order');
  }

  receiveOutSelectReviewee(reviewee) {
    this.reviewee = reviewee;
    this.getOneReview('order');
  }

  // clickUncertain(e) {
  //   if (e.target.innerText === 'Uncertain' && this.reviewOrder !== 'most_uncertain') {
  //     this.receiveOutClickReviewOrder('most_uncertain');
  //   }
  // }

  toDatasetAnalyze() {
    this.loadingViewData = ClrLoadingState.LOADING;

    this.apiService.findDatasetName(this.projectInfo.selectedDataset[0]).subscribe(
      (res) => {
        if (res?.length > 0) {
          this.router.navigate(['loop/datasets/analyze'], {
            queryParams: { data: JSON.stringify(res[0]) },
          });
        } else {
          this.errorMessage = 'No permission to view this data.';
        }
        this.loadingViewData = ClrLoadingState.DEFAULT;
      },
      (error: any) => {
        this.errorMessage = 'Failed to load the datasets';
        this.loadingViewData = ClrLoadingState.DEFAULT;
      },
    );
  }
}
