/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { ToolService } from 'app/services/common/tool.service';
import { AvaService } from '../ava.service';

@Injectable()
export class EmailService {
  constructor(private toolService: ToolService, private avaService: AvaService) {}

  public sendEmailToAnnotator(param) {
    this.avaService.sendEmailToAnnotator(param).subscribe(
      (res) => {
        console.log('sendEmailToAnnotator:::', res);
      },
      (error: any) => {
        console.log(error);
      },
    );
  }

  public sendEmailToOwner(param) {
    this.avaService.sendEmailToOwner(param).subscribe(
      (res) => {
        console.log('sendEmailToOwner:::', res);
      },
      (error: any) => {
        console.log(error);
      },
    );
  }

  public sendEmail(inputProjectName, msg, ownerList, assigneeList) {
    const param: object = {
      pname: inputProjectName,
      fileName: msg.dataSource,
    };
    const ownerDiff = _.difference(ownerList, msg.creator);
    let aa = [];
    assigneeList.forEach((element) => {
      aa.push(element.email);
    });
    const annotatorDiff = _.difference(aa, msg.annotator);

    if (annotatorDiff.length > 0) {
      param['annotator'] = annotatorDiff;
      this.sendEmailToAnnotator(param);
    }
    if (ownerDiff.length > 0) {
      param['projectOwner'] = ownerDiff;
      this.sendEmailToOwner(param);
    }
  }
}
