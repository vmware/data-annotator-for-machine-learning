/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, Output, EventEmitter, Renderer2 } from "@angular/core";
import { FormGroup, FormBuilder } from "@angular/forms";
import { Observable, Subject } from "rxjs";
import { AvaService } from "../../services/ava.service";
import { FormValidatorUtil } from "../../shared/form-validators/form-validator-util";
import { DatasetData, Dataset, UploadData } from "../../model/index";
import { UserAuthService } from "../../services/user-auth.service";
import { Router, ActivatedRoute } from "@angular/router";
import { ViewChild, ElementRef } from "@angular/core";
import "rxjs/Rx";
import { DatasetUtil } from "app/model/index";
import { DatasetValidator } from "../../shared/form-validators/dataset-validator";
import { Papa } from "ngx-papaparse";
import * as _ from "lodash";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { EnvironmentsService } from "app/services/environments.service";

@Component({
  selector: "app-create",
  templateUrl: "./create-project.component.html",
  styleUrls: ["./create-project.component.scss"]
})
export class CreateNewComponent implements OnInit {
  @Output("onAddedDataset")
  onAddedDsEmitter: EventEmitter<Dataset> = new EventEmitter<Dataset>();
  @Input()
  format: string = "cvs";
  @ViewChild("labels", { static: false })
  labels: ElementRef;
  @ViewChild("assignee", { static: false })
  assignee: ElementRef;

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
  showWarningDialogRequiredFields: boolean = false;
  assigneeList = [];
  categoryList = [];
  annotationComplete: number = 0;
  showAddNewDatasetDialog: boolean;
  isShowSetHeader: string;
  previewHeadDatas = [];
  previewContentDatas = [];
  previewTotalData = [];
  descriptions = [];
  chooseLabel = [];
  selectDescription = [];
  selectColumns = [];
  pageSize: number;
  page: number;
  uploadComplete: boolean;
  nonEnglish = 0;
  errorMessage: string = "";
  errorMessageTop: string = "";
  infoMessage: string;
  inputLabelValidation: boolean;
  inputAssigneeValidation: boolean;
  activeNew: number;
  activeOriginal: number;
  totalCase: number;
  setDataDialog: boolean;
  overPerLabelLimit: boolean;
  overMaxLabelLimit: boolean;
  setDataComplete: boolean;
  dataSetId: string = "";
  uploadErrorTip: boolean;
  inputFile: any;
  waitingTip: boolean = false;
  datasetsList = [];
  loadingSetData: boolean = false;
  loadingPreviewData: boolean = false;
  fileName: string = "";
  isHasHeader: string = "";
  changeSetData: boolean = false;
  changePreview: boolean = false;
  location: string = "";
  fileSize: any;
  isSelectWrongColumn: boolean;
  showQueryDatasetDialog: boolean;
  userQuestionUpdate = new Subject<string>();
  minLabel: number;
  maxLabel: number;
  sizeError: boolean = false;
  isNumeric: boolean;
  labelType: string;
  isShowNumeric: boolean;
  isShowLabelRadio: boolean;
  classifier: any;
  projectType: string;
  columnInfo: any = [];
  msg: any;
  isChangeVariable: boolean;
  encoder: any;
  isMultipleLabel: boolean;


  constructor(
    private formBuilder: FormBuilder,
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private el: ElementRef,
    private router: Router,
    private route: ActivatedRoute,
    private papa: Papa,
    private renderer2: Renderer2,
    private env: EnvironmentsService

  ) {
    this.user = this.userAuthService.loggedUser().email;
    this.page = 1;
    this.pageSize = 10;
    this.route.params.subscribe(params => {
      this.projectType = params.param;
      this.msg = {
        type: this.projectType,
        page: 'create'
      }
    });

    this.userQuestionUpdate
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((value) => {
        if (value != "") {
          this.checkDatasetName(value);
        } else {
          this.nameExist = false;
        }
      });

  }

  ngOnInit(): void {
    this.loading = false;
    this.error = null;
    this.nameExist = false;
    this.datasetNameExist = false;
    this.emailReg = true;
    this.showAddNewDatasetDialog = false;
    this.uploadComplete = false;
    this.inputLabelValidation = false;
    this.inputAssigneeValidation = false;
    this.setDataDialog = false;
    this.overMaxLabelLimit = false;
    this.overPerLabelLimit = false;
    this.setDataComplete = false;
    this.uploadErrorTip = false;
    this.classifier = [{ name: "RandomForestClassifier", value: "RFC" }, { name: "KNeighborsClassifier", value: "KNC" }, { name: "GradientBoostingClassifier", value: "GBC" }];
    this.encoder = [{ name: " One-Hot Encoding", value: "oneHot" }, { name: "Categorical Embeddings", value: "embeddings" }];
    this.createForm();
    this.getMyDatasets();
  }

  createForm(): void {
    if (!this.dataset) {
      this.dataset = DatasetUtil.init();
    }
    this.dsDialogForm = this.formBuilder.group({
      projectName: [this.dataset.name || "", DatasetValidator.modelName()],
      taskInstruction: [this.dataset.description, null],
      maxAnnotations: [this.dataset.maxAnnotations, DatasetValidator.maxAnnotation()],
      labels: [this.dataset.labels, DatasetValidator.requiredTwo(this.projectType)],
      assignmentLogic: [this.dataset.assigmentLogic, ""],
      assignee: [this.dataset.assignee, DatasetValidator.required()],
      selectDescription: [this.dataset.selectDescription, ""],
      selectLabels: [this.dataset.selectLabels, ""],
      totalRow: [this.dataset.totalRow, DatasetValidator.validRow()],
      annotationQuestion: [this.msg.type == 'ner' ? 'Label all entity types in the given text corpus.' : this.dataset.annotationQuestion, DatasetValidator.required()],
      selectedDataset: ["", DatasetValidator.required()],
      min: [this.dataset.min, DatasetValidator.minNumber()],
      max: [this.dataset.max, DatasetValidator.minNumber()],
      selectedClassifier: ["", DatasetValidator.required()],
      selectedEncoder: ["", DatasetValidator.required()],
      multipleLabel: [this.dataset.multipleLabel, null],
      selectedText: [this.dataset.selectedText, ""],
      isShowFilename: [this.dataset.isShowFilename, ""]
    });
  }


  buildFormModel(): any {
    let formModel = JSON.parse(JSON.stringify(this.dsDialogForm.value));
    return formModel;
  }

  onSubmit(event): void {
    if (event && "submit".includes(event.currentTarget.type)) {
      let condition;
      if (this.isNumeric) {
        this.labelType = 'numericLabel';
        this.validNumeirc();
        condition = !this.dsDialogForm.invalid && this.nameExist == false && this.sizeError == false
      } else {
        this.labelType = 'textLabel';
        this.dsDialogForm.get("min").setValidators(null);
        this.dsDialogForm.get("max").setValidators(null);
        this.dsDialogForm.get("labels").setValidators(DatasetValidator.requiredTwo(this.projectType));
        this.dsDialogForm.get("labels").updateValueAndValidity();
        this.dsDialogForm.get("min").updateValueAndValidity();
        this.dsDialogForm.get("max").updateValueAndValidity();
        if (this.msg.type === 'text') {
          this.dsDialogForm.get("selectedEncoder").setValue(null);
          this.dsDialogForm.get("selectedEncoder").setValidators(null);
          this.dsDialogForm.get("selectedEncoder").updateValueAndValidity();
        };
        if (this.msg.type === 'tabular') {
          this.dsDialogForm.get("selectedEncoder").setValidators(DatasetValidator.required());
          this.dsDialogForm.get("selectedEncoder").updateValueAndValidity();
        };
        if (this.msg.type === 'ner' || this.msg.type === 'log') {
          this.validNer();
        };
        if (this.msg.type === 'image') {
          this.validImageSubmit();
        }
        if (this.isMultipleLabel) {
          this.validMultiple();
        };
        condition = !this.dsDialogForm.invalid && this.nameExist == false;
      };
      FormValidatorUtil.markControlsAsTouched(this.dsDialogForm);
      if (condition) {
        this.loading = true;
        let formModel = this.buildFormModel();
        let ds: DatasetData = formModel;
        this.postLocalFile(ds).subscribe(
          (res) => {
            if (res.status == "success") {
              this.onAddedDsEmitter.emit();
              this.loading = false;
              this.dataSetId = "";
              this.router.navigate(["projects"]);
              //send email
              if (this.env.config.enableSendEmail) {
                this.sendEmailToOwner();
              }
              this.fileName = "";
            }
          },
          (error) => {
            console.log("Error:", error);
            this.loading = false;
            this.errorMessageTop =
              "Create project failed, please try again later!";
            setTimeout(() => {
              this.errorMessageTop = "";
            }, 5000);
          },
          () => {
            this.loading = false;
          }
        );
      }
    }
  }

  public postLocalFile(dataset: DatasetData): Observable<any> {
    let formData = new FormData();

    this.dsDialogForm.get("labels").setValue(this.projectType === "ner" ? [...this.categoryList, ...this.selectDescription] : this.categoryList);
    formData.append("pname", this.dsDialogForm.value.projectName);
    formData.append("taskInstruction", this.dsDialogForm.value.taskInstruction);
    formData.append("maxAnnotations", this.dsDialogForm.value.maxAnnotations);
    formData.append("assignmentLogic", this.dsDialogForm.value.assignmentLogic);
    formData.append("assignee", JSON.stringify(this.dsDialogForm.value.assignee));
    formData.append("selectDescription", this.msg.type == 'ner' ? JSON.stringify([this.dsDialogForm.value.selectedText]) : JSON.stringify(this.dsDialogForm.value.selectDescription));
    formData.append("selectLabels", this.msg.type == 'ner' ? JSON.stringify(this.dsDialogForm.value.selectDescription) : this.dsDialogForm.value.selectLabels);
    formData.append("header", JSON.stringify(this.previewHeadDatas));
    formData.append("isHasHeader", this.isHasHeader);
    formData.append("annotationQuestion", this.dsDialogForm.value.annotationQuestion);
    formData.append("totalRows", this.dsDialogForm.value.totalRow);
    formData.append("fileName", this.fileName);
    formData.append("fileSize", this.fileSize);
    formData.append("location", this.location);
    formData.append("selectedDataset", this.dsDialogForm.value.selectedDataset);
    formData.append("min", this.dsDialogForm.value.min);
    formData.append("max", this.dsDialogForm.value.max);
    formData.append("labelType", this.labelType);
    formData.append("estimator", this.dsDialogForm.value.selectedClassifier);
    formData.append("projectType", this.projectType);
    formData.append("encoder", this.dsDialogForm.value.selectedEncoder);
    formData.append("isMultipleLabel", (this.msg.type == 'ner' || this.msg.type == 'image' || this.msg.type == 'log') ? true : this.dsDialogForm.value.multipleLabel);
    if (this.projectType === 'ner') {
      formData.append("regression", this.selectDescription.length > 0 ? 'true' : 'false');
      let aa = [];
      this.dsDialogForm.value.labels.forEach(element => {
        aa.push(element.name);
      });
      formData.append("labels", aa.join(','));

    } else {
      formData.append("labels", this.dsDialogForm.value.labels);
    };
    if (this.projectType === 'log') {
      formData.append("isShowFilename", JSON.stringify(this.dsDialogForm.get("isShowFilename").value));

    }
    return this.avaService.postDataset(formData);
  }



  sendEmailToOwner() {
    let param = {
      projectOwner: [this.user],
      pname: this.dsDialogForm.value.projectName,
      fileName: this.fileName
    };
    this.avaService.sendEmailToOwner(param).subscribe(
      (res) => {
        console.log(res);
      },
      (error: any) => {
        console.log(error);
      }
    );
  }



  onKeydown(e) {
    e.stopPropagation();
  }



  inputProjectBlur(e) {
    let param = {
      pname: e.target.value
    };
    if (e.target.value != "") {
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
    if (e && this.inputLabelValidation == false) {
      if (this.projectType === 'ner') {
        this.categoryList.push({ name: e });
        this.dsDialogForm.get("labels").setValue([...this.categoryList, ...this.selectDescription]);
      } else {
        this.categoryList.push(e);
        this.dsDialogForm.get("labels").setValue(this.categoryList);
      }
      this.labels.nativeElement.value = null;
    }
  }

  labelsBlur(e: any) {
    let val = e.target.value;
    if (val && this.inputLabelValidation == false) {
      if (this.projectType === 'ner') {
        this.categoryList.push({ name: val });
        this.dsDialogForm.get("labels").setValue([...this.categoryList, ...this.selectDescription]);
      } else {
        this.categoryList.push(val);
        this.dsDialogForm.get("labels").setValue(this.categoryList);
      }
      this.labels.nativeElement.value = null;
    }
  }


  assigneeBlur(e: any) {
    this.toRegEmail(e.target.value)
  }

  onEnter(e) {
    this.toRegEmail(e);
  }

  toRegEmail(value) {
    let emails = value.split(/,|;/)
    if (this.env.config.authUrl) {
      for (let i = 0; i < emails.length; i++) {
        if (!(/^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@vmware.com$/).test(emails[i].trim())) {
          this.emailReg = false;
          return;
        };
        this.emailReg = true;
      }
    } else {
      for (let i = 0; i < emails.length; i++) {
        if (!(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emails[i].trim()))) {
          this.emailReg = false;
          return;
        };
        this.emailReg = true;
      }
    }
    if (this.emailReg && this.inputAssigneeValidation == false) {
      emails.forEach(element => {
        if (this.assigneeList.indexOf(element.trim()) == -1) {
          this.assigneeList.push(element.trim());
        }
      });
      this.dsDialogForm.get("assignee").setValue(this.assigneeList);
      this.assignee.nativeElement.value = null;
    }
    if (this.assigneeList.length != 0) {
      this.emailReg = true;
    }
  }

  deleteAssignee(index) {
    this.assigneeList.splice(index, 1);
    this.dsDialogForm.get("assignee").setValue(this.assigneeList);
    if (this.assigneeList.length != 0) {
      this.emailReg = true;
    }
  }

  onAddingDataset(event) {
    this.showAddNewDatasetDialog = true;
    this.uploadErrorTip = false;
  }

  receiveUploadCloseInfo(e) {
    this.showAddNewDatasetDialog = false;
  };

  receiveUploadSuccessInfo(e) {
    this.isShowSetHeader = e.isShowSetHeader;
    this.dsDialogForm.get("selectDescription").reset();
    this.descriptions = [];
    this.nonEnglish = 0;
    this.chooseLabel = [];
    this.previewHeadDatas = [];
    this.previewContentDatas = [];
    this.totalCase = 0;
    this.previewTotalData = [];
    this.dsDialogForm.get("totalRow").setValue(0);
    this.dsDialogForm.get("labels").setValue([]);
    this.dsDialogForm.get("min").setValue(null);
    this.dsDialogForm.get("max").setValue(null);
    this.dsDialogForm.get("multipleLabel").setValue(null);
    this.isMultipleLabel = null;
    this.dsDialogForm.get("selectedText").setValue(null);
    this.dsDialogForm.get("isShowFilename").setValue(false);

    this.categoryList = [];
    this.minLabel = null;
    this.maxLabel = null;
    this.labelType = '';
    this.isNumeric = null;
    this.isShowNumeric = false;
    this.dsDialogForm.get("selectLabels").reset();
    this.selectDescription = [];
    // this.selectLabel = "";
    this.setDataComplete = false;
    this.isSelectWrongColumn = false;
    this.selectColumns = [];
    this.columnInfo = [];
    this.isHasHeader = '';


    this.showAddNewDatasetDialog = false;
    this.infoMessage = 'Upload success.';
    this.dsDialogForm.get("selectedDataset").setValue(e.dataSetName);
    this.dataSetId = e.dataSetId;
    this.fileName = e.fileName;
    this.fileSize = e.fileSize;
    // this.isShowSetHeader = e.isShowSetHeader;
    this.previewHeadDatas = e.previewHeadDatas;
    this.previewContentDatas = e.previewContentDatas;
    if (this.msg.type == 'image' && e.images && e.images.length > 0) {
      this.previewContentDatas.forEach(element => {
        element.fileSize = (element.fileSize / 1024).toFixed(2)
      });
      this.dsDialogForm.get("totalRow").setValue(e.images.length);
    } else if (this.msg.type == 'log') {
      this.location = e.location;
      this.dsDialogForm.get("totalRow").setValue(e.totalRows);
    } else {
      this.chooseLabel = e.chooseLabel;
      this.isHasHeader = e.isHasHeader;
      this.location = e.location;
      if (e.columnInfo && e.columnInfo.length > 0) {
        this.columnInfo = e.columnInfo;
      } else if (!e.columnInfo || e.columnInfo.length == 0) {
        for (let i = 0; i < this.previewHeadDatas.length; i++) {
          this.columnInfo.push({
            name: this.previewHeadDatas[i],
            type: "Numeric",
            uniqueLength: 51,
            isOriginal: true
          });
        }
      };
    }

    this.getMyDatasets();
    setTimeout(() => {
      this.infoMessage = '';
    }, 3000);
  }



  selectedDatasets(e) {
    this.dsDialogForm.get("selectDescription").reset();
    this.descriptions = [];
    this.nonEnglish = 0;
    this.chooseLabel = [];
    this.previewHeadDatas = [];
    this.previewContentDatas = [];
    this.totalCase = 0;
    this.previewTotalData = [];
    this.dsDialogForm.get("totalRow").setValue(0);
    this.categoryList = [];
    this.minLabel = null;
    this.maxLabel = null;
    this.labelType = '';
    this.isNumeric = null;
    this.isShowNumeric = false;
    this.dsDialogForm.get("selectLabels").reset();
    this.selectDescription = [];
    this.setDataComplete = false;
    this.isSelectWrongColumn = false;
    this.selectColumns = [];
    this.columnInfo = [];
    this.dsDialogForm.get("multipleLabel").setValue(null);
    this.isMultipleLabel = null;
    this.dsDialogForm.get("selectedText").setValue(null);
    this.dsDialogForm.get("isShowFilename").setValue(false);

    this.datasetsList.forEach((dataset) => {
      if (dataset.dataSetName === e.target.value) {
        let choosedDataset = dataset;
        this.dataSetId = choosedDataset.id;
        this.fileName = choosedDataset.fileName;
        this.fileSize = choosedDataset.fileSize;
        this.loadingSetData = true;
        this.loadingPreviewData = true;
        this.isShowSetHeader = choosedDataset.format;


        if (this.msg.type == 'image' && choosedDataset.format == 'image') {
          this.previewHeadDatas = ['Id', 'ImageName', 'ImageSize(KB)', 'Image'];
          let a = 0;
          choosedDataset.topReview.forEach(element => {
            element.fileSize = (element.fileSize / 1024).toFixed(2);
            let img = new Image();
            img.src = element.location;
            let m = this;
            img.onload = function () {
              a++;
              if (a == Math.round((choosedDataset.topReview.length) / 2)) {
                m.loadingPreviewData = false;
              }
            }
          });
          this.previewContentDatas = choosedDataset.topReview;
          this.dsDialogForm.get("totalRow").setValue(choosedDataset.images.length);
        } else if (choosedDataset.format == 'txt') {
          this.previewHeadDatas = ['FileName', 'FileContent'];
          this.previewContentDatas = choosedDataset.topReview;
          this.dsDialogForm.get("totalRow").setValue(choosedDataset.totalRows);
          this.location = choosedDataset.location;
          this.loadingPreviewData = false;
        } else {
          this.previewHeadDatas = choosedDataset.topReview.header;
          this.previewContentDatas = choosedDataset.topReview.topRows;
          this.isHasHeader = choosedDataset.hasHeader;
          this.location = choosedDataset.location;
          if (choosedDataset.columnInfo && choosedDataset.columnInfo.length > 0) {
            this.columnInfo = choosedDataset.columnInfo;
          } else if (!choosedDataset.columnInfo || choosedDataset.columnInfo.length == 0) {
            for (let i = 0; i < this.previewHeadDatas.length; i++) {
              this.columnInfo.push({
                name: this.previewHeadDatas[i],
                type: "Numeric",
                uniqueLength: 51,
                isOriginal: true
              });
            }
          };
          this.chooseLabel = choosedDataset.topReview.header;
          this.loadingPreviewData = false;

        }
        this.loadingSetData = false;
        return;
      }
    });
  }


  onSelectingLabels(e) {
    this.changeSetData = true;
    // this.selectLabel = e.target.value;
    this.dsDialogForm.get("totalRow").setValue(0);
    this.dsDialogForm.get("min").setValue(null);
    this.dsDialogForm.get("max").setValue(null);
    this.dsDialogForm.get("labels").setValue([]);
    this.dsDialogForm.get("multipleLabel").setValue(null);
    this.isMultipleLabel = null;



    this.annotationComplete = 0;
    this.categoryList = [];
    this.nonEnglish = 0;
    this.totalCase = 0;
    this.previewTotalData = [];
    this.minLabel = null;
    this.maxLabel = null;
    this.isNumeric = null;
    this.labelType = '';
    this.isShowNumeric = false;
    if (e.target.value == 'No Labels') {
      this.isShowLabelRadio = true;
    } else {
      this.isShowLabelRadio = false;
    };
    if (this.selectDescription.length > 0) {
      this.selectDescription.forEach(element => {
        e.target.value == element.name ? (this.isSelectWrongColumn = true) : (this.isSelectWrongColumn = false);
      });
    }
    this.turnDuplicatedRed(e.target.value);

    // let dom = this.el.nativeElement.querySelectorAll(".labelOriginal");
    // for (let i = 0; i < dom.length; i++) {
    //   dom[i].style.color = "rgb(0, 0, 0)";
    // };

    // if (this.selectDescription.length > 0) {
    //   for (let i = 0; i < this.selectDescription.length; i++) {
    //     if (this.selectDescription[i].name == this.selectLabel) {
    //       let index = _.indexOf(this.previewHeadDatas, this.selectLabel)
    //       this.isSelectWrongColumn = true;
    //       this.renderer2.setStyle(
    //         this.el.nativeElement.querySelector(".label" + index),
    //         "color",
    //         "red"
    //       );
    //     }
    //   }
    // };
  }




  selectionChanged() {
    this.changePreview = true;
    this.isSelectWrongColumn = false;
    this.selectColumns = [];
    this.selectDescription.forEach(e => {
      this.selectColumns.push(e.name);
    })
    this.dsDialogForm.get("selectDescription").setValue(this.selectColumns);
    this.turnDuplicatedRed(this.projectType == 'ner' ? this.dsDialogForm.get("selectedText").value : this.dsDialogForm.get("selectLabels").value);

    if (this.projectType !== 'ner') {
      this.dsDialogForm.get("totalRow").setValue(0);
      this.totalCase = 0;
      this.nonEnglish = 0;
      this.previewTotalData = [];
    };
    if (this.projectType === 'ner') {
      this.selectDescription.forEach(element => {
        for (let i = 0; i < this.categoryList.length; i++) {
          if (element.name == this.categoryList[i].name) {
            this.categoryList.splice(i, 1);
            break;
          }
        }
      });
      this.dsDialogForm.get("labels").setValue([...this.categoryList, ...this.selectDescription]);

    }
  }



  turnDuplicatedRed(selectLabel) {
    let dom = this.el.nativeElement.querySelectorAll(".labelOriginal");
    for (let i = 0; i < dom.length; i++) {
      dom[i].style.color = "rgb(0, 0, 0)";
    };
    if (this.selectDescription.length > 0) {
      for (let i = 0; i < this.selectDescription.length; i++) {
        if (this.selectDescription[i].name == selectLabel) {
          let index = _.indexOf(this.previewHeadDatas, selectLabel)
          this.isSelectWrongColumn = true;
          this.renderer2.setStyle(
            this.el.nativeElement.querySelector(".label" + index),
            "color",
            "red"
          );
          break;
        }
      }
    };
  }



  onSelectingText(e) {
    this.dsDialogForm.get("selectedText").setValue(e.target.value);
    this.annotationComplete = 0;
    this.nonEnglish = 0;
    this.totalCase = 0;
    this.previewTotalData = [];
    this.labelType = '';
    this.dsDialogForm.get("totalRow").setValue(0);
    if (this.selectDescription.length > 0) {
      this.selectDescription.forEach(element => {
        e.target.value == element.name ? (this.isSelectWrongColumn = true) : (this.isSelectWrongColumn = false);
      });
    }
    this.turnDuplicatedRed(e.target.value)
  }



  sureSet() {

    if (this.changePreview || this.changeSetData || this.msg.type == 'ner') {
      this.setDataComplete = true;
      this.nonEnglish = 0;
      this.totalCase = 0;
      this.previewTotalData = [];
      this.dsDialogForm.get("totalRow").setValue(0);
      if (this.projectType !== 'ner') {
        this.dsDialogForm.get("labels").setValue([]);
        this.categoryList = [];
      }
      this.dsDialogForm.get("min").setValue(null);
      this.dsDialogForm.get("max").setValue(null);
      this.dsDialogForm.get("multipleLabel").setValue(null);
      this.isMultipleLabel = null;



      let indexArray = [];
      if (this.msg.type == 'ner') {
        this.selectColumns = [this.dsDialogForm.get('selectedText').value]
      };
      for (let k = 0; k < this.selectColumns.length; k++) {
        indexArray.push(this.previewHeadDatas.indexOf(this.selectColumns[k]));
      }


      this.avaService.getCloudUrl(this.dataSetId).subscribe(
        (res) => {
          let flag = [];
          let count = 0;
          let invalidCount = 0;
          let selectedLabel = this.dsDialogForm.get("selectLabels").value;
          let selectedLabelIndex = this.previewHeadDatas.indexOf(selectedLabel);
          this.papa.parse(res, {
            header: false,
            download: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            worker: true,
            error: (error) => {
              // console.log('parse_error: ', error);
              this.setDataComplete = false;
            },
            chunk: (results, parser) => {
              let chunkData = results.data;
              count += chunkData.length;
              let newArray = [];

              for (let a = 0; a < chunkData.length; a++) {

                let newArray2 = [];
                for (let c = 0; c < indexArray.length; c++) {
                  newArray2.push(chunkData[a][indexArray[c]]);
                };
                newArray.push(newArray2);

                if (
                  selectedLabelIndex > -1 && chunkData[a][selectedLabelIndex] != null && chunkData[a][selectedLabelIndex] != ""
                ) {
                  flag.push(chunkData[a][selectedLabelIndex]);
                }
              };

              for (let b = 0; b < newArray.length; b++) {
                if (_.sortedUniq(newArray[b]).length == 1 && _.sortedUniq(newArray[b])[0] == null) {
                  invalidCount += 1;
                  // console.log("empty_before" + (b - 1) + ":", newArray[b - 1]);
                  // console.log("empty" + b + ":", newArray[b]);
                  // console.log("empty_after" + (b + 1) + ":", newArray[b + 1]);

                } else {
                  for (let j = 0; j < newArray[b].length; j++) {
                    if (!this.isASCII(String(newArray[b][j]).trim())) {
                      invalidCount += 1;
                      // console.log("non_english:row_" + b + "_cell:" + j, newArray[b][j]);
                      break;
                    }
                  }
                }
              }
            },
            complete: (result) => {

              if (this.isHasHeader == 'yes') {
                flag = flag.slice(1);
                count = count - 1;
              } else if (this.isHasHeader == 'no') {
              };

              flag = _.uniq(flag);
              flag.forEach((element, index) => {
                if (!this.isASCII(element)) {
                  flag.splice(index, 1);
                };
              });

              //to check this is a totally numeric flag or not
              let isNumeric = true;
              let typeScope = ['Number', 'Null', 'Undefined'];
              for (let i = 0; i < flag.length; i++) {
                let call = toString.call(flag[i]);
                call = _.trimStart(call, '[');
                call = _.trimEnd(call, ']');
                call = call.split(' ')[1];
                if (typeScope.indexOf(call) == -1) {
                  isNumeric = false;
                  break;
                }
              };


              if (selectedLabelIndex > -1 && isNumeric == false) {
                this.isNumeric = false;
                if (flag.length > 50) {
                  this.setDataDialog = true;
                  this.setDataComplete = false;
                  this.overMaxLabelLimit = true;
                  return;
                };

                for (let d = 0; d < flag.length; d++) {

                  if (flag[d].length > 50) {
                    this.overPerLabelLimit = true;
                    let sliceStr = flag[d].slice(0, 50);
                    flag.splice(d, 1, sliceStr);
                  };

                  if (!this.isASCII(flag[d])) {
                    flag.splice(d, 1);
                  };
                };

                if (this.overMaxLabelLimit == false && this.overPerLabelLimit) {
                  this.setDataDialog = true;
                  this.overPerLabelLimit = true;
                };
                this.categoryList = flag;
                if (this.projectType === 'ner') {
                  this.dsDialogForm.get("labels").setValue([...this.categoryList, ...this.selectDescription]);
                } else {
                  this.dsDialogForm.get("labels").setValue(this.categoryList);

                }

              } else if (selectedLabelIndex > -1 && isNumeric == true) {
                this.isNumeric = true;;
                this.minLabel = _.min(flag);
                this.maxLabel = _.max(flag);
                this.dsDialogForm.get("min").setValue(this.minLabel);
                this.dsDialogForm.get("max").setValue(this.maxLabel);
                this.isShowNumeric = true;
              };
              this.totalCase = count;
              this.nonEnglish = invalidCount;
              this.dsDialogForm.get("totalRow").setValue(this.totalCase - this.nonEnglish);
              this.setDataComplete = false;
              this.changeSetData = false;
              this.changePreview = false;
            }
          });
        },
        (error) => {
          console.log("Error:", error);
          this.uploadComplete = false;
        }
      );
    }
  }



  onLabelKeydown(e) {
    if (this.projectType === 'ner') {
      let aa = [];
      let bb = this.dsDialogForm.value.labels;
      bb.forEach(e => {
        aa.push(e.name)
      });
      if (aa.indexOf(e.target.value) !== -1) {
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
    if (this.assigneeList.indexOf(e.target.value) !== -1) {
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
      this.selectDescription.splice(index, 1);
      let aa = [];
      this.selectDescription.forEach(e => {
        aa.push(e.name);
      })
      this.dsDialogForm.get("selectDescription").setValue(aa);
    }
    this.dsDialogForm.get("labels").setValue(this.projectType === "ner" ? [...this.categoryList, ...this.selectDescription] : this.categoryList);
  }



  checkDatasetName(e) {
    this.avaService.findDatasetName(e).subscribe((res) => {
      if (res.length != 0) {
        this.datasetNameExist = true;
      } else {
        this.datasetNameExist = false;
      }
    });
  }

  private getMyDatasets(params?: any) {
    let a = (this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'ner') ? 'csv' : (this.projectType == 'image' ? 'image' : 'txt');
    this.avaService.getMyDatasets(a).subscribe(
      (res) => {
        if (this.msg.type == 'image') {
          let flag = [];
          res.forEach((element) => {
            if (element.format == 'image') {
              flag.push(element)
            }
          });
          this.datasetsList = flag;

        } else {
          let flag = [];
          res.forEach((element) => {
            if (element.format !== 'image') {
              flag.push(element)
            }
          });
          this.datasetsList = flag;
        }
      },
      (error: any) => {
        console.log(error);
      }
    );
  }


  onQuerySQL() {
    this.showQueryDatasetDialog = true;
  }

  onAddedDataset(e) {
    if (e && e.dataSetName != undefined) {
      let param = {
        target: { value: e.dataSetName }
      };
      let a = (this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'ner') ? 'csv' : (this.projectType == 'image' ? 'image' : 'txt')
      this.avaService.getMyDatasets(a).subscribe(
        (res) => {
          this.datasetsList = res;
          this.dsDialogForm.get("selectedDataset").setValue(e.dataSetName);
          this.showQueryDatasetDialog = false;
          this.selectedDatasets(param);
        },
        (error: any) => {
          console.log(error);
        }
      );
    } else {
      this.showQueryDatasetDialog = false;
      this.errorMessageTop =
        "Get datasets from supercollider filed, please try again later!";
      setTimeout(() => {
        this.errorMessageTop = "";
      }, 5000);
    }
  }

  receiveCloseInfo(e) {
    this.showQueryDatasetDialog = false;
  };


  minUpdate(e) {
    this.minLabel = e.target.value;
    Number(this.minLabel) >= Number(this.maxLabel) ? this.sizeError = true : this.sizeError = false;

  };


  maxUpdate(e) {
    this.maxLabel = e.target.value;
    Number(this.minLabel) >= Number(this.maxLabel) ? this.sizeError = true : this.sizeError = false;
  }


  changeLabelType(e) {
    if (e.target.value == "numericLabel") {
      this.isShowNumeric = true;
      this.isNumeric = true;
    } else {
      this.dsDialogForm.get("multipleLabel").setValue(null);
      this.isMultipleLabel = null;
      this.isShowNumeric = false;
      this.isNumeric = false;
    }
  }

  // in tabular case to change the variable type
  // updateColumnFormat(column, e) {
  //   if (e.target.value != column.type) {
  //     this.isChangeVariable = true;
  //     setTimeout(() => {
  //       this.isChangeVariable = false;
  //     }, 2000);
  //   } else {
  //     this.isChangeVariable = false;
  //   }
  // }


  isMultiple(e) {
    this.isMultipleLabel = e.target.checked
    this.dsDialogForm.get("multipleLabel").setValue(this.isMultipleLabel);
  }


  validNumeirc() {
    this.dsDialogForm.get("selectedClassifier").setValue(null);
    this.dsDialogForm.get("selectedClassifier").setValidators(null);
    this.dsDialogForm.get("selectedClassifier").updateValueAndValidity();
    this.dsDialogForm.get("selectedEncoder").setValue(null);
    this.dsDialogForm.get("selectedEncoder").setValidators(null);
    this.dsDialogForm.get("selectedEncoder").updateValueAndValidity();
    this.dsDialogForm.get("labels").setValidators(null);
    this.dsDialogForm.get("labels").updateValueAndValidity();
    this.dsDialogForm.get("min").setValidators(DatasetValidator.minNumber());
    this.dsDialogForm.get("min").updateValueAndValidity();
    this.dsDialogForm.get("max").setValidators(DatasetValidator.minNumber());
    this.dsDialogForm.get("max").updateValueAndValidity();

  }


  validMultiple() {
    this.dsDialogForm.get("selectedClassifier").setValue(null);
    this.dsDialogForm.get("selectedClassifier").setValidators(null);
    this.dsDialogForm.get("selectedClassifier").updateValueAndValidity();
    this.dsDialogForm.get("selectedEncoder").setValue(null);
    this.dsDialogForm.get("selectedEncoder").setValidators(null);
    this.dsDialogForm.get("selectedEncoder").updateValueAndValidity();
  }



  validNer() {
    this.validMultiple();
    this.dsDialogForm.get("maxAnnotations").setValue(1);

  }

  validImageSubmit() {
    this.validMultiple();
    this.dsDialogForm.get("maxAnnotations").setValue(1);

  }

  isASCII(str) {
    // return /^[\x00-\x7F]*$/.test(str);
    return /^[\x00-\xFF\u2013-\u2122]*$/.test(str);
  }
}
