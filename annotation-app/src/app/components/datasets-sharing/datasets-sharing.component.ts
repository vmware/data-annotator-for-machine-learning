/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { ActivatedRoute } from '@angular/router';
import { UserAuthService } from '../../services/user-auth.service';
import { AvaService } from '../../services/ava.service';
import { EnvironmentsService } from 'app/services/environments.service';
import { Buffer } from 'buffer';
import { DownloadService } from 'app/services/common/download.service';
import { CommonService } from 'app/services/common/common.service';

@Component({
  selector: 'app-datasets-sharing',
  templateUrl: './datasets-sharing.component.html',
  styleUrls: ['./datasets-sharing.component.scss'],
})
export class DatasetsSharingComponent implements OnInit {
  @ViewChild('dataGird', { static: true }) dataGird;

  user: string;
  datasets: any = [];
  taskParamId: number;
  selectedDataset;
  isBrowsing: boolean;
  loading: boolean;
  errorMessage = '';
  infoMessage = '';
  refresh: any;
  pageSize: number;
  page: number;
  totalItems: number;
  download: string;
  labelLength: number;
  downloadDatasets: boolean;
  generateDoneTime: any;
  selectedDownloadFile: any;
  downloadUrl: any;
  showDownloadDatasets = false;
  msg;
  msgGenerate;
  showGenerateDatasets = false;

  constructor(
    private route: ActivatedRoute,
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    public env: EnvironmentsService,
    private downloadService: DownloadService,
    private commonService: CommonService,
  ) {
    this.download = `${this.env.config.annotationService}/api`;
    this.user = this.userAuthService.loggedUser().email;
    this.page = 1;
    this.pageSize = 10;

    this.route.queryParams.subscribe((params) => {
      this.taskParamId = Number(params['id']);
    });
  }

  ngOnInit() {
    this.downloadDatasets = false;
    this.loading = false;
    this.isBrowsing = this.taskParamId ? false : true;
    this.getProjects();
  }

  valueChange(value: number) {
    this.pageSize = value;
    setTimeout(() => {
      this.dataGird.stateProvider.debouncer._change.next();
    }, 100);
  }

  private getProjects(params?: any) {
    this.loading = true;
    this.avaService.getProjects('community').subscribe(
      (res) => {
        this.loading = false;
        this.totalItems = res.length;
        for (let i = 0; i < res.length; i++) {
          const newA = res[i].categoryList.split(',');
          res[i].labelCount = newA.length;
        }
        this.datasets = res;
        this.datasets.forEach((item) => {
          if (item.labelType == 'numericLabel' && item.isMultipleLabel) {
            const categoryList = JSON.parse(item.categoryList);
            const itemKeys = [];
            categoryList.forEach((element) => {
              const labels = Object.keys(element);
              itemKeys.push(labels[0]);
            });
            item.mutilNumbericLabels = itemKeys.toString();
            item.labelCount = itemKeys.length;
          }
        });
      },
      (error: any) => {
        console.log(error);
        this.errorMessage = 'Failed to load the datasets';
        this.loading = false;
      },
    );
  }

  generateProject(e) {
    this.commonService
      .generateProject(e, this.datasets, this.user, 'community')
      .then((response) => {
        this.datasets = response.datasets;
        this.showGenerateDatasets = true;
        if (response.err) {
          this.showGenerateDatasets = false;
        } else {
          this.msgGenerate = response.e;
        }
      });
  }

  clickDownload(e) {
    this.showDownloadDatasets = true;
    this.avaService.downloadProject(e.id).subscribe(
      (res) => {
        if (res) {
          this.msg = {
            selectedDownloadFile: e.dataSource,
            latestAnnotationTime: e.updatedDate,
            generateDoneTime: res.updateTime,
            downloadUrl: this.env.config.enableAWSS3
              ? new Buffer(res.file, 'base64').toString()
              : res.file,
            datasets: this.datasets,
            id: e.id,
            format: res.format,
            projectName: e.projectName,
            src: 'community',
            labelType: e.labelType,
            projectType: e.projectType,
            originalDataSets: res.originalDataSets,
          };
        }
      },
      (error: any) => {
        console.log(error);
        this.loading = false;
      },
    );
  }

  downloadProject() {
    this.downloadService.downloadFile(this.downloadUrl);
  }

  receiveCloseDownloadInfo(e) {
    if (e == 'communityDownload') {
      this.getProjects();
    }
    this.showDownloadDatasets = false;
    this.msg = null;
    this.msgGenerate = null;
  }

  receiveCloseGenerateInfo(e) {
    this.showGenerateDatasets = false;
  }

  receiveGenerateInfo(e) {
    if (e && e.Body.status != 'undefined') {
      e.Modal == 'generateDownload'
        ? (this.showDownloadDatasets = false)
        : (this.showGenerateDatasets = false);
      if (e.Body.status == 'prepare') {
        this.infoMessage =
          'Dataset with annotations is being generated. You will receive an email when download is ready.';
        this.getProjects();
      } else if (e.Body.status == 'done') {
        this.infoMessage =
          'Dataset with annotations is already been generated. Please refresh the page.';
        this.downloadUrl = this.env.config.enableAWSS3
          ? new Buffer(e.Body.file, 'base64').toString()
          : e.Body.file;
        this.downloadProject();
        this.getProjects();
      } else if (e.Body.status == 'generating') {
        this.infoMessage =
          'Dataset with annotations is already being generated. Please refresh the page.';
        this.getProjects();
      }
      setTimeout(() => {
        this.infoMessage = '';
      }, 5000);
      this.msg = null;
      this.msgGenerate = null;
    }
  }
}
