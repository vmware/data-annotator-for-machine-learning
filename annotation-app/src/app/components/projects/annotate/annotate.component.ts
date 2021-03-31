/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ElementRef, Renderer2, ViewChild, HostListener } from '@angular/core';
import { AvaService } from '../../../services/ava.service';
import { Observable } from 'rxjs';
import 'rxjs/Rx'
import { SR, SrUserInput } from '../../../model/sr';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from "lodash";
import { LabelStudioService } from 'app/services/label-studio.service';
import { GetElementService } from 'app/services/common/dom.service';
import { ToolService } from 'app/services/common/tool.service';

@Component({
  selector: 'app-annotate',
  templateUrl: './annotate.component.html',
  styleUrls: ['./annotate.component.scss']
})


export class AnnotateComponent implements OnInit {


  @ViewChild('numericInput', { static: false }) numericInput;

  questionForm: FormGroup;
  sr: SR;
  categories: string[];
  loading: boolean;
  error: string;
  maxAnnotationError: string;
  isSubmittingDialog: boolean;
  isEndingGameDialog: boolean;
  isSkippingGameDialog: boolean;
  isOptOutDialog: boolean;
  pointsEarnedOnSubmission: number;
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
  selectedEntityID: number = 0;
  spansList = [];
  onLabelStudioLoadInfo: any;
  imagePolyLabelTemplate: any;
  imageRectLabelTemplate: any;
  rectLabelDom: Element;
  polygonLabelDom: Element;
  rectSelected: boolean = true;
  currentBoundingData: any = [];
  highlightedNode: any;
  projectType: string;
  historyTask: any = [];
  antTags: any;
  logCategories: any = [];
  filterList: any = [];
  filterType: string = 'keyword';
  regexErr: boolean = false;
  isDrawer: boolean = false;
  colorsRainbow = [
    "#00ffff",
    "#ff00ff",
    "#00ff7f",
    "#ff6347",
    "#9B0D54",
    "#00bfff",
    "#ffa500",
    "#ff69b4",
    "#7fffd4",
    "#ffd700",
    "#FBC1DA",
    "#4D007A",
    "#ffdab9",
    "#adff2f",
    "#d2b48c",
    "#dcdcdc",
    "#583fcf",
    "#A32100",
    "#0F1E82",
    "#F89997",
    "#003D79",
    "#00D4B8",
    "#6C5F59",
    "#AADB1E",
    "#36C9E1",
    "#D0ACE4",
    "#798893",
    "#ED186F",
    "#9DA3DB",
    "#ffff00"
  ];

  constructor(
    private renderer2: Renderer2,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private avaService: AvaService,
    private el: ElementRef,
    private LabelStudioService: LabelStudioService,
    private getElementService: GetElementService,
    private toolService: ToolService

  ) { }



  ngOnInit(): void {
    this.loading = true;
    this.error = null;
    this.maxAnnotationError = null;
    this.isSubmittingDialog = false;
    this.isEndingGameDialog = false;
    this.isSkippingGameDialog = false;
    this.isOptOutDialog = false;
    this.silenceStatus = false;

    this.isNumeric = false;
    this.clrErrorTip = false;
    this.pointsEarnedOnSubmission = 0;
    this.active = -1;
    this.labelChoose = null;
    this.idName = '';
    this.route.queryParams.subscribe(data => {
      this.selectParam = data.name;
      this.projectId = data.id;
      this.projectType = data.projectType;
      this.avaService.getProjectInfo(this.projectId).subscribe(response => {
        response.taskInstructions = response.taskInstructions.replace(/(\r\n|\n|\r)/gm, "<br/>");
        this.projectInfo = response;
        this.max = response.maxAnnotation;
        this.isMultipleLabel = response.isMultipleLabel;
        this.fetchData();

      }, error => {
        console.log(error);
      });
    });
    this.createForm();
    this.getProjectsList();
    this.getProgress();

  };


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
    };
    this.questionForm = this.formBuilder.group({});
    this.questionForm.addControl('questionGroup',
      this.formBuilder.group({
        category: this.sr.problemCategory,
        freeText: [null],
        answer: [null],
        selectProject: [this.selectParam],
        filterText: [null],
      })
    );
  }

  fetchData(): void {
    this.silenceStatus = false;

    let paramSr = {
      id: this.projectId,
    }
    this.loading = true;
    Observable.forkJoin(
      this.avaService.getRandomSr(paramSr),
      this.avaService.getProblemCategories(this.projectId)
    ).subscribe(
      response => {
        let index = 0;
        this.sr = response[index++] as SR;
        let categoryResponse = response[index++];

        if (this.sr.MSG) {
          this.error = "All cases have been completely annotated.";
          return;
        };
        if (this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'regression') {
          this.sr = this.resetTabularSrData(this.sr);
        };
        if (this.projectType == 'ner') {
          this.sr = this.resetNerSrData(this.sr);
          this.toShowExistingLabel();
        };
        if (this.projectType == 'image') {
          // console.log("fetchData.this.sr:::", this.sr);
          this.sr = this.resetImageSrData(this.sr);
          setTimeout(() => {
            this.sortLabelForColor(this.categories);
            let option = {
              dom: 'label-studio',
              imageRectLabelTemplate: this.imageRectLabelTemplate,
              imagePolyLabelTemplate: this.imagePolyLabelTemplate,
              url: this.sr.originalData.location,
              historyCompletions: this.historyTask,
              annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
              from: 'annotate'
            }
            this.toCallStudio(option);
          }, 0);
        };
        if (this.projectType == 'log') {
          this.sr = this.resetLogSrData(this.sr)
        };
        if (this.sr.flag && this.sr.flag.silence) {
          this.silenceStatus = true;
        };
        if (categoryResponse.labelType == 'numericLabel') {
          this.isNumeric = true;
          this.numericMessage = 'Allowed values are between ' + categoryResponse.min + ' and ' + categoryResponse.max + ' .';
          this.minLabel = categoryResponse.min;
          this.maxLabel = categoryResponse.max;
          setTimeout(() => {
            this.numericInput.nativeElement.focus();
          }, 500);
        } else {

          this.categories = categoryResponse.lables;
          if (this.projectType == 'log') {
            this.sortLabelForColor(this.categories)
          }
          this.isShowDropDown = false;
          if (this.categories.length > 6 && this.projectType != 'ner' && this.projectType != 'image' && this.projectType != 'log') {
            this.isShowDropDown = true;
          };
        }
      }, error => {
        this.error = "All cases have been completely annotated.";
        console.log('Unable to fetch SR data from ava server: ', JSON.stringify(error, null, 2));
        this.loading = false;
      }, () => {
        this.loading = false;
        if (this.projectType == 'log') {
          setTimeout(() => {
            this.el.nativeElement.querySelector('.logCategories' + this.selectedEntityID).style.backgroundColor = this.colorsRainbow[this.selectedEntityID];
            // to read the filterList from localStorage
            if (localStorage.getItem('log-filter')) {
              let logFilter = JSON.parse(localStorage.getItem('log-filter'));
              for (let i = 0; i < logFilter.length; i++) {
                if (this.projectId == logFilter[i].pId) {
                  this.filterList = logFilter[i].filter;
                  this.toFilterLog(this.filterList);
                  break;
                }
              }
            };
          }, 5);
        }
      }
    );
  }

  onSelectingCategory(label, index) {
    this.active = index;
    this.labelChoose = label;
  }


  onSelectingDropDown(e) {
    this.onSubmit();
  }


  dropDownSubmit() {
    this.questionForm.get('questionGroup.category').reset();
  }


  onSubmit(): void {

    this.clearCheckbox();
    this.silenceStatus = false;
    this.error = null;
    this.maxAnnotationError = null;
    let category = [];
    category = this.categoryFunc()
    // let freeText = this.questionForm.get('questionGroup.freeText').value;
    // let answer = this.questionForm.get('questionGroup.answer').value;
    // this.pointsEarnedOnSubmission = this.calculatePointsEarned(category, freeText, answer);
    let srUserInput: SrUserInput = {
      pid: this.projectId,
      userInput: [{
        problemCategory: category,
        tid: this.sr._id,
      }],
    };

    if (this.projectType == 'image') {
      srUserInput.userInput[0].problemCategory = this.currentBoundingData;
      this.sr.images = this.currentBoundingData;
    };

    this.loading = true;
    this.avaService.putSrUserInput(srUserInput).subscribe(response => {

      if (response && response.MSG) {
        this.getOne();
        this.maxAnnotationError = "Annotate invalid because the previous ticket has already meet the maxAnnotation.";
        setTimeout(() => {
          this.maxAnnotationError = null;
        }, 10000);
      } else {
        this.maxAnnotationError = null;
        this.getOne();
      }
    }, error => {
      console.log(error)
      this.getOne();

    });
  }


  getOne() {
    let paramSr = {
      id: this.projectId,
    }
    this.avaService.getRandomSr(paramSr).subscribe(newSr => {
      this.getProgress();
      if (newSr && newSr.MSG) {
        this.error = "All cases have been completely annotated.";
        return;
      }
      //add to the history
      if (this.maxAnnotationError == null) {
        let OldSr = JSON.parse(JSON.stringify(this.sr));
        let addSubmit = {
          srId: OldSr._id,
          type: 'submit',
          category: this.categoryFunc(),
          rewrite: '',
          solution: '',
          activeClass: this.active,
          images: OldSr.images
        };
        if (this.projectType == 'ner' || this.projectType == 'image') {
          addSubmit['historyDescription'] = [OldSr.originalData]
        } else if (this.projectType == 'log') {
          addSubmit.category.forEach(element => {
            for (let i = 0; i < OldSr.originalData.length; i++) {
              if (element.line == OldSr.originalData[i].line) {
                element.text = OldSr.originalData[i].text;
                break;
              }
            }
          });
          addSubmit['historyDescription'] = addSubmit.category;
        } else {
          addSubmit['historyDescription'] = OldSr.originalData.slice(0, 10);
        }
        this.annotationHistory.unshift(addSubmit);
        // console.log("getOne.annotationHistory:::", this.annotationHistory);
      }
      this.sr = newSr;
      this.currentBoundingData = [];
      if (this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'regression') {
        this.sr = this.resetTabularSrData(this.sr);
      };
      if (this.projectType == 'ner') {
        this.sr = this.resetNerSrData(this.sr);
        this.toShowExistingLabel();
      };
      if (this.projectType == 'image') {
        this.sr = this.resetImageSrData(this.sr);
        // console.log("getOne.this.sr:::", this.sr)
        setTimeout(() => {
          let option = {
            dom: 'label-studio',
            imageRectLabelTemplate: this.imageRectLabelTemplate,
            imagePolyLabelTemplate: this.imagePolyLabelTemplate,
            url: this.sr.originalData.location,
            historyCompletions: this.historyTask,
            annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
            from: 'annotate'

          }
          this.toCallStudio(option);
        }, 0);
      };
      if (this.projectType == 'log') {
        this.sr = this.resetLogSrData(this.sr);
        this.toFilterLog(this.filterList);
      }
      if (this.sr.flag && this.sr.flag.silence) {
        this.silenceStatus = true;
      };
      if (this.isNumeric) {
        setTimeout(() => {
          this.numericInput.nativeElement.focus();
        }, 300);
      };
      this.showSubmitDialog();
      this.clearUserInput();

    }, error => {
      this.error = JSON.stringify(error, null, 2);
      this.loading = false;
      this.showSubmitDialog();
    }, () => {
      this.loading = false;
      if (this.projectType == 'log') {
        setTimeout(() => {
          this.el.nativeElement.querySelector('.logCategories' + this.selectedEntityID).style.backgroundColor = this.colorsRainbow[this.selectedEntityID];
        }, 5);
      }
      this.showSubmitDialog();
    });
  }


  showSubmitDialog(): void {
    this.isSubmittingDialog = true;
    Observable.interval(3500).take(1).subscribe(time => {
      this.isSubmittingDialog = false;
    });
  }

  onEndGame(): void {
    if (this.isFormPrestine()) {
      this.router.navigate(['/game']);
    } else {
      this.isEndingGameDialog = true;
    }
  }

  onSkipGame(): void {
    if (this.isFormPrestine()) {
      this.clearCheckbox();
      this.labelChoose = null;
      this.active = -1;
      this.skipAndFetchNewQuestion();
    } else {
      this.isSkippingGameDialog = true;
    }
  }

  skipAndFetchNewQuestion(): void {
    this.clearCheckbox();
    this.silenceStatus = false;
    this.clrErrorTip = false;
    this.loading = true;
    let paramSr = {
      pid: this.projectId,
      tid: this.sr._id,
    }
    this.avaService.skipToNext(paramSr).subscribe(responseSr => {
      //skip to the history
      let OldSr = JSON.parse(JSON.stringify(this.sr));
      let addSkip = {
        srId: OldSr._id,
        historyDescription: (this.projectType == 'ner' || this.projectType == 'image') ? [OldSr.originalData] : OldSr.originalData.slice(0, 10),
        type: 'skip',
        category: [],
        rewrite: '',
        solution: '',
        activeClass: -1,
        images: []
      };
      this.annotationHistory.unshift(addSkip);
      this.sr = responseSr;
      this.currentBoundingData = [];
      if (this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'regression') {
        this.sr = this.resetTabularSrData(this.sr);
      };
      if (this.projectType == 'ner') {
        this.sr = this.resetNerSrData(this.sr);
        this.toShowExistingLabel();
      };
      if (this.projectType == 'image') {
        this.sr = this.resetImageSrData(this.sr);
        setTimeout(() => {
          let option = {
            dom: 'label-studio',
            imageRectLabelTemplate: this.imageRectLabelTemplate,
            imagePolyLabelTemplate: this.imagePolyLabelTemplate,
            url: this.sr.originalData.location,
            historyCompletions: this.historyTask,
            annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
            from: 'annotate'

          }
          this.toCallStudio(option);
        }, 0);
      };
      if (this.projectType == 'log') {
        this.sr = this.resetLogSrData(this.sr);
        this.toFilterLog(this.filterList);

      };
      if (this.sr.flag && this.sr.flag.silence) {
        this.silenceStatus = true;
      };
      this.loading = false;
      this.isSkippingGameDialog = false;
      if (this.isNumeric) {
        setTimeout(() => {
          this.numericInput.nativeElement.focus();
        }, 300);
      };
      this.clearUserInput();

    }, error => {
      this.error = JSON.stringify(error, null, 2);
      this.loading = false;
      this.isSkippingGameDialog = false;
    }, () => {
      this.loading = false;
      if (this.projectType == 'log') {
        setTimeout(() => {
          this.el.nativeElement.querySelector('.logCategories' + this.selectedEntityID).style.backgroundColor = this.colorsRainbow[this.selectedEntityID];
        }, 5);
      }
      this.isSkippingGameDialog = false;
    });
  }


  isFormPrestine(): boolean {
    let category = this.categoryFunc();
    if (this.isNumeric) {
      setTimeout(() => {
        this.numericInput.nativeElement.focus();
      }, 300);
    };
    let freeText = this.questionForm.get('questionGroup.freeText').value;
    let answer = this.questionForm.get('questionGroup.answer').value;
    return !(category.length > 0 || freeText || answer);
  }


  calculatePointsEarned(category, freeText, answer): number {
    let questionPoints = 0;
    questionPoints = (category.length > 0) ? questionPoints + 1 : questionPoints;
    questionPoints = (freeText) ? questionPoints + 5 : questionPoints;
    questionPoints = (answer) ? questionPoints + 10 : questionPoints;
    return questionPoints;
  }


  getProjectsList() {
    this.avaService.getProjectsList().subscribe(response => {
      this.projects = response;
    }, error => {
      console.log(error)
    });

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
        this.avaService.getProjectInfo(this.projectId).subscribe(response => {
          this.projectInfo = response;
          this.max = response.maxAnnotation;
          this.isMultipleLabel = response.isMultipleLabel;
          this.projectType = response.projectType;
        }, error => {
          console.log(error);
          this.loading = false;
        });
      }
    }
    this.fetchData();
    this.getProgress();
    this.annotationHistory = [];
    this.idName = '';
    this.clearUserInput();
    this.filterList = [];
    this.selectedEntityID = 0;

  }


  getProgress() {
    let param = {
      id: this.projectId,
    }
    this.avaService.getProgress(param).subscribe(response => {
      this.progressInfo = response;
      this.percentage = Math.round(this.progressInfo.completeCase / this.progressInfo.totalCase * 10000) / 100
    }, error => {
      console.log(error)
    });
  }


  historyBack(index, id) {

    this.silenceStatus = false;
    let isCategory = this.categoryFunc();

    if (isCategory.length > 0) {
      this.isSkippingGameDialog = true;
    } else {
      this.clearCheckbox();
      let param = {
        id: id,
        pid: this.projectId
      };
      this.getSrById(param, index);
    }
  }

  isBack() {
    if (this.annotationHistory.length > 0) {
      this.clearCheckbox();
      this.silenceStatus = false;
      this.clrErrorTip = false;
      let isCategory = this.categoryFunc();
      if (isCategory.length > 0) {
        this.isSkippingGameDialog = true;
      } else {
        let param = {
          id: this.annotationHistory[0].srId,
          pid: this.projectId
        }
        this.getSrById(param, 0);
      }
    } else {
      console.log('no history')
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
        }
      }
    };
    let param = {
      tid: this.sr._id,
      pid: this.projectId
    };
    let aa = this.avaService.toFlagTicket(param).subscribe(response => {
      this.sr = response;
      if (this.sr.MSG) {
        this.error = "All cases have been completely annotated.";
        return;
      };
      if (this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'regression') {
        this.sr = this.resetTabularSrData(this.sr);
      };
      if (this.projectType == 'ner') {
        this.sr = this.resetNerSrData(this.sr);
        this.toShowExistingLabel();
      };
      if (this.projectType == 'image') {
        this.sr = this.resetImageSrData(this.sr);
        setTimeout(() => {
          let option = {
            dom: 'label-studio',
            imageRectLabelTemplate: this.imageRectLabelTemplate,
            imagePolyLabelTemplate: this.imagePolyLabelTemplate,
            url: this.sr.originalData.location,
            historyCompletions: this.historyTask,
            annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
            from: 'annotate'

          }

          this.toCallStudio(option);
        }, 0);
      };
      if (this.projectType == 'log') {
        this.sr = this.resetLogSrData(this.sr);
        this.toFilterLog(this.filterList);

      };
      if (this.sr.flag && this.sr.flag.silence) {
        this.silenceStatus = true;
      };
      this.loading = false;
      if (this.projectType == 'log') {
        setTimeout(() => {
          this.el.nativeElement.querySelector('.logCategories' + this.selectedEntityID).style.backgroundColor = this.colorsRainbow[this.selectedEntityID];
        }, 5);
      }
      if (this.isNumeric) {
        setTimeout(() => {
          this.numericInput.nativeElement.focus();
        }, 300);
      };
    }, error => {
      this.loading = false;
      console.log(error)
    },
      () => {
        aa.unsubscribe();
      });
  };


  enterNumeric(e) {
    if (e.target.value == "" || this.clrErrorTip == true) {
      e.preventDefault();
      this.clrErrorTip = true;
    } else {
      this.labelChoose = e.target.value;
      this.clrErrorTip = false;
    }
  };


  enterNumericUp(e) {
    if (this.validNumeric(e.target.value)) {
      this.clrErrorTip = false;
    } else {
      this.clrErrorTip = true;
    };
  };


  selectLabel(e, i) {
    let isChecked = e.target.checked;
    let checkedValue = e.target.value;
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
      this.multipleLabelList.splice(this.multipleLabelList.findIndex(item => item == checkedValue), 1)
    }
  }


  validNumeric(data) {
    let isNum = /^(\-|\+)?\d+(\.\d+)?$/.test(data);
    let isNumScope = (data >= this.minLabel) && (data <= this.maxLabel);
    if (isNum && isNumScope) {
      return true;
    } else {
      return false;
    }
  }


  categoryFunc() {
    let category = [];
    if (this.isShowDropDown && !this.isMultipleLabel && !this.isNumeric && this.projectType !== 'ner' && this.projectType !== 'image') {
      if (this.questionForm.get('questionGroup.category').value) {
        category.push(this.questionForm.get('questionGroup.category').value);
      }
      return category;
    } else if ((!this.isShowDropDown && !this.isMultipleLabel && this.projectType !== 'ner' && this.projectType !== 'image' && this.projectType !== 'log') || this.isNumeric) {
      if (this.labelChoose) {
        category.push(this.labelChoose);
      }
      return category;
    } else if (!this.isNumeric && this.isMultipleLabel && this.projectType !== 'ner' && this.projectType !== 'image' && this.projectType !== 'log') {
      category = this.multipleLabelList;
      return category;
    } else if (this.projectType == 'ner') {
      category = this.spansList;
      return category;
    } else if (this.projectType == 'log') {
      let a = [];
      this.spansList.forEach((e) => {
        a.push({ line: e.line, label: e.label, freeText: e.freeText })
      });
      category = a;
      return category;
    } else if (this.projectType == 'image') {
      category = this.currentBoundingData;
      return category;
    }
  }

  categoryBackFunc(index) {
    if (this.isShowDropDown && !this.isMultipleLabel && !this.isNumeric) {
      this.questionForm.get('questionGroup.category').setValue(this.annotationHistory[index].category[0]);
    } else if ((!this.isShowDropDown && !this.isMultipleLabel && this.projectType != 'ner' && this.projectType !== 'image') || this.isNumeric) {
      //to storage the ticket label
      this.labelChoose = this.annotationHistory[index].category[0];
      //get the previous label color
      let labelIndex = this.annotationHistory[index].activeClass;
      this.idName = 'label' + labelIndex;
      switch (labelIndex) {
        case 0:
          this.renderer2.setStyle(this.el.nativeElement.querySelector('.' + this.idName), 'background-color', '#60b515');
          break;
        case 1:
          this.renderer2.setStyle(this.el.nativeElement.querySelector('.' + this.idName), 'background-color', '#ff681c');
          break;
        case 2:
          this.renderer2.setStyle(this.el.nativeElement.querySelector('.' + this.idName), 'background-color', '#efd603');
          break;
        case 3:
          this.renderer2.setStyle(this.el.nativeElement.querySelector('.' + this.idName), 'background-color', '#00bfa9');
          break;
        case 4:
          this.renderer2.setStyle(this.el.nativeElement.querySelector('.' + this.idName), 'background-color', '#6870c4');
          break;
        case 5:
          this.renderer2.setStyle(this.el.nativeElement.querySelector('.' + this.idName), 'background-color', '#ff9c32');
          break;
      };
    } else if (!this.isNumeric && this.isMultipleLabel && this.projectType != 'ner' && this.projectType !== 'image' && this.projectType !== 'log') {
      this.multipleLabelList = this.annotationHistory[index].category
      this.multipleLabelList.forEach(e => {
        let multiLabelClass = 'multiLabel' + this.categories.indexOf(e);;
        this.el.nativeElement.querySelector('.' + multiLabelClass).children[0].checked = true;
        this.renderer2.setStyle(this.el.nativeElement.querySelector('.' + multiLabelClass), 'background-color', '#fafafa');
        this.renderer2.setStyle(this.el.nativeElement.querySelector('.' + multiLabelClass), 'border-color', '#ccc');
        this.renderer2.setStyle(this.el.nativeElement.querySelector('.' + multiLabelClass), 'border-bottom-width', 'medium');
        this.renderer2.setStyle(this.el.nativeElement.querySelector('.' + multiLabelClass + " label"), 'font-weight', 'bold');
      })
    } else if (!this.isShowDropDown && !this.isNumeric && this.isMultipleLabel && this.projectType == 'ner') {

      let annotations = this.sr.userInputs;
      let annotatedIDs = [];
      setTimeout(() => {
        annotations.forEach(element => {
          element.problemCategory.forEach(element2 => {
            annotatedIDs = element2.ids.split('-');
            this.onMouseDown(annotatedIDs[0], 'historyBack');
            this.onMouseUp(annotatedIDs[annotatedIDs.length - 1], 'historyBack', this.categories.indexOf(element2.label));
          });
        });
      }, 10);
    } else if (this.projectType == 'log') {
      setTimeout(() => {
        if (this.sr.userInputs.length > 0) {
          this.sr.userInputs[0].problemCategory.forEach(element => {
            for (let i = 0; i < this.sr.originalData.length; i++) {
              if (element.line == this.sr.originalData[i].line) {
                this.onMouseDownTxt(element, this.sr.originalData[i].index);
                this.onMouseUpTxt(element, this.sr.originalData[i].index, 'historyBack');
                break;
              }
            }
          });
        }
      }, 10)
    }
    this.annotationHistory.splice(index, 1);
  }


  clearUserInput() {
    this.isShowDropDown ? this.questionForm.get('questionGroup.category').reset() : this.labelChoose = null;
    this.active = -1;
    this.questionForm.get('questionGroup.freeText').reset();
    this.questionForm.get('questionGroup.answer').reset();
    this.multipleLabelList = [];
    this.spansList = [];
    this.projectType == 'log' ? this.questionForm.get('questionGroup.filterText').reset() : null;
    this.regexErr = false;

  }

  clearCheckbox() {
    this.multipleLabelList.forEach(e => {
      let multiLabelClass = 'multiLabel' + this.categories.indexOf(e);;
      this.el.nativeElement.querySelector('.' + multiLabelClass).children[0].checked = false;
    })

  }



  onMouseDown(e, data) {
    this.spanStart = null;
    if (data == 'historyBack') {
      this.spanStart = this.sr.originalData.tokens[e]
    } else {
      this.spanStart = this.sr.originalData.tokens[e.target.id];
    };
  }


  onMouseUp(e, data, selectedEntityID0) {

    this.spanEnd = null;

    if (data == 'historyBack') {
      this.spanEnd = this.sr.originalData.tokens[e];
    } else {
      this.spanEnd = this.sr.originalData.tokens[e.target.id];
    };

    let IDs = this.sortStartEndID();

    if (IDs) {

      // to check whether has mark in the selected scope
      for (let j = 0; j < IDs.length; j++) {
        if (this.el.nativeElement.querySelector('.spanIndex' + IDs[j]) == null) {
          return;
        }
      }

      // to create mark and style
      let parentDom = this.el.nativeElement.querySelector('.nerBox');
      let markDom = this.renderer2.createElement('mark');
      this.renderer2.addClass(markDom, 'markSelected');
      this.renderer2.addClass(markDom, 'c-' + IDs.join('-'));
      this.renderer2.insertBefore(parentDom, markDom, this.el.nativeElement.querySelector('.spanIndex' + IDs[0]));
      let part = { text: '', start: 0, end: 0, label: '', ids: '' };
      for (let i = 0; i < IDs.length; i++) {
        let spanDom = this.renderer2.createElement('span')
        this.renderer2.appendChild(spanDom, this.renderer2.createText(this.sr.originalData.tokens[IDs[i]].text))
        this.renderer2.addClass(spanDom, 'nerSpan')
        this.renderer2.appendChild(markDom, spanDom)
        this.renderer2.removeChild(parentDom, this.el.nativeElement.querySelector('.spanIndex' + IDs[i]))
        part.text = (part.text + ' ' + this.sr.originalData.tokens[IDs[i]].text).trim();
        part.start = this.sr.originalData.tokens[IDs[0]].start;
        part.end = this.sr.originalData.tokens[IDs[i]].end;
      };
      let entityDom = this.renderer2.createElement('span');
      this.renderer2.appendChild(entityDom, this.renderer2.createText(this.categories[data == 'historyBack' ? selectedEntityID0 : this.selectedEntityID]));
      this.renderer2.addClass(entityDom, 'entity');
      let clearDom = this.renderer2.createElement('span');
      this.renderer2.appendChild(clearDom, this.renderer2.createText('×'));
      this.renderer2.addClass(clearDom, 'clear');
      this.renderer2.appendChild(markDom, entityDom);
      this.renderer2.appendChild(markDom, clearDom);
      this.el.nativeElement.querySelector('.c-' + IDs.join('-')).addEventListener('mouseenter', this.mouseenterMark.bind(this))
      this.el.nativeElement.querySelector('.c-' + IDs.join('-')).addEventListener('mouseleave', this.mouseleaveMark.bind(this))
      this.el.nativeElement.querySelector('.c-' + IDs.join('-')).addEventListener('click', this.clickMark.bind(this))
      part.label = this.categories[data == 'historyBack' ? selectedEntityID0 : this.selectedEntityID];
      part.ids = IDs.join('-');
      this.spansList.push(part);
      // console.log('spansList:::', this.spansList)
    }
  }



  mouseenterMark(e) {
    e.target.lastChild.style.backgroundColor = "#444";
    e.target.lastChild.style.color = "#fff";
  }


  mouseleaveMark(e) {
    e.target.lastChild.style.backgroundColor = "transparent";
    e.target.lastChild.style.color = "transparent";

  }



  clickMark(e) {

    let markClasses = [];
    let ids = [];

    if (e.target.parentNode.className.split(' ').indexOf('markSelected') > -1 || e.target.className.split(' ').indexOf('markSelected') > -1) {

      if (e.target.parentNode.className.split(' ').indexOf('markSelected') > -1) {
        markClasses = e.target.parentNode.className.split(' ');
      };
      if (e.target.className.split(' ').indexOf('markSelected') > -1) {
        markClasses = e.target.className.split(' ');
      };

      markClasses.forEach(element => {
        if (element.startsWith('c-')) {
          ids = element.split('-').splice(1);
          let parentDom = this.el.nativeElement.querySelector('.nerBox');
          let targetMark = this.el.nativeElement.querySelector('.' + element);
          for (let i = 0; i < ids.length; i++) {
            let spanDom = this.renderer2.createElement('span');
            this.renderer2.appendChild(spanDom, this.renderer2.createText(this.sr.originalData.tokens[ids[i]].text));
            this.renderer2.addClass(spanDom, 'nerSpan');
            this.renderer2.addClass(spanDom, 'spanIndex' + ids[i]);
            this.renderer2.setAttribute(spanDom, 'id', ids[i]);
            this.renderer2.insertBefore(parentDom, spanDom, targetMark);
            this.el.nativeElement.querySelector('.spanIndex' + ids[i]).addEventListener('mousedown', this.onMouseDown.bind(this))
            this.el.nativeElement.querySelector('.spanIndex' + ids[i]).addEventListener('mouseup', this.onMouseUp.bind(this))
          };
          this.renderer2.removeChild(parentDom, targetMark);
          // to update the spansList
          this.spansList.forEach((e, i) => {
            if (e.ids == element.slice(2)) {
              this.spansList.splice(i, 1)
            }
          });
        }
      })
    };
  }



  onSelectingEntity(e, data, index) {
    e.preventDefault();
    this.selectedEntityID = index;
    if (this.projectType == 'log') {
      let logLabelDoms = this.el.nativeElement.querySelectorAll('.logCategories');
      // console.log('logLabelDoms:::', logLabelDoms);
      logLabelDoms.forEach((element, i) => {
        if (index == i) {
          element.style.backgroundColor = element.style.borderLeftColor;
          element.style.color = 'white';
        } else {
          element.style.backgroundColor = "";
          element.style.color = "black";
        }
      });
    }
  }


  sortStartEndID() {
    let startID
    let endID;
    let ids = [];
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



  getSrById(data, index) {

    this.avaService.getSrById(data).subscribe(responseSr => {

      if (responseSr) {

        let flag = [];
        if (this.projectType != 'ner' && this.projectType != 'image' && this.projectType != 'log') {
          _.forIn(responseSr.originalData, function (value, key) {
            flag.push({ key: key, value: value });
            responseSr.originalData = flag;
          });
        };
        if (this.projectType == 'image') {
          this.historyTask = [{ "result": this.annotationHistory[index].images }];
          setTimeout(() => {
            let option = {
              dom: 'label-studio',
              imageRectLabelTemplate: this.imageRectLabelTemplate,
              imagePolyLabelTemplate: this.imagePolyLabelTemplate,
              url: this.annotationHistory[index].historyDescription[0].location,
              historyCompletions: this.historyTask,
              annotationQuestion: `<Header style="margin-top:2rem;" value="${this.projectInfo.annotationQuestion}"/>`,
              from: 'annotate'
            }
            this.toCallStudio(option);
            this.historyTask = [];
            this.currentBoundingData = this.annotationHistory[index].images;
            this.annotationHistory.splice(index, 1);
          }, 0);
        };
        if (this.projectType == 'log') {
          responseSr.originalData = this.resetLogSrData([responseSr]).originalData;
          setTimeout(() => {
            this.toFilterLog(this.filterList);
          }, 10);

        }
        if (responseSr.flag && responseSr.flag.silence) {
          this.silenceStatus = true;
        };

        this.sr._id = responseSr._id;
        this.sr.originalData = responseSr.originalData;
        this.sr.flag = responseSr.flag;
        this.sr.userInputs = responseSr.userInputs;
        if (this.projectType !== 'image') {
          this.categoryBackFunc(index);
        };
        if (this.isNumeric) {
          setTimeout(() => {
            this.numericInput.nativeElement.focus();
          }, 300);
        };
      } else {
        console.log('failed to get data')
      }
    }, error => {
      console.log(error)
    });
  }


  resetNerSrData(sr) {
    if (!sr.MSG) {
      if (sr[0].userInputs && sr[0].userInputs.length > 0 && sr[0].userInputs[0].problemCategory.length > 0) {
        let aa = sr[0].userInputs[0].problemCategory;
        let bb = sr[0].originalData.tokens;
        for (let j = 0; j < aa.length; j++) {
          let ids = [];
          for (let i = 0; i < bb.length; i++) {
            if (aa[j].start == bb[i].start && ids.length == 0) {
              ids.push(bb[i].id)
            };
            if (aa[j].end == bb[i].end) {
              ids.push(bb[i].id);
              if (ids.length == 2) {
                if (ids[0] == ids[1]) {
                  aa[j].ids = String(ids[0])
                } else {
                  let flag = [];
                  for (let k = ids[0]; k < ids[1] + 1; k++) {
                    flag.push(k)
                  };
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
  };


  resetTabularSrData(sr) {
    if (!sr.MSG) {
      let flag = [];
      sr = sr[0];
      _.forIn(sr.originalData, function (value, key) {
        flag.push({ key: key, value: value });
      });
      sr.originalData = flag;
      return sr;
    } else {
      return sr;
    }
  };


  resetImageSrData(sr) {
    if (!sr.MSG) {
      return sr[0];
    } else {
      return sr;
    }
  };

  resetLogSrData(sr) {
    if (!sr.MSG) {
      let flag = [];
      sr = sr[0];
      let a = 0;
      _.forIn(sr.originalData, function (value, key) {
        flag.push({ index: a, line: key, text: value, freeText: '' });
        a++
      });

      sr.originalData = flag;
      return sr;
    } else {
      return sr;
    }
  }


  toCallStudio(option) {
    this.LabelStudioService.initLabelStudio(option)
    let h4Dom = this.el.nativeElement.querySelector('.ant-typography');
    this.rectLabelDom = h4Dom.nextElementSibling
    this.polygonLabelDom = this.rectLabelDom.nextElementSibling
    this.renderer2.setStyle(this.polygonLabelDom, 'display', 'none');
    this.renderer2.setStyle(this.rectLabelDom, 'display', 'block');
  }


  submitImage() {
    this.LabelStudioService.imageLabelInfo.submitCompletion();
  };


  deletePolygon() {
    // console.log("deletePolygon:::", this.LabelStudioService.imageLabelInfo.completionStore.completions[0].highlightedNode)
    if (this.LabelStudioService.imageLabelInfo.completionStore && this.LabelStudioService.imageLabelInfo.completionStore.completions[0].highlightedNode) {
      this.LabelStudioService.imageLabelInfo.completionStore.completions[0].highlightedNode.deleteRegion();
    }
  };


  deleteAllPolygon() {
    this.LabelStudioService.imageLabelInfo.completionStore.selected.history.reset();

  };


  onPolygon() {
    this.rectSelected = false;
    this.renderer2.setStyle(this.polygonLabelDom, 'display', 'block');
    this.renderer2.setStyle(this.rectLabelDom, 'display', 'none');

  };


  onRects() {
    this.rectSelected = true;
    this.renderer2.setStyle(this.polygonLabelDom, 'display', 'none');
    this.renderer2.setStyle(this.rectLabelDom, 'display', 'block');
  }


  sortLabelForColor(categories) {
    this.logCategories = [];
    categories.forEach((element, index) => {
      if (index >= 30) { index = index - 30; };
      if (this.projectType == 'log') {
        this.logCategories.push({ label: element, color: this.colorsRainbow[index] })
      } else {
        this.imageRectLabelTemplate += `<Label value="${element}" background="${this.colorsRainbow[index]}" selectedColor="white"/>`
        this.imagePolyLabelTemplate += `<Label value="${element}" background="${this.colorsRainbow[index]}" selectedColor="white"/>`
      }
    });
  };



  @HostListener('click', ['$event.target'])
  public onClick() {
    if (this.LabelStudioService.imageLabelInfo && this.LabelStudioService.imageLabelInfo.completionStore) {
      this.currentBoundingData = this.LabelStudioService.imageLabelInfo.completionStore.selected.serializeCompletion();
      this.highlightedNode = this.LabelStudioService.imageLabelInfo.completionStore.selected.highlightedNode;
      // console.log("currentBoundingData:::", this.currentBoundingData)
      // console.log("highlightedNode:::", this.highlightedNode)
      if (this.highlightedNode && this.highlightedNode.type === "rectangleregion") {
        this.onRects();
      } else if (this.highlightedNode && this.highlightedNode.type === "polygonregion") {
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
      let pDom = this.el.nativeElement.querySelector('.txtRowContent' + this.spanEnd);
      let indexDom = this.el.nativeElement.querySelector('.logIndex' + this.spanEnd);
      this.getElementService.toFindDomAddClass(pDom, 'selectedTxtRow');
      // to give label's color to text
      if (pDom) {
        pDom.style.backgroundColor = this.toolService.hexToRgb(this.colorsRainbow[from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID]);
      }
      // update the this.spansList
      if (_.indexOf(this.toGetLogLines(this.spansList), data.line) < 0) {
        this.spansList.push({ line: data.line, label: from == 'historyBack' ? data.label : this.categories[this.selectedEntityID], freeText: from == 'historyBack' ? data.freeText : this.questionForm.get('questionGroup.freeText').value, index: this.spanEnd, selected: false })
      }

      let txtRowEntityDom = this.el.nativeElement.querySelector('.txtRowEntity' + this.spanEnd);
      // to give label's color to entity
      if (txtRowEntityDom) {
        txtRowEntityDom.style.backgroundColor = this.colorsRainbow[from == 'historyBack' ? this.categories.indexOf(data.label) : this.selectedEntityID];
      }
      this.getElementService.toFindDomAddText(txtRowEntityDom, from == 'historyBack' ? data.label : this.categories[this.selectedEntityID], 'txtEntityLabel');
      this.spansList = this.getElementService.toCreateClear(txtRowEntityDom, pDom, 'clear-' + this.spanEnd, 'clearTxt', this.spansList, indexDom, this.el.nativeElement.querySelector('.customBadge' + this.spanEnd));
      this.getElementService.toListenMouseIn(pDom, this.el.nativeElement.querySelector('.clear-' + this.spanEnd));
      this.getElementService.toListenMouseOut(pDom, this.el.nativeElement.querySelector('.clear-' + this.spanEnd));
      this.spansList = this.getElementService.toClearSelected(txtRowEntityDom, pDom, this.el.nativeElement.querySelector('.clear-' + this.spanEnd), this.spansList, indexDom, this.el.nativeElement.querySelector('.customBadge' + this.spanEnd));
    }
    // console.log('this.spansList:::', this.spansList)
    this.toCheckSpanslist(this.spansList);
  }


  toGetLogLines(spansList) {
    let x = [];
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
            let dom = this.el.nativeElement.querySelector('.logIndex' + e.index);
            this.renderer2.removeClass(dom, 'selectedRowIndex');
            this.renderer2.addClass(dom, 'rowIndex');
          }
        }
      })
    }

    if (e.target.nextElementSibling && e.target.nextElementSibling.className && e.target.nextElementSibling.className.indexOf('txtEntityLabel') > 0) {

      // to show the original freetext enable edit
      for (let i = 0; i < this.spansList.length; i++) {
        if (this.spansList[i].line == data.line) {
          this.questionForm.get('questionGroup.freeText').setValue(this.spansList[i].freeText);
          let classList = e.target.className.split(' ');
          if (classList.indexOf('selectedRowIndex') > -1) {
            classList.splice(classList.indexOf('selectedRowIndex'), 1, 'rowIndex')
            e.target.className = classList.join(' ');
            this.spansList[i].selected = false;
          } else {
            classList.splice(classList.indexOf('rowIndex'), 1, 'selectedRowIndex')
            e.target.className = classList.join(' ');
            this.spansList[i].selected = true;
          };
          this.toCheckSpanslist(this.spansList)
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
          this.toCheckSpanslist(this.spansList)
          break;
        }
      }
    }
  }


  toCheckSpanslist(list) {
    list.forEach(element => {
      let dom = this.el.nativeElement.querySelector('.customBadge' + element.index);
      if (dom) {
        if (element.freeText) {
          dom.style.backgroundColor = '#cccccc'
        } else {
          dom.style.backgroundColor = ''
        }
      }
    });
  };


  toFilterLog(e) {
    // console.log('updateFilterText:::', e)
    let filterRowsIndex = [];
    this.sr.originalData.forEach(element => {
      element.filter = true;
    });
    if (e.length > 0) {
      this.sr.originalData.forEach((element, index) => {
        let arr = [];
        e.forEach(filter => {
          if (filter.filterType == 'keyword') {
            let a = [...element.text.matchAll(RegExp(filter.filterText, 'gi'))];
            if (a.length > 0) {
              arr = [...arr, ...a]
            }
          } else {
            let a = this.toolService.regexExec(filter.filterText, element.text);
            if (a.length > 0) {
              arr = [...arr, ...a]
            };
          };
          if (arr.length > 0) {
            element.filter = true;
            this.getElementService.setFilterHighLight('txtRowContent' + element.index, element.text, arr);
            filterRowsIndex.push(element.index)
          } else {
            element.filter = false;
          }
        });
      });
    };
    setTimeout(() => {
      if (this.spansList.length > 0) {
        this.spansList.forEach(data => {
          if (e.length == 0 || (filterRowsIndex.length > 0 && filterRowsIndex.indexOf(data.index) > -1)) {
            this.onMouseDownTxt({ line: data.line, label: data.label, freeText: data.freeText }, data.index);
            this.onMouseUpTxt({ line: data.line, label: data.label, freeText: data.freeText }, data.index, 'historyBack');
          }
        })
      }
    }, 10);
  }


  updateFilterSelect(e) {
    this.regexErr = false;
    this.filterType = e.target.value;
  };


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
    if (e) {
      if (this.filterType == 'regex') {
        try {
          this.toolService.regexExec(e, 'test');
          this.regexErr = false;
        } catch (err) {
          console.log("regErr:", err);
          this.regexErr = true;
          return;
        };
      } else {
        this.regexErr = false;
      }
      this.filterList.push({ filterType: this.filterType, filterText: e });
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
          console.log("regErr:", err);
          this.regexErr = true;
          return;
        };
      } else {
        this.regexErr = false;
      };
      this.filterList.push({ filterType: this.filterType, filterText: e.target.value });
      this.questionForm.get('questionGroup.filterText').reset()
      this.toFilterLog(this.filterList);
    }
  };


  toStorageFilter() {
    if (this.filterList.length > 0) {
      if (localStorage.getItem('log-filter')) {
        let logFilter = JSON.parse(localStorage.getItem('log-filter'));
        let pIds = []
        logFilter.forEach(element => {
          pIds.push(element.pId)
        });
        if (pIds.indexOf(this.projectId) > -1) {
          logFilter[pIds.indexOf(this.projectId)].filter = this.filterList;
          localStorage.setItem('log-filter', JSON.stringify(logFilter));
        } else {
          logFilter.push({
            pId: this.projectId,
            filter: this.filterList
          });
          localStorage.setItem('log-filter', JSON.stringify(logFilter));
        }
      } else {
        let obj = {
          pId: this.projectId,
          filter: this.filterList
        }
        localStorage.setItem('log-filter', JSON.stringify([obj]));
      }
    } else {
      if (localStorage.getItem('log-filter')) {
        let logFilter = JSON.parse(localStorage.getItem('log-filter'));
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
  };



  detailDrawer() {
    if (this.isDrawer) {
      this.isDrawer = false;
    } else {
      this.isDrawer = true;
    }
  }



  toShowExistingLabel() {
    let annotations = this.sr.userInputs;
    let annotatedIDs = [];
    setTimeout(() => {
      annotations.forEach(element => {
        element.problemCategory.forEach(element2 => {
          annotatedIDs = element2.ids.split('-');
          this.onMouseDown(annotatedIDs[0], 'historyBack');
          this.onMouseUp(annotatedIDs[annotatedIDs.length - 1], 'historyBack', this.categories.indexOf(element2.label));
        });
      });
    }, 10);
  }



  ngOnDestroy() {
    this.toStorageFilter();
  }




}
