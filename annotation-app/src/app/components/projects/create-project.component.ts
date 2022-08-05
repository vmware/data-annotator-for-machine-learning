/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { Observable } from 'rxjs';
import { AvaService } from '../../services/ava.service';
import { FormValidatorUtil } from '../../shared/form-validators/form-validator-util';
import { DatasetData, UploadData } from '../../model/index';
import { UserAuthService } from '../../services/user-auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { DatasetUtil } from 'app/model/index';
import { DatasetValidator } from '../../shared/form-validators/dataset-validator';
import { Papa } from 'ngx-papaparse';
import * as _ from 'lodash';
// import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EnvironmentsService } from 'app/services/environments.service';
import { ToolService } from 'app/services/common/tool.service';
import { CommonService } from 'app/services/common/common.service';
import { EmailService } from 'app/services/common/email.service';

@Component({
  selector: 'app-create',
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.scss'],
})
export class CreateNewComponent implements OnInit {
  @Input()
  format = 'cvs';
  @ViewChild('labels', { static: false })
  labels: ElementRef;
  @ViewChild('assignee', { static: false })
  assignee: ElementRef;
  @ViewChild('popupLables', { static: false })
  popupLables: ElementRef;

  user: string;
  dsDialogForm: FormGroup;
  uploadGroup: FormGroup;
  loading: boolean;
  dataset: DatasetData;
  uploadSet: UploadData;
  addNewLabel: string;
  error: string;
  nameExist: boolean;
  datasetNameExist: boolean;
  emailReg: boolean;
  // this field controls whether or not to show the warning dialog for required fields
  showWarningDialogRequiredFields = false;
  assigneeList = [];
  categoryList = [];
  annotationComplete = 0;
  showAddNewDatasetDialog: boolean;
  isShowSetHeader: string;
  previewHeadDatas = [];
  previewContentDatas = [];
  previewTotalData = [];
  chooseLabel = [];
  pageSize: number;
  page: number;
  nonEnglish = 0;
  errorMessage = '';
  errorMessageTop = '';
  infoMessage: string;
  inputLabelValidation: boolean;
  inputAssigneeValidation: boolean;
  activeNew: number;
  activeOriginal: number;
  totalCase: number;
  overPerLabelLimit: boolean;
  dataSetId = '';
  inputFile: any;
  waitingTip = false;
  datasetsList = [];
  loadingPreviewData = false;
  fileName = '';
  isHasHeader = '';
  location = '';
  fileSize: any;
  showQueryDatasetDialog: boolean;
  minLabel: number;
  maxLabel: number;
  sizeError = false;
  isNumeric: boolean;
  labelType: string;
  isShowNumeric: boolean;
  isShowLabelRadio: boolean;
  classifier: any;
  projectType: string;
  msg: any;
  isChangeVariable: boolean;
  encoder: any;
  isMultipleLabel: boolean;
  fileLocation: string;
  assignTickets: object;
  isMutilNumericLabel: boolean;
  inputIsNull: boolean;
  popLabelList: any = [];
  showPopLabel: boolean;
  activePopNew: number;
  activePopOriginal: number;
  popLabelValidation: boolean;
  queryStrategyBase: any;
  slackList: any = [];
  inputSlackValidation: string;
  loadingSlack: boolean = false;
  isShowSlack: boolean = false;
  isUploadLabel: boolean = false;
  showUploadLabelDialog: boolean = false;
  treeLabels: any = [];
  showTreeLabelTip: any;
  showTreeView: boolean = false;
  treeData: any;
  isShowSetdataWizard: boolean = false;
  wizardData: any;
  dropdownSelected: string;
  checkboxChecked: any = [];
  helpfulText: any = [];

  constructor(
    private formBuilder: FormBuilder,
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private papa: Papa,
    public env: EnvironmentsService,
    private toolService: ToolService,
    private commonService: CommonService,
    private emailService: EmailService,
  ) {
    this.user = this.userAuthService.loggedUser().email;
    this.page = 1;
    this.pageSize = 10;
    this.route.params.subscribe((params) => {
      this.projectType = params.param;
      this.msg = {
        type: this.projectType,
        page: 'create',
      };
    });
  }

  ngOnInit(): void {
    this.loading = false;
    this.error = null;
    this.nameExist = false;
    this.datasetNameExist = false;
    this.emailReg = true;
    this.showAddNewDatasetDialog = false;
    this.inputLabelValidation = false;
    this.inputAssigneeValidation = false;
    this.overPerLabelLimit = false;
    this.popLabelValidation = false;
    this.showPopLabel = false;
    this.classifier = [
      { name: 'RandomForestClassifier', value: 'RFC' },
      { name: 'KNeighborsClassifier', value: 'KNC' },
      { name: 'GradientBoostingClassifier', value: 'GBC' },
    ];
    this.encoder = [
      { name: ' One-Hot Encoding', value: 'oneHot' },
      { name: 'Categorical Embeddings', value: 'embeddings' },
    ];
    this.queryStrategyBase = [
      { name: 'uncertainty_sampling', value: 'PB_UNS' },
      { name: 'margin_sampling', value: 'PB_MS' },
      { name: 'entropy_sampling', value: 'PB_ES' },
      { name: 'uncertainty_batch_sampling', value: 'RBM_UNBS' },
    ];
    this.createForm();
    this.getMyDatasets();
  }

  createForm(): void {
    if (!this.dataset) {
      this.dataset = DatasetUtil.init();
    }
    this.popLabelList = this.dataset.popLabels;
    this.dsDialogForm = this.formBuilder.group({
      projectName: [this.dataset.name || '', DatasetValidator.modelName()],
      taskInstruction: [this.dataset.description, null],
      maxAnnotations: [this.dataset.maxAnnotations, DatasetValidator.maxAnnotation()],
      labels: [this.dataset.labels, DatasetValidator.requiredTwo(this.projectType)],
      popLabels: [this.dataset.popLabels, DatasetValidator.requiredTwoPopLabel(this.projectType)],
      assignmentLogic: [this.dataset.assigmentLogic, ''],
      assignee: [this.dataset.assignee, DatasetValidator.required()],
      totalRow: [this.dataset.totalRow, DatasetValidator.validRow()],
      annotationDisplayName: [this.dataset.annotationDisplayName, DatasetValidator.required()],
      annotationQuestion: [
        this.msg.type == 'ner'
          ? 'Label all entity types in the given text corpus.'
          : this.dataset.annotationQuestion,
        DatasetValidator.required(),
      ],
      selectedDataset: ['', DatasetValidator.required()],
      min: [this.dataset.min, null],
      max: [this.dataset.max, null],
      selectedClassifier: ['', DatasetValidator.required()],
      selectedqueryStrategy: ['', DatasetValidator.required()],
      selectedEncoder: ['', DatasetValidator.required()],
      multipleLabel: [this.dataset.multipleLabel, null],
      isShowFilename: [this.dataset.isShowFilename, ''],
      mutilLabelArray: this.formBuilder.array([
        this.formBuilder.group({
          label: this.formBuilder.control(''),
          maxMutilVal: this.formBuilder.control(''),
          minMutilVal: this.formBuilder.control(''),
        }),
        this.formBuilder.group({
          label: this.formBuilder.control(''),
          maxMutilVal: this.formBuilder.control(''),
          minMutilVal: this.formBuilder.control(''),
        }),
      ]),
      slack: [this.dataset.slack, null],
    });
  }

  get mutilLabelArray() {
    return this.dsDialogForm.get('mutilLabelArray') as FormArray;
  }

  buildFormModel(): any {
    return JSON.parse(JSON.stringify(this.dsDialogForm.value));
  }

  onSubmit(event): void {
    if (event && 'submit'.includes(event.currentTarget.type)) {
      let condition: any;
      if (this.isNumeric) {
        this.labelType = 'numericLabel';
        this.validNumeirc();
        condition = !this.dsDialogForm.invalid && !this.nameExist && !this.sizeError;
      } else if (this.isMutilNumericLabel) {
        this.validBoth();
        condition =
          !this.dsDialogForm.invalid &&
          !this.nameExist &&
          !this.sizeError &&
          !this.inputLabelValidation &&
          !this.inputIsNull;
      } else if (this.isUploadLabel) {
        this.dsDialogForm.get('min').setValidators(null);
        this.dsDialogForm.get('max').setValidators(null);
        this.dsDialogForm.get('selectedEncoder').setValidators(null);
        this.dsDialogForm.get('min').updateValueAndValidity();
        this.dsDialogForm.get('max').updateValueAndValidity();
        this.dsDialogForm.get('selectedEncoder').updateValueAndValidity();
        this.dsDialogForm.get('selectedClassifier').setValue(null);
        this.dsDialogForm.get('selectedClassifier').setValidators(null);
        this.dsDialogForm.get('selectedClassifier').updateValueAndValidity();
        this.dsDialogForm.get('selectedqueryStrategy').setValue(null);
        this.dsDialogForm.get('selectedqueryStrategy').setValidators(null);
        this.dsDialogForm.get('selectedqueryStrategy').updateValueAndValidity();
        if (this.treeLabels.length > 0) {
          this.showTreeLabelTip = false;
          this.labelType = 'HTL';
          condition =
            !this.dsDialogForm.invalid &&
            !this.nameExist &&
            !this.sizeError &&
            !this.inputLabelValidation &&
            !this.inputIsNull;
        } else {
          this.showTreeLabelTip = true;
        }
      } else {
        this.labelType = 'textLabel';
        this.dsDialogFormValidationReset('min', undefined, null);
        this.dsDialogFormValidationReset('max', undefined, null);
        this.dsDialogFormValidationReset(
          'labels',
          undefined,
          DatasetValidator.requiredTwo(this.projectType),
        );
        this.dsDialogFormValidationReset(
          'selectedClassifier',
          undefined,
          DatasetValidator.required(),
        );

        this.dsDialogFormValidationReset(
          'selectedqueryStrategy',
          undefined,
          DatasetValidator.required(),
        );

        // ---start---to make email assign and channel assign is optional
        if (this.slackList.length > 0) {
          this.dsDialogFormValidationReset('assignee', undefined, null);
        }
        // ---end---to make email assign and channel assign is optional
        if (this.msg.type === 'text') {
          this.dsDialogFormValidationReset('selectedEncoder', null, null);
        }
        if (this.msg.type === 'tabular') {
          this.dsDialogFormValidationReset(
            'selectedEncoder',
            undefined,
            DatasetValidator.required(),
          );
        }
        if (this.msg.type === 'ner' || this.msg.type === 'log') {
          this.validNer();
        }
        if (this.msg.type === 'image') {
          this.validImageSubmit();
        }
        if (this.isMultipleLabel) {
          this.validMultiple();
        }

        this.dsDialogFormValidationReset('popLabels', undefined, null);
        if (this.showPopLabel) {
          this.dsDialogFormValidationReset(
            'popLabels',
            undefined,
            DatasetValidator.requiredTwoPopLabel(this.projectType),
          );
        }
        condition =
          !this.dsDialogForm.invalid &&
          !this.nameExist &&
          !this.inputSlackValidation &&
          !this.loadingSlack;
      }

      FormValidatorUtil.markControlsAsTouched(this.dsDialogForm);
      if (condition) {
        this.loading = true;
        const formModel = this.buildFormModel();
        const ds: DatasetData = formModel;
        this.postLocalFile(ds).subscribe(
          (res) => {
            if (res.status == 'success') {
              this.loading = false;
              this.dataSetId = '';
              this.router.navigate(['projects']);
              // send email
              if (this.env.config.enableSendEmail) {
                const param = {
                  projectOwner: [this.user],
                  pname: this.dsDialogForm.value.projectName,
                  fileName: this.fileName,
                };
                this.emailService.sendEmailToOwner(param);
              }
              this.fileName = '';
            }
          },
          (error) => {
            console.log('Error:', error);
            this.loading = false;
            this.errorMessageTop = 'Create project failed, please try again later!';
            setTimeout(() => {
              this.errorMessageTop = '';
            }, 5000);
          },
          () => {
            this.loading = false;
          },
        );
      }
    }
  }

  public postLocalFile(dataset: DatasetData): Observable<any> {
    const formData = new FormData();
    this.dsDialogForm
      .get('labels')
      .setValue(
        this.projectType === 'ner'
          ? [...this.categoryList, ...this.checkboxChecked]
          : this.categoryList,
      );
    formData.append('slack', JSON.stringify(this.slackList));
    formData.append('pname', this.dsDialogForm.value.projectName);
    formData.append('taskInstruction', this.dsDialogForm.value.taskInstruction);
    formData.append('maxAnnotations', this.dsDialogForm.value.maxAnnotations);
    formData.append('assignmentLogic', this.dsDialogForm.value.assignmentLogic);
    formData.append('assignee', JSON.stringify(this.dsDialogForm.value.assignee));
    formData.append(
      'selectDescription',
      this.msg.type === 'ner'
        ? JSON.stringify([this.dropdownSelected])
        : JSON.stringify(this.checkboxChecked),
    );
    formData.append(
      'selectLabels',
      this.msg.type === 'ner' ? JSON.stringify(this.checkboxChecked) : this.dropdownSelected,
    );

    formData.append('ticketQuestions', JSON.stringify(this.helpfulText));
    formData.append('header', JSON.stringify(this.previewHeadDatas));
    formData.append('isHasHeader', this.isHasHeader);
    formData.append('ticketDescription', this.dsDialogForm.value.annotationDisplayName);
    formData.append('annotationQuestion', this.dsDialogForm.value.annotationQuestion);
    formData.append('totalRows', this.dsDialogForm.value.totalRow);
    formData.append('fileName', this.fileName);
    formData.append('fileSize', this.fileSize);
    formData.append('location', this.location);
    formData.append('selectedDataset', this.dsDialogForm.value.selectedDataset);
    formData.append('min', this.dsDialogForm.value.min);
    formData.append('max', this.dsDialogForm.value.max);
    formData.append('estimator', this.dsDialogForm.value.selectedClassifier);
    formData.append('queryStrategy', this.dsDialogForm.value.selectedqueryStrategy);
    formData.append('projectType', this.projectType);
    formData.append('encoder', this.dsDialogForm.value.selectedEncoder);
    if (this.isMutilNumericLabel) {
      formData.append('isMultipleLabel', 'true');
      formData.append('labelType', 'numericLabel');
      const labels = [];
      this.mutilLabelArray.value.forEach((element) => {
        labels.push({
          [element.label]: [element.minMutilVal, element.maxMutilVal],
        });
      });
      formData.append('labels', JSON.stringify(labels));
    } else {
      formData.append('labelType', this.labelType);
      if (this.labelType !== 'HTL') {
        formData.append(
          'isMultipleLabel',
          this.msg.type == 'ner' || this.msg.type == 'image' || this.msg.type == 'log'
            ? true
            : this.dsDialogForm.value.multipleLabel,
        );
      }

      if (this.projectType === 'ner') {
        formData.append('labels', this.dsDialogForm.value.labels.join(','));
      } else {
        if (this.labelType !== 'HTL') {
          formData.append('labels', this.dsDialogForm.value.labels);
        }
      }
    }
    if (this.projectType === 'ner') {
      formData.append('regression', this.checkboxChecked.length > 0 ? 'true' : 'false');

      if (this.showPopLabel && this.dsDialogForm.value.popLabels.length > 0) {
        const popLabels = [];
        this.dsDialogForm.value.popLabels.forEach((element) => {
          popLabels.push(element.name);
        });
        formData.append('popUpLabels', JSON.stringify(popLabels));
      }
    }
    if (this.projectType === 'log') {
      formData.append(
        'isShowFilename',
        JSON.stringify(this.dsDialogForm.get('isShowFilename').value),
      );
    }
    if (this.labelType === 'HTL') {
      formData.append('labels', JSON.stringify(this.treeLabels));
      formData.append('isMultipleLabel', 'true');
    }
    return this.avaService.postDataset(formData);
  }

  onKeydown(e) {
    e.stopPropagation();
  }

  inputProjectBlur(e) {
    const param = {
      pname: e.target.value,
    };
    if (e.target.value != '') {
      this.avaService.findProjectName(param).subscribe((res) => {
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

  onEnterLabel(e) {
    this.updateLabel(e);
  }

  labelsBlur(e: any) {
    this.updateLabel(e.target.value);
  }

  updateLabel(data) {
    if (data && this.inputLabelValidation == false) {
      this.categoryList.push(data);
      if (this.projectType === 'ner') {
        this.dsDialogForm.get('labels').setValue([...this.categoryList, ...this.checkboxChecked]);
      } else {
        this.dsDialogForm.get('labels').setValue(this.categoryList);
      }
      this.labels.nativeElement.value = null;
    }
  }

  assigneeBlur(e: any) {
    this.toRegEmail(e.target.value);
  }

  onEnter(e) {
    this.toRegEmail(e);
  }

  toRegEmail(value) {
    const emails = value.split(/,|;/);
    this.emailReg = this.toolService.toRegEmail(emails);
    if (this.emailReg && this.inputAssigneeValidation == false) {
      emails.forEach((element) => {
        if (_.filter(this.assigneeList, ['email', element.trim()]).length === 0) {
          this.assigneeList.push({ email: element.trim(), assignedCase: 0 });
        }
      });
      this.dsDialogForm.get('assignee').setValue(this.assigneeList);
      this.toEvenlyDistributeTicket();
      this.assignee.nativeElement.value = null;
    }
    if (this.assigneeList.length != 0) {
      this.emailReg = true;
    }
  }

  deleteAssignee(index) {
    this.assigneeList.splice(index, 1);
    this.dsDialogForm.get('assignee').setValue(this.assigneeList);
    this.toEvenlyDistributeTicket();
    if (this.assigneeList.length != 0) {
      this.emailReg = true;
    }
  }

  editAssignedTickets(data) {
    this.commonService.editAssignedNumber(
      data,
      this.dsDialogForm.get('totalRow').value,
      this.dsDialogForm.get('maxAnnotations').value,
      this.assigneeList,
    );
  }

  onAddingDataset(event) {
    this.showAddNewDatasetDialog = true;
  }

  receiveErrorMessageInfo(e) {
    this.showAddNewDatasetDialog = false;
    this.errorMessageTop = e;
    setTimeout(() => {
      this.errorMessageTop = '';
    }, 10000);
  }

  receiveUploadCloseInfo(e) {
    this.showAddNewDatasetDialog = false;
  }

  receiveUploadSuccessInfo(e) {
    this.isShowSetHeader = e.isShowSetHeader;
    this.nonEnglish = 0;
    this.chooseLabel = [];
    this.previewHeadDatas = [];
    this.previewContentDatas = [];
    this.totalCase = 0;
    this.previewTotalData = [];
    this.dsDialogForm.get('totalRow').setValue(0);
    this.dsDialogForm.get('labels').setValue([]);
    this.dsDialogForm.get('min').setValue(null);
    this.dsDialogForm.get('max').setValue(null);
    this.dsDialogForm.get('multipleLabel').setValue(null);
    this.isMultipleLabel = null;
    this.dsDialogForm.get('isShowFilename').setValue(false);
    this.categoryList = [];
    this.minLabel = null;
    this.maxLabel = null;
    this.labelType = '';
    this.isNumeric = null;
    this.isShowNumeric = false;
    this.dropdownSelected = null;
    this.checkboxChecked = [];
    this.helpfulText = [];
    this.isHasHeader = '';
    this.showAddNewDatasetDialog = false;
    this.infoMessage = 'Upload success.';
    this.dsDialogForm.get('selectedDataset').setValue(e.dataSetName);
    this.dataSetId = e.dataSetId;
    this.fileLocation = e.location;
    this.fileName = e.fileName;
    this.fileSize = e.fileSize;
    this.previewHeadDatas = e.previewHeadDatas;
    this.previewContentDatas = e.previewContentDatas;
    if (this.msg.type == 'image' && e.images && e.images.length > 0) {
      this.previewContentDatas.forEach((element) => {
        element.fileSize = (element.fileSize / 1024).toFixed(2);
        if (!this.env.config.enableAWSS3) {
          element.location = `${
            this.env.config.annotationService
          }/api/v1.0/datasets/set-data?file=${element.location}&token=${
            JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token.access_token
          }`;
        }
      });
      this.dsDialogForm.get('totalRow').setValue(e.images.length);
    } else if (this.msg.type == 'log') {
      this.location = e.location;
      this.dsDialogForm.get('totalRow').setValue(e.totalRows);
    } else {
      this.chooseLabel = e.chooseLabel;
      this.isHasHeader = e.isHasHeader;
      this.location = e.location;
      // open wizard and reset
      this.openWizard();
    }
    this.toEvenlyDistributeTicket();
    this.getMyDatasets();
    setTimeout(() => {
      this.infoMessage = '';
    }, 10000);
  }

  selectedDatasets(e) {
    this.clearFormdata();
    this.datasetsList.forEach((dataset) => {
      if (dataset.dataSetName === e.target.value) {
        const choosedDataset = dataset;
        this.dataSetId = choosedDataset.id;
        this.fileName = choosedDataset.fileName;
        this.fileSize = choosedDataset.fileSize;
        this.loadingPreviewData = true;
        this.isShowSetHeader = choosedDataset.format;
        this.fileLocation = choosedDataset.location;

        if (this.msg.type == 'image' && choosedDataset.format == 'image') {
          this.previewHeadDatas = ['Id', 'ImageName', 'ImageSize(KB)', 'Image'];
          let a = 0;
          let flag = JSON.parse(JSON.stringify(choosedDataset.topReview));
          flag.forEach((element) => {
            element.fileSize = (element.fileSize / 1024).toFixed(2);
            if (this.env.config.enableAWSS3) {
              const img = new Image();
              let m = this;
              img.src = element.location;
              img.onload = function () {
                a++;
                if (a == Math.round(flag.length / 2)) {
                  m.loadingPreviewData = false;
                }
              };
            } else {
              element.location = `${
                this.env.config.annotationService
              }/api/v1.0/datasets/set-data?file=${element.location}&token=${
                JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token.access_token
              }`;
              this.loadingPreviewData = false;
            }
          });
          this.previewContentDatas = flag;
          this.dsDialogForm.get('totalRow').setValue(choosedDataset.images.length);
        } else if (choosedDataset.format == 'txt') {
          this.previewHeadDatas = ['FileName', 'FileContent'];
          this.previewContentDatas = choosedDataset.topReview;
          this.dsDialogForm.get('totalRow').setValue(choosedDataset.totalRows);
          this.location = choosedDataset.location;
          this.loadingPreviewData = false;
        } else {
          this.previewHeadDatas = choosedDataset.topReview.header;
          this.previewContentDatas = choosedDataset.topReview.topRows;
          this.isHasHeader = choosedDataset.hasHeader;
          this.location = choosedDataset.location;
          this.chooseLabel = choosedDataset.topReview.header;
          this.loadingPreviewData = false;
          // open wizard and reset
          this.openWizard();
        }
        this.toEvenlyDistributeTicket();
        return;
      }
    });
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
  }

  identifyCategory(selectedLabelIndex, isNumeric, flag) {
    if (selectedLabelIndex > -1 && !isNumeric) {
      this.isNumeric = false;
      if (flag.length > 50) {
        this.totalCase = 0;
        this.nonEnglish = 0;
        this.dsDialogForm.get('totalRow').setValue(0);
        this.inputMsgTOWizard(
          false,
          'Set data failed! Your selected label column has more than 50 different labels, please select one new label column that has less than or equal to 50 labels then to set date.',
        );
        return;
      }
      for (let d = 0; d < flag.length; d++) {
        if (flag[d] == null || String(flag[d]).trim() == '') {
          flag.splice(d, 1);
        }
        if (flag[d].length > 50) {
          this.overPerLabelLimit = true;
          const sliceStr = flag[d].slice(0, 50);
          flag.splice(d, 1, sliceStr);
        }
      }
      this.categoryList = flag;
      this.dsDialogForm.get('labels').setValue(this.categoryList);
    } else if (selectedLabelIndex > -1 && isNumeric) {
      this.isNumeric = true;
      this.minLabel = _.min(flag);
      this.maxLabel = _.max(flag);
      this.dsDialogForm.get('min').setValue(this.minLabel);
      this.dsDialogForm.get('max').setValue(this.maxLabel);
      this.isShowNumeric = true;
    }
    if (this.projectType === 'ner') {
      this.dsDialogForm.get('labels').setValue([...this.categoryList, ...this.checkboxChecked]);
    }
    this.toEvenlyDistributeTicket();
    this.inputMsgTOWizard(
      true,
      this.overPerLabelLimit
        ? 'Set data alert! Please be aware of that some label in your selected label column which has more than 50 characters has been truncated.'
        : null,
    );
  }

  public papaParse(location) {
    let flag = [];
    let count = 0;
    let invalidCount = 0;
    let indexArray = [];
    let textArray = this.checkboxChecked;
    let selectedLabelIndex = this.previewHeadDatas.indexOf(this.dropdownSelected);
    if (this.projectType === 'ner') {
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
        console.log('parse_error: ', error);
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
        if (this.isHasHeader == 'yes') {
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
      },
    });
  }

  sureSet() {
    this.clearFormdata('set-data');
    this.toEvenlyDistributeTicket();
    if (this.env.config.enableAWSS3) {
      this.avaService.getCloudUrl(this.dataSetId).subscribe(
        (res) => {
          this.papaParse(res);
        },
        (error) => {
          console.log('Error:', error);
          this.inputMsgTOWizard(false, `Set data failed! ${error.message}`);
        },
      );
    } else {
      // to read the file stream with set-data api
      this.papaParse(
        `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
          this.fileLocation
        }&token=${
          JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token.access_token
        }`,
      );
    }
  }

  onLabelKeydown(e) {
    if (this.projectType === 'ner') {
      if (this.dsDialogForm.value.labels.indexOf(e.target.value) !== -1) {
        this.inputLabelValidation = true;
      } else {
        this.inputLabelValidation = false;
      }
    } else {
      if (this.categoryList.indexOf(e.target.value) !== -1) {
        this.inputLabelValidation = true;
      } else {
        this.inputLabelValidation = false;
      }
    }
  }

  onAssigneeKeydown(e) {
    let flag = _.filter(this.assigneeList, ['email', e.target.value]);
    if (flag.length > 0) {
      this.inputAssigneeValidation = true;
    } else {
      this.inputAssigneeValidation = false;
    }
  }

  overLabels(index, from) {
    if (from === 'new') {
      this.activeNew = index;
    } else {
      this.activeOriginal = index;
    }
  }

  outLabels(index, from) {
    if (from === 'new') {
      this.activeNew = null;
    } else {
      this.activeOriginal = null;
    }
  }

  deleteLabel(index, from) {
    if (from === 'new') {
      this.categoryList.splice(index, 1);
    } else {
      this.checkboxChecked.splice(index, 1);
    }
    this.dsDialogForm
      .get('labels')
      .setValue(
        this.projectType === 'ner'
          ? [...this.categoryList, ...this.checkboxChecked]
          : this.categoryList,
      );
  }

  private getMyDatasets(params?: any) {
    const a =
      this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'ner'
        ? 'csv'
        : this.projectType == 'image'
        ? 'image'
        : 'txt';
    this.avaService.getMyDatasets(a).subscribe(
      (res) => {
        if (this.msg.type == 'image') {
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
      },
      (error: any) => {
        console.log(error);
      },
    );
  }

  // to supercollider
  // onQuerySQL() {
  //   this.showQueryDatasetDialog = true;
  // }

  // onAddedDataset(e) {
  //   if (e && e.dataSetName != undefined) {
  //     const param = {
  //       target: { value: e.dataSetName },
  //     };
  //     const a =
  //       this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'ner'
  //         ? 'csv'
  //         : this.projectType == 'image'
  //         ? 'image'
  //         : 'txt';
  //     this.avaService.getMyDatasets(a).subscribe(
  //       (res) => {
  //         this.datasetsList = res;
  //         this.dsDialogForm.get('selectedDataset').setValue(e.dataSetName);
  //         this.showQueryDatasetDialog = false;
  //         this.selectedDatasets(param);
  //       },
  //       (error: any) => {
  //         console.log(error);
  //       },
  //     );
  //   } else {
  //     this.showQueryDatasetDialog = false;
  //     this.errorMessageTop = 'Get datasets from supercollider filed, please try again later!';
  //     setTimeout(() => {
  //       this.errorMessageTop = '';
  //     }, 5000);
  //   }
  // }

  // receiveCloseInfo(e) {
  //   this.showQueryDatasetDialog = false;
  // }

  checkBoth() {
    if (this.mutilLabelArray.value.length) {
      this.sizeError = this.mutilLabelArray.value.some(
        (item) =>
          !DatasetValidator.isInvalidNumber(item.minMutilVal) &&
          !DatasetValidator.isInvalidNumber(item.maxMutilVal) &&
          Number(item.minMutilVal) >= Number(item.maxMutilVal),
      );
      this.inputIsNull = this.mutilLabelArray.value.some(
        (item) =>
          DatasetValidator.isInvalidNumber(item.minMutilVal) ||
          DatasetValidator.isInvalidNumber(item.maxMutilVal) ||
          !item.label,
      );
    }
  }

  minMaxUpdate(e, from?) {
    if (this.isMutilNumericLabel) {
      this.checkBoth();
    } else {
      from === 'min' ? (this.minLabel = e.target.value) : (this.maxLabel = e.target.value);
      if (_.intersection([this.minLabel, this.maxLabel], ['', undefined, null]).length > 0) {
        this.sizeError = true;
      } else {
        this.sizeError = Number(this.minLabel) >= Number(this.maxLabel);
      }
    }
  }

  changeLabelType(e) {
    if (e.target.value == 'numericLabel') {
      this.isShowNumeric = true;
      this.isNumeric = true;
      this.isMutilNumericLabel = false;
      this.isUploadLabel = false;
    } else if (e.target.value == 'mutilNumericLabel') {
      this.isMutilNumericLabel = true;
      this.isShowNumeric = false;
      this.isNumeric = false;
      this.dsDialogForm.get('labels').setValidators(null);
      this.dsDialogForm.get('labels').updateValueAndValidity();
      this.isUploadLabel = false;
    } else if (e.target.value == 'uploadLabel') {
      this.isMultipleLabel = null;
      this.isShowNumeric = false;
      this.isNumeric = false;
      this.isMutilNumericLabel = false;
      this.isUploadLabel = true;
      this.dsDialogForm.get('labels').setValidators(null);
      this.dsDialogForm.get('labels').updateValueAndValidity();
    } else {
      this.dsDialogForm.get('multipleLabel').setValue(null);
      this.isMultipleLabel = null;
      this.isShowNumeric = false;
      this.isNumeric = false;
      this.isMutilNumericLabel = false;
      this.isUploadLabel = false;
    }
  }

  isMultiple(e) {
    this.isMultipleLabel = e.target.checked;
    this.dsDialogForm.get('multipleLabel').setValue(this.isMultipleLabel);
  }

  validNumeirc() {
    this.dsDialogFormValidationReset('selectedClassifier', null, null);
    this.dsDialogFormValidationReset('selectedqueryStrategy', null, null);
    this.dsDialogFormValidationReset('selectedEncoder', null, null);
    this.dsDialogFormValidationReset('labels', undefined, null);
    this.slackList = [];
    this.dsDialogFormValidationReset('assignee', undefined, DatasetValidator.required());
    if (_.intersection([this.minLabel, this.maxLabel], ['', undefined, null]).length > 0) {
      this.sizeError = true;
    } else {
      this.sizeError = Number(this.minLabel) >= Number(this.maxLabel);
    }
  }

  validBoth() {
    this.dsDialogFormValidationReset('selectedClassifier', null, null);
    this.dsDialogFormValidationReset('selectedqueryStrategy', null, null);
    this.dsDialogFormValidationReset('selectedEncoder', null, null);
    this.dsDialogFormValidationReset('min', undefined, null);
    this.dsDialogFormValidationReset('max', undefined, null);
    this.dsDialogFormValidationReset('labels', undefined, null);
    this.slackList = [];
    this.dsDialogFormValidationReset('assignee', undefined, DatasetValidator.required());
    this.checkBoth();
  }

  validMultiple() {
    this.dsDialogFormValidationReset('selectedClassifier', null, null);
    this.dsDialogFormValidationReset('selectedqueryStrategy', null, null);
    this.dsDialogFormValidationReset('selectedEncoder', null, null);
    this.slackList = [];
    this.dsDialogFormValidationReset('assignee', undefined, DatasetValidator.required());
  }

  validNer() {
    this.validMultiple();
    this.dsDialogForm.get('maxAnnotations').setValue(1);
  }

  validImageSubmit() {
    this.validMultiple();
    this.dsDialogForm.get('maxAnnotations').setValue(1);
  }

  changeMaxAnnotations() {
    this.toEvenlyDistributeTicket();
  }

  toEvenlyDistributeTicket() {
    if (this.assigneeList.length > 0) {
      this.assigneeList.forEach((item) => {
        item.isModify = false;
      });
      this.commonService.evenlyDistributeTicket(
        this.assigneeList,
        this.dsDialogForm.get('totalRow').value,
        this.dsDialogForm.get('maxAnnotations').value,
      );
    }
  }

  onMutilLabelKeydown() {
    let labelValues = [];
    if (this.mutilLabelArray.value.length) {
      this.mutilLabelArray.value.forEach((ele) => {
        labelValues.push(ele.label);
      });
    }
    this.inputIsNull = labelValues.filter((item) => item).length !== this.mutilLabelArray.length;
    this.inputLabelValidation = DatasetValidator.isRepeatArr(labelValues);
  }

  addMutilLabel() {
    this.mutilLabelArray.push(this.newMutliLabel());
  }

  newMutliLabel(): FormGroup {
    return this.formBuilder.group({
      label: this.formBuilder.control(''),
      maxMutilVal: this.formBuilder.control(''),
      minMutilVal: this.formBuilder.control(''),
    });
  }

  deleteMutilLabel(delIndex) {
    this.mutilLabelArray.removeAt(delIndex);
    if (this.mutilLabelArray.value.length) {
      this.checkBoth();
    }
  }

  clickPopLabel() {
    this.showPopLabel = !this.showPopLabel;
  }

  deletePopLabel(index, from) {
    if (from === 'new') {
      this.popLabelList.splice(index, 1);
      this.dsDialogForm.get('popLabels').setValue([...this.popLabelList]);
    }
  }

  onEnterPopLabel(e) {
    this.updatePopLabel(e);
  }

  poplabelsBlur(e: any) {
    this.updatePopLabel(e.target.value);
  }

  updatePopLabel(data) {
    if (data && this.popLabelValidation == false) {
      if (this.projectType === 'ner') {
        this.popLabelList.push({ name: data });
        this.dsDialogForm.get('popLabels').setValue([...this.popLabelList]);
      }
      this.popupLables.nativeElement.value = null;
    }
  }

  overPopLabels(index, from) {
    if (from === 'new') {
      this.activePopNew = index;
    } else {
      this.activePopOriginal = index;
    }
  }

  outPopLabels(index, from) {
    if (from === 'new') {
      this.activePopNew = null;
    } else {
      this.activePopOriginal = null;
    }
  }

  onPopLabelKeydown(e) {
    if (this.projectType === 'ner') {
      const aa = [];
      const bb = this.dsDialogForm.value.popLabels;
      bb.forEach((e) => {
        aa.push(e.name);
      });
      if (aa.indexOf(e.target.value) !== -1) {
        this.popLabelValidation = true;
      } else {
        this.popLabelValidation = false;
      }
    } else {
      if (this.popLabelList.indexOf(e.target.value) !== -1) {
        this.popLabelValidation = true;
      } else {
        this.popLabelValidation = false;
      }
    }
  }

  receiveSlackAssign(e) {
    this.slackList = e.slackList;
    this.loadingSlack = e.loadingSlack;
    this.inputSlackValidation = e.inputSlackValidation;
  }

  dsDialogFormValidationReset(form: string, value: any, validator: any) {
    if (value === null) {
      this.dsDialogForm.get(form).setValue(value);
    }
    this.dsDialogForm.get(form).setValidators(validator);
    this.dsDialogForm.get(form).updateValueAndValidity();
  }

  uploadLabels() {
    this.showUploadLabelDialog = true;
  }

  uploadLabelsErr(event) {
    this.showUploadLabelDialog = false;
    this.errorMessageTop = event;
    setTimeout(() => {
      this.errorMessageTop = '';
    }, 10000);
  }

  uploadLabelsCloseInfo() {
    this.showUploadLabelDialog = false;
  }

  uploadLabelsSuccessInfo(event) {
    this.treeLabels = this.recursionLabel(event.data);
    this.showUploadLabelDialog = false;
    this.showTreeLabelTip = false;
  }

  recursionLabel(datas: any) {
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

  getChildren = (folder) => folder.children;

  clickTreeView(data) {
    this.showTreeView = true;
    this.treeData = data;
  }

  onCloseTreeDialog() {
    this.showTreeView = false;
  }

  openWizard() {
    this.isShowSetdataWizard = true;
    this.wizardData = {
      previewHeadDatas: this.previewHeadDatas,
      previewContentDatas: this.previewContentDatas,
      csvHeaders: this.chooseLabel,
      projectType: this.projectType,
      dropdownSelected: this.dropdownSelected,
      checkboxChecked: this.checkboxChecked,
      helpfulText: this.helpfulText,
    };
  }

  closeWizard() {
    this.isShowSetdataWizard = false;
  }
  
  receiveWizardInfo(e) {
    this.dropdownSelected = e.dropdownSelected;
    this.checkboxChecked = e.checkboxChecked;
    this.helpfulText = e.helpfulText ? e.helpfulText : [];
    this.sureSet();
  }

  inputMsgTOWizard(code, msg?) {
    // to close wizard
    if (this.projectType !== 'ner') {
      if (this.dropdownSelected === 'No Labels') {
        this.isShowLabelRadio = true;
      } else {
        this.isShowLabelRadio = false;
      }
    }
    this.wizardData['status'] = { ok: code, msg };
    let wizardDataCopy = _.cloneDeep(this.wizardData);
    this.wizardData = wizardDataCopy;
  }

  clearFormdata(from?) {
    if (from !== 'set-data') {
      this.chooseLabel = [];
      this.previewHeadDatas = [];
      this.previewContentDatas = [];
      this.dropdownSelected = null;
      this.checkboxChecked = [];
      this.helpfulText = [];
    }
    if (this.projectType !== 'ner') {
      this.dsDialogForm.get('labels').setValue([]);
      this.categoryList = [];
    }
    this.isShowLabelRadio = false;
    this.nonEnglish = 0;
    this.totalCase = 0;
    this.previewTotalData = [];
    this.dsDialogForm.get('totalRow').setValue(0);
    this.minLabel = null;
    this.maxLabel = null;
    this.dsDialogForm.get('min').setValue(null);
    this.dsDialogForm.get('max').setValue(null);
    this.labelType = '';
    this.isNumeric = null;
    this.isShowNumeric = false;
    this.dsDialogForm.get('multipleLabel').setValue(null);
    this.isMultipleLabel = null;
    this.dsDialogForm.get('isShowFilename').setValue(false);
    this.isMutilNumericLabel = false;
    this.isUploadLabel = false;
    this.dsDialogForm.get('mutilLabelArray').reset();
    while (this.mutilLabelArray.length > 2) {
      this.mutilLabelArray.removeAt(2);
    }
  }
}
