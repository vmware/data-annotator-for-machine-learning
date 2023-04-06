/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { ToolService } from 'src/app/services/common/tool.service';
import { ApiService } from '../api.service';

@Injectable()
export class EmailService {
  constructor(private toolService: ToolService, private apiService: ApiService) {}

  public sendEmailToAnnotator(param) {
    this.apiService.sendEmailToAnnotator(param).subscribe(
      (res) => {},
      (error: any) => {},
    );
  }

  public sendEmailToOwner(param) {
    this.apiService.sendEmailToOwner(param).subscribe(
      (res) => {},
      (error: any) => {},
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
