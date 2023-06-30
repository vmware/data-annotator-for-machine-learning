/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClrLoadingState } from '@clr/angular';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { Observable } from 'windowed-observable';
import { ApiService } from 'src/app/services/api.service';
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
  dataSetName;
  configData;

  constructor(
    private route: ActivatedRoute,
    public env: EnvironmentsService,
    private router: Router,
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    this.dataset = [];
    this.route.queryParams.subscribe((values) => {
      this.dataSetName = values['data'];
      this.getDatasetData();
    });
  }

  getDatasetData() {
    this.apiService.findDatasetName(this.dataSetName).subscribe((res) => {
      if (res && res.length > 0) {
        this.dataset = res[0];
        this.initData = res[0];
        this.dealGridData();
      } else {
        this.loadingPreviewData = true;
      }
    });
  }

  dealGridData() {
    if (this.dataset.format == 'image') {
      let imgTypeNameArray = ['image', 'imageName', 'imageSize', 'id'];
      this.topRowHeader = this.dealCloumn(imgTypeNameArray);
      this.topRowContent = this.dataset.topReview.map((item) => {
        return {
          image: this.env.config.enableAWSS3
            ? item.location
            : `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${item.location}&token=${
                JSON.parse(localStorage.getItem(this.env.config.sessionKey))?.token.access_token
              }`,
          imageName: item.fileName,
          imageSize: (item.fileSize / 1024).toFixed(2),
          id: item._id,
        };
      });
    } else if (this.dataset.format == 'txt') {
      this.topRowContent = this.dataset.topReview;
      let texTypeNameArray = ['fileName', 'fileContent'];
      this.topRowHeader = this.dealCloumn(texTypeNameArray);
    } else {
      this.topRowHeader = this.dealCloumn(this.dataset.topReview.header);
      this.topRowContent = this.matchArrays(this.dataset.topReview.header, this.dataset.topReview.topRows);
    }
    this.configData = {
      columnData: this.topRowHeader,
      tableData: this.topRowContent,
      type: this.dataset.format,
    };
    this.loadingPreviewData = false;
  }

  dealCloumn(header) {
    return header.map((item) => {
      return {
        label: this.toPascalCase(item),
        prop: item,
        type: item === 'image' ? 'img' : '',
      };
    });
  }

  toPascalCase(str) {
    var words = str.split(/[\s_-]+/);
    var pascalCase = words.map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
    return pascalCase.join('');
  }

  matchArrays(header, topRows) {
    return topRows.map(function (row) {
      var obj = {};
      header.forEach(function (key, index) {
        obj[key] = row[index];
      });
      return obj;
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

