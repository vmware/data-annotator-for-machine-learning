/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import { resolve } from 'core-js/fn/promise';
import * as _ from 'lodash';
import { AvaService } from '../ava.service';

@Injectable()
export class CommonService {
  constructor(private avaService: AvaService) {}

  editAssignedNumber(data, totalRow, maxAnnotations, assigneeList) {
    if (data.assignedCase <= 0) {
      alert('Assigned tickets number should be more than 1.');
      data.assignedCase = data.originValue;
      return;
    }
    let orginisModify = data.isModify;
    if (data.assignedCase !== data.originValue) {
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
    if (size === array.length && array.length !== 1) {
      //the last one only can be linkage changed
      array[array.length - 1].isModify = false;
    }
    if (max < array.length || array.length === 1) {
      if (totalnum + (array.length - size) > max * row) {
        alert(
          'Fail to modify for the assigned tickets number is larger than the max value can be set.',
        );
        data.assignedCase = data.originValue;
        data.isModify = orginisModify;
        return;
      }
    } else {
      data.assignedCase = data.originValue;
      data.isModify = orginisModify;
      return;
    }

    if (_.filter(assigneeList, { isModify: true }).length > 0) {
      this.evenlyDistributeTicket(array, row, max);
    }
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
          value.originValue = totalRow;
          value.isModify = false;
        });
      } else {
        let flag = false;
        for (let a of assigneeList) {
          if (a.isModify) {
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
              assigneeList[i].originValue = assigneeList[i].assignedCase;
              continue;
            }
            if (d > 0) {
              assigneeList[i].assignedCase = c + 1;
              assigneeList[i].originValue = c + 1;
              d--;
            } else {
              assigneeList[i].assignedCase = c;
              assigneeList[i].originValue = c;
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
            value.originValue = a;
            value.isModify = false;
          });
          for (let i = 0; i <= b - 1; i++) {
            assigneeList[i].assignedCase = a + 1;
            assigneeList[i].originValue = a + 1;
          }
        }
      }
    }
  }

  generateProject(e, datasets, email, from) {
    let response;
    return new Promise<any>((resolve) => {
      if (e.labelType == 'numericLabel') {
        for (let items of datasets) {
          if (items.id === e.id) {
            items.generateInfo.status = 'generating';
            break;
          }
        }

        this.avaService.generate(e.id, email, 'standard', from).subscribe(
          (res) => {
            if (res && res.Info != 'undefined') {
              if (res.Info == 'prepare') {
                response = {
                  res: res,
                  datasets: datasets,
                  infoMessage:
                    'Dataset with annotations is being generated. You will receive an email when download is ready.',
                };
                resolve(response);
              } else if (res.Info == 'done') {
                for (let items of datasets) {
                  if (items.id === e.id) {
                    items.generateInfo.status = 'done';
                  }
                }
                response = {
                  res: res,
                  datasets: datasets,
                };
                resolve(response);
              } else if (res.Info == 'generating') {
                response = {
                  res: res,
                  datasets: datasets,
                  infoMessage:
                    'Dataset with annotations is already being generated. Please refresh the page.',
                };
                resolve(response);
              }
            }
          },
          (error: any) => {
            console.log(error);
            response = {
              err: error,
              datasets: datasets,
            };
            resolve(response);
          },
        );
      } else {
        e.src = from;
        if (e.projectType == 'log') {
          this.avaService.downloadProject(e.id).subscribe(
            (res) => {
              if (res) {
                e.originalDataSets = res.originalDataSets;
                response = {
                  datasets: datasets,
                  e: e,
                };
                resolve(response);
              }
            },
            (error: any) => {
              console.log(error);
              response = {
                err: error,
                datasets: datasets,
              };
              resolve(response);
            },
          );
        } else {
          response = {
            datasets: datasets,
            e: e,
          };
          resolve(response);
        }
      }
    });
  }
}
