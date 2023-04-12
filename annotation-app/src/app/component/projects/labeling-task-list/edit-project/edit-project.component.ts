/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as _ from 'lodash';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { ToolService } from 'src/app/services/common/tool.service';
import { CommonService } from 'src/app/services/common/common.service';
import { EmailService } from 'src/app/services/common/email.service';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { DatasetValidator } from 'src/app/shared/form-validators/dataset-validator';
import { InternalApiService } from 'src/app/services/internal-api.service';

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
  assigneeList: any = [];
  ownerList: any = [];
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
  showLabel: boolean = true;
  inputLabelErrMsg: string;
  assignType: any = [];

  constructor(
    private apiService: ApiService,
    public env: EnvironmentsService,
    private toolService: ToolService,
    private commonService: CommonService,
    private emailService: EmailService,
    private formBuilder: FormBuilder,
    private internalApiService: InternalApiService,
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
    let flag = [];
    _.cloneDeep(this.msg.annotator).forEach((annotator) => {
      for (let i = 0; i < this.msg.userCompleteCase.length; i++) {
        if (annotator === this.msg.userCompleteCase[i].user) {
          flag.push({
            email: annotator,
            assignedCase: this.msg.userCompleteCase[i].assignedCase,
            completeCase: this.msg.userCompleteCase[i].completeCase,
            setUserErrMessage: '',
          });
          break;
        }
      }
    });
    this.assigneeList = flag;
    this.assigneeList.push({ email: '', setUserErrMessage: '', assignedCase: null, completeCase: null });
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
    } else if (this.labelType === 'HTL') {
      this.categoryList = this.msg.categoryList;
    } else {
      this.msg.categoryList.split(',').forEach((element) => {
        const flag = { status: 'old', originalLabel: element, editLabel: element };
        this.categoryList.push(flag);
      });
    }
    if (this.msg.assignSlackChannels && this.msg.assignSlackChannels.length > 0) {
      this.msg.assignSlackChannels.forEach((element) => {
        this.slackList.push({ slackName: element.slackName, slackId: element.slackId, setUserErrMessage: '' });
      });
    }
    this.slackList.push({ slackName: '', slackId: '', setUserErrMessage: '' });

    this.assignType = [
      { name: 'Email', value: 'email', checked: true },
      { name: 'Slack Channel', value: 'slack', checked: false },
    ];

    let owners = JSON.parse(JSON.stringify(this.msg.creator));
    owners.forEach((element) => {
      this.ownerList.push({ email: element, setUserErrMessage: '' });
    });
    this.reAssign();
  }

  get mutilLabelArray() {
    return this.mutilNumericForm.get('mutilLabelArray') as FormArray;
  }

  pnameCheck(name) {
    const param = {
      pname: name,
    };
    if (name != this.previousProjectName) {
      this.apiService.findProjectName(param).subscribe((res) => {
        if (res.length != 0) {
          this.nameExist = true;
        } else {
          this.nameExist = false;
        }
      });
    }
  }

  reAssign() {
    this.toCheckAssigneeList(this.assigneeList).forEach((element) => {
      element.originValue = element.assignedCase;
      element.isModify = false;
    });
    this.commonService.evenlyDistributeTicket(
      this.toCheckAssigneeList(this.assigneeList),
      this.msg.totalCase,
      this.msg.maxAnnotation,
    );
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
    this.assigneeList = [];
    this.slackList = [];
    this.ownerList = [];
    this.onCloseEditDialogEmitter.emit();
  }

  changeAssignType(e, index) {}

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

  validSubmit() {
    if (this.nameExist || this.inputProjectName == '') {
      return false;
    }
    if (this.toCheckAssigneeList(this.ownerList).length < 1) {
      return false;
    }
    if (!this.assignType[0].checked && !this.assignType[1].checked) {
      return false;
    }
    if (this.assignType[0].checked && this.toCheckAssigneeList(this.assigneeList).length < 1) {
      return false;
    }
    if (this.assignType[1].checked && this.toCheckSlackList().length < 1) {
      return false;
    }
    return true;
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
      this.validSubmit() &&
      !this.notNumber &&
      !this.notTriggerNumber &&
      !this.minThreshold &&
      !this.minFrequency &&
      this.inputfrequency > 9 &&
      this.inputTrigger > 49 &&
      !this.inputIsNull &&
      !this.inputLabelValidation;
    if (this.labelType == 'numericLabel' && !this.isMultipleLabel) {
      condition =
        this.validSubmit() &&
        !this.sizeError &&
        this.msg.min <= this.oldMin &&
        this.msg.max >= this.oldMax &&
        this.msg.min !== this.msg.max;
    }
    if (condition) {
      this.editProjectComplete = true;
      let arr = [];
      this.toCheckAssigneeList(this.ownerList).forEach((value) => {
        arr.push(value.email);
      });

      const param = {
        pid: this.msg.id,
        previousPname: this.previousProjectName,
        pname: this.inputProjectName,
        taskInstructions: this.inputTaskInstruction,
        projectOwner: arr,
        assignee: this.toCheckAssigneeList(this.assigneeList),
        assignmentLogic: this.assignmentLogicEdit,
        frequency: this.inputfrequency,
        trigger: this.inputTrigger,
        editLabels,
        addLabels,
        min: null,
        max: null,
        assignSlackChannels: this.toCheckSlackList(),
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
      this.apiService.saveProjectEdit(param).subscribe(
        (res) => {
          if (this.env.config.enableSendEmail) {
            this.emailService.sendEmail(
              this.inputProjectName,
              this.msg,
              arr,
              this.toCheckAssigneeList(this.assigneeList),
            );
          }
          this.onSubmitEditEmitter.emit(true);
        },
        (error: any) => {
          this.onSubmitEditEmitter.emit(false);
        },
      );
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
      this.apiService.deleteLabel(param).subscribe(
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
        this.errorMessage = 'Failed to delete the label because this project at least keep 1 submitted label.';
      } else {
        this.errorMessage = 'Failed to delete the label because this project at least keep 2 submitted labels.';
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
    // to check format comma
    if (/[,，]/g.test(e.trim())) {
      this.inputLabelErrMsg = 'Wrong format! Not allow comma.';
      return;
    } else {
      this.inputLabelErrMsg = '';
    }
    if (e && this.inputLabelValidation == false && !this.inputLabelErrMsg) {
      const flag = { status: 'new', originalLabel: e.trim(), editLabel: e.trim() };
      this.categoryList.push(flag);
      this.inputNewLabel = null;
    }
  }

  labelsBlur(e: any) {
    this.onEnterLabel(e.target.value);
  }

  onLabelKeyUp(e) {
    for (let i = 0; i < this.categoryList.length; i++) {
      if (this.categoryList[i].editLabel == e.target.value.trim()) {
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

    if (e.editLabel == '' || this.inputLabelValidation == true || this.inputLabelErrMsg) {
      this.activeClickInput = null;
      e.editLabel = e.originalLabel;
      this.inputLabelErrMsg = '';
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
      if (element == e.trim()) {
        i = i + 1;
      }
    });
    if (i > 1) {
      this.inputLabelValidation = true;
    } else {
      this.inputLabelValidation = false;
    }
    // to check format comma
    if (/[,，]/g.test(e.trim())) {
      this.inputLabelErrMsg = 'Wrong format! Not allow comma.';
      return;
    } else {
      this.inputLabelErrMsg = '';
    }
  }

  minUpdate(e) {
    if (this.labelType === 'numericLabel' && this.isMultipleLabel) {
      this.checkBoth();
    } else {
      if (e != null && Number(this.msg.max) >= Number(e) && Number(this.msg.max) !== Number(this.msg.min)) {
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
      if (e != null && Number(e) >= Number(this.msg.min) && Number(this.msg.max) !== Number(this.msg.min)) {
        this.sizeError = false;
      } else {
        this.sizeError = true;
      }
    }
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
    this.apiService.deleteLabel(param).subscribe(
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

  toCheckAssigneeList(list) {
    let arr = [];
    for (let i = 0; i < list.length; i++) {
      if (!list[i].setUserErrMessage && !list[i].emailReg && list[i].email) {
        arr.push(list[i]);
      } else if (!list[i].setUserErrMessage && !list[i].emailReg && !list[i].email) {
        continue;
      } else {
        return [];
      }
    }
    return arr;
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
    this.reAssign();
  }

  inputTicketsUpdate(user) {
    if (this.toCheckAssigneeList(this.assigneeList).length > 0) {
      this.commonService.editAssignedNumber(
        user,
        this.msg.totalCase,
        this.msg.maxAnnotation,
        this.toCheckAssigneeList(this.assigneeList),
      );
    }
  }

  deleteUserRow(index) {
    if (this.assigneeList.length > 1) {
      this.assigneeList.splice(index, 1);
      this.toCheckAssigneeList(this.assigneeList)?.forEach((item) => {
        item.isModify = false;
      });
      this.commonService.evenlyDistributeTicket(
        this.toCheckAssigneeList(this.assigneeList),
        this.msg.totalCase,
        this.msg.maxAnnotation,
      );
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
    });
  }

  deleteSlackRow(index) {
    if (this.slackList.length > 1) {
      this.slackList.splice(index, 1);
    }
  }

  createEmailRow() {
    this.assigneeList.push({ email: '', setUserErrMessage: '' });
  }

  inputOwnerUpdate(array, index) {
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
  }

  deleteOwnerRow(i) {
    if (this.ownerList.length > 1) {
      this.ownerList.splice(i, 1);
    }
  }

  createOwnerRow() {
    this.ownerList.push({ email: '', setUserErrMessage: '' });
  }
}
