/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { DatasetData } from '../../../model/index';
import { FormGroup, FormBuilder } from '@angular/forms';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { DatasetValidator } from '../../../shared/form-validators/dataset-validator';
import { DatasetUtil } from 'src/app/model/index';
import { Classifier, Encoder, QueryStrategyBase, PopLabels } from '../../../model/constant';
import * as _ from 'lodash';
import { ClrWizard, ClrWizardPage } from '@clr/angular';
import { ToolService } from 'src/app/services/common/tool.service';
import { CommonService } from 'src/app/services/common/common.service';
import { EmailService } from 'src/app/services/common/email.service';
import { Papa } from 'ngx-papaparse';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAuthService } from 'src/app/services/user-auth.service';
import { InternalApiService } from 'src/app/services/internal-api.service';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.scss'],
})
export class CreateProjectComponent implements OnInit {
  @ViewChild('wizard') wizard: ClrWizard;
  errorMessage;
  infoMessage;
  isPop: boolean;
  wizardOpen: boolean;
  nameExist: boolean;
  popLabelList = PopLabels;
  dataset: DatasetData;
  dsDialogForm: FormGroup;
  datasetsList = [];
  isNumeric: boolean;
  isMultipleLabel: boolean;
  previewHeadDatas = [];
  previewContentDatas = [];
  datasetInfo: any = {};
  selectDescription = [];
  selectDescriptionCopy = [];
  checkboxColumns = [];
  dropdownSelected: string;
  checkboxChecked: any = [];
  helpfulText: any = [];
  categoryList: any = [];
  categoryListInfo: any = [];
  nonEnglish: number;
  totalCase: number;
  isUploadLabel: boolean;
  isMutilNumericLabel: boolean;
  isShowNumeric: boolean;
  assigneeList: any = [];
  msgCreateProjectPage;
  msgUploadFile;
  treeLabels: any = [];
  isExpandLabelTree: boolean = false;
  isSecondaryLabel: boolean = false;
  showPopLabel: boolean;
  slackList: any = [];
  loading$ = new BehaviorSubject(false);
  clrWizardPageNextDisabled: any = {};
  assignType: any = [];
  queryStrategyBase = QueryStrategyBase;
  encoder = Encoder;
  classifier = Classifier;
  loading: boolean = false;
  user: any;
  wizardpage: ClrWizardPage;

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    public env: EnvironmentsService,
    private toolService: ToolService,
    private commonService: CommonService,
    private emailService: EmailService,
    private papa: Papa,
    private router: Router,
    private route: ActivatedRoute,
    private userAuthService: UserAuthService,
    private internalApiService: InternalApiService,
  ) {
    this.user = this.userAuthService.loggedUser().user.email;
  }

  ngOnInit(): void {
    this.createForm();
    this.isPop = false;
    setTimeout(() => {
      this.wizardOpen = true;
    }, 10);
    this.getMyDatasets('text');
    this.categoryListInfo = [{ name: '', setLableErrMessage: '' }];
    this.assigneeList.push({ email: '', setUserErrMessage: '', assignedCase: null });
    this.slackList.push({ slackName: '', slackId: '', setUserErrMessage: '' });
    this.msgUploadFile = {
      type: 'json',
      page: 'defineLabels',
    };
    this.assignType = [
      { name: 'Email', value: 'email', checked: true },
      { name: 'Slack Channel', value: 'slack', checked: false },
    ];
    this.clrWizardPageNextDisabled = { page4: true, page5: true, page6: true };
    // come from dataset-analyze
    this.route.queryParams.subscribe((params) => {
      if (params && params['data']) {
        let data = JSON.parse(params['data']);
        // according to the dataset from router to init the wizard
        this.dsDialogForm.get('projectType').setValue(data.projectType);
        this.getMyDatasets(data.projectType).then((res) => {
          if (res) {
            this.selectedDatasets({ target: { value: data.dataSetName } }, true);
            this.dsDialogForm.get('selectedDataset').setValue(data.dataSetName);
          }
        });
      }
    });
  }

  clrWizardPageOnLoad(e) {
    if (e === 'clr-wizard-page-2') {
      this.dsDialogForm.get('selectedDataset').setValue(this.dsDialogForm.get('selectedDataset').value!);
    }
    if (e === 'clr-wizard-page-4') {
      // user can next to assign when the label is ready
      if (this.isUploadLabel) {
        // console.log('clrWizardPageOnLoad(e)---this.treeLabels---', this.treeLabels);
        if (this.treeLabels.length > 0) {
          this.clrWizardPageNextDisabled.page4 = false;
        } else {
          this.clrWizardPageNextDisabled.page4 = true;
        }
      } else {
        let val = this.toCheckCategoryListInfo();
        if (val.length > 0) {
          if (
            this.dsDialogForm.get('projectType').value === 'tabular' ||
            this.dsDialogForm.get('projectType').value === 'text'
          ) {
            if (val.length > 1) {
              this.clrWizardPageNextDisabled.page4 = false;
            } else {
              if (this.isShowNumeric) {
                this.clrWizardPageNextDisabled.page4 = false;
              } else {
                this.clrWizardPageNextDisabled.page4 = true;
                return;
              }
            }
          }
          this.clrWizardPageNextDisabled.page4 = false;
        } else {
          this.clrWizardPageNextDisabled.page4 = true;
          return;
        }
      }

      // ner has secondary label
      if (this.dsDialogForm.get('projectType').value === 'ner' && this.showPopLabel && this.popLabelList.length > 0) {
        if (_.filter(this.popLabelList, ['setLableErrMessage', '']).length == this.popLabelList.length) {
          this.clrWizardPageNextDisabled.page4 = false;
        } else {
          this.clrWizardPageNextDisabled.page4 = true;
          return;
        }
      }
    }
    if (e === 'clr-wizard-page-5') {
      this.toEvenlyDistributeTicket();
      if (this.dsDialogForm.get('totalRow').value < 1 || this.dsDialogForm.get('maxAnnotations').value < 0) {
        return (this.clrWizardPageNextDisabled.page5 = true);
      }
      if (!this.assignType[0].checked && !this.assignType[1].checked) {
        return (this.clrWizardPageNextDisabled.page5 = true);
      }
      if (this.assignType[0].checked) {
        if (this.toCheckAssigneeList().length == 0) {
          return (this.clrWizardPageNextDisabled.page5 = true);
        }
      }
      if (this.assignType[1].checked) {
        if (this.toCheckSlackList().length == 0) {
          return (this.clrWizardPageNextDisabled.page5 = true);
        }
      }
      this.clrWizardPageNextDisabled.page5 = false;
      return;
    }
    if (e === 'clr-wizard-page-6') {
      if (!this.isShowNumeric && !this.isMutilNumericLabel && !this.isUploadLabel) {
        if (this.dsDialogForm.get('projectType').value == 'tabular') {
          if (this.dsDialogForm.get('multipleLabel').value == 'y') {
            return (this.clrWizardPageNextDisabled.page6 = false);
          } else {
            if (
              this.dsDialogForm.get('selectedClassifier').value &&
              this.dsDialogForm.get('selectedqueryStrategy').value &&
              this.dsDialogForm.get('selectedEncoder').value
            ) {
              return (this.clrWizardPageNextDisabled.page6 = false);
            } else {
              return (this.clrWizardPageNextDisabled.page6 = true);
            }
          }
        } else if (this.dsDialogForm.get('projectType').value == 'text') {
          if (this.dsDialogForm.get('multipleLabel').value == 'y') {
            return (this.clrWizardPageNextDisabled.page6 = false);
          } else {
            if (
              this.dsDialogForm.get('selectedClassifier').value &&
              this.dsDialogForm.get('selectedqueryStrategy').value
            ) {
              return (this.clrWizardPageNextDisabled.page6 = false);
            } else {
              return (this.clrWizardPageNextDisabled.page6 = true);
            }
          }
        } else {
          this.clrWizardPageNextDisabled.page6 = false;
        }
      } else {
        return (this.clrWizardPageNextDisabled.page6 = false);
      }
    }
  }

  changeEncoder() {
    this.clrWizardPageOnLoad('clr-wizard-page-6');
  }

  changeQueryStrategy() {
    this.clrWizardPageOnLoad('clr-wizard-page-6');
  }

  changeClassifier() {
    this.clrWizardPageOnLoad('clr-wizard-page-6');
  }

  toCheckCategoryListInfo() {
    let arr = [];
    for (let i = 0; i < this.categoryListInfo.length; i++) {
      if (this.isMutilNumericLabel) {
        if (
          !this.categoryListInfo[i].setLableErrMessage &&
          !this.categoryListInfo[i].setNumberErrMessage &&
          this.categoryListInfo[i].name != '' &&
          this.categoryListInfo[i].min != '' &&
          this.categoryListInfo[i].max != ''
        ) {
          arr.push({
            [this.categoryListInfo[i].name]: [this.categoryListInfo[i].min, this.categoryListInfo[i].max],
          });
        } else if (
          !this.categoryListInfo[i].setLableErrMessage &&
          !this.categoryListInfo[i].setNumberErrMessage &&
          this.categoryListInfo[i].name == '' &&
          this.categoryListInfo[i].min == '' &&
          this.categoryListInfo[i].max == ''
        ) {
          continue;
        } else {
          return [];
        }
      } else if (this.isShowNumeric) {
        if (
          !this.categoryListInfo[i].setNumberErrMessage &&
          this.categoryListInfo[i].min != '' &&
          this.categoryListInfo[i].max != ''
        ) {
          arr.push({ min: this.categoryListInfo[i].min, max: this.categoryListInfo[i].max });
        } else if (
          !this.categoryListInfo[i].setNumberErrMessage &&
          this.categoryListInfo[i].min == '' &&
          this.categoryListInfo[i].max == ''
        ) {
          continue;
        } else {
          return [];
        }
      } else {
        if (!this.categoryListInfo[i].setLableErrMessage && this.categoryListInfo[i].name) {
          arr.push(this.categoryListInfo[i].name);
        } else if (!this.categoryListInfo[i].setLableErrMessage && this.categoryListInfo[i].name == '') {
          continue;
        } else {
          return [];
        }
      }
    }
    return arr;
  }

  doCustomClick(buttonType: string): void {
    if ('custom-next' === buttonType) {
      if (this.totalCase > 0) {
        this.wizard.next();
      } else {
        this.setdata();
      }
    }

    if ('custom-previous' === buttonType) {
      this.wizard.previous();
    }

    // if ('custom-finish' === buttonType) {
    //   // if click the image type finish in assign email page
    //   this.toCreate();
    // }
  }

  createForm(): void {
    if (!this.dataset) {
      this.dataset = DatasetUtil.init();
    }
    this.dsDialogForm = this.formBuilder.group({
      projectName: [this.dataset.name || '', DatasetValidator.modelName()],
      projectType: [this.dataset.projectType, DatasetValidator.required()],
      taskInstruction: [this.dataset.description, null],
      maxAnnotations: [this.dataset.maxAnnotations, DatasetValidator.maxAnnotation()],
      assignmentLogic: [this.dataset.assigmentLogic, ''],
      totalRow: [this.dataset.totalRow, DatasetValidator.validRow()],
      annotationDisplayName: [this.dataset.annotationDisplayName, DatasetValidator.required()],
      annotationQuestion: [
        this.dataset.projectType == 'ner'
          ? 'Label all entity types in the given text corpus.'
          : this.dataset.annotationQuestion,
        DatasetValidator.required(),
      ],
      selectedDataset: ['', DatasetValidator.required()],
      selectedClassifier: [null, DatasetValidator.required()],
      selectedqueryStrategy: [null, DatasetValidator.required()],
      selectedEncoder: [null, DatasetValidator.required()],
      multipleLabel: [this.dataset.multipleLabel, null],
      isShowFilename: [this.dataset.isShowFilename, ''],
    });
  }

  onKeydown(e) {
    e.stopPropagation();
  }

  inputProjectBlur(e) {
    this.nameExist = true;
    const param = {
      pname: e.target.value,
    };
    if (e.target.value != '') {
      this.apiService.findProjectName(param).subscribe((res) => {
        if (res.length != 0) {
          this.nameExist = true;
        } else {
          this.nameExist = false;
        }
      });
    } else {
      this.nameExist = false;
    }
  }

  selectedDatasets(e, from?) {
    this.datasetInfo.loadingPreviewData = true;
    if (!from) {
      this.clearFormdata(2);
    }
    this.datasetsList.forEach((dataset) => {
      if (dataset.dataSetName === e.target.value) {
        const choosedDataset = dataset;
        this.datasetInfo.dataSetId = choosedDataset.id;
        this.datasetInfo.fileName = choosedDataset.fileName;
        this.datasetInfo.fileSize = choosedDataset.fileSize;
        this.datasetInfo.isShowSetHeader = choosedDataset.format;
        this.datasetInfo.fileLocation = choosedDataset.location;
        if (this.dsDialogForm.get('projectType').value == 'image' && choosedDataset.format == 'image') {
          let a = 0;
          let flag = JSON.parse(JSON.stringify(choosedDataset.topReview));
          flag.forEach((element) => {
            element.fileSize = (element.fileSize / 1024).toFixed(2);
            if (this.env.config.enableAWSS3) {
              const img = new Image();
              let that = this;
              img.src = element.location;
              img.onload = function () {
                a++;
                if (a == Math.round(flag.length / 2)) {
                  that.previewHeadDatas = ['Image', 'ImageName', 'ImageSize(KB)', 'Id'];
                  that.datasetInfo.loadingPreviewData = false;
                }
              };
            } else {
              element.location = `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
                element.location
              }&token=${JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token}`;
              setTimeout(() => {
                this.previewHeadDatas = ['Image', 'ImageName', 'ImageSize(KB)', 'Id'];
                this.datasetInfo.loadingPreviewData = false;
              }, 1000);
            }
          });
          this.previewContentDatas = flag;
          this.dsDialogForm.get('totalRow').setValue(choosedDataset.images ? choosedDataset.images.length : 0);
        } else if (choosedDataset.format == 'txt') {
          this.previewContentDatas = choosedDataset.topReview;
          setTimeout(() => {
            this.previewHeadDatas = ['FileName', 'FileContent'];
            this.datasetInfo.loadingPreviewData = false;
          }, 500);
          this.dsDialogForm.get('totalRow').setValue(choosedDataset.totalRows);
          this.datasetInfo.location = choosedDataset.location;
        } else {
          this.previewContentDatas = choosedDataset.topReview.topRows;
          // this.sortPreviewHeadDatas(this.previewHeadDatas);
          setTimeout(() => {
            this.previewHeadDatas = choosedDataset.topReview.header;
            this.datasetInfo.loadingPreviewData = false;
          }, 500);
          this.datasetInfo.isHasHeader = choosedDataset.hasHeader;
          this.datasetInfo.location = choosedDataset.location;
          this.datasetInfo.chooseLabel = choosedDataset.topReview.header;
          // open wizard and reset
          // this.openWizard();
        }
        // this.toEvenlyDistributeTicket();
        return;
      }
    });
  }

  sortPreviewHeadDatas(csvHeaders) {
    if (this.dsDialogForm.get('projectType').value === 'ner') {
      for (let item of csvHeaders) {
        this.checkboxColumns.push({
          name: item,
          checkboxDisabled: this.dropdownSelected === item ? true : false,
          labelChecked: this.checkboxChecked.indexOf(item) > -1 ? true : false,
          helptextChecked: this.helpfulText.indexOf(item) > -1 ? true : false,
        });
      }
    } else {
      this.checkboxColumns = JSON.parse(JSON.stringify(csvHeaders));
      if (this.dropdownSelected) {
        // if one column has been selected as label then should not selected as text column
        let that = this;
        that.checkboxColumns = _.remove(JSON.parse(JSON.stringify(csvHeaders)), function (n) {
          return n != that.dropdownSelected;
        });
      }
      this.selectDescription = this.checkboxChecked;
    }
  }

  clearFormdata(changeFromPage?) {
    this.totalCase = 0;
    this.dsDialogForm.get('totalRow').setValue(0);
    this.dsDialogForm.get('multipleLabel').setValue('n');
    this.nonEnglish = 0;
    this.isNumeric = false;
    this.isShowNumeric = false;
    this.isMutilNumericLabel = false;
    this.isUploadLabel = false;
    this.categoryList = [];
    this.loading$.next(false);
    this.assignType = [
      { name: 'Email', value: 'email', checked: true },
      { name: 'Slack Channel', value: 'slack', checked: false },
    ];
    this.toEvenlyDistributeTicket();

    if (changeFromPage == 1) {
      this.dsDialogForm.get('selectedDataset').reset();
      this.datasetsList = [];
      this.previewHeadDatas = [];
      this.previewContentDatas = [];
      // this.datasetInfo.datasetName=null
      if (
        this.dsDialogForm.get('projectType').value === 'image' ||
        this.dsDialogForm.get('projectType').value === 'log'
      ) {
        this.categoryListInfo = [{ name: '', setLableErrMessage: '' }];
      }
    }
    if (changeFromPage < 3) {
      this.dropdownSelected = null;
      this.dsDialogForm.get('isShowFilename').setValue('no');
    }
    if (changeFromPage < 4) {
      this.selectDescription = [];
      this.checkboxColumns = [];
      this.checkboxChecked = [];
      this.helpfulText = [];
    }

    // if (this.dsDialogForm.get('projectType').value !== 'ner') {
    //   this.dsDialogForm.get('labels').setValue([]);
    //   this.categoryList = [];
    // }
    // this.isShowLabelRadio = false;
    // this.nonEnglish = 0;
    // this.totalCase = 0;
    // this.dsDialogForm.get('totalRow').setValue(0);
    // this.minLabel = null;
    // this.maxLabel = null;
    // this.dsDialogForm.get('min').setValue(null);
    // this.dsDialogForm.get('max').setValue(null);
    // this.labelType = '';
    // this.isNumeric = null;
    // this.isShowNumeric = false;
    // this.dsDialogForm.get('multipleLabel').setValue(null);
    // this.isMultipleLabel = null;
    // this.isMutilNumericLabel = false;
    // this.isUploadLabel = false;
    // this.dsDialogForm.get('mutilLabelArray').reset();
    // while (this.mutilLabelArray.length > 2) {
    //   this.mutilLabelArray.removeAt(2);
    // }
  }

  changeProjectType() {
    this.clearFormdata(1);
    this.getMyDatasets(this.dsDialogForm.get('projectType').value).then((res) => {});
  }

  getMyDatasets(projectType) {
    let a =
      projectType == 'text' || projectType == 'tabular' || projectType == 'ner'
        ? 'csv'
        : projectType == 'image'
        ? 'image'
        : 'txt';
    return new Promise((resolve, reject) => {
      this.apiService.getMyDatasets(a).subscribe(
        (res) => {
          if (projectType == 'image') {
            const flag = [];
            res.forEach((element) => {
              if (element.format == 'image') {
                flag.push(element);
              }
            });
            this.datasetsList = flag;
          } else {
            const flag = [];
            res.forEach((element) => {
              if (element.format !== 'image') {
                flag.push(element);
              }
            });
            this.datasetsList = flag;
          }
          resolve(res);
        },
        (error: any) => {
          reject(error);
        },
      );
    });
  }

  toEvenlyDistributeTicket() {
    if (this.toCheckAssigneeList().length > 0) {
      let arr = this.toCheckAssigneeList();
      arr.forEach((item) => {
        item.isModify = false;
      });
      this.commonService.evenlyDistributeTicket(
        arr,
        this.dsDialogForm.get('totalRow').value,
        this.dsDialogForm.get('maxAnnotations').value,
      );
    }
  }

  toCaculateInvalid(newArray) {
    let invalidCount = 0;
    for (let b = 0; b < newArray.length; b++) {
      if (_.sortedUniq(newArray[b]).length == 1 && _.sortedUniq(newArray[b])[0] == null) {
        invalidCount += 1;
      }
    }
    return invalidCount;
  }

  toCheckNumeric(flag) {
    let isNumeric;
    const typeScope = ['Number', 'Null', 'Undefined'];
    if (flag.length > 0) {
      for (let i = 0; i < flag.length; i++) {
        let call = toString.call(flag[i]);
        call = _.trimStart(call, '[');
        call = _.trimEnd(call, ']');
        call = call.split(' ')[1];
        if (typeScope.indexOf(call) == -1) {
          isNumeric = 'no';
          return isNumeric;
        }
      }
    } else {
      return 'no';
    }
  }

  sortCategoryList(list) {
    list.forEach((element) => {
      this.categoryListInfo.push({ name: element.trim(), setLableErrMessage: '' });
    });
    this.categoryListInfo.push({ name: '', setLableErrMessage: '' });
    if (
      this.categoryListInfo.length < 2 &&
      (this.dsDialogForm.get('projectType').value === 'tabular' ||
        this.dsDialogForm.get('projectType').value === 'text')
    ) {
      this.categoryListInfo.push({ name: '', setLableErrMessage: '' });
    }
  }

  identifyCategory(selectedLabelIndex, isNumeric, flag) {
    this.categoryListInfo = [];
    if (selectedLabelIndex > -1 && !isNumeric) {
      this.isNumeric = false;
      if (flag.length > 50) {
        this.totalCase = 0;
        this.nonEnglish = 0;
        this.dsDialogForm.get('totalRow').setValue(0);
        this.errorMessage =
          'Set data failed! Your selected label column has more than 50 different labels, please select one new label column that has less than or equal to 50 labels then to set date.';
        this.loading$.next(false);
        return;
      }
      let commaLabel = [];
      let overPerLabelLimit = 0;
      for (let d = 0; d < flag.length; d++) {
        if (!flag[d] || String(flag[d]).trim() == '') {
          flag.splice(d, 1);
        }
        // to check format comma
        let c = String(flag[d]).trim();
        if (/[,，]/g.test(c)) {
          commaLabel = [...commaLabel, ...c.split(',')];
          flag.splice(d, 1);
        }
        if (flag[d] && flag[d].length > 50) {
          overPerLabelLimit++;
          const sliceStr = flag[d].slice(0, 50);
          flag.splice(d, 1, sliceStr);
        }
      }
      if (overPerLabelLimit > 0) {
        this.infoMessage = `Set data alert! Please be aware of that ${overPerLabelLimit} label in your selected label column have more than 50 characters has been truncated.`;
      }
      let newCommaLabel = _.uniq(commaLabel);
      this.categoryList = [...flag, ...newCommaLabel];
    } else if (selectedLabelIndex > -1 && isNumeric) {
      this.isNumeric = true;
      this.categoryListInfo.push({ min: _.min(flag), max: _.max(flag), setLableErrMessage: '' });
      this.isShowNumeric = true;
    }

    if (this.dsDialogForm.get('projectType').value === 'ner') {
      this.categoryList = [...this.categoryList, ...this.checkboxChecked];
    }
    // after set data succeed, change set data btn status to succeed
    if (!isNumeric) {
      this.sortCategoryList(this.categoryList);
    }
    this.toEvenlyDistributeTicket();
    this.wizard.next();
    this.loading$.next(false);
  }

  public papaParse(location) {
    let flag = [];
    let count = 0;
    let invalidCount = 0;
    let indexArray = [];
    let textArray = this.checkboxChecked;
    let selectedLabelIndex = this.previewHeadDatas.indexOf(this.dropdownSelected);
    if (this.dsDialogForm.get('projectType').value === 'ner') {
      selectedLabelIndex = -1;
      textArray = [this.dropdownSelected];
    }

    for (let k = 0; k < textArray.length; k++) {
      indexArray.push(this.previewHeadDatas.indexOf(textArray[k]));
    }

    this.papa.parse(location, {
      header: false,
      download: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker: true,
      error: (error) => {
        this.errorMessage = JSON.stringify(error);
        this.loading$.next(false);
      },
      chunk: (results, parser) => {
        const chunkData = results.data;
        count += chunkData.length;
        const newArray = [];

        for (let a = 0; a < chunkData.length; a++) {
          const newArray2 = [];
          for (let c = 0; c < indexArray.length; c++) {
            newArray2.push(chunkData[a][indexArray[c]]);
          }
          newArray.push(newArray2);

          if (
            selectedLabelIndex > -1 &&
            chunkData[a][selectedLabelIndex] != null &&
            chunkData[a][selectedLabelIndex] != ''
          ) {
            flag.push(chunkData[a][selectedLabelIndex]);
          }
        }
        invalidCount = this.toCaculateInvalid(newArray);
      },
      complete: (result) => {
        if (this.datasetInfo.isHasHeader == 'yes') {
          flag = flag.slice(1);
          count = count - 1;
        }

        flag = _.uniq(flag);

        // to check this is a totally numeric flag or not
        const isNumeric = this.toCheckNumeric(flag) == 'no' ? false : true;
        this.totalCase = count;
        this.nonEnglish = invalidCount;
        this.dsDialogForm.get('totalRow').setValue(this.totalCase - this.nonEnglish);
        this.identifyCategory(selectedLabelIndex, isNumeric, flag);
        this.toEvenlyDistributeTicket();
      },
    });
  }

  sureSet() {
    this.errorMessage = '';
    this.infoMessage = '';
    this.toEvenlyDistributeTicket();
    if (this.env.config.enableAWSS3) {
      this.internalApiService.getCloudUrl(this.datasetInfo.dataSetId).subscribe(
        (res) => {
          this.papaParse(res);
        },
        (error) => {
          this.errorMessage = JSON.stringify(error);
          this.loading$.next(false);
        },
      );
    } else {
      // to read the file stream with set-data api
      this.papaParse(
        `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${this.datasetInfo.fileLocation}&token=${
          JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token
        }`,
      );
    }
  }

  setdata() {
    // user click the set data btn
    if (this.dsDialogForm.get('projectType').value === 'ner') {
      let nerLabel = [];
      for (let item of this.checkboxColumns) {
        if (item.labelChecked) {
          nerLabel.push(item.name);
        }
        if (item.helptextChecked) {
          this.selectDescription.push(item.name);
        }
      }
      this.checkboxChecked = nerLabel;
      this.helpfulText = this.selectDescription;
    } else {
      this.checkboxChecked = this.selectDescription;
    }
    // console.log(5555, this.dropdownSelected + '---' + this.checkboxChecked + '---' + this.helpfulText);
    this.sureSet();
  }

  createNewDataset() {
    this.wizardOpen = false;
    let obj = { showModal: true, fileFormat: this.dsDialogForm.get('projectType').value };
    this.msgCreateProjectPage = obj;
  }

  selectedItem(e) {
    this.clearFormdata(3);
    this.dropdownSelected = e;
    this.sortPreviewHeadDatas(this.previewHeadDatas);
  }

  selectDescriptionChanged(value) {
    // this value === this.selectDescription
    if (
      this.selectDescriptionCopy.sort().toString() != this.selectDescription.sort().toString() ||
      (this.selectDescriptionCopy.length == 0 && this.selectDescription.length == 0)
    ) {
      this.clearFormdata();
    }
  }

  changeCheckbox(data, from) {
    this.clearFormdata();
    let index = _.findIndex(this.checkboxColumns, function (o) {
      return o.name === data;
    });
    this.checkboxColumns[index][from] = !this.checkboxColumns[index][from];
  }

  uploadModalInfo(value) {
    if (value && value.datasetsName) {
      // receive child component msg that upload ok, next show wizard, call datasets, preview data
      this.wizardOpen = true;
      this.getMyDatasets(this.dsDialogForm.get('projectType').value).then((res) => {
        if (res) {
          this.dsDialogForm.get('selectedDataset').setValue(value.datasetsName);
          this.selectedDatasets({ target: { value: value.datasetsName } });
        }
      });
    }
  }

  onCloseUploadModal(value) {
    if (value) {
      // receive close or cancel modal
      this.wizardOpen = true;
    }
  }

  changeLabelType(e) {
    this.categoryListInfo = [{ name: '', setLableErrMessage: '' }];
    this.assignType = [
      { name: 'Email', value: 'email', checked: true },
      { name: 'Slack Channel', value: 'slack', checked: false },
    ];
    if (
      this.dsDialogForm.get('projectType').value === 'tabular' ||
      this.dsDialogForm.get('projectType').value === 'text'
    ) {
      this.categoryListInfo.push({ name: '', setLableErrMessage: '' });
    }

    if (e.target.value == 'numericLabel') {
      this.isShowNumeric = true;
      // this.isNumeric = true;
      this.isMutilNumericLabel = false;
      this.isUploadLabel = false;
      this.categoryListInfo = [{ min: '', max: '', setNumberErrMessage: '' }];
    } else if (e.target.value == 'mutilNumericLabel') {
      this.isMutilNumericLabel = true;
      this.isShowNumeric = false;
      this.isNumeric = false;
      // this.dsDialogForm.get('labels').setValidators(null);
      // this.dsDialogForm.get('labels').updateValueAndValidity();
      this.isUploadLabel = false;
      this.categoryListInfo = [
        { name: '', min: '', max: '', setLableErrMessage: '', setNumberErrMessage: '' },
        { name: '', min: '', max: '', setLableErrMessage: '', setNumberErrMessage: '' },
      ];
    } else if (e.target.value == 'uploadLabel') {
      this.isMultipleLabel = null;
      this.isShowNumeric = false;
      this.isNumeric = false;
      this.isMutilNumericLabel = false;
      this.isUploadLabel = true;
      // this.dsDialogForm.get('labels').setValidators(null);
      // this.dsDialogForm.get('labels').updateValueAndValidity();
    } else {
      this.dsDialogForm.get('multipleLabel').setValue('n');
      this.isMultipleLabel = null;
      this.isShowNumeric = false;
      this.isNumeric = false;
      this.isMutilNumericLabel = false;
      this.isUploadLabel = false;
    }
    this.clrWizardPageOnLoad('clr-wizard-page-4');
  }

  inputLabelUpdate(array, index) {
    if (_.filter(array, ['name', array[index].name.trim()]).length > 1) {
      array[index].setLableErrMessage = 'This label already exist!';
    } else {
      array[index].setLableErrMessage = '';
    }
    // to valid whether next is enable
    this.clrWizardPageOnLoad('clr-wizard-page-4');
  }

  inputMinUpdate(index) {
    if (Number(this.categoryListInfo[index].min) >= Number(this.categoryListInfo[index].max)) {
      this.categoryListInfo[index].setNumberErrMessage = 'The Min should less than the Max!';
    } else {
      this.categoryListInfo[index].setNumberErrMessage = '';
    }
    // to valid whether next is enable
    this.clrWizardPageOnLoad('clr-wizard-page-4');
  }

  inputMaxUpdate(index) {
    this.inputMinUpdate(index);
    // to valid whether next is enable
    this.clrWizardPageOnLoad('clr-wizard-page-4');
  }

  deleteLabelRow(index) {
    if (
      this.dsDialogForm.get('projectType').value === 'text' ||
      this.dsDialogForm.get('projectType').value === 'tabular'
    ) {
      if (this.categoryListInfo.length > 2) {
        this.categoryListInfo.splice(index, 1);
      }
    } else {
      if (this.categoryListInfo.length > 1) {
        this.categoryListInfo.splice(index, 1);
      }
    }
    // to valid whether next is enable
    this.clrWizardPageOnLoad('clr-wizard-page-4');
  }

  createNewLabelRow(array) {
    if (array.length < 50) {
      array.push({ name: '', setLableErrMessage: '' });
    }
  }

  recursionLabel(datas: any) {
    if (datas) {
      datas.forEach((item) => {
        if (item.children && item.children.length) {
          this.recursionLabel(item.children);
          item['enable'] = 1;
        } else {
          item['enable'] = 1;
        }
      });
      return datas;
    }
  }

  getChildren = (folder) => folder.children;

  receiveFile(val) {
    this.treeLabels = this.recursionLabel(val.data);
    this.clrWizardPageOnLoad('clr-wizard-page-4');
  }

  changeLabelFileFormat(format: string) {
    this.msgUploadFile.type = format;
    this.msgUploadFile = JSON.parse(JSON.stringify(this.msgUploadFile));
  }

  labelExpandChanged(e) {
    this.isExpandLabelTree = !this.isExpandLabelTree;
  }

  clickPopLabel() {
    this.showPopLabel = !this.showPopLabel;
  }

  inputSecondaryLabelUpdate(array, index) {
    this.inputLabelUpdate(array, index);
    // to valid whether next is enable
    this.clrWizardPageOnLoad('clr-wizard-page-4');
  }

  deleteSecondaryLabelRow(index) {
    if (this.popLabelList.length > 2) {
      this.popLabelList.splice(index, 1);
      // to valid whether next is enable
      this.clrWizardPageOnLoad('clr-wizard-page-4');
    }
  }

  createSecondaryLabelRow(array) {
    this.createNewLabelRow(array);
  }

  inputUserNameUpdate(array, index) {
    if (_.filter(array, ['email', array[index].email.trim()]).length > 1) {
      array[index].setUserErrMessage = 'This item already exist!';
    } else {
      array[index].setUserErrMessage = '';
    }
    if (!this.toolService.toRegEmail([array[index].email.trim()])) {
      array[index].emailReg = this.env.config.authUrl ? 'Wrong format! Only allow Vmware email box!' : 'Wrong format';
    } else {
      array[index].emailReg = '';
    }
    this.toEvenlyDistributeTicket();
    this.clrWizardPageOnLoad('clr-wizard-page-5');
  }

  toCheckAssigneeList() {
    let arr = [];
    for (let i = 0; i < this.assigneeList.length; i++) {
      if (!this.assigneeList[i].setUserErrMessage && !this.assigneeList[i].emailReg && this.assigneeList[i].email) {
        arr.push(this.assigneeList[i]);
      } else if (
        !this.assigneeList[i].setUserErrMessage &&
        !this.assigneeList[i].emailReg &&
        !this.assigneeList[i].email
      ) {
        continue;
      } else {
        return [];
      }
    }
    return arr;
  }

  toCheckSlackList() {
    let arr = [];
    for (let i = 0; i < this.slackList.length; i++) {
      if (!this.slackList[i].setUserErrMessage && this.slackList[i].slackId && this.slackList[i].slackName) {
        arr.push(this.slackList[i]);
      } else if (!this.slackList[i].setUserErrMessage && !this.slackList[i].slackId && !this.slackList[i].slackName) {
        continue;
      } else {
        return [];
      }
    }
    return arr;
  }

  inputTicketsUpdate(user) {
    if (this.toCheckAssigneeList().length > 0) {
      this.commonService.editAssignedNumber(
        user,
        this.dsDialogForm.get('totalRow').value,
        this.dsDialogForm.get('maxAnnotations').value,
        this.toCheckAssigneeList(),
      );
    }
  }

  deleteUserRow(index) {
    if (this.assigneeList.length > 1) {
      this.assigneeList.splice(index, 1);
      this.toEvenlyDistributeTicket();
      this.clrWizardPageOnLoad('clr-wizard-page-5');
    }
  }

  inputSlackUpdate(array, index: number) {
    if (array[index].slackId.trim()) {
      if (_.filter(array, ['slackId', array[index].slackId.trim()]).length > 1) {
        array[index].setUserErrMessage = 'This item already exist!';
      } else {
        array[index].setUserErrMessage = '';
        // to query this id
        this.validSlackChannel(array, index);
      }
    }
  }

  validSlackChannel(array, index: number) {
    array[index].loadingSlack = true;
    let params = {
      slackId: array[index].slackId,
    };
    this.internalApiService.validSlackChannel(params).subscribe((res) => {
      array[index].loadingSlack = false;
      if (res) {
        if (res.is_member) {
          array[index].slackName = res.name;
          array[index].inputSlackValidation = '';
        } else {
          array[index].slackName = '';

          array[
            index
          ].inputSlackValidation = `${this.env.config.slackAppName} not in this channel, please type '/invite @${this.env.config.slackAppName}' and send in this channel first.`;
        }
      } else {
        array[index].inputSlackValidation = "This channel doesn't exist!";
      }
      this.clrWizardPageOnLoad('clr-wizard-page-5');
    });
  }

  deleteSlackRow(index) {
    if (this.slackList.length > 1) {
      this.slackList.splice(index, 1);
      this.clrWizardPageOnLoad('clr-wizard-page-5');
    }
  }

  createEmailRow() {
    this.assigneeList.push({ email: '', setUserErrMessage: '' });
  }

  createSlackRow() {
    this.slackList.push({ slackId: '', slackName: '', setUserErrMessage: '' });
  }

  changeAssignType(e, index) {
    this.clrWizardPageOnLoad('clr-wizard-page-5');
  }

  changeMaxAnnotations() {
    this.toEvenlyDistributeTicket();
    this.clrWizardPageOnLoad('clr-wizard-page-5');
  }

  changeMultipleLabel() {
    this.assignType = [
      { name: 'Email', value: 'email', checked: true },
      { name: 'Slack Channel', value: 'slack', checked: false },
    ];
  }

  buildFormModel(): any {
    return JSON.parse(JSON.stringify(this.dsDialogForm.value));
  }

  categoryListInfoToCategoryList() {
    let arr = this.toCheckCategoryListInfo();
    if (this.dsDialogForm.get('projectType').value === 'ner') {
      return arr;
    } else {
      if (this.isShowNumeric) {
        return arr;
      } else if (this.isUploadLabel) {
        return this.treeLabels;
      } else {
        return arr;
      }
    }
  }

  public postLocalFile(dataset: DatasetData): Observable<any> {
    const formData = new FormData();
    formData.append('pname', this.dsDialogForm.value.projectName);
    formData.append('projectType', this.dsDialogForm.value.projectType);
    formData.append('taskInstruction', this.dsDialogForm.value.taskInstruction);
    formData.append('ticketDescription', this.dsDialogForm.value.annotationDisplayName);
    formData.append('annotationQuestion', this.dsDialogForm.value.annotationQuestion);
    formData.append('fileName', this.datasetInfo.fileName);
    formData.append('fileSize', this.datasetInfo.fileSize);
    formData.append('location', this.datasetInfo.fileLocation);
    formData.append('selectedDataset', this.dsDialogForm.value.selectedDataset);
    formData.append('header', JSON.stringify(this.previewHeadDatas));
    if (
      this.dsDialogForm.get('projectType').value !== 'image' &&
      this.dsDialogForm.get('projectType').value !== 'log'
    ) {
      formData.append('isHasHeader', this.datasetInfo.isHasHeader);
      formData.append(
        'selectDescription',
        this.dsDialogForm.get('projectType').value === 'ner'
          ? JSON.stringify([this.dropdownSelected])
          : JSON.stringify(this.checkboxChecked),
      );
      formData.append(
        'selectLabels',
        this.dsDialogForm.get('projectType').value === 'ner'
          ? JSON.stringify(this.checkboxChecked)
          : this.dropdownSelected,
      );
    }
    if (this.dsDialogForm.get('projectType').value === 'ner') {
      formData.append('ticketQuestions', JSON.stringify(this.helpfulText));
      formData.append('regression', this.checkboxChecked.length > 0 ? 'true' : 'false');
      if (this.showPopLabel && this.popLabelList.length > 0) {
        const popLabels = [];
        this.popLabelList.forEach((element) => {
          popLabels.push(element.name);
        });
        formData.append('popUpLabels', JSON.stringify(popLabels));
      }
    }
    formData.append('totalRows', this.dsDialogForm.value.totalRow);
    formData.append('slack', this.assignType[1].checked ? JSON.stringify(this.slackList) : '[]');
    formData.append('maxAnnotations', this.dsDialogForm.value.maxAnnotations);
    formData.append('assignmentLogic', this.dsDialogForm.value.assignmentLogic);
    formData.append('assignee', JSON.stringify(this.toCheckAssigneeList()));
    formData.append('min', this.categoryListInfoToCategoryList()[0].min);
    formData.append('max', this.categoryListInfoToCategoryList()[0].max);
    formData.append('estimator', this.dsDialogForm.value.selectedClassifier);
    formData.append('queryStrategy', this.dsDialogForm.value.selectedqueryStrategy);
    formData.append('encoder', this.dsDialogForm.value.selectedEncoder);
    formData.append(
      'labels',
      this.isMutilNumericLabel || this.isUploadLabel
        ? JSON.stringify(this.categoryListInfoToCategoryList())
        : this.categoryListInfoToCategoryList().join(','),
    );
    if (this.dsDialogForm.get('projectType').value === 'log') {
      formData.append('isShowFilename', this.dsDialogForm.get('isShowFilename').value === 'yes' ? 'true' : 'false');
    }
    formData.append(
      'isMultipleLabel',
      this.dsDialogForm.get('projectType').value == 'ner' ||
        this.dsDialogForm.get('projectType').value == 'image' ||
        this.dsDialogForm.get('projectType').value == 'log' ||
        this.isMutilNumericLabel ||
        this.isUploadLabel
        ? 'true'
        : this.dsDialogForm.value.multipleLabel == 'y'
        ? 'true'
        : 'false',
    );
    formData.append(
      'labelType',
      this.isShowNumeric || this.isMutilNumericLabel ? 'numericLabel' : this.isUploadLabel ? 'HTL' : 'textLabel',
    );
    return this.apiService.postDataset(formData);
  }

  toCreate() {
    if (
      (this.dsDialogForm.get('projectType').value == 'image' && this.clrWizardPageNextDisabled.page5) ||
      (this.dsDialogForm.get('projectType').value !== 'image' && this.clrWizardPageNextDisabled.page6)
    ) {
      return;
    }
    this.loading = true;
    const formModel = this.buildFormModel();
    const ds: DatasetData = formModel;
    this.postLocalFile(ds).subscribe(
      (res) => {
        if (res.status == 'success') {
          // send email
          if (this.env.config.enableSendEmail) {
            const param = {
              projectOwner: [this.user],
              pname: this.dsDialogForm.value.projectName,
              fileName: this.datasetInfo.fileName,
            };
            this.emailService.sendEmailToOwner(param);
          }
          this.loading = false;
          this.router.navigate(['loop/project/list']);
        }
      },
      (error) => {
        this.loading = false;
        this.errorMessage = 'Create project failed, please try again later! ' + JSON.stringify(error);
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      },
      () => {
        this.loading = false;
      },
    );
  }

  doCancel(): void {
    window.history.go(-1);
    this.wizard.close();
  }
}
