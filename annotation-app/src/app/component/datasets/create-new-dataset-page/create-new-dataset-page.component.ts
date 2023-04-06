/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit } from '@angular/core';
import { EnvironmentsService } from 'src/app/services/environments.service';

@Component({
  selector: 'app-create-new-dataset-page',
  templateUrl: './create-new-dataset-page.component.html',
  styleUrls: ['./create-new-dataset-page.component.scss'],
})
export class CreateNewDatasetPageComponent implements OnInit {
  msg;
  uploading = false;
  createBtnDisable = true;

  constructor(public env: EnvironmentsService) {}

  ngOnInit(): void {
    this.msg = { page: 'createDataset', createDataBtn: 0 };
  }

  receiveOutFormData(formdata) {
    if (formdata) {
      this.msg.type = formdata.fileFormat;
      this.createBtnDisable = false;
    } else {
      this.createBtnDisable = true;
    }
  }

  clickCreate() {
    this.uploading = true;
    this.msg.createDataBtn = this.msg.createDataBtn + 1;
    this.msg = JSON.parse(JSON.stringify(this.msg));
  }

  receiveUploadDone(uploading) {
    this.uploading = false;
  }
}
