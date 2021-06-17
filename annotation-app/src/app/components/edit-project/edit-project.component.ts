/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AvaService } from "../../services/ava.service";
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as _ from "lodash";
import { EnvironmentsService } from "app/services/environments.service";
import { ToolService } from 'app/services/common/tool.service';

@Component({
  selector: 'app-edit-project',
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.scss']
})
export class EditProjectComponent implements OnInit {

  @Input() msgInEdit: any;

  @Output('onCloseEditDialog')
  onCloseEditDialogEmitter = new EventEmitter();

  @Output('onSubmitEdit')
  onSubmitEditEmitter = new EventEmitter();

  @Output('onDeleteLabel')
  onDeleteLabelEmitter = new EventEmitter();


  inputProjectName: string = "";
  nameExist: boolean;
  inputProjectCreator: string = "";
  emailRegForOwner: boolean = true;
  inputProjectAssignee: any = [];
  showAnnotatorList: boolean;
  showOwnerList: boolean;
  assigneeList: any = [];
  ownerList: any = [];
  inputAssigneeValidation: boolean;
  inputOwnerValidation: boolean;
  emailReg: boolean = true;
  inputTrigger: number;
  notTriggerNumber: boolean;
  minThreshold: boolean;
  minFrequency: boolean;
  labelType: string = '';
  inputfrequency: number;
  notNumber: boolean;
  assignmentLogicEdit: any;
  previousProjectName: string = "";
  inputPnameUpdate = new Subject<string>();
  editProjectComplete: boolean = false;
  categoryList: any = [];
  activeOverOut: number;
  inputLabelValidation: boolean = false;
  inputNewLabel: any;
  activeClickInput: number;
  sizeError: boolean = false;
  oldMin: number;
  oldMax: number;
  msg: any;
  errorMessage: string = '';
  infoMessage: string = '';
  isShowDeleteModal: boolean = false;
  deleteLabelInfo: any;
  deleteLabelComplete: boolean = false;
  isShowFilename: any;

  constructor(
    private avaService: AvaService,
    private env: EnvironmentsService,
    private toolService: ToolService


  ) {
    this.inputPnameUpdate.pipe(
      debounceTime(400),
      distinctUntilChanged())
      .subscribe(value => {
        if (value != '') {
          this.pnameCheck(value);
        } else {
          this.nameExist = false;
        }
      });
  }



  ngOnInit() {
    // setTimeout(() => {
    //   console.log('EditProjectComponent:::', this.msgInEdit)
    // }, 500);
    this.msg = JSON.parse(JSON.stringify(this.msgInEdit));
    let al = this.msg.al;
    this.previousProjectName = this.msg.projectName;
    this.inputProjectName = this.msg.projectName;
    this.inputfrequency = al.frequency ? al.frequency : null;
    this.inputTrigger = al.trigger ? al.trigger : null;
    this.labelType = this.msg.labelType;
    this.inputProjectCreator = this.msg.creator;
    this.inputProjectAssignee = this.msg.annotator;
    this.assigneeList = JSON.parse(JSON.stringify(this.msg.annotator));
    this.ownerList = JSON.parse(JSON.stringify(this.msg.creator));
    this.assignmentLogicEdit = this.msg.assignmentLogic;
    this.isShowFilename = this.msg.isShowFilename ? 'yes' : 'no';
    this.oldMax = this.msg.max;
    this.oldMin = this.msg.min;
    this.msg.categoryList.split(',').forEach(element => {
      let flag = { status: 'old', originalLabel: element, editLabel: element };
      this.categoryList.push(flag);

    });
  }



  pnameCheck(name) {
    let param = {
      pname: name
    };
    if (name != this.previousProjectName) {
      this.avaService.findProjectName(param).subscribe(res => {
        if (res.length != 0) {
          this.nameExist = true;
        } else {
          this.nameExist = false;
        }
      });
    }
    if (name == '') {
      this.nameExist = false;
    }
  };


  onInputingProjectOwner(e) {
    let emails = e.target.value.split(/,|;/);
    this.emailRegForOwner = this.toolService.toRegEmail(emails);
    // if (this.env.config.authUrl) {
    //   for (let i = 0; i < emails.length; i++) {
    //     if (!(/^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@vmware.com$/).test(emails[i].trim())) {
    //       this.emailRegForOwner = false;
    //       return;
    //     };
    //     this.emailRegForOwner = true;
    //   }
    // } else {
    //   for (let i = 0; i < emails.length; i++) {
    //     if (!(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emails[i].trim()))) {
    //       this.emailRegForOwner = false;
    //       return;
    //     };
    //     this.emailRegForOwner = true;
    //   }
    // };
    if (this.emailRegForOwner && this.inputOwnerValidation == false) {
      emails.forEach(element => {
        if (this.ownerList.indexOf(element.trim()) == -1) {
          this.ownerList.push(element.trim());
        }
      });
      e.target.value = '';
    };

  };


  onAssigneeKeydown(e) {
    if (this.assigneeList.indexOf(e.target.value) !== -1) {
      this.inputAssigneeValidation = true;
    } else {
      this.inputAssigneeValidation = false;
    }
  };



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
  };



  reOwner(e) {
    this.showOwnerList = true;
    e.target.value = '';
    this.inputOwnerValidation = false;
    this.emailRegForOwner = true;
  };



  onInputingAssignee(e) {
    let emails = e.target.value.split(/,|;/);
    this.emailReg = this.toolService.toRegEmail(emails);
    // if (this.env.config.authUrl) {
    //   for (let i = 0; i < emails.length; i++) {
    //     if (!(/^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@vmware.com$/).test(emails[i].trim())) {
    //       this.emailReg = false;
    //       return;
    //     };
    //     this.emailReg = true;
    //   }
    // } else {
    //   for (let i = 0; i < emails.length; i++) {
    //     if (!(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emails[i].trim()))) {
    //       this.emailReg = false;
    //       return;
    //     };
    //     this.emailReg = true;
    //   }
    // };
    if (this.emailReg && this.inputAssigneeValidation == false) {
      emails.forEach(element => {
        if (this.assigneeList.indexOf(element.trim()) == -1) {
          this.assigneeList.push(element.trim());
        }
      });
      e.target.value = '';
    };
  };


  deleteAssignee(index) {
    this.assigneeList.splice(index, 1);
  };


  deleteOwner(index) {
    this.ownerList.splice(index, 1)
  }


  inputTriggerBlur(e) {
    let pattern = `^[0-9]+$`;
    let argRegEx = new RegExp(pattern, 'g');
    if (e.target.value < 50) {
      this.minThreshold = true;
      this.notTriggerNumber = false;
    } else {
      this.minThreshold = false;
      if (!String(e.target.value).match(argRegEx)) {
        this.notTriggerNumber = true;
      } else {
        this.notTriggerNumber = false;
      };
    };
  }


  inputFrequencyBlur(e) {

    let pattern = `^[0-9]+$`;
    let argRegEx = new RegExp(pattern, 'g');
    if (e.target.value < 10) {
      this.minFrequency = true;
      this.notNumber = false;
    } else {
      this.minFrequency = false;
      if (!String(e.target.value).match(argRegEx)) {
        this.notNumber = true;
      } else {
        this.notNumber = false;
      };
    };
  };


  onCloseEditDialog() {
    this.onCloseEditDialogEmitter.emit();
  };


  saveProjectEdit(id) {
    let editLabels = {};
    let addLabels = [];
    this.categoryList.forEach(element => {
      if (element.status == 'old') {
        editLabels[element.originalLabel] = element.editLabel;
      };
      if (element.status == 'new') {
        addLabels.push(element.editLabel);
      }
    });
    let condition = this.inputProjectName !== '' && this.inputProjectCreator !== '' && this.assigneeList.length > 0 && this.ownerList.length > 0 && !this.nameExist && this.emailReg && !this.inputAssigneeValidation && this.emailRegForOwner && !this.notNumber && !this.notTriggerNumber && !this.minThreshold && !this.minFrequency && this.inputfrequency > 9 && this.inputTrigger > 49;
    if (this.labelType == "numericLabel") {
      condition = this.inputProjectName !== '' && this.inputProjectCreator !== '' && this.assigneeList.length > 0 && this.ownerList.length > 0 && !this.nameExist && this.emailReg && !this.inputAssigneeValidation && this.emailRegForOwner && !this.sizeError && this.msg.min <= this.oldMin && this.msg.max >= this.oldMax;
    };
    if (condition) {
      this.editProjectComplete = true;
      let param = {
        pid: this.msg.id,
        previousPname: this.previousProjectName,
        pname: this.inputProjectName,
        projectOwner: this.ownerList,
        assignee: this.assigneeList,
        assignmentLogic: this.assignmentLogicEdit,
        frequency: this.inputfrequency,
        trigger: this.inputTrigger,
        editLabels: editLabels,
        addLabels: addLabels,
        min: null,
        max: null

      };
      if (this.labelType == "numericLabel") {
        param.frequency = null;
        param.trigger = null;
        param.min = this.msg.min;
        param.max = this.msg.max;
        param.addLabels = [];
        param.editLabels = {};
      };
      if (this.msg.projectType === 'log') {
        param['isShowFilename'] = this.isShowFilename == 'yes' ? true : false;
      }
      this.avaService.saveProjectEdit(param).subscribe(res => {
        if (this.env.config.enableSendEmail) {
          let param: object = {
            pname: this.inputProjectName,
            fileName: this.msg.dataSource
          };
          let ownerDiff = _.difference(this.ownerList, this.msg.creator);
          let annotatorDiff = _.difference(this.assigneeList, this.msg.annotator);
          if (annotatorDiff.length > 0) {
            param['annotator'] = annotatorDiff;
            this.sendEmailToAnnotator(param);
          };
          if (ownerDiff.length > 0) {
            param['projectOwner'] = ownerDiff;
            this.sendEmailToOwner(param);
          }
        }
        this.onSubmitEditEmitter.emit(true);
      }, (error: any) => {
        console.log(error);
        this.onSubmitEditEmitter.emit(false);
      });
    }

  };


  sendEmailToAnnotator(param) {
    this.avaService.sendEmailToAnnotator(param).subscribe(res => {
      console.log('sendEmailToAnnotator:::', res);
    }, (error: any) => {
      console.log(error);
    });
  }


  sendEmailToOwner(param) {
    this.avaService.sendEmailToOwner(param).subscribe(res => {
      console.log('sendEmailToOwner:::', res);
    }, (error: any) => {
      console.log(error);
    });
  };


  overLabels(index) {
    this.activeOverOut = index;
  }

  outLabels(index) {
    this.activeOverOut = null;
  };


  isShowDelete(label, index) {
    if (label.status == 'old') {
      this.isShowDeleteModal = true;
      this.deleteLabelInfo = label;
      this.deleteLabelInfo.index = index;
    } else {
      if ((this.msg.projectType == 'ner' && this.categoryList.length > 1) || (this.msg.projectTyp != 'ner' && this.categoryList.length > 2)) {
        this.categoryList.splice(index, 1);

      } else {
        this.errorMessage = 'Failed to delete the label because this project at least keep ' + this.categoryList.length + ' label.'
        this.isShowDeleteModal = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 1000);

      }
    }

  }

  deleteLabel() {
    let oldLabelList = [];
    this.categoryList.forEach(element => {
      if (element.status == 'old') {
        oldLabelList.push(element)
      }
    });
    if ((this.msg.projectType == 'ner' && this.categoryList.length > 1 && oldLabelList.length > 1) || (this.msg.projectTyp != 'ner' && this.categoryList.length > 2 && oldLabelList.length > 2)) {
      let param = {
        pname: this.msgInEdit.projectName,
        label: this.deleteLabelInfo.originalLabel
      };
      this.deleteLabelComplete = true;
      this.avaService.deleteLabel(param).subscribe(res => {
        this.isShowDeleteModal = false;
        this.deleteLabelComplete = false;
        if (res.CODE == 200) {
          this.infoMessage = 'Label has been deleted successfully.';
          this.categoryList.splice(this.deleteLabelInfo.index, 1);
          this.onDeleteLabelEmitter.emit();
          setTimeout(() => {
            this.infoMessage = '';
          }, 1000);
        } else {
          this.errorMessage = 'Failed to delete the label because that label has been used.'
          setTimeout(() => {
            this.errorMessage = '';
          }, 1000);
        };
      }, (error: any) => {
        console.log(error);
        this.isShowDeleteModal = false;
        this.deleteLabelComplete = false;
        this.errorMessage = 'Failed to delete the label because that label has been used.'
        setTimeout(() => {
          this.errorMessage = '';
        }, 1000);

      })
    } else {
      if (this.msg.projectType == 'ner') {
        this.errorMessage = 'Failed to delete the label because this project at least keep 1 submitted label.'
      } else {
        this.errorMessage = 'Failed to delete the label because this project at least keep 2 submitted labels.'
      }
      this.isShowDeleteModal = false;
      setTimeout(() => {
        this.errorMessage = '';
      }, 1000);
    }


  };


  onCloseDeleteDialog() {
    this.isShowDeleteModal = false;
  }


  onEnterLabel(e) {
    if (e && this.inputLabelValidation == false) {
      let flag = { status: 'new', originalLabel: e, editLabel: e };
      this.categoryList.push(flag);
      this.inputNewLabel = null;
    }
  };


  labelsBlur(e: any) {
    this.onEnterLabel(e.target.value);
  };


  onLabelKeyUp(e) {
    for (let i = 0; i < this.categoryList.length; i++) {
      if (this.categoryList[i].editLabel == e.target.value) {
        this.inputLabelValidation = true;
        return;
      } else {
        this.inputLabelValidation = false;
      }
    }
  };


  editLabel(e, i) {
    this.activeClickInput = i;
  };


  enterEditLabel(e, i) {
    if (e.editLabel != '' && this.inputLabelValidation == false) {
      for (let i = 0; i < this.categoryList.length; i++) {
        if (this.categoryList[i].originalLabel == e.originalLabel) {
          this.categoryList[i].editLabel = e.editLabel;
        }
      };
      this.activeOverOut = null;
      this.activeClickInput = null;
    }

    if (e.editLabel == '' || this.inputLabelValidation == true) {
      this.activeClickInput = null;
      e.editLabel = e.originalLabel;
    };


  };


  blurEditLabel(e, i) {
    this.enterEditLabel(e, i);

  };


  editLabelChange(e) {
    let flag = [];
    this.categoryList.forEach(element => {
      flag.push(element.editLabel);
    });
    let i = 0;
    flag.forEach(element => {
      if (element == e) {
        i = i + 1;
      }
    });
    if (i > 1) {
      this.inputLabelValidation = true;
    } else {
      this.inputLabelValidation = false;
    }
  };


  minUpdate(e) {
    if (e != null && Number(this.msg.max) >= Number(e)) {
      this.sizeError = false;
    } else {
      this.sizeError = true;
    };

  };


  maxUpdate(e) {
    if (e != null && Number(e) >= Number(this.msg.min)) {
      this.sizeError = false;
    } else {
      this.sizeError = true;
    };

  }




}
