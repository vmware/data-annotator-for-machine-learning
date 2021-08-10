/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { EnvironmentsService } from 'app/services/environments.service';

@Injectable()
export class CommonService {
  constructor(public env: EnvironmentsService) {}

  editAssignedNumber(data, totalRow, maxAnnotations, assigneeList) {
    if (data.assignedCase <= 0) {
      alert('Assigned tickets number should be more than 1.');
      data.assignedCase = data.orginvalue;
      return;
    }
    let orginisModify = data.isModify;
    if (data.assignedCase !== data.orginvalue) {
      data.isModify = true;
    }
    let totalnum = 0;
    let size = 0;
    let row = totalRow;
    let max = maxAnnotations;
    let array = assigneeList;
    array.forEach((value) => {
      if (value.isModify) {
        totalnum += value.assignedCase;
        size++;
      }
    });
    if (size === array.length) {
      //the last one only can be linkage changed
      array[array.length - 1].isModify = false;
    }
    if (max < array.length) {
      if (totalnum + (array.length - size) > max * row) {
        alert(
          'Fail to modify for the assigned tickets number is larger than the max value can be set.',
        );
        data.assignedCase = data.orginvalue;
        data.isModify = orginisModify;
        return;
      }
    }

    this.evenlyDistributeTicket(array, row, max);
  }

  evenlyDistributeTicket(assigneeList, totalRow, maxAnnotations) {
    if (totalRow === 0) {
      assigneeList.forEach((value) => {
        //init num is 1
        value.assignedCase = 1;
      });
    } else {
      if (maxAnnotations >= assigneeList.length) {
        assigneeList.forEach((value) => {
          value.assignedCase = totalRow;
          value.orginvalue = totalRow;
          value.isModify = false;
        });
      } else {
        let flag = false;
        for (let i = 0; i < assigneeList.length; i++) {
          if (assigneeList[i].isModify) {
            flag = true;
            break;
          }
        }
        if (flag) {
          let totalmodify = 0;
          let array = [];
          let num = 0;
          assigneeList.forEach((value, index) => {
            if (value.isModify) {
              totalmodify += value.assignedCase;
              array.push(index);
              num++;
            }
          });
          let totalNum = totalRow * maxAnnotations - totalmodify;
          let personNum = assigneeList.length - num;
          let c = Math.floor(totalNum / personNum);
          let d = totalNum % personNum;
          for (let i = 0; i < assigneeList.length; i++) {
            if (array.indexOf(i) > -1) {
              assigneeList[i].orginvalue = assigneeList[i].assignedCase;
              continue;
            }
            if (d > 0) {
              assigneeList[i].assignedCase = c + 1;
              assigneeList[i].orginvalue = c + 1;
              d--;
            } else {
              assigneeList[i].assignedCase = c;
              assigneeList[i].orginvalue = c;
              assigneeList[i].isModify = false;
            }
          }
        } else {
          //to calculate the total
          let totalNum = totalRow * maxAnnotations;
          let personNum = assigneeList.length;
          let a = Math.floor(totalNum / personNum);
          let b = totalNum % personNum;
          assigneeList.forEach((value) => {
            value.assignedCase = a;
            value.orginvalue = a;
            value.isModify = false;
          });
          for (let i = 0; i <= b - 1; i++) {
            assigneeList[i].assignedCase = a + 1;
            assigneeList[i].orginvalue = a + 1;
          }
        }
      }
    }
  }
}
