/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { ClrDatagridStateInterface } from '@clr/angular';
import * as _ from 'lodash';
import { UserAuthService } from '../../services/user-auth.service';
import { AvaService } from '../../services/ava.service';
import { EnvironmentsService } from 'app/services/environments.service';

@Component({
  selector: 'app-my-datasets',
  templateUrl: './my-datasets.component.html',
  styleUrls: ['./my-datasets.component.scss'],
})
export class MyDatasetsComponent implements OnInit {
  @ViewChild('dataGird', { static: true }) dataGird;

  user: string;
  datasets: any = [];
  datasetClrDatagridStateInterface;
  deleteDatasetDialog = false;
  previewDatasetDialog = false;
  selectedDataset;
  errorMessageTop = '';
  loading: boolean;
  errorMessage = '';
  infoMessage = '';
  tableState: ClrDatagridStateInterface;
  pageSize: number;
  page: number;
  totalItems: number;
  showAddNewDatasetDialog = false;
  topRowName;
  topRowHeader: any = [];
  topRowContent: any = [];
  msg: any;
  targetFormat = '';

  constructor(
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    public env: EnvironmentsService,
  ) {
    this.user = this.userAuthService.loggedUser().email;
    this.page = 1;
    this.pageSize = 10;
  }

  ngOnInit() {
    this.loading = false;
    this.getMyDatasets();
    this.msg = {
      type: '',
      page: 'datasets',
    };
  }

  valueChange(value: number) {
    this.pageSize = value;
    setTimeout(() => {
      this.dataGird.stateProvider.debouncer._change.next();
    }, 100);
  }

  onAddingDataset(event) {
    this.showAddNewDatasetDialog = true;
  }

  receiveCloseInfo(e) {
    this.showAddNewDatasetDialog = false;
  }

  private getMyDatasets(params?: any) {
    this.loading = true;
    this.avaService.getMyDatasets('').subscribe(
      (res) => {
        this.loading = false;
        this.datasets = res;
        this.totalItems = res.length;
      },
      (error: any) => {
        console.log(error);
        this.errorMessage = 'Failed to load the datasets';
        this.loading = false;
      },
    );
  }

  deleteDataset(e) {
    this.loading = true;
    const param = {
      dsId: e.id,
    };
    this.avaService.deleteMyDataset(param).subscribe(
      () => {
        this.infoMessage = 'Dataset was deleted successfully.';
        this.getMyDatasets();
        this.loading = false;
        setTimeout(() => {
          this.infoMessage = '';
        }, 1000);
      },
      (error: any) => {
        console.log(error);
        this.errorMessage = `Delete dataset failed. ${error.error.MSG}`;
        this.loading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      },
    );
  }

  toShowPreview(data) {
    this.previewDatasetDialog = true;
    this.topRowName = data.dataSetName;
    this.targetFormat = data.format;
    if (data.format == 'image') {
      this.topRowContent = [];
      this.topRowHeader = ['Id', 'ImageName', 'ImageSize(KB)', 'Image'];
      let flag = JSON.parse(JSON.stringify(data.topReview));
      flag.forEach((element) => {
        element.fileSize = (element.fileSize / 1024).toFixed(2);
        if (!this.env.config.enableAWSS3) {
          element.location = `${
            this.env.config.annotationService
          }/api/v1.0/datasets/set-data?file=${element.location}&token=${
            JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token.access_token
          }`;
        }
      });
      this.topRowContent = flag;
    } else if (data.format == 'txt') {
      this.topRowHeader = ['FileName', 'FileContent'];
      this.topRowContent = data.topReview;
    } else {
      this.topRowHeader = data.topReview.header == null ? [] : data.topReview.header;
      this.topRowContent = data.topReview.topRows == null ? [] : data.topReview.topRows;
    }
  }

  receiveUploadSuccessInfo(e) {
    this.showAddNewDatasetDialog = false;
    this.infoMessage = 'Upload success.';
    this.getMyDatasets();
    setTimeout(() => {
      this.infoMessage = '';
    }, 10000);
  }

  receiveErrorMessageInfo(e) {
    this.showAddNewDatasetDialog = false;
    this.errorMessageTop = e;
    this.getMyDatasets();
    setTimeout(() => {
      this.errorMessageTop = '';
    }, 10000);
  }
}
