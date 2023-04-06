/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, Input, OnInit, OnChanges, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'windowed-observable';
import { Location } from '@angular/common';

@Component({
  selector: 'app-create-new-dataset-modal',
  templateUrl: './create-new-dataset-modal.component.html',
  styleUrls: ['./create-new-dataset-modal.component.scss'],
})
export class CreateNewDatasetModalComponent implements OnInit, OnChanges {
  @Input() msgCreateProjectPage;
  @Output('onCloseUploadModal')
  onCloseUploadModalEmitter = new EventEmitter();
  @Output('uploadModalInfo')
  uploadModalInfoEmitter = new EventEmitter();

  showModal: boolean;
  clickOkBtn = false;
  createBtnDisable = true;
  data;
  msgMfe;
  modelType;
  msg;

  constructor(private route: ActivatedRoute, private location: Location, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((value: any) => {
      if (value.data) {
        this.data = JSON.parse(value.data);
        this.msgMfe = this.data.app;
        this.msg = { page: this.data.app, type: '', createDataBtn: 0 };
        const modelData = JSON.parse(this.data.modelData);
        this.modelType = modelData.modelType;
        this.showModal = true;
      }
    });
  }

  ngOnChanges(changes) {
    this.msg = {
      type: this.msgCreateProjectPage.fileFormat,
      page: 'createLabelingTask',
      createDataBtn: 0,
    };
    if (this.msgCreateProjectPage) {
      this.showModal = this.msgCreateProjectPage.showModal;
      this.msg = {
        type: this.msgCreateProjectPage.fileFormat,
        page: 'createLabelingTask',
        createDataBtn: this.msg.createDataBtn,
      };
    }
  }

  receiveOutFormData(formdata) {
    if (formdata) {
      if (this.msgMfe) {
        this.data['datasetName'] = formdata?.datasetsName;
      } else {
        this.data = formdata;
      }

      this.createBtnDisable = false;
    } else {
      this.clickOkBtn = false;
      this.createBtnDisable = true;
    }
  }

  okBtn() {
    this.clickOkBtn = true;
    // update msg enable to call save upload
    this.msg.createDataBtn = this.msg.createDataBtn + 1;
    this.msg = JSON.parse(JSON.stringify(this.msg));
  }

  receiveUploadDone(uploading) {
    if (uploading == 'yes' && this.msgMfe) {
      const observable = new Observable('datasetUploadDoneMsg');
      observable.publish(this.data);
    }
    this.clickOkBtn = false;
    if (uploading == 'yes') {
      // to tell create labeling task page the file upload ok
      this.uploadModalInfoEmitter.emit(this.data);
      this.onCloseUploadModalEmitter.emit(true);
      this.showModal = false;
    }
  }

  closeModal() {
    if (this.msgMfe === 'inst') {
      const observable = new Observable('datasetUploadDoneMsg');
      observable.publish(this.data);
    } else {
      if (this.msgCreateProjectPage) {
        this.showModal = false;
        this.onCloseUploadModalEmitter.emit(true);
      } else {
        this.location.historyGo(-1);
      }
    }
  }
}
