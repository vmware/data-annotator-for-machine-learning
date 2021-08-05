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

  constructor(
    private avaService: AvaService,
    private env: EnvironmentsService,
    private toolService: ToolService,
  ) {
    this.inputPnameUpdate.pipe(debounceTime(400), distinctUntilChanged()).subscribe((value) => {
      if (value != '') {
        this.pnameCheck(value);
      } else {
        this.nameExist = false;
      }
    });
  }

  ngOnInit() {
    this.msg = JSON.parse(JSON.stringify(this.msgInEdit));
    const al = this.msg.al;
    this.previousProjectName = this.msg.projectName;
    this.inputProjectName = this.msg.projectName;
    this.inputfrequency = al.frequency ? al.frequency : null;
    this.inputTrigger = al.trigger ? al.trigger : null;
    this.labelType = this.msg.labelType;
    this.inputProjectCreator = this.msg.creator;
    this.inputProjectAssignee = this.msg.annotator;
    let flag = [];
    _.cloneDeep(this.msg.annotator).forEach(annotator => {
      for (let i = 0; i < this.msg.userCompleteCase.length; i++) {
        if (annotator === this.msg.userCompleteCase[i].user) {
          flag.push({ email: annotator, assignedCase: this.msg.userCompleteCase[i].assignedCase, completeCase: this.msg.userCompleteCase[i].completeCase })
          break;
        }
      }
    });
    this.assigneeList = flag;
    console.log(3, this.assigneeList)
    this.ownerList = JSON.parse(JSON.stringify(this.msg.creator));
    this.assignmentLogicEdit = this.msg.assignmentLogic;
    this.isShowFilename = this.msg.isShowFilename ? 'yes' : 'no';
    this.oldMax = this.msg.max;
    this.oldMin = this.msg.min;
    this.msg.categoryList.split(',').forEach((element) => {
      const flag = { status: 'old', originalLabel: element, editLabel: element };
      this.categoryList.push(flag);
    });
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
    if (name == '') {
      this.nameExist = false;
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

  // onAssigneeKeydown(e) {
  //   console.log(15,this.assigneeList)
  //   if (this.assigneeList.indexOf(e.target.value) !== -1) {
  //     this.inputAssigneeValidation = true;
  //   } else {
  //     this.inputAssigneeValidation = false;
  //   }
  // }

  onAssigneeKeydown(e) {
    // if (this.assigneeList.indexOf(e.target.value) !== -1) {
    let flag = _.filter(this.assigneeList, ['email', e.target.value]);
    console.log(1, flag);
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
        // if (this.assigneeList.indexOf(element.trim()) == -1) {
          if (_.filter(this.assigneeList, ['email', element.trim()]).length === 0) {

          // this.assigneeList.push(element.trim());
          this.assigneeList.push({ email: element.trim(), assignedCase: 0 });

        }
      });
      if (this.assigneeList.length > 0) {
        this.assigneeList.forEach(item=>{
          item.isModify=false;
        })
        this.evenlyDistributeTicket(
          this.assigneeList,
          this.msg.totalCase,
          this.msg.maxAnnotation
        );
      }
      e.target.value = '';
    }
  }

  deleteAssignee(index) {
    this.assigneeList.splice(index, 1);
    if (this.assigneeList.length > 0) {
      this.assigneeList.forEach(item=>{
        item.isModify=false;
      })
      this.evenlyDistributeTicket(
        this.assigneeList,
        this.msg.totalCase,
        this.msg.maxAnnotation
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
    const editLabels = {};
    const addLabels = [];
    this.categoryList.forEach((element) => {
      if (element.status == 'old') {
        editLabels[element.originalLabel] = element.editLabel;
      }
      if (element.status == 'new') {
        addLabels.push(element.editLabel);
      }
    });
    let condition =
      this.inputProjectName !== '' &&
      this.inputProjectCreator !== '' &&
      this.assigneeList.length > 0 &&
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
      this.inputTrigger > 49;
    if (this.labelType == 'numericLabel') {
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
        this.msg.max >= this.oldMax;
    }
    if (condition) {
      this.editProjectComplete = true;
      const param = {
        pid: this.msg.id,
        previousPname: this.previousProjectName,
        pname: this.inputProjectName,
        projectOwner: this.ownerList,
        assignee: this.assigneeList,
        assignmentLogic: this.assignmentLogicEdit,
        frequency: this.inputfrequency,
        trigger: this.inputTrigger,
        editLabels,
        addLabels,
        min: null,
        max: null,
      };
      if (this.labelType == 'numericLabel') {
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
            const param: object = {
              pname: this.inputProjectName,
              fileName: this.msg.dataSource,
            };
            const ownerDiff = _.difference(this.ownerList, this.msg.creator);
            let aa=[];
            this.assigneeList.forEach(element => {
              aa.push(element.email);
            });
            // const annotatorDiff = _.difference(this.assigneeList, this.msg.annotator);
            const annotatorDiff = _.difference(aa, this.msg.annotator);

            if (annotatorDiff.length > 0) {
              param['annotator'] = annotatorDiff;
              this.sendEmailToAnnotator(param);
            }
            if (ownerDiff.length > 0) {
              param['projectOwner'] = ownerDiff;
              this.sendEmailToOwner(param);
            }
          }
          this.onSubmitEditEmitter.emit(true);
        },
        (error: any) => {
          console.log(error);
          this.onSubmitEditEmitter.emit(false);
        },
      );
    }
  }

  sendEmailToAnnotator(param) {
    this.avaService.sendEmailToAnnotator(param).subscribe(
      (res) => {
        console.log('sendEmailToAnnotator:::', res);
      },
      (error: any) => {
        console.log(error);
      },
    );
  }

  sendEmailToOwner(param) {
    this.avaService.sendEmailToOwner(param).subscribe(
      (res) => {
        console.log('sendEmailToOwner:::', res);
      },
      (error: any) => {
        console.log(error);
      },
    );
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
        (this.msg.projectTyp != 'ner' && this.categoryList.length > 2)
      ) {
        this.categoryList.splice(index, 1);
      } else {
        this.errorMessage =
          'Failed to delete the label because this project at least keep ' +
          this.categoryList.length +
          ' label.';
        this.isShowDeleteModal = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 1000);
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
      (this.msg.projectTyp != 'ner' && this.categoryList.length > 2 && oldLabelList.length > 2)
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
            }, 1000);
          } else {
            this.errorMessage = 'Failed to delete the label because that label has been used.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 1000);
          }
        },
        (error: any) => {
          console.log(error);
          this.isShowDeleteModal = false;
          this.deleteLabelComplete = false;
          this.errorMessage = 'Failed to delete the label because that label has been used.';
          setTimeout(() => {
            this.errorMessage = '';
          }, 1000);
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
      }, 1000);
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

  enterEditLabel(e, i) {
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

  blurEditLabel(e, i) {
    this.enterEditLabel(e, i);
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
    if (e != null && Number(this.msg.max) >= Number(e)) {
      this.sizeError = false;
    } else {
      this.sizeError = true;
    }
  }

  maxUpdate(e) {
    if (e != null && Number(e) >= Number(this.msg.min)) {
      this.sizeError = false;
    } else {
      this.sizeError = true;
    }
  }

  evenlyDistributeTicket(assigneeList, totalRow, maxAnnotations) {
    // totalRow=55
    if(totalRow===0){
      assigneeList.forEach((value,index) => {
        value.assignedCase = 1;//初始化的值最小为1;
      });
    }else{
      console.log(assigneeList, totalRow, maxAnnotations)
      if ( maxAnnotations>= assigneeList.length) {
        assigneeList.forEach((value) => {
          value.assignedCase = totalRow;
          value.orginvalue=totalRow;
          value.isModify=false;
        });
      } else {
        let flag=false;
        for(let i =0;i<assigneeList.length;i++){
          if(assigneeList[i].isModify){
            flag=true;
            break;
          }
        }
        if(flag){
          let totalmodify=0;
          let array=[];
          let num =0;
          assigneeList.forEach((value,index) => {
            if(value.isModify){
              totalmodify+=value.assignedCase;
              array.push(index);
              num++;
            }
          });
          let totalNum =totalRow*maxAnnotations-totalmodify;
          let personNum=assigneeList.length-num;
          let c =Math.floor(totalNum/personNum);
          let d =totalNum%personNum;
          for(let i =0;i<assigneeList.length;i++){
            if(array.indexOf(i)>-1){
              continue;
            }
            if(d>0){
              assigneeList[i].assignedCase = c+1;
              assigneeList[i].orginvalue=c+1;
              d--;
            }else{
              assigneeList[i].assignedCase = c;
              assigneeList[i].orginvalue=c;
              assigneeList[i].isModify=false;
            }
          }
        }else{
          //计算总条数
          let totalNum = totalRow*maxAnnotations;
          let personNum = assigneeList.length;
          let a =Math.floor(totalNum/personNum);
          let b =totalNum%personNum;
          assigneeList.forEach((value,index) => {
            value.assignedCase = a;
            value.orginvalue=a;
            value.isModify=false;
          });
          for(let i =0;i<=b-1;i++){
            assigneeList[i].assignedCase=a+1;
            assigneeList[i].orginvalue=a+1;
          }
        } 
      }
    }
  }

  editAssignedNumber(data,index) {
    console.log(99, data);
    if(data.assignedCase<=0){
      alert("Assigned tickets number should be more than 1.");
      data.assignedCase=data.orginvalue
      return;
    }
    if(data.assignedCase!==data.orginvalue){
      data.isModify=true;
    }
    let totalnum=0;
    let size =0;
    
        
    let row =this.msg.totalCase;
    // row=55;
    let max= this.msg.maxAnnotation;
    let array=this.assigneeList;
    array.forEach((value,index) => {
      if(value.isModify){
        totalnum+=value.assignedCase;
        size++;
      }
    });
    if(size===array.length){
      //当数组中的值都修改过后，默认最后一个值可以被自动修改
      array[array.length-1].isModify=false;
    }
    if(max< array.length){
      if(totalnum+(array.length-size)>max*row){
        alert("Fail to modify for the total assigned tickets is more than the total valid tickets.");
        data.assignedCase=data.orginvalue;
        return;
      }
    }

    this.evenlyDistributeTicket(array,row,max);
  }

}
