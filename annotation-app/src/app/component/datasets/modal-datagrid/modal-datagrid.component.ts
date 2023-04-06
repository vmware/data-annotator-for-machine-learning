/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { EnvironmentsService } from 'src/app/services/environments.service';

@Component({
  selector: 'app-modal-datagrid',
  templateUrl: './modal-datagrid.component.html',
})
export class ModalDatagridComponent implements OnInit {
  @Input() msgPreview: any;

  @Output('onClosePreviewDialog')
  onClosePreviewDialogEmitter = new EventEmitter();

  previewDatasetDialog = true;
  topRowHeader: any = [];
  topRowContent: any = [];

  constructor(public env: EnvironmentsService) {}

  ngOnInit(): void {
    this.toShowPreview();
  }

  toShowPreview() {
    if (this.msgPreview.format == 'image') {
      this.topRowContent = [];
      let flag = JSON.parse(JSON.stringify(this.msgPreview.topReview));
      flag.forEach((element) => {
        element.fileSize = (element.fileSize / 1024).toFixed(2);
        if (!this.env.config.enableAWSS3) {
          element.location = `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
            element.location
          }&token=${JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token}`;
        }
      });
      this.topRowContent = flag;
      this.topRowHeader = ['Id', 'ImageName', 'ImageSize(KB)', 'Image'];
    } else if (this.msgPreview.format == 'txt') {
      this.topRowHeader = ['FileName', 'FileContent'];
      this.topRowContent = this.msgPreview.topReview;
    } else {
      this.topRowHeader = this.msgPreview.topReview.header == null ? [] : this.msgPreview.topReview.header;
      this.topRowContent = this.msgPreview.topReview.topRows == null ? [] : this.msgPreview.topReview.topRows;
    }
  }

  onClosePreviewDialog() {
    this.onClosePreviewDialogEmitter.emit(true);
  }
}
