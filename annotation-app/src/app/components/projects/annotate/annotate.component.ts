/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import {
  Component,
  OnInit,
  ElementRef,
  Renderer2,
  ViewChild,
  HostListener,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { AvaService } from '../../../services/ava.service';
import { SR, SrUserInput } from '../../../model/sr';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { LabelStudioService } from 'app/services/label-studio.service';
import { GetElementService } from 'app/services/common/dom.service';
import { ToolService } from 'app/services/common/tool.service';
import { UserAuthService } from 'app/services/user-auth.service';
import { EnvironmentsService } from 'app/services/environments.service';

@Component({
  selector: 'app-annotate',
  templateUrl: './annotate.component.html',
  styleUrls: ['./annotate.component.scss'],
})
export class AnnotateComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('numericInput', { static: false }) numericInput;
  user: any;
  questionForm: FormGroup;
  sr: SR;
  categories: string[];
  loading: boolean;
  error: string;
  actionError: string;
  maxAnnotationError: string;
  isEndingGameDialog: boolean;
  isSkippingGameDialog: boolean;
  projects: any;
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
  colorsRainbow = [
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
  startFrom: string;
  annotationPrevious: any = [];
  reviewOrder = 'random';
  selectedFile: number;
  currentLogFile: string;
  logFiles: any = [];

  constructor(
    private renderer2: Renderer2,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private avaService: AvaService,
    private el: ElementRef,
    private LabelStudioService: LabelStudioService,
    private getElementService: GetElementService,
    private toolService: ToolService,
    private userAuthService: UserAuthService,
    private env: EnvironmentsService,
  ) {
    this.user = this.userAuthService.loggedUser();
  }

  ngAfterViewInit() {}

  ngOnInit(): void {
    this.loading = true;
    this.error = null;
    this.maxAnnotationError = null;
    this.isEndingGameDialog = false;
    this.isSkippingGameDialog = false;
    this.silenceStatus = false;
    this.isNumeric = false;
    this.clrErrorTip = false;
    this.active = -1;
    this.labelChoose = null;
    this.idName = '';
    this.route.queryParams.subscribe((data) => {
      this.selectParam = data.name;
      this.projectId = data.id;
      this.projectType = data.projectType;
      this.startFrom = data.from;
      this.toGetProjectInfo(this.projectId);
    });
    this.createForm();
    this.getProgress();
    this.getProjectsList();
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
    this.questionForm = this.formBuilder.group({});
    this.questionForm.addControl(
      'questionGroup',
      this.formBuilder.group({
        category: this.sr.problemCategory,
        freeText: [null],
        answer: [null],
        selectProject: [this.selectParam],
        filterText: [null],
        reviewee: [null],
      }),
    );
  }

  fetchData(): void {
    this.silenceStatus = false;
    this.error = null;
    const paramSr = {
      id: this.projectId,
    };
    this.loading = true;
    this.avaService.getRandomSr(paramSr).subscribe(
      (response) => {
        this.sr = response;
        if (this.sr.MSG) {
          this.error = 'All cases have been completely annotated.';
          return;
        } else {
          if (
            this.projectType == 'text' ||
            this.projectType == 'tabular' ||
            this.projectType == 'regression'
          ) {
            this.sr = this.resetTabularSrData(this.sr);
          }
          if (this.projectType == 'ner') {
            this.sr = this.resetNerSrData(this.sr);
            this.toShowExistingLabel();
          }
          if (this.projectType == 'image') {
            // console.log("fetchData.this.sr:::", this.sr);
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
                    }&token=${
                      JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token
                        .access_token
                    }`,
                historyCompletions: this.historyTask,
                annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
                from: 'annotate',
              };
              this.toCallStudio(option);
            }, 0);
          }
          if (this.projectType == 'log') {
            this.sr = this.resetLogSrData(this.sr);
            this.currentLogFile =
              this.projectInfo.isShowFilename || this.startFrom === 'review'
                ? this.sr.fileInfo.fileName
                : '';
          }
          if (this.sr.flag && this.sr.flag.silence) {
            this.silenceStatus = true;
          }
          if (this.labelType == 'numericLabel') {
            this.isNumeric = true;
            this.numericMessage =
              'Allowed values are between ' + this.minLabel + ' and ' + this.maxLabel + ' .';
            setTimeout(() => {
              this.numericInput.nativeElement.focus();
            }, 500);
          } else {
            if (this.projectType == 'log') {
              this.sortLabelForColor(this.categories);
            }
            this.isShowDropDown = false;
            if (
              this.categories.length > 6 &&
              this.projectType != 'ner' &&
              this.projectType != 'image' &&
              this.projectType != 'log'
            ) {
              this.isShowDropDown = true;
            }
          }
        }
      },
      (error) => {
        this.error = 'All cases have been completely annotated.';
        console.log('Unable to fetch SR data from ava server: ', JSON.stringify(error, null, 2));
        this.loading = false;
      },
      () => {
        if (!this.sr.MSG) {
          this.loading = false;
        }
        if (this.projectType == 'log' && !this.error) {
          setTimeout(() => {
            this.el.nativeElement.querySelector(
              '.logCategories' + this.selectedEntityID,
            ).style.backgroundColor = this.colorsRainbow[this.selectedEntityID];
            // to read the filterList from localStorage
            if (localStorage.getItem('log-filter')) {
              const logFilter = JSON.parse(localStorage.getItem('log-filter'));
              for (let i = 0; i < logFilter.length; i++) {
                if (this.projectId == logFilter[i].pId) {
                  this.filterList = logFilter[i].filter;
                  this.toFilterLog(this.filterList);
                  break;
                }
              }
            }
          }, 5);
        }
      },
    );
  }

  getOneReview(from?) {
    this.loading = true;
    this.avaService
      .getOneReview(
        this.projectId,
        this.questionForm.get('questionGroup.reviewee').value,
        this.reviewOrder,
      )
      .subscribe(
        (res) => {
          this.loading = false;
          if (res && res.MSG) {
            this.error = res.MSG;
            return;
          } else {
            // this.submitAndHistory([this.sr], from);
            this.submitAndHistory(res, from);
            this.sr = res;
            this.sr = this.resetLogSrData(this.sr);
            this.currentLogFile = this.sr.fileInfo.fileName;
            if (this.sr.flag && this.sr.flag.silence) {
              this.silenceStatus = true;
            }
            this.getAllLogFilename();
            this.sortLabelForColor(this.categories);
            this.categoryBackFunc();
            this.getProgress();
          }
        },
        (error) => {
          console.log(error);
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
    this.isSkipOrBack('pass');
  }

  dropDownSubmit() {
    this.questionForm.get('questionGroup.category').reset();
  }

  onSubmit(from?): void {
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
      this.avaService.putSrUserInput(srUserInput).subscribe(
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
          console.log(error);
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
      tid: [this.sr._id],
    };
    if (from === 'pass') {
      param['modify'] = false;
    } else {
      param['modify'] = true;
      param['problemCategory'] = this.spansList;
    }
    this.avaService.passTicket(param).subscribe((res) => {
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
          originalLabel !== this.questionForm.get('questionGroup.category').value
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
      } else if (
        this.isMultipleLabel &&
        (this.projectType == 'text' || this.projectType == 'tabular')
      ) {
        // case multiple
        for (let i = 0; i < this.annotationHistory.length; i++) {
          let difference = [];
          if (originalLabel.length - this.multipleLabelList.length >= 0) {
            difference = _.difference(originalLabel, this.multipleLabelList);
          } else {
            difference = _.difference(this.multipleLabelList, originalLabel);
          }
          if (this.annotationHistory[i].srId === this.sr._id && difference.length > 0) {
            this.annotationHistory.splice(i, 1);
            this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
            break;
          }
        }
      } else if (
        this.projectType === 'ner' ||
        this.projectType === 'log' ||
        this.projectType === 'image'
      ) {
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
                this.sortBy(
                  this.projectType === 'ner'
                    ? 'start'
                    : this.projectType === 'log'
                    ? 'line'
                    : 'sort',
                  'ascending',
                ),
              );
              const bb = isCategory.sort(
                this.sortBy(
                  this.projectType === 'ner'
                    ? 'start'
                    : this.projectType === 'log'
                    ? 'line'
                    : 'sort',
                  'ascending',
                ),
              );

              for (let n = 0; n < aa.length; n++) {
                let aaString;
                let bbString;
                if (this.projectType === 'ner') {
                  aaString = aa[n].text + aa[n].ids + aa[n].label;
                  bbString = bb[n].text + bb[n].ids + bb[n].label;
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
    this.avaService.getRandomSr(paramSr).subscribe(
      (newSr) => {
        this.getProgress();
        if (newSr && newSr.MSG) {
          this.error = 'All cases have been completely annotated.';
          return;
        }
        this.submitAndHistory(newSr);
      },
      (error) => {
        this.error = JSON.stringify(error, null, 2);
        this.loading = false;
      },
      () => {
        this.loading = false;
        if (this.projectType == 'log') {
          setTimeout(() => {
            this.el.nativeElement.querySelector(
              '.logCategories' + this.selectedEntityID,
            ).style.backgroundColor = this.colorsRainbow[this.selectedEntityID];
          }, 5);
        }
      },
    );
  }

  submitAndHistory(newSr, from?) {
    // add to the history
    if (this.maxAnnotationError == null && this.sr._id !== 0) {
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
          OldSr.originalData.location = `${
            this.env.config.annotationService
          }/api/v1.0/datasets/set-data?file=${OldSr.originalData.location}&token=${
            JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token.access_token
          }`;
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
        addSubmit['historyDescription'] = OldSr.originalData.slice(0, 10);
      }
      if (from !== 'order') {
        if (!this.srInHistory()) {
          this.annotationHistory.unshift(addSubmit);
        }
        this.annotationPrevious = JSON.parse(JSON.stringify(this.annotationHistory));
      }

      // console.log('getOne.annotationHistory:::', this.annotationHistory, this.annotationPrevious);
    }
    this.sr = newSr;
    this.currentBoundingData = [];
    if (
      this.projectType == 'text' ||
      this.projectType == 'tabular' ||
      this.projectType == 'regression'
    ) {
      this.sr = this.resetTabularSrData(this.sr);
    }
    if (this.projectType == 'ner') {
      this.sr = this.resetNerSrData(this.sr);
      this.toShowExistingLabel();
    }
    if (this.projectType == 'image') {
      this.sr = this.resetImageSrData(this.sr);
      // console.log("getOne.this.sr:::", this.sr)
      setTimeout(() => {
        const option = {
          dom: 'label-studio',
          imageRectLabelTemplate: this.imageRectLabelTemplate,
          imagePolyLabelTemplate: this.imagePolyLabelTemplate,
          url: this.env.config.enableAWSS3
            ? this.sr.originalData.location
            : `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
                this.sr.originalData.location
              }&token=${
                JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token.access_token
              }`,
          historyCompletions: this.historyTask,
          annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
          from: 'annotate',
        };
        this.toCallStudio(option);
      }, 0);
    }
    if (this.projectType == 'log') {
      this.sr = this.resetLogSrData(this.sr);
      this.currentLogFile =
        this.projectInfo.isShowFilename || this.startFrom === 'review'
          ? this.sr.fileInfo.fileName
          : '';
      this.toFilterLog(this.filterList);
    }
    if (this.sr.flag && this.sr.flag.silence) {
      this.silenceStatus = true;
    }
    if (this.isNumeric) {
      setTimeout(() => {
        this.numericInput.nativeElement.focus();
      }, 500);
    }
    this.clearUserInput();
  }

  onEndGame(): void {
    if (this.isFormPrestine()) {
      this.router.navigate(['/game'], {
        queryParams: { outfrom: this.startFrom == 'review' ? 'review' : 'annotate', hash: 'max' },
      });
    } else {
      this.isEndingGameDialog = true;
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
        this.isMultipleLabel &&
        this.projectType !== 'ner' &&
        this.projectType !== 'image' &&
        this.projectType !== 'log'
      ) {
        if (!this.sr.userInputsLength && !this.sr.userInputs) {
          const isCategory = this.categoryFunc();
          this.isActionErr(isCategory, null, 'skip');
        } else {
          for (let i = 0; i < this.annotationHistory.length; i++) {
            if (this.annotationHistory[i].srId === this.sr._id) {
              let difference = [];
              if (this.annotationHistory[i].category.length - this.multipleLabelList.length >= 0) {
                difference = _.difference(
                  this.annotationHistory[i].category,
                  this.multipleLabelList,
                );
              } else {
                difference = _.difference(
                  this.multipleLabelList,
                  this.annotationHistory[i].category,
                );
              }
              if (difference.length > 0) {
                this.actionError =
                  'The current label is diiferent from the original existing label, please do submit first.';
                return;
              } else {
                this.skipAndFetchNewQuestion();
                return;
              }
            }
          }
        }
      } else if (this.projectType == 'ner') {
        this.isSkipOrBack('skip');
      } else if (this.projectType == 'image') {
        this.isSkipOrBack('skip');
      } else if (this.projectType == 'log') {
        this.isSkipOrBack('skip');
      } else {
        this.skipAndFetchNewQuestion();
      }
    }
  }

  skipAndFetchNewQuestion(): void {
    this.clearCheckbox();
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
      if (this.questionForm.get('questionGroup.reviewee').value) {
        paramSr['user'] = this.questionForm.get('questionGroup.reviewee').value;
      }
    }
    this.avaService.skipToNext(paramSr).subscribe(
      (responseSr) => {
        if (responseSr && responseSr.MSG) {
          this.error = this.sr.MSG;
          return;
        }
        // skip to the history
        const OldSr = JSON.parse(JSON.stringify(this.sr));
        if (!this.env.config.enableAWSS3 && this.projectType === 'image') {
          OldSr.originalData.location = `${
            this.env.config.annotationService
          }/api/v1.0/datasets/set-data?file=${OldSr.originalData.location}&token=${
            JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token.access_token
          }`;
        }
        const addSkip = {
          srId: OldSr._id,
          historyDescription:
            this.projectType === 'ner' || this.projectType === 'image'
              ? [OldSr.originalData]
              : OldSr.originalData.slice(0, 10),
          type: 'skip',
          category: this.projectType === 'ner' || this.projectType === 'log' ? this.spansList : [],
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
        this.currentBoundingData = [];
        if (
          this.projectType == 'text' ||
          this.projectType == 'tabular' ||
          this.projectType == 'regression'
        ) {
          this.sr = this.resetTabularSrData(this.sr);
        }
        if (this.projectType == 'ner') {
          this.sr = this.resetNerSrData(this.sr);
          this.toShowExistingLabel();
        }
        if (this.projectType == 'image') {
          this.sr = this.resetImageSrData(this.sr);
          setTimeout(() => {
            const option = {
              dom: 'label-studio',
              imageRectLabelTemplate: this.imageRectLabelTemplate,
              imagePolyLabelTemplate: this.imagePolyLabelTemplate,
              url: this.env.config.enableAWSS3
                ? this.sr.originalData.location
                : `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
                    this.sr.originalData.location
                  }&token=${
                    JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token
                      .access_token
                  }`,
              historyCompletions: this.historyTask,
              annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
              from: 'annotate',
            };
            this.toCallStudio(option);
          }, 0);
        }
        if (this.projectType == 'log') {
          this.sr = this.resetLogSrData(this.sr);
          this.currentLogFile =
            this.projectInfo.isShowFilename || this.startFrom === 'review'
              ? this.sr.fileInfo.fileName
              : '';
          this.setSelectedFile();
          this.toFilterLog(this.filterList);
          if (this.sr.userInputsLength > 0) {
            this.categoryBackFunc();
            this.sortLabelForColor(this.categories);
            this.getProgress();
          }
        }
        if (this.sr.flag && this.sr.flag.silence) {
          this.silenceStatus = true;
        }
        this.loading = false;
        this.isSkippingGameDialog = false;
        if (this.isNumeric) {
          setTimeout(() => {
            this.numericInput.nativeElement.focus();
          }, 500);
        }
        this.clearUserInput();
      },
      (error) => {
        this.error = JSON.stringify(error, null, 2);
        this.loading = false;
        this.isSkippingGameDialog = false;
      },
      () => {
        this.loading = false;
        if (this.projectType == 'log') {
          setTimeout(() => {
            this.el.nativeElement.querySelector(
              '.logCategories' + this.selectedEntityID,
            ).style.backgroundColor = this.colorsRainbow[this.selectedEntityID];
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
    const freeText = this.questionForm.get('questionGroup.freeText').value;
    const answer = this.questionForm.get('questionGroup.answer').value;
    return !(category.length > 0 || freeText || answer);
  }

  calculatePointsEarned(category, freeText, answer): number {
    let questionPoints = 0;
    questionPoints = category.length > 0 ? questionPoints + 1 : questionPoints;
    questionPoints = freeText ? questionPoints + 5 : questionPoints;
    questionPoints = answer ? questionPoints + 10 : questionPoints;
    return questionPoints;
  }

  getProjectsList() {
    if (this.startFrom === 'review') {
      this.avaService.getProjectsReviewList().subscribe(
        (response) => {
          this.projects = response;
        },
        (error) => {
          console.log(error);
        },
      );
    } else {
      this.avaService.getProjectsList().subscribe(
        (response) => {
          this.projects = response;
        },
        (error) => {
          console.log(error);
        },
      );
    }
  }

  onSelectingProjects(e) {
    this.isNumeric = false;
    this.minLabel = null;
    this.maxLabel = null;
    this.selectParam = e.target.value;
    this.toStorageFilter();
    for (let i = 0; i < this.projects.length; i++) {
      if (this.projects[i].projectName == e.target.value) {
        this.projectId = this.projects[i].id;
        this.toGetProjectInfo(this.projectId);
      }
    }
    this.getProgress();
    this.annotationHistory = [];
    this.annotationPrevious = [];
    this.idName = '';
    this.clearUserInput();
    this.filterList = [];
    this.selectedEntityID = 0;
    this.reviewOrder = 'random';
    this.questionForm.get('questionGroup.reviewee').reset();
  }

  toGetProjectInfo(pid) {
    this.avaService.getProjectInfo(pid).subscribe(
      (response) => {
        response.taskInstructions = response.taskInstructions.replace(/(\r\n|\n|\r)/gm, '<br/>');
        this.projectInfo = response;
        this.max = response.maxAnnotation;
        this.isMultipleLabel = response.isMultipleLabel;
        this.projectType = response.projectType;
        this.labelType = response.labelType;
        if (this.labelType === 'numericLabel') {
          this.minLabel = response.min;
          this.maxLabel = response.max;
        } else {
          this.categories = response.categoryList.split(',');
        }
        if (this.startFrom === 'review') {
          this.getOneReview();
        } else {
          this.fetchData();
        }
      },
      (error) => {
        console.log(error);
        this.loading = false;
      },
    );
  }

  getProgress() {
    const param = {
      id: this.projectId,
      review: this.startFrom === 'review' ? true : null,
    };
    this.avaService.getProgress(param).subscribe(
      (response) => {
        if (this.startFrom === 'review') {
          if (response.userCompleteCase.length === 1) {
            this.questionForm
              .get('questionGroup.reviewee')
              .setValue(response.userCompleteCase[0].user);
          } else {
            response.userCompleteCase = response.userCompleteCase.sort(
              this.sortBy('completeCase', 'descending'),
            );
          }
        }
        this.progressInfo = response;
        this.percentage =
          Math.round((this.progressInfo.completeCase / this.progressInfo.totalCase) * 10000) / 100;
      },
      (error) => {
        console.log(error);
      },
    );
  }

  isActionErr(isCategory, id?, from?) {
    if (!this.sr.userInputsLength && !this.sr.userInputs) {
      this.actionError =
        'The current label is diiferent from the original existing label, please do submit first.';
      return;
    } else {
      for (let i = 0; i < this.annotationHistory.length; i++) {
        let difference = [];
        if (this.annotationHistory[i].category.length - isCategory.length >= 0) {
          difference = _.difference(this.annotationHistory[i].category, isCategory);
        } else {
          difference = _.difference(isCategory, this.annotationHistory[i].category);
        }
        if (this.annotationHistory[i].srId === this.sr._id && difference.length > 0) {
          this.actionError =
            'The current label is diiferent from the original existing label, please do submit first.';
          return;
        }
      }
      if (from == 'skip') {
        this.skipAndFetchNewQuestion();
      } else if (from == 'pass') {
        this.onSubmit(from);
      } else {
        if (!this.actionError) {
          this.clearCheckbox();
          this.multipleLabelList = [];
          const param = {
            id,
            pid: this.projectId,
          };
          this.getSrById(param, 0, 'previous');
        }
      }
    }
  }

  historyBack(index, id) {
    this.silenceStatus = false;
    const isCategory = this.categoryFunc();

    // to update the annotationprevious list from the index
    if (this.projectType !== 'image') {
      this.annotationPrevious = this.annotationHistory.slice(index + 1);
    }

    if (isCategory.length > 0) {
      if (
        this.isMultipleLabel &&
        this.projectType !== 'ner' &&
        this.projectType !== 'image' &&
        this.projectType !== 'log'
      ) {
        this.isActionErr(isCategory, id);
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

  sortBy(field, order) {
    return function (a, b) {
      if (order == 'ascending') {
        return a[field] - b[field];
      } else {
        return b[field] - a[field];
      }
    };
  }

  isSkipOrBack(type, id?, index?) {
    const isCategory = this.categoryFunc();
    let flag1;
    let flag2;
    if (this.projectType == 'ner' || this.projectType == 'log') {
      flag1 =
        this.sr.userInputs &&
        this.sr.userInputs.length > 0 &&
        this.sr.userInputs[0].problemCategory.length > 0;
    } else {
      flag1 = this.sr.userInputs && this.sr.userInputs.length > 0;
    }
    if (flag1) {
      const a = [];
      if (this.projectType === 'image') {
        this.sr.userInputs.forEach((e) => {
          if (e.user == this.user.email) {
            a.push(e.problemCategory);
          }
        });
        flag2 = isCategory.length == a.length;
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
        const aa = isCategory.sort(
          this.sortBy(
            this.projectType === 'ner' ? 'start' : this.projectType === 'log' ? 'line' : 'sort',
            'ascending',
          ),
        );
        let bb;
        if (this.projectType === 'image') {
          bb = a.sort(this.sortBy('sort', 'ascending'));
        } else {
          bb = this.sr.userInputs[0].problemCategory.sort(
            this.sortBy(this.projectType === 'ner' ? 'start' : 'line', 'ascending'),
          );
        }
        for (let i = 0; i < aa.length; i++) {
          let aaString;
          let bbString;
          if (this.projectType === 'ner') {
            aaString = aa[i].text + aa[i].ids + aa[i].label;
            bbString = bb[i].text + bb[i].ids + bb[i].label;
          } else if (this.projectType === 'log') {
            aaString = aa[i].line + aa[i].label + aa[i].freeText;
            bbString = bb[i].line + bb[i].label + bb[i].freeText;
          } else if (this.projectType === 'image') {
            aaString = aa[i].valueInfo;
            bbString = bb[i].valueInfo;
          }
          if (aaString !== bbString) {
            this.actionError =
              'The current label is diiferent from the original existing label, please do submit first.';
            return false;
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
        this.actionError =
          'The current label is diiferent from the original existing label, please do submit first.';
        return false;
      }
    } else {
      this.actionError =
        'The current label is diiferent from the original existing label, please do submit first.';
      return;
    }
  }

  isBack() {
    if (this.annotationPrevious.length > 0) {
      this.silenceStatus = false;
      this.clrErrorTip = false;
      const isCategory = this.categoryFunc();
      if (isCategory.length > 0) {
        if (
          this.isMultipleLabel &&
          this.projectType !== 'ner' &&
          this.projectType !== 'image' &&
          this.projectType !== 'log'
        ) {
          this.isActionErr(isCategory, this.annotationPrevious[0].srId);
        } else if (
          this.projectType == 'ner' ||
          this.projectType == 'log' ||
          this.projectType == 'image'
        ) {
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
                  this.sortBy(
                    this.projectType === 'ner'
                      ? 'start'
                      : this.projectType === 'log'
                      ? 'line'
                      : 'sort',
                    'ascending',
                  ),
                );
                const bb = isCategory.sort(
                  this.sortBy(
                    this.projectType === 'ner'
                      ? 'start'
                      : this.projectType === 'log'
                      ? 'line'
                      : 'sort',
                    'ascending',
                  ),
                );
                for (let i = 0; i < aa.length; i++) {
                  let aaString;
                  let bbString;
                  if (this.projectType === 'ner') {
                    aaString = aa[i].text + aa[i].ids + aa[i].label;
                    bbString = bb[i].text + bb[i].ids + bb[i].label;
                  } else if (this.projectType === 'log') {
                    aaString = aa[i].line + aa[i].label + aa[i].freeText;
                    bbString = bb[i].line + bb[i].label + bb[i].freeText;
                  } else if (this.projectType === 'image') {
                    aaString = aa[i].valueInfo;
                    bbString = bb[i].valueInfo;
                  }
                  if (aaString !== bbString) {
                    this.actionError =
                      'The current label is diiferent from the original existing label, please do submit first.';
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
                this.actionError =
                  'The current label is diiferent from the original existing label, please do submit first.';
                return;
              }
            }
          }
          if (!flag) {
            this.isSkipOrBack('previous');
          }
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
      if (this.questionForm.get('questionGroup.reviewee').value) {
        param['user'] = this.questionForm.get('questionGroup.reviewee').value;
      }
    }
    const aa = this.avaService.toFlagTicket(param).subscribe(
      (response) => {
        this.sr = response;
        if (this.sr.MSG) {
          this.error = 'All cases have been completely annotated.';
          return;
        }
        if (
          this.projectType == 'text' ||
          this.projectType == 'tabular' ||
          this.projectType == 'regression'
        ) {
          this.sr = this.resetTabularSrData(this.sr);
        }
        if (this.projectType == 'ner') {
          this.sr = this.resetNerSrData(this.sr);
          this.toShowExistingLabel();
        }
        if (this.projectType == 'image') {
          this.sr = this.resetImageSrData(this.sr);
          setTimeout(() => {
            const option = {
              dom: 'label-studio',
              imageRectLabelTemplate: this.imageRectLabelTemplate,
              imagePolyLabelTemplate: this.imagePolyLabelTemplate,
              url: this.env.config.enableAWSS3
                ? this.sr.originalData.location
                : `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
                    this.sr.originalData.location
                  }&token=${
                    JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token
                      .access_token
                  }`,
              historyCompletions: this.historyTask,
              annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
              from: 'annotate',
            };

            this.toCallStudio(option);
          }, 0);
        }
        if (this.projectType == 'log') {
          this.sr = this.resetLogSrData(this.sr);
          this.currentLogFile =
            this.projectInfo.isShowFilename || this.startFrom === 'review'
              ? this.sr.fileInfo.fileName
              : '';
          this.setSelectedFile();
          this.toFilterLog(this.filterList);
          if (this.sr.userInputsLength > 0) {
            this.categoryBackFunc();
            this.sortLabelForColor(this.categories);
            this.getProgress();
          }
        }
        if (this.sr.flag && this.sr.flag.silence) {
          this.silenceStatus = true;
        }
        this.loading = false;
        if (this.projectType == 'log') {
          setTimeout(() => {
            this.el.nativeElement.querySelector(
              '.logCategories' + this.selectedEntityID,
            ).style.backgroundColor = this.colorsRainbow[this.selectedEntityID];
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
        console.log(error);
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
      this.clrErrorTip = false;
    } else {
      this.clrErrorTip = true;
    }
  }

  selectLabel(e, i) {
    this.actionError = null;
    const isChecked = e.target.checked;
    const checkedValue = e.target.value;
    if (isChecked) {
      e.target.parentElement.style.backgroundColor = '#fafafa';
      e.target.parentElement.style.borderColor = '#ccc';
      e.target.parentElement.style.borderBottomWidth = 'medium';
      e.target.nextElementSibling.style.fontWeight = 'bold';
      this.multipleLabelList.push(checkedValue);
    } else {
      e.target.parentElement.style.backgroundColor = '';
      e.target.parentElement.style.borderBottomWidth = '';
      e.target.parentElement.style.borderColor = '#eee';
      e.target.nextElementSibling.style.fontWeight = '';
      this.multipleLabelList.splice(
        this.multipleLabelList.findIndex((item) => item == checkedValue),
        1,
      );
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

  categoryFunc() {
    let category = [];
    if (
      this.isShowDropDown &&
      !this.isMultipleLabel &&
      !this.isNumeric &&
      this.projectType !== 'ner' &&
      this.projectType !== 'image'
    ) {
      if (this.questionForm.get('questionGroup.category').value) {
        category.push(this.questionForm.get('questionGroup.category').value);
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
      if (this.labelChoose) {
        category.push(this.labelChoose);
      }
      return category;
    } else if (
      !this.isNumeric &&
      this.isMultipleLabel &&
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
    }
  }

  getProblemCategory() {
    if (this.sr.userInputs.length > 0) {
      for (let i = 0; i < this.sr.userInputs.length; i++) {
        if (this.sr.userInputs[i].user == this.user.email) {
          return this.sr.userInputs[i].problemCategory;
        }
      }
    } else if (this.sr.userInputs.length == 0) {
      return;
    }
  }

  categoryBackFunc(index?, from?) {
    if (this.isShowDropDown && !this.isMultipleLabel && !this.isNumeric) {
      this.questionForm.get('questionGroup.category').setValue(this.getProblemCategory());
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
    } else if (this.isNumeric) {
      this.labelChoose = this.getProblemCategory();
    } else if (
      !this.isNumeric &&
      this.isMultipleLabel &&
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
            if (this.sr.userInputs[j].user === this.user.email) {
              originalLabel.push(this.sr.userInputs[j].problemCategory);
            }
          }
        } else if (this.sr.userInputs.length == 0) {
          originalLabel = [];
        }
        this.multipleLabelList = originalLabel;
      }
      this.multipleLabelList.forEach((e) => {
        const multiLabelClass = 'multiLabel' + this.categories.indexOf(e);
        this.el.nativeElement.querySelector('.' + multiLabelClass).children[0].checked = true;
        this.renderer2.setStyle(
          this.el.nativeElement.querySelector('.' + multiLabelClass),
          'background-color',
          '#fafafa',
        );
        this.renderer2.setStyle(
          this.el.nativeElement.querySelector('.' + multiLabelClass),
          'border-color',
          '#ccc',
        );
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
    } else if (
      !this.isShowDropDown &&
      !this.isNumeric &&
      this.isMultipleLabel &&
      this.projectType == 'ner'
    ) {
      this.spansList = [];
      const annotations = this.sr.userInputs;
      let annotatedIDs = [];
      setTimeout(() => {
        annotations.forEach((element) => {
          element.problemCategory.forEach((element2) => {
            annotatedIDs = element2.ids.split('-');
            this.onMouseDown(annotatedIDs[0], 'historyBack');
            this.onMouseUp(
              annotatedIDs[annotatedIDs.length - 1],
              'historyBack',
              this.categories.indexOf(element2.label),
            );
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
        }
      }, 10);
    }

    if (from == 'previous') {
      this.annotationPrevious.splice(index, 1);
    }
  }

  clearUserInput() {
    this.isShowDropDown
      ? this.questionForm.get('questionGroup.category').reset()
      : (this.labelChoose = null);
    this.active = -1;
    this.questionForm.get('questionGroup.freeText').reset();
    this.questionForm.get('questionGroup.answer').reset();
    this.multipleLabelList = [];
    this.spansList = [];
    if (this.projectType === 'log') {
      this.questionForm.get('questionGroup.filterText').reset();
    }
    this.regexErr = false;
  }

  clearCheckbox() {
    this.multipleLabelList.forEach((e) => {
      const multiLabelClass = 'multiLabel' + this.categories.indexOf(e);
      this.el.nativeElement.querySelector('.' + multiLabelClass).children[0].checked = false;
    });
  }

  onMouseDown(e, data) {
    this.spanStart = null;
    if (data == 'historyBack') {
      this.spanStart = this.sr.originalData.tokens[e];
    } else {
      this.spanStart = this.sr.originalData.tokens[e.target.id];
    }
  }

  onMouseUp(e, data, selectedEntityID0) {
    this.spanEnd = null;

    if (data == 'historyBack') {
      this.spanEnd = this.sr.originalData.tokens[e];
    } else {
      this.spanEnd = this.sr.originalData.tokens[e.target.id];
    }

    const IDs = this.sortStartEndID();

    if (IDs) {
      // to check whether has mark in the selected scope
      for (let j = 0; j < IDs.length; j++) {
        if (this.el.nativeElement.querySelector('.spanIndex' + IDs[j]) == null) {
          return;
        }
      }

      // to create mark and style
      const parentDom = this.el.nativeElement.querySelector('.nerBox');
      const markDom = this.renderer2.createElement('mark');
      this.renderer2.addClass(markDom, 'markSelected');
      this.renderer2.addClass(markDom, 'c-' + IDs.join('-'));
      this.renderer2.insertBefore(
        parentDom,
        markDom,
        this.el.nativeElement.querySelector('.spanIndex' + IDs[0]),
      );
      const part = { text: '', start: 0, end: 0, label: '', ids: '' };
      for (let i = 0; i < IDs.length; i++) {
        const spanDom = this.renderer2.createElement('span');
        this.renderer2.appendChild(
          spanDom,
          this.renderer2.createText(this.sr.originalData.tokens[IDs[i]].text),
        );
        this.renderer2.addClass(spanDom, 'nerSpan');
        this.renderer2.appendChild(markDom, spanDom);
        this.renderer2.removeChild(
          parentDom,
          this.el.nativeElement.querySelector('.spanIndex' + IDs[i]),
        );
        part.text = (part.text + ' ' + this.sr.originalData.tokens[IDs[i]].text).trim();
        part.start = this.sr.originalData.tokens[IDs[0]].start;
        part.end = this.sr.originalData.tokens[IDs[i]].end;
      }
      const entityDom = this.renderer2.createElement('span');
      this.renderer2.appendChild(
        entityDom,
        this.renderer2.createText(
          this.categories[data == 'historyBack' ? selectedEntityID0 : this.selectedEntityID],
        ),
      );
      this.renderer2.addClass(entityDom, 'entity');
      const clearDom = this.renderer2.createElement('span');
      this.renderer2.appendChild(clearDom, this.renderer2.createText('×'));
      this.renderer2.addClass(clearDom, 'clear');
      this.renderer2.appendChild(markDom, entityDom);
      this.renderer2.appendChild(markDom, clearDom);
      this.el.nativeElement
        .querySelector('.c-' + IDs.join('-'))
        .addEventListener('mouseenter', this.mouseenterMark.bind(this));
      this.el.nativeElement
        .querySelector('.c-' + IDs.join('-'))
        .addEventListener('mouseleave', this.mouseleaveMark.bind(this));
      this.el.nativeElement
        .querySelector('.c-' + IDs.join('-'))
        .addEventListener('click', this.clickMark.bind(this));
      part.label =
        this.categories[data == 'historyBack' ? selectedEntityID0 : this.selectedEntityID];
      part.ids = IDs.join('-');
      this.spansList.push(part);
      this.actionError = null;
      // console.log('spansList:::', this.spansList)
    }
  }

  mouseenterMark(e) {
    e.target.lastChild.style.backgroundColor = '#444';
    e.target.lastChild.style.color = '#fff';
  }

  mouseleaveMark(e) {
    e.target.lastChild.style.backgroundColor = 'transparent';
    e.target.lastChild.style.color = 'transparent';
  }

  clickMark(e) {
    let markClasses = [];
    let ids = [];

    if (
      e.target.parentNode.className.split(' ').indexOf('markSelected') > -1 ||
      e.target.className.split(' ').indexOf('markSelected') > -1
    ) {
      if (e.target.parentNode.className.split(' ').indexOf('markSelected') > -1) {
        markClasses = e.target.parentNode.className.split(' ');
      }
      if (e.target.className.split(' ').indexOf('markSelected') > -1) {
        markClasses = e.target.className.split(' ');
      }

      markClasses.forEach((element) => {
        if (element.startsWith('c-')) {
          ids = element.split('-').splice(1);
          const parentDom = this.el.nativeElement.querySelector('.nerBox');
          const targetMark = this.el.nativeElement.querySelector('.' + element);
          for (let i = 0; i < ids.length; i++) {
            const spanDom = this.renderer2.createElement('span');
            this.renderer2.appendChild(
              spanDom,
              this.renderer2.createText(this.sr.originalData.tokens[ids[i]].text),
            );
            this.renderer2.addClass(spanDom, 'nerSpan');
            this.renderer2.addClass(spanDom, 'spanIndex' + ids[i]);
            this.renderer2.setAttribute(spanDom, 'id', ids[i]);
            this.renderer2.insertBefore(parentDom, spanDom, targetMark);
            this.el.nativeElement
              .querySelector('.spanIndex' + ids[i])
              .addEventListener('mousedown', this.onMouseDown.bind(this));
            this.el.nativeElement
              .querySelector('.spanIndex' + ids[i])
              .addEventListener('mouseup', this.onMouseUp.bind(this));
          }
          this.renderer2.removeChild(parentDom, targetMark);
          // to update the spansList
          this.spansList.forEach((e, i) => {
            if (e.ids == element.slice(2)) {
              this.spansList.splice(i, 1);
            }
          });
          this.actionError = null;
        }
      });
    }
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
  }

  sortStartEndID() {
    let startID;
    let endID;
    const ids = [];
    if (this.spanEnd && this.spanStart) {
      if (this.spanEnd.id > this.spanStart.id) {
        startID = this.spanStart.id;
        endID = this.spanEnd.id;
        for (let i = startID; i < endID + 1; i++) {
          ids.push(i);
        }
        return ids;
      } else if (this.spanStart.id > this.spanEnd.id) {
        endID = this.spanStart.id;
        startID = this.spanEnd.id;
        for (let i = startID; i < endID + 1; i++) {
          ids.push(i);
        }
        return ids;
      } else if (this.spanStart.id == this.spanEnd.id) {
        startID = this.spanStart.id;
        return [startID];
      }
    } else {
      return null;
    }
  }

  getSrById(data, index, from) {
    this.avaService.getSrById(data).subscribe(
      (responseSr) => {
        if (responseSr) {
          this.loading = false;
          const flag = [];
          if (
            this.projectType != 'ner' &&
            this.projectType != 'image' &&
            this.projectType != 'log'
          ) {
            _.forIn(responseSr.originalData, function (value, key) {
              flag.push({ key, value });
              responseSr.originalData = flag;
            });
          }
          if (this.projectType == 'image') {
            this.historyTask = [
              {
                result:
                  from == 'previous'
                    ? this.annotationPrevious[index].images
                    : this.annotationHistory[index].images,
              },
            ];
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
              this.historyTask = [];
              this.currentBoundingData =
                from == 'previous'
                  ? this.annotationPrevious[index].images
                  : this.annotationHistory[index].images;

              if (from == 'previous') {
                this.annotationPrevious.splice(index, 1);
              } else if (from == 'history') {
                this.annotationPrevious = this.annotationHistory.slice(index + 1);
              }
            }, 0);
          }
          if (this.projectType == 'log') {
            responseSr.originalData = this.resetLogSrData([responseSr]).originalData;
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
          this.currentLogFile =
            this.projectInfo.isShowFilename || this.startFrom === 'review'
              ? responseSr.fileInfo.fileName
              : '';
          this.setSelectedFile();
          if (this.projectType !== 'image') {
            this.categoryBackFunc(index, from);
          }
          if (this.isNumeric) {
            setTimeout(() => {
              this.numericInput.nativeElement.focus();
            }, 500);
          }
        } else {
          console.log('failed to get data');
        }
      },
      (error) => {
        console.log(error);
        this.loading = false;
      },
    );
  }

  resetNerSrData(sr) {
    if (!sr.MSG) {
      if (
        sr[0].userInputs &&
        sr[0].userInputs.length > 0 &&
        sr[0].userInputs[0].problemCategory.length > 0
      ) {
        const aa = sr[0].userInputs[0].problemCategory;
        const bb = sr[0].originalData.tokens;
        for (let j = 0; j < aa.length; j++) {
          const ids = [];
          for (let i = 0; i < bb.length; i++) {
            if (aa[j].start == bb[i].start && ids.length == 0) {
              ids.push(bb[i].id);
            }
            if (aa[j].end == bb[i].end) {
              ids.push(bb[i].id);
              if (ids.length == 2) {
                if (ids[0] == ids[1]) {
                  aa[j].ids = String(ids[0]);
                } else {
                  const flag = [];
                  for (let k = ids[0]; k < ids[1] + 1; k++) {
                    flag.push(k);
                  }
                  aa[j].ids = flag.join('-');
                }
                break;
              }
            }
          }
        }
      }
      return sr[0];
    } else {
      return sr;
    }
  }

  resetTabularSrData(sr) {
    if (!sr.MSG) {
      const flag = [];
      sr = sr[0];
      _.forIn(sr.originalData, function (value, key) {
        flag.push({ key, value });
      });
      sr.originalData = flag;
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
      const flag = [];
      sr = sr[0];
      if (Object.prototype.toString.call(sr.originalData) !== '[object Array]') {
        let a = 0;
        _.forIn(sr.originalData, function (value, key) {
          flag.push({ index: a, line: key, text: value, freeText: '' });
          a++;
        });

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

  submitImage() {
    this.LabelStudioService.imageLabelInfo.submitCompletion();
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
    categories.forEach((element, index) => {
      if (index >= 30) {
        index = index - 30;
      }
      if (this.projectType == 'log') {
        this.logCategories.push({ label: element, color: this.colorsRainbow[index] });
      } else {
        this.imageRectLabelTemplate += `<Label value="${element}" background="${this.colorsRainbow[index]}" selectedColor="white"/>`;
        this.imagePolyLabelTemplate += `<Label value="${element}" background="${this.colorsRainbow[index]}" selectedColor="white"/>`;
      }
    });
  }

  @HostListener('click', ['$event.target'])
  public onClick() {
    if (
      this.LabelStudioService.imageLabelInfo &&
      this.LabelStudioService.imageLabelInfo.completionStore
    ) {
      this.currentBoundingData =
        this.LabelStudioService.imageLabelInfo.completionStore.selected.serializeCompletion();
      this.highlightedNode =
        this.LabelStudioService.imageLabelInfo.completionStore.selected.highlightedNode;
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

  onMouseUpTxt(data, row, from) {
    this.spanEnd = row;
    if (this.spanEnd == this.spanStart) {
      const pDom = this.el.nativeElement.querySelector('.txtRowContent' + this.spanEnd);
      const indexDom = this.el.nativeElement.querySelector('.logIndex' + this.spanEnd);
      this.getElementService.toFindDomAddClass(pDom, 'selectedTxtRow');
      // to give label's color to text
      if (pDom) {
        pDom.style.backgroundColor = this.toolService.hexToRgb(
          this.colorsRainbow[
            from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID
          ],
        );
      }
      // update the this.spansList
      if (_.indexOf(this.toGetLogLines(this.spansList), data.line) < 0) {
        this.spansList.push({
          line: data.line,
          label: from == 'historyBack' ? data.label : this.categories[this.selectedEntityID],
          freeText:
            from == 'historyBack'
              ? data.freeText
              : this.questionForm.get('questionGroup.freeText').value,
          index: this.spanEnd,
          selected: false,
        });
      }

      const txtRowEntityDom = this.el.nativeElement.querySelector('.txtRowEntity' + this.spanEnd);
      // to give label's color to entity
      if (txtRowEntityDom) {
        txtRowEntityDom.style.backgroundColor =
          this.colorsRainbow[
            from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID
          ];
      }
      this.getElementService.toFindDomAddText(
        txtRowEntityDom,
        from == 'historyBack' ? data.label : this.categories[this.selectedEntityID],
        'txtEntityLabel',
      );
      this.spansList = this.getElementService.toCreateClear(
        txtRowEntityDom,
        pDom,
        'clear-' + this.spanEnd,
        'clearTxt',
        this.spansList,
        indexDom,
        this.el.nativeElement.querySelector('.customBadge' + this.spanEnd),
      );
      this.getElementService.toListenMouseIn(
        pDom,
        this.el.nativeElement.querySelector('.clear-' + this.spanEnd),
      );
      this.getElementService.toListenMouseOut(
        pDom,
        this.el.nativeElement.querySelector('.clear-' + this.spanEnd),
      );
      this.spansList = this.getElementService.toClearSelected(
        txtRowEntityDom,
        pDom,
        this.el.nativeElement.querySelector('.clear-' + this.spanEnd),
        this.spansList,
        indexDom,
        this.el.nativeElement.querySelector('.customBadge' + this.spanEnd),
      );
    } else if (this.spanEnd > this.spanStart) {
      for (let a = this.spanStart; a < this.spanEnd + 1; a++) {
        const pDom = this.el.nativeElement.querySelector('.txtRowContent' + a);
        const txtRowEntityDom = this.el.nativeElement.querySelector('.txtRowEntity' + a);
        const indexDom = this.el.nativeElement.querySelector('.logIndex' + a);
        this.getElementService.toFindDomAddClass(pDom, 'selectedTxtRow');
        if (pDom) {
          pDom.style.backgroundColor = this.toolService.hexToRgb(
            this.colorsRainbow[
              from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID
            ],
          );
          if (
            _.indexOf(this.toGetLogLines(this.spansList), pDom.classList[0].split('-').pop()) < 0
          ) {
            this.spansList.push({
              line: pDom.classList[0].split('-').pop(),
              label: this.categories[this.selectedEntityID],
              freeText: this.questionForm.get('questionGroup.freeText').value,
              index: a,
              selected: false,
            });
          } else {
            for (let i = 0; i < this.spansList.length; i++) {
              if (this.spansList[i].line == pDom.classList[0].split('-').pop()) {
                this.spansList[i].label = this.categories[this.selectedEntityID];
                this.spansList[i].freeText = this.questionForm.get('questionGroup.freeText').value;
                this.spansList[i].index = a;
                this.spansList[i].selected = false;
                break;
              }
            }
          }
        }

        if (txtRowEntityDom) {
          txtRowEntityDom.style.backgroundColor =
            this.colorsRainbow[
              from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID
            ];
        }
        this.getElementService.toFindDomAddText(
          txtRowEntityDom,
          this.categories[this.selectedEntityID],
          'txtEntityLabel',
        );
        this.getElementService.toCreateClear(
          txtRowEntityDom,
          pDom,
          'clear-' + a,
          'clearTxt',
          this.spansList,
          indexDom,
          this.el.nativeElement.querySelector('.customBadge' + a),
        );
        this.getElementService.toListenMouseIn(
          pDom,
          this.el.nativeElement.querySelector('.clear-' + a),
        );
        this.getElementService.toListenMouseOut(
          pDom,
          this.el.nativeElement.querySelector('.clear-' + a),
        );

        this.getElementService.toClearSelected(
          txtRowEntityDom,
          pDom,
          this.el.nativeElement.querySelector('.clear-' + a),
          this.spansList,
          indexDom,
          this.el.nativeElement.querySelector('.customBadge' + a),
        );
      }
    } else {
      for (let a = this.spanEnd; a < this.spanStart + 1; a++) {
        const pDom = this.el.nativeElement.querySelector('.txtRowContent' + a);
        const indexDom = this.el.nativeElement.querySelector('.logIndex' + a);
        this.getElementService.toFindDomAddClass(pDom, 'selectedTxtRow');
        if (pDom) {
          pDom.style.backgroundColor = this.toolService.hexToRgb(
            this.colorsRainbow[
              from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID
            ],
          );
          if (
            _.indexOf(this.toGetLogLines(this.spansList), pDom.classList[0].split('-').pop()) < 0
          ) {
            this.spansList.push({
              line: pDom.classList[0].split('-').pop(),
              label: this.categories[this.selectedEntityID],
              freeText: this.questionForm.get('questionGroup.freeText').value,
              index: a,
              selected: false,
            });
          } else {
            for (let i = 0; i < this.spansList.length; i++) {
              if (this.spansList[i].line == pDom.classList[0].split('-').pop()) {
                this.spansList[i].label = this.categories[this.selectedEntityID];
                this.spansList[i].freeText = this.questionForm.get('questionGroup.freeText').value;
                this.spansList[i].index = a;
                this.spansList[i].selected = false;
                break;
              }
            }
          }
        }

        const txtRowEntityDom = this.el.nativeElement.querySelector('.txtRowEntity' + a);
        if (txtRowEntityDom) {
          txtRowEntityDom.style.backgroundColor =
            this.colorsRainbow[
              from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID
            ];
        }
        this.getElementService.toFindDomAddText(
          txtRowEntityDom,
          this.categories[this.selectedEntityID],
          'txtEntityLabel',
        );
        this.getElementService.toCreateClear(
          txtRowEntityDom,
          pDom,
          'clear-' + a,
          'clearTxt',
          this.spansList,
          indexDom,
          this.el.nativeElement.querySelector('.customBadge' + a),
        );
        this.getElementService.toListenMouseIn(
          pDom,
          this.el.nativeElement.querySelector('.clear-' + a),
        );
        this.getElementService.toListenMouseOut(
          pDom,
          this.el.nativeElement.querySelector('.clear-' + a),
        );
        this.getElementService.toClearSelected(
          txtRowEntityDom,
          pDom,
          this.el.nativeElement.querySelector('.clear-' + a),
          this.spansList,
          indexDom,
          this.el.nativeElement.querySelector('.customBadge' + a),
        );
      }
    }
    // console.log('this.spansList:::', this.spansList)
    this.actionError = null;
    this.toCheckSpanslist(this.spansList);
  }

  toGetLogLines(spansList) {
    const x = [];
    spansList.forEach((e) => {
      x.push(e.line);
    });
    return x;
  }

  clickIndex(e, data, index) {
    // to clean all the selected rowIndex first
    if (this.spansList.length > 0) {
      this.spansList.forEach((e) => {
        if (e.index != data.index) {
          if (e.selected) {
            e.selected = false;
            const dom = this.el.nativeElement.querySelector('.logIndex' + e.index);
            this.renderer2.removeClass(dom, 'selectedRowIndex');
            this.renderer2.addClass(dom, 'rowIndex');
          }
        }
      });
    }

    if (
      e.target.nextElementSibling &&
      e.target.nextElementSibling.className &&
      e.target.nextElementSibling.className.indexOf('txtEntityLabel') > 0
    ) {
      // to show the original freetext enable edit
      for (let i = 0; i < this.spansList.length; i++) {
        if (this.spansList[i].line == data.line) {
          this.questionForm.get('questionGroup.freeText').setValue(this.spansList[i].freeText);
          const classList = e.target.className.split(' ');
          if (classList.indexOf('selectedRowIndex') > -1) {
            classList.splice(classList.indexOf('selectedRowIndex'), 1, 'rowIndex');
            e.target.className = classList.join(' ');
            this.spansList[i].selected = false;
          } else {
            classList.splice(classList.indexOf('rowIndex'), 1, 'selectedRowIndex');
            e.target.className = classList.join(' ');
            this.spansList[i].selected = true;
          }
          this.toCheckSpanslist(this.spansList);
          break;
        }
      }
    } else {
      this.questionForm.get('questionGroup.freeText').reset();
    }
  }

  updateFreeText(e) {
    if (this.spansList.length > 0) {
      for (let i = 0; i < this.spansList.length; i++) {
        if (this.spansList[i].selected) {
          this.spansList[i].freeText = e;
          this.toCheckSpanslist(this.spansList);
          break;
        }
      }
    }
  }

  toCheckSpanslist(list) {
    list.forEach((element) => {
      const dom = this.el.nativeElement.querySelector('.customBadge' + element.index);
      if (dom) {
        if (element.freeText) {
          dom.style.backgroundColor = '#cccccc';
        } else {
          dom.style.backgroundColor = '';
        }
      }
    });
  }

  toFilterLog(e) {
    const filterRowsIndex = [];
    this.sr.originalData.forEach((element) => {
      element.filter = true;
    });
    if (e.length > 0) {
      this.sr.originalData.forEach((element, index) => {
        let arr = [];
        e.forEach((filter) => {
          if (filter.filterType == 'keyword') {
            const a = [...element.text.matchAll(RegExp(filter.filterText, 'gi'))];
            if (a.length > 0) {
              arr = [...arr, ...a];
            }
          } else {
            const a = this.toolService.regexExec(filter.filterText, element.text);
            if (a.length > 0) {
              arr = [...arr, ...a];
            }
          }
          if (arr.length > 0) {
            element.filter = true;
            this.getElementService.setFilterHighLight(
              'txtRowContent' + element.index,
              element.text,
              arr,
            );
            filterRowsIndex.push(element.index);
          } else {
            element.filter = false;
          }
        });
      });
    }
    setTimeout(() => {
      if (this.spansList.length > 0) {
        this.spansList.forEach((data) => {
          if (
            e.length == 0 ||
            (filterRowsIndex.length > 0 && filterRowsIndex.indexOf(data.index) > -1)
          ) {
            this.onMouseDownTxt(
              { line: data.line, label: data.label, freeText: data.freeText },
              data.index,
            );
            this.onMouseUpTxt(
              { line: data.line, label: data.label, freeText: data.freeText },
              data.index,
              'historyBack',
            );
          }
        });
      }
    }, 10);
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
          console.log('regErr:', err);
          this.regexErr = true;
          return;
        }
      } else {
        this.regexErr = false;
      }
      this.filterList.push({ filterType: this.filterType, filterText: e.value });
      this.questionForm.get('questionGroup.filterText').reset();
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
          console.log('regErr:', err);
          this.regexErr = true;
          return;
        }
      } else {
        this.regexErr = false;
      }
      this.filterList.push({ filterType: this.filterType, filterText: e.target.value });
      this.questionForm.get('questionGroup.filterText').reset();
      this.toFilterLog(this.filterList);
    }
  }

  toStorageFilter() {
    if (this.filterList.length > 0) {
      if (localStorage.getItem('log-filter')) {
        const logFilter = JSON.parse(localStorage.getItem('log-filter'));
        const pIds = [];
        logFilter.forEach((element) => {
          pIds.push(element.pId);
        });
        if (pIds.indexOf(this.projectId) > -1) {
          logFilter[pIds.indexOf(this.projectId)].filter = this.filterList;
          localStorage.setItem('log-filter', JSON.stringify(logFilter));
        } else {
          logFilter.push({
            pId: this.projectId,
            filter: this.filterList,
          });
          localStorage.setItem('log-filter', JSON.stringify(logFilter));
        }
      } else {
        const obj = {
          pId: this.projectId,
          filter: this.filterList,
        };
        localStorage.setItem('log-filter', JSON.stringify([obj]));
      }
    } else {
      if (localStorage.getItem('log-filter')) {
        const logFilter = JSON.parse(localStorage.getItem('log-filter'));
        for (let i = 0; i < logFilter.length; i++) {
          if (this.projectId == logFilter[i].pId) {
            logFilter.splice(i, 1);
            if (logFilter.length > 0) {
              localStorage.setItem('log-filter', JSON.stringify(logFilter));
              break;
            } else {
              localStorage.removeItem('log-filter');
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
  }

  toShowExistingLabel() {
    if (this.sr.userInputs) {
      const annotations = this.sr.userInputs;
      let annotatedIDs = [];
      let errLabel = [];
      setTimeout(() => {
        annotations.forEach((element) => {
          element.problemCategory.forEach((element2) => {
            console.log(3, element2);
            if (element2.ids) {
              annotatedIDs = element2.ids.split('-');
              this.onMouseDown(annotatedIDs[0], 'historyBack');
              this.onMouseUp(
                annotatedIDs[annotatedIDs.length - 1],
                'historyBack',
                this.categories.indexOf(element2.label),
              );
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

  onSelectingReviewee(e) {
    this.getOneReview('order');
  }

  changeReviewOrder(e) {
    this.reviewOrder = e.target.value;
    this.getOneReview('order');
  }

  getAllLogFilename() {
    this.avaService.getAllLogFilename(this.projectId).subscribe(
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
          console.log(response);
        }
      },
      (error) => {
        console.log(error);
      },
    );
  }

  getTargetFile(file) {
    if (file && file.fileName && file.fileName !== this.currentLogFile) {
      const param = {
        pid: this.projectId,
        fname: file.fileName,
      };
      this.loading = true;
      this.avaService.getSrByFilename(param).subscribe(
        (response) => {
          if (response) {
            if (response && response.MSG) {
              this.error = this.sr.MSG;
              return;
            }
            this.sr = this.resetLogSrData(response);
            this.currentLogFile = this.sr.fileInfo.fileName;
            this.toFilterLog(this.filterList);
            if (this.sr.userInputsLength > 0) {
              this.categoryBackFunc();
              this.sortLabelForColor(this.categories);
              this.getProgress();
            }

            if (this.sr.flag && this.sr.flag.silence) {
              this.silenceStatus = true;
            }
            this.loading = false;
            this.isSkippingGameDialog = false;
            this.clearUserInput();
          } else {
            console.log(response);
          }
        },
        (error) => {
          console.log(error);
        },
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

  outOfPage() {
    this.error = null;
    this.router.navigate(['game'], {
      queryParams: { outfrom: this.startFrom == 'review' ? 'review' : 'annotate', hash: 'max' },
    });
  }

  ngOnDestroy() {
    this.toStorageFilter();
  }
}
