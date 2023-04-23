/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClrLoadingState } from '@clr/angular';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { Observable } from 'windowed-observable';

@Component({
  selector: 'app-dataset-analyze',
  templateUrl: './dataset-analyze.component.html',
  styleUrls: ['./dataset-analyze.component.scss'],
})
export class DatasetAnalyzeComponent implements OnInit {
  infoMessage = '';
  errorMessage = '';
  loading: boolean;
  dataset;
  topRowContent = [];
  topRowHeader = [];
  initData: any;
  loadingPreviewData: boolean = true;
  loadingAutomlBtn: ClrLoadingState = ClrLoadingState.DEFAULT;

  constructor(private route: ActivatedRoute, public env: EnvironmentsService, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((value) => {
      this.initData = JSON.parse(value['data']);
      if (this.initData && this.initData?.targetPath) {
        this.dataset = JSON.parse(this.initData.dataset);
      } else {
        this.dataset = this.initData;
      }
      this.sortPreviewData();
    });
  }

  createLabelingTask(type: string) {
    this.router.navigate(['loop/project/create'], {
      queryParams: {
        data: JSON.stringify({
          dataSetName: this.dataset.dataSetName,
          projectType: type,
        }),
      },
    });
  }

  sortPreviewData() {
    if (this.dataset.format == 'image') {
      this.topRowContent = [];
      let a = 0;
      let flag = JSON.parse(JSON.stringify(this.dataset.topReview));
      flag.forEach((element) => {
        element.fileSize = (element.fileSize / 1024).toFixed(2);
        if (this.env.config.enableAWSS3) {
          const img = new Image();
          let m = this;
          img.src = element.location;
          img.onload = function () {
            a++;
            if (a == Math.round(flag.length / 2)) {
              m.loadingPreviewData = false;
              m.topRowHeader = ['Image', 'ImageName', 'ImageSize(KB)', 'Id'];
            }
          };
        } else {
          element.location = `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
            element.location
          }&token=${JSON.parse(localStorage.getItem(this.env.config.sessionKey))?.token.access_token}`;
          setTimeout(() => {
            this.topRowHeader = ['Image', 'ImageName', 'ImageSize(KB)', 'Id'];
            this.loadingPreviewData = false;
          }, 1000);
        }
      });
      this.topRowContent = flag;
    } else if (this.dataset.format == 'txt') {
      this.topRowContent = this.dataset.topReview;
      setTimeout(() => {
        this.topRowHeader = ['FileName', 'FileContent'];
        this.loadingPreviewData = false;
      }, 500);
    } else {
      this.topRowContent = this.dataset.topReview.topRows == null ? [] : this.dataset.topReview.topRows;
      setTimeout(() => {
        this.topRowHeader = this.dataset.topReview.header == null ? [] : this.dataset.topReview.header;
        this.loadingPreviewData = false;
      }, 500);
    }
  }

  createModel(type: String) {
    this.loadingAutomlBtn = ClrLoadingState.LOADING;
    const dataset = JSON.parse(JSON.stringify(this.dataset));
    dataset.modelType = type;
    if (dataset && dataset.images) {
      dataset.images = [];
    }
    const observable = new Observable('msg');
    let value = {
      currentPath: 'loop/datasets/analyze',
      targetPath: 'inst/models/create-modal',
      app: 'loop',
      dataset: JSON.stringify(dataset),
    };
    observable.publish(value);
  }
}
