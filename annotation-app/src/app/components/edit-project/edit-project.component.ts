/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AvaService } from '../../services/ava.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as _ from 'lodash';
import { EnvironmentsService } from 'app/services/environments.service';
import { ToolService } from 'app/services/common/tool.service';
import { CommonService } from 'app/services/common/common.service';
import { EmailService } from 'app/services/common/email.service';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { DatasetValidator } from 'app/shared/form-validators/dataset-validator';

@Component({
  selector: 'app-edit-project',
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.scss'],
})
export class EditProjectComponent implements OnInit {
  @Input() msgInEdit: any;

  @Output('onCloseEditDialog')
  onCloseEditDialogEmitter = new EventEmitter();

  @Output('onSubmitEdit')
  onSubmitEditEmitter = new EventEmitter();

  @Output('onDeleteLabel')
  onDeleteLabelEmitter = new EventEmitter();

  inputProjectName = '';
  inputTaskInstruction = '';
  nameExist: boolean;
  inputProjectCreator = '';
  emailRegForOwner = true;
  inputProjectAssignee: any = [];
  showAnnotatorList: boolean;
  showOwnerList: boolean;
  assigneeList: any = [];
  ownerList: any = [];
  inputAssigneeValidation: boolean;
  inputOwnerValidation: boolean;
  emailReg = true;
  inputTrigger: number;
  notTriggerNumber: boolean;
  minThreshold: boolean;
  minFrequency: boolean;
  labelType = '';
  inputfrequency: number;
  notNumber: boolean;
  assignmentLogicEdit: any;
  previousProjectName = '';
  inputPnameUpdate = new Subject<string>();
  editProjectComplete = false;
  categoryList: any = [];
  activeOverOut: number;
  inputLabelValidation = false;
  inputNewLabel: any;
  activeClickInput: number;
  sizeError = false;
  oldMin: number;
  oldMax: number;
  msg: any;
  errorMessage = '';
  infoMessage = '';
  isShowDeleteModal = false;
  deleteLabelInfo: any;
  deleteLabelComplete = false;
  isShowFilename: any;
  mutilNumericForm: FormGroup;
  inputIsNull: boolean;
  isMultipleLabel: boolean;
  slackList: any = [];
  inputSlackValidation: string;
  loadingSlack: boolean = false;
  inputSlackChannels: any = [];
  showLabel: boolean = true;
  isShowSlack: boolean = false;

  constructor(
    private avaService: AvaService,
    public env: EnvironmentsService,
    private toolService: ToolService,
    private commonService: CommonService,
    private emailService: EmailService,
    private formBuilder: FormBuilder,
  ) {
    this.inputPnameUpdate.pipe(debounceTime(400), distinctUntilChanged()).subscribe((value) => {
      let pname = value.trim();
      if (pname != '') {
        this.pnameCheck(pname);
      } else {
        this.inputProjectName = pname;
        this.nameExist = false;
      }
    });
  }

  ngOnInit() {
    this.msg = JSON.parse(JSON.stringify(this.msgInEdit));
    const al = this.msg.al;
    this.previousProjectName = this.msg.projectName;
    this.showLabel = !(this.msg.integration.source && this.msg.integration.externalId[0]);
    this.inputProjectName = this.msg.projectName;
    this.inputTaskInstruction = this.msg.taskInstructions;
    this.inputfrequency = al.frequency ? al.frequency : null;
    this.inputTrigger = al.trigger ? al.trigger : null;
    this.labelType = this.msg.labelType;
    this.isMultipleLabel = this.msg.isMultipleLabel;
    this.inputProjectCreator = this.msg.creator;
    this.inputProjectAssignee = this.msg.annotator;
    let flag = [];
    _.cloneDeep(this.msg.annotator).forEach((annotator) => {
      for (let i = 0; i < this.msg.userCompleteCase.length; i++) {
        if (annotator === this.msg.userCompleteCase[i].user) {
          flag.push({
            email: annotator,
            assignedCase: this.msg.userCompleteCase[i].assignedCase,
            completeCase: this.msg.userCompleteCase[i].completeCase,
          });
          break;
        }
      }
    });
    this.assigneeList = flag;
    this.ownerList = JSON.parse(JSON.stringify(this.msg.creator));
    this.assignmentLogicEdit = this.msg.assignmentLogic;
    this.isShowFilename = this.msg.isShowFilename ? 'yes' : 'no';
    this.oldMax = this.msg.max;
    this.oldMin = this.msg.min;
    if (this.labelType === 'numericLabel' && this.isMultipleLabel) {
      let mutilNumerics = [];
      let categoryList = JSON.parse(this.msg.categoryList);
      categoryList.forEach((element) => {
        const labels = Object.keys(element);
        const label = labels[0];
        const values = element[label];
        const minVal = values[0];
        const maxVal = values[1];
        mutilNumerics.push(
          this.formBuilder.group({
            status: 'old',
            originalLabel: label,
            editLabel: label,
            oldMinMutilVal: this.formBuilder.control(minVal),
            minMutilVal: this.formBuilder.control(minVal),
            oldMaxMutilVal: this.formBuilder.control(maxVal),
            maxMutilVal: this.formBuilder.control(maxVal),
          }),
        );
      });
      this.mutilNumericForm = this.formBuilder.group({
        mutilLabelArray: this.formBuilder.array(mutilNumerics),
      });
    } else {
      this.msg.categoryList.split(',').forEach((element) => {
        const flag = { status: 'old', originalLabel: element, editLabel: element };
        this.categoryList.push(flag);
      });
    }
    if (this.msg.assignSlackChannels.length > 0) {
      this.slackList = this.msg.assignSlackChannels;
      this.msg.assignSlackChannels.forEach((element) => {
        this.inputSlackChannels.push(element.slackName);
      });
    }
    this.isShowSlack =
      this.env.config.enableSlack &&
      ['text', 'tabular'].includes(this.msg.projectType) &&
      !this.msg.isMultipleLabel &&
      this.msg.labelType == 'textLabel';
  }

  get mutilLabelArray() {
    return this.mutilNumericForm.get('mutilLabelArray') as FormArray;
  }

  pnameCheck(name) {
    const param = {
      pname: name,
    };
    if (name != this.previousProjectName) {
      this.avaService.findProjectName(param).subscribe((res) => {
        if (res.length != 0) {
          this.nameExist = true;
        } else {
          this.nameExist = false;
        }
      });
    }
  }

  onInputingProjectOwner(e) {
    const emails = e.target.value.split(/,|;/);
    this.emailRegForOwner = this.toolService.toRegEmail(emails);
    if (this.emailRegForOwner && this.inputOwnerValidation == false) {
      emails.forEach((element) => {
        if (this.ownerList.indexOf(element.trim()) == -1) {
          this.ownerList.push(element.trim());
        }
      });
      e.target.value = '';
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

  onOwnerKeydown(e) {
    if (this.ownerList.indexOf(e.target.value) !== -1) {
      this.inputOwnerValidation = true;
    } else {
      this.inputOwnerValidation = false;
    }
  }

  reAssign(e) {
    this.showAnnotatorList = true;
    e.target.value = '';
    this.inputAssigneeValidation = false;
    this.emailReg = true;
    this.assigneeList.forEach((element) => {
      element.originValue = element.assignedCase;
      element.isModify = false;
    });
  }

  reOwner(e) {
    this.showOwnerList = true;
    e.target.value = '';
    this.inputOwnerValidation = false;
    this.emailRegForOwner = true;
  }

  onInputingAssignee(e) {
    const emails = e.target.value.split(/,|;/);
    this.emailReg = this.toolService.toRegEmail(emails);
    if (this.emailReg && this.inputAssigneeValidation == false) {
      emails.forEach((element) => {
        if (_.filter(this.assigneeList, ['email', element.trim()]).length === 0) {
          this.assigneeList.push({ email: element.trim(), assignedCase: 0 });
        }
      });
      if (this.assigneeList.length > 0) {
        this.assigneeList.forEach((item) => {
          item.isModify = false;
        });
        this.commonService.evenlyDistributeTicket(
          this.assigneeList,
          this.msg.totalCase,
          this.msg.maxAnnotation,
        );
      }
      e.target.value = '';
    }
  }

  deleteAssignee(index) {
    this.assigneeList.splice(index, 1);
    if (this.assigneeList.length > 0) {
      this.assigneeList.forEach((item) => {
        item.isModify = false;
      });
      this.commonService.evenlyDistributeTicket(
        this.assigneeList,
        this.msg.totalCase,
        this.msg.maxAnnotation,
      );
    }
  }

  deleteOwner(index) {
    this.ownerList.splice(index, 1);
  }

  inputTriggerBlur(e) {
    const pattern = `^[0-9]+$`;
    const argRegEx = new RegExp(pattern, 'g');
    if (e.target.value < 50) {
      this.minThreshold = true;
      this.notTriggerNumber = false;
    } else {
      this.minThreshold = false;
      if (!String(e.target.value).match(argRegEx)) {
        this.notTriggerNumber = true;
      } else {
        this.notTriggerNumber = false;
      }
    }
  }

  inputFrequencyBlur(e) {
    const pattern = `^[0-9]+$`;
    const argRegEx = new RegExp(pattern, 'g');
    if (e.target.value < 10) {
      this.minFrequency = true;
      this.notNumber = false;
    } else {
      this.minFrequency = false;
      if (!String(e.target.value).match(argRegEx)) {
        this.notNumber = true;
      } else {
        this.notNumber = false;
      }
    }
  }

  onCloseEditDialog() {
    this.onCloseEditDialogEmitter.emit();
  }

  saveProjectEdit(id) {
    let editLabels;
    const addLabels = [];
    if (this.labelType === 'numericLabel' && this.isMultipleLabel) {
      if (
        this.mutilLabelArray.value.some(
          (item) =>
            (item.oldMinMutilVal && item.oldMinMutilVal < item.minMutilVal) ||
            (item.oldMaxMutilVal && item.oldMaxMutilVal > item.maxMutilVal) ||
            item.maxMutilVal <= item.minMutilVal,
        )
      ) {
        return false;
      } else {
        editLabels = [];
        this.mutilLabelArray.value.forEach((element) => {
          if (element.status == 'old') {
            editLabels.push({
              edit:
                element.oldMinMutilVal !== element.minMutilVal ||
                element.oldMaxMutilVal !== element.maxMutilVal ||
                element.originalLabel !== element.editLabel,
              originLB: {
                [element.originalLabel]: [element.oldMinMutilVal, element.oldMaxMutilVal],
              },
              editLB: { [element.editLabel]: [element.minMutilVal, element.maxMutilVal] },
            });
          }
          if (element.status == 'new') {
            addLabels.push({ [element.editLabel]: [element.minMutilVal, element.maxMutilVal] });
          }
        });
      }
    } else {
      editLabels = {};
      this.categoryList.forEach((element) => {
        if (element.status == 'old') {
          editLabels[element.originalLabel] = element.editLabel;
        }
        if (element.status == 'new') {
          addLabels.push(element.editLabel);
        }
      });
    }

    let condition =
      this.inputProjectName !== '' &&
      this.inputProjectCreator.length > 0 &&
      (this.assigneeList.length > 0 || this.slackList.length > 0) &&
      this.ownerList.length > 0 &&
      !this.nameExist &&
      this.emailReg &&
      !this.inputAssigneeValidation &&
      this.emailRegForOwner &&
      !this.notNumber &&
      !this.notTriggerNumber &&
      !this.minThreshold &&
      !this.minFrequency &&
      this.inputfrequency > 9 &&
      this.inputTrigger > 49 &&
      !this.inputIsNull &&
      !this.inputLabelValidation &&
      !this.loadingSlack &&
      !this.inputSlackValidation;
    if (this.labelType == 'numericLabel' && !this.isMultipleLabel) {
      condition =
        this.inputProjectName !== '' &&
        this.inputProjectCreator !== '' &&
        this.assigneeList.length > 0 &&
        this.ownerList.length > 0 &&
        !this.nameExist &&
        this.emailReg &&
        !this.inputAssigneeValidation &&
        this.emailRegForOwner &&
        !this.sizeError &&
        this.msg.min <= this.oldMin &&
        this.msg.max >= this.oldMax &&
        this.msg.min !== this.msg.max;
    }
    if (condition) {
      this.editProjectComplete = true;
      const param = {
        pid: this.msg.id,
        previousPname: this.previousProjectName,
        pname: this.inputProjectName,
        taskInstructions: this.inputTaskInstruction,
        projectOwner: this.ownerList,
        assignee: this.assigneeList,
        assignmentLogic: this.assignmentLogicEdit,
        frequency: this.inputfrequency,
        trigger: this.inputTrigger,
        editLabels,
        addLabels,
        min: null,
        max: null,
        assignSlackChannels: this.slackList,
      };
      if (this.labelType == 'numericLabel' && !this.isMultipleLabel) {
        param.frequency = null;
        param.trigger = null;
        param.min = this.msg.min;
        param.max = this.msg.max;
        param.addLabels = [];
        param.editLabels = {};
      }
      if (this.msg.projectType === 'log') {
        param['isShowFilename'] = this.isShowFilename == 'yes' ? true : false;
      }
      this.avaService.saveProjectEdit(param).subscribe(
        (res) => {
          if (this.env.config.enableSendEmail) {
            this.emailService.sendEmail(
              this.inputProjectName,
              this.msg,
              this.ownerList,
              this.assigneeList,
            );
          }
          this.onSubmitEditEmitter.emit(true);
        },
        (error: any) => {
          console.log(error);
          this.onSubmitEditEmitter.emit(false);
        },
      );
    } else {
      // this.sizeError = true;
    }
  }

  overLabels(index) {
    this.activeOverOut = index;
  }

  outLabels(index) {
    this.activeOverOut = null;
  }

  isShowDelete(label, index) {
    if (label.status == 'old') {
      this.isShowDeleteModal = true;
      this.deleteLabelInfo = label;
      this.deleteLabelInfo.index = index;
    } else {
      if (
        (this.msg.projectType == 'ner' && this.categoryList.length > 1) ||
        (this.msg.projectType != 'ner' && this.categoryList.length > 2)
      ) {
        this.categoryList.splice(index, 1);
      }
    }
  }

  deleteLabel() {
    const oldLabelList = [];
    this.categoryList.forEach((element) => {
      if (element.status == 'old') {
        oldLabelList.push(element);
      }
    });
    if (
      (this.msg.projectType == 'ner' && this.categoryList.length > 1 && oldLabelList.length > 1) ||
      (this.msg.projectType != 'ner' && this.categoryList.length > 2 && oldLabelList.length > 2)
    ) {
      const param = {
        pname: this.msgInEdit.projectName,
        label: this.deleteLabelInfo.originalLabel,
      };
      this.deleteLabelComplete = true;
      this.avaService.deleteLabel(param).subscribe(
        (res) => {
          this.isShowDeleteModal = false;
          this.deleteLabelComplete = false;
          if (res.CODE == 200) {
            this.infoMessage = 'Label has been deleted successfully.';
            this.categoryList.splice(this.deleteLabelInfo.index, 1);
            this.onDeleteLabelEmitter.emit();
            setTimeout(() => {
              this.infoMessage = '';
            }, 5000);
          } else {
            this.errorMessage = 'Failed to delete the label because that label has been used.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          }
        },
        (error: any) => {
          console.log(error);
          this.isShowDeleteModal = false;
          this.deleteLabelComplete = false;
          this.errorMessage = 'Failed to delete the label because that label has been used.';
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        },
      );
    } else {
      if (this.msg.projectType == 'ner') {
        this.errorMessage =
          'Failed to delete the label because this project at least keep 1 submitted label.';
      } else {
        this.errorMessage =
          'Failed to delete the label because this project at least keep 2 submitted labels.';
      }
      this.isShowDeleteModal = false;
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    }
  }

  onCloseDeleteDialog() {
    this.isShowDeleteModal = false;
  }

  onEnterLabel(e) {
    if (e && this.inputLabelValidation == false) {
      const flag = { status: 'new', originalLabel: e, editLabel: e };
      this.categoryList.push(flag);
      this.inputNewLabel = null;
    }
  }

  labelsBlur(e: any) {
    this.onEnterLabel(e.target.value);
  }

  onLabelKeyUp(e) {
    for (let i = 0; i < this.categoryList.length; i++) {
      if (this.categoryList[i].editLabel == e.target.value) {
        this.inputLabelValidation = true;
        return;
      } else {
        this.inputLabelValidation = false;
      }
    }
  }

  editLabel(e, i) {
    this.activeClickInput = i;
  }

  enterEditLabel(e) {
    if (e.editLabel != '' && this.inputLabelValidation == false) {
      for (let i = 0; i < this.categoryList.length; i++) {
        if (this.categoryList[i].originalLabel == e.originalLabel) {
          this.categoryList[i].editLabel = e.editLabel;
        }
      }
      this.activeOverOut = null;
      this.activeClickInput = null;
    }

    if (e.editLabel == '' || this.inputLabelValidation == true) {
      this.activeClickInput = null;
      e.editLabel = e.originalLabel;
    }
  }

  blurEditLabel(e) {
    this.enterEditLabel(e);
  }

  editLabelChange(e) {
    const flag = [];
    this.categoryList.forEach((element) => {
      flag.push(element.editLabel);
    });
    let i = 0;
    flag.forEach((element) => {
      if (element == e) {
        i = i + 1;
      }
    });
    if (i > 1) {
      this.inputLabelValidation = true;
    } else {
      this.inputLabelValidation = false;
    }
  }

  minUpdate(e) {
    if (this.labelType === 'numericLabel' && this.isMultipleLabel) {
      this.checkBoth();
    } else {
      if (
        e != null &&
        Number(this.msg.max) >= Number(e) &&
        Number(this.msg.max) !== Number(this.msg.min)
      ) {
        this.sizeError = false;
      } else {
        this.sizeError = true;
      }
    }
  }

  maxUpdate(e) {
    if (this.labelType === 'numericLabel' && this.isMultipleLabel) {
      this.checkBoth();
    } else {
      if (
        e != null &&
        Number(e) >= Number(this.msg.min) &&
        Number(this.msg.max) !== Number(this.msg.min)
      ) {
        this.sizeError = false;
      } else {
        this.sizeError = true;
      }
    }
  }

  editAssignedNumber(data) {
    this.commonService.editAssignedNumber(
      data,
      this.msg.totalCase,
      this.msg.maxAnnotation,
      this.assigneeList,
    );
  }

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
          !item.editLabel,
      );
    }
  }

  onMutilLabelKeydown() {
    let labelValues = [];
    if (this.mutilLabelArray.value.length) {
      this.mutilLabelArray.value.forEach((ele) => {
        labelValues.push(ele.editLabel);
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
      status: 'new',
      originalLabel: this.formBuilder.control(''),
      editLabel: this.formBuilder.control(''),
      oldMinMutilVal: this.formBuilder.control(''),
      minMutilVal: this.formBuilder.control(''),
      oldMaxMutilVal: this.formBuilder.control(''),
      maxMutilVal: this.formBuilder.control(''),
    });
  }

  deleteMutilLabel(delIndex) {
    if (this.mutilLabelArray.value[delIndex].status === 'old') {
      this.delOldMutilLabel(delIndex);
    } else {
      this.mutilLabelArray.removeAt(delIndex);
      if (this.mutilLabelArray.value.length) {
        this.checkBoth();
      }
    }
  }

  delOldMutilLabel(delIndex) {
    const param = {
      pname: this.msgInEdit.projectName,
      label: this.mutilLabelArray.value[delIndex].originalLabel,
    };
    this.deleteLabelComplete = true;
    this.avaService.deleteLabel(param).subscribe(
      (res) => {
        this.isShowDeleteModal = false;
        this.deleteLabelComplete = false;
        if (res.CODE == 200) {
          this.infoMessage = 'Label has been deleted successfully.';
          this.mutilLabelArray.removeAt(delIndex);
          if (this.mutilLabelArray.value.length) {
            this.checkBoth();
          }
          this.onDeleteLabelEmitter.emit();
          setTimeout(() => {
            this.infoMessage = '';
          }, 5000);
        } else {
          this.errorMessage = 'Failed to delete the label because that label has been used.';
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        }
      },
      () => {
        this.isShowDeleteModal = false;
        this.deleteLabelComplete = false;
        this.errorMessage = 'Failed to delete the label because that label has been used.';
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      },
    );
  }

  receiveSlackAssign(e) {
    this.slackList = e.slackList;
    this.loadingSlack = e.loadingSlack;
    this.inputSlackValidation = e.inputSlackValidation;
  }
}
