/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { WebAnalyticsService } from '../web-analytics.service';

@Injectable()
export class DownloadService {
  constructor(public env: EnvironmentsService, private wa: WebAnalyticsService) {}

  downloadMultiple(urls) {
    urls.forEach((url, index) => {
      let hiddenIFrameID = 'hiddenDownloader' + index;
      let iframe = document.createElement('iframe');
      iframe.id = hiddenIFrameID;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.src = this.env.config.enableAWSS3
        ? url
        : `${this.env.config.annotationService}/api/v1.0/datasets/download-from-local-system?file=${url}&token=${
            JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token
          }`;
      if (this.env.config.embedded && this.env.config.lumosUrl) {
        this.wa.toRecordDownloadWebAnalytics(url);
      }
    });
  }

  downloadFile(url) {
    if (this.env.config.enableAWSS3) {
      window.location.href = url;
      if (this.env.config.embedded && this.env.config.lumosUrl) {
        this.wa.toRecordDownloadWebAnalytics(url);
      }
    } else {
      window.location.href = `${
        this.env.config.annotationService
      }/api/v1.0/datasets/download-from-local-system?file=${url}&token=${
        JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token
      }`;
    }
  }
}
