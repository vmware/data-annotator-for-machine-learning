/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { ClrDatagridStateInterface } from '@clr/angular';
import 'rxjs/Rx'
import * as _ from 'lodash';
import { UserAuthService } from '../../services/user-auth.service';
import { AvaService } from "../../services/ava.service";



@Component({
  selector: 'app-my-datasets',
  templateUrl: './my-datasets.component.html',
  styleUrls: ['./my-datasets.component.scss']
})
export class MyDatasetsComponent implements OnInit {

  @ViewChild('dataGird', { static: true }) dataGird;

  user: string;
  datasets: any = [];
  datasetClrDatagridStateInterface;
  deleteDatasetDialog: boolean = false;
  previewDatasetDialog: boolean = false;
  selectedDataset;
  errorMessageTop: string = '';
  loading: boolean;
  errorMessage: string = '';
  infoMessage: string = '';
  tableState: ClrDatagridStateInterface;
  pageSize: number;
  page: number;
  totalItems: number;
  showAddNewDatasetDialog: boolean = false;
  topRowName;
  topRowHeader: any = [];
  topRowContent: any = [];
  msg: any;
  targetFormat: string = '';


  constructor(
    private avaService: AvaService,
    private userAuthService: UserAuthService,

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
      page: 'datasets'
    }

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
  };




  private getMyDatasets(params?: any) {
    this.loading = true;
    this.avaService.getMyDatasets().subscribe(res => {
      this.loading = false;
      this.datasets = res;
      this.totalItems = res.length;
    }, (error: any) => {
      console.log(error);
      this.errorMessage = "Failed to load the datasets";
      this.loading = false;
    });
  }





  deleteDataset(e) {
    this.loading = true;
    let param = {
      fileKey: e.fileKey,
      dsname: e.dataSetName
    };
    this.avaService.deleteMyDataset(param).subscribe(res => {
      if (res && res.MSG) {
        this.infoMessage = 'Dataset was deleted successfully.';
        this.getMyDatasets();
        this.loading = false;
        setTimeout(() => {
          this.infoMessage = '';
        }, 1000);

      }
    }, (error: any) => {
      console.log(error);
      this.errorMessage = 'Delete the dataset failed.'
      this.loading = false;
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    });
  };



  toShowPreview(data) {
    this.previewDatasetDialog = true;
    this.topRowName = data.dataSetName;
    this.targetFormat = data.format;
    if (data.format == 'image') {
      this.topRowHeader = ['Id', 'ImageName', 'ImageSize(KB)', 'Image'];
      data.topReview.forEach(element => {
        element.fileSize = (element.fileSize / 1024).toFixed(2)
      });
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
    }, 3000);
  }



  receiveErrorMessageInfo(e) {
    this.showAddNewDatasetDialog = false;
    this.errorMessageTop = e;
    this.getMyDatasets();
    setTimeout(() => {
      this.errorMessageTop = '';
    }, 3000);

  }


}
