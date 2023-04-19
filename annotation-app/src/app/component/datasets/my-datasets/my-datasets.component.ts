/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { CommonService } from 'src/app/services/common/common.service';
import { DownloadService } from 'src/app/services/common/download.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { UserAuthService } from 'src/app/services/user-auth.service';
import { Buffer } from 'buffer';
import { InternalApiService } from 'src/app/services/internal-api.service';

@Component({
  selector: 'app-my-datasets',
  templateUrl: './my-datasets.component.html',
  styleUrls: ['./my-datasets.component.scss'],
})
export class MyDatasetsComponent implements OnInit {
  user;
  loading: boolean;
  loadingCommunity: boolean;
  loadingPower: boolean;
  datasets = [];
  pageSize: number;
  totalItems: number;
  page: number;
  pageSizeCommunity: number;
  totalItemsCommunity: number;
  pageCommunity: number;
  totalItemsPower: number;
  pagePower: number = 1;
  pageSizePower: number = 10;
  errorMessage = '';
  infoMessage = '';
  previewDatasetDialog: boolean;
  msgPreview = {};
  deleteDatasetDialog: boolean;
  msgDelete = {};
  selectedDataset;
  communityDatasets = [];
  showDownloadDatasets = false;
  msg;
  downloadUrl: string;
  msgGenerate;
  showGenerateDatasets = false;
  showTreeView: boolean = false;
  treeData: any;
  currentTab: number;
  allDatasets: any = [];

  constructor(
    private apiService: ApiService,
    private router: Router,
    public env: EnvironmentsService,
    private downloadService: DownloadService,
    private commonService: CommonService,
    private userAuthService: UserAuthService,
    private internalApiService: InternalApiService,
  ) {
    this.user = this.userAuthService.loggedUser().user;
  }

  ngOnInit(): void {
    this.currentTab = 1;
    this.page = 1;
    this.pageSize = 10;
    this.pageCommunity = 1;
    this.pageSizeCommunity = 10;
    this.loading = false;
    this.loadingCommunity = false;
    this.getMyDatasets();
    this.getCommunityData();
    if (this.user.role === 'Power User') {
      this.getAllDatasets('admin');
    }
  }

  private getMyDatasets() {
    this.loading = true;
    this.apiService.getMyDatasets('').subscribe(
      (res) => {
        this.loading = false;
        res.forEach((element) => {
          let projects = [];
          element.projects.forEach((task) => {
            projects.push({ pname: task, isShowLoading: false });
          });
          element.labelingTasks = projects;
        });
        this.datasets = res;
        this.totalItems = res.length;
      },
      (error: any) => {
        this.errorMessage = 'Failed to load the datasets';
        this.loading = false;
      },
    );
  }

  private getAllDatasets(from) {
    this.loadingPower = true;
    this.apiService.getAllDatasets(from).subscribe(
      (res) => {
        this.loadingPower = false;
        res.forEach((element) => {
          let projects = [];
          element.projects.forEach((task) => {
            projects.push({ pname: task, isShowLoading: false });
          });
          element.labelingTasks = projects;
        });

        this.allDatasets = res;
        this.totalItemsPower = res.length;
      },
      (error: any) => {
        this.errorMessage = 'Failed to load the datasets';
        this.loadingPower = false;
      },
    );
  }

  deleteDataset(dataset) {
    this.selectedDataset = dataset;
    this.deleteDatasetDialog = true;
    this.msgDelete = {
      modalHeader: 'Delete Dataset',
      modalContent: 'Please be sure this is not reversible, still delete selected dataset?',
    };
  }

  toShowPreview(dataset) {
    this.previewDatasetDialog = true;
    this.msgPreview = dataset;
  }

  receiveClosePreview(value: boolean) {
    if (value) {
      this.previewDatasetDialog = false;
    }
  }

  receiveCloseDelete(value: boolean) {
    if (value) {
      this.deleteDatasetDialog = false;
    }
  }

  receiveDeleteOkBtn(value: boolean) {
    if (value) {
      this.loading = true;
      const param = {
        dsId: this.selectedDataset.id,
      };
      this.apiService.deleteMyDataset(param).subscribe(
        () => {
          this.deleteDatasetDialog = false;
          this.infoMessage = 'Dataset was deleted successfully.';
          if (this.env.config.inUrl) {
            this.deleteInDataset();
          }
          if (this.user.role === 'Power User') {
            this.getAllDatasets('admin');
          }
          this.getMyDatasets();
          this.loading = false;
          setTimeout(() => {
            this.infoMessage = '';
          }, 1000);
        },
        (error: any) => {
          this.deleteDatasetDialog = false;
          this.errorMessage = `Delete dataset failed. ${error.error.MSG}`;
          this.loading = false;
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        },
      );
    }
  }

  deleteInDataset() {
    let param = {
      user: this.user.email,
      ids: [this.selectedDataset.dataSetName],
      deleteFiles: true,
    };
    this.internalApiService.deleteInDataset(param).subscribe(
      (res) => {},
      (err) => {},
    );
  }

  onAddingDataset() {
    this.router.navigate(['loop/datasets/create']);
  }

  toDatasetAnalyze(dataset) {
    this.router.navigate(['loop/datasets/analyze'], {
      queryParams: { data: JSON.stringify(dataset) },
    });
  }

  private getCommunityData() {
    this.loadingCommunity = true;
    this.apiService.getProjects('community').subscribe(
      (res) => {
        this.loadingCommunity = false;
        this.totalItemsCommunity = res.length;
        for (let i = 0; i < res.length; i++) {
          const newA = res[i].categoryList.split(',');
          res[i].labelCount = newA.length;
        }
        this.communityDatasets = res;
        this.communityDatasets.forEach((item) => {
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
          if (item.labelType === 'HTL') {
            item.categoryList = JSON.parse(item.categoryList);
          }
        });
      },
      (error: any) => {
        this.errorMessage = 'Failed to load the community datasets';
        this.loadingCommunity = false;
      },
    );
  }

  generateProject(e) {
    this.commonService.generateProject(e, this.communityDatasets, this.user.email, 'community').then((response) => {
      this.communityDatasets = response.datasets;
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
    this.apiService.downloadProject(e.id).subscribe(
      (res) => {
        if (res) {
          this.msg = {
            selectedDownloadFile: e.dataSource,
            latestAnnotationTime: e.updatedDate,
            generateDoneTime: res.updateTime,
            downloadUrl: this.env.config.enableAWSS3 ? Buffer.from(res.file, 'base64').toString() : res.file,
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
        this.loading = false;
      },
    );
  }

  receiveCloseDownloadInfo(e) {
    if (e == 'communityDownload') {
      this.getCommunityData();
    }
    this.showDownloadDatasets = false;
    this.msg = null;
    this.msgGenerate = null;
  }

  receiveCloseGenerateInfo(e) {
    this.showGenerateDatasets = false;
  }

  downloadProject() {
    this.downloadService.downloadFile(this.downloadUrl);
  }
  receiveGenerateInfo(e) {
    if (e && e.Body.status != 'undefined') {
      e.Modal == 'generateDownload' ? (this.showDownloadDatasets = false) : (this.showGenerateDatasets = false);
      if (e.Body.status == 'prepare') {
        this.infoMessage =
          'Dataset with annotations is being generated. You will receive an email when download is ready.';
        this.getCommunityData();
      } else if (e.Body.status == 'done') {
        this.infoMessage = 'Dataset with annotations is already been generated. Please refresh the page.';
        this.downloadUrl = this.env.config.enableAWSS3 ? Buffer.from(e.Body.file, 'base64').toString() : e.Body.file;
        this.downloadProject();
        this.getCommunityData();
      } else if (e.Body.status == 'generating') {
        this.infoMessage = 'Dataset with annotations is already being generated. Please refresh the page.';
        this.getCommunityData();
      }
      setTimeout(() => {
        this.infoMessage = '';
      }, 5000);
      this.msg = null;
      this.msgGenerate = null;
    }
  }

  // getChildren = (folder) => folder.children;

  clickTreeView(data) {
    this.showTreeView = true;
    this.treeData = data;
  }

  onCloseTreeDialog() {
    this.showTreeView = false;
  }

  clickMore(id) {
    let data = this.currentTab === 1 ? this.datasets : this.allDatasets;
    for (let i = 0; i < data.length; i++) {
      if (data[i].id == id) {
        data[i].isShowHide = !data[i].isShowHide;
        break;
      }
    }
    this.currentTab === 1 ? (this.datasets = data) : (this.allDatasets = data);
  }

  clickTab(tab_index) {
    this.currentTab = tab_index;
  }

  reload() {
    if (this.currentTab === 1) {
      this.getMyDatasets();
    } else if (this.currentTab === 2) {
      this.getCommunityData();
    } else if (this.currentTab === 3) {
      this.getAllDatasets('admin');
    }
  }

  clickLabelingTask(index, ds, pname) {
    ds.labelingTasks[index].isShowLoading = true;
    this.apiService.findProjectName({ pname }).subscribe((task) => {
      ds.labelingTasks[index].isShowLoading = false;
      if (task[0].generateInfo?.status == 'pending') {
        this.generateProject(task[0]);
      } else if (task[0].generateInfo?.status == 'prepare' || task[0].generateInfo?.status == 'generating') {
        this.infoMessage = 'Download Processing...';
      } else if (task[0].generateInfo?.status == 'done') {
        this.clickDownload(task[0]);
      }
    });
  }
}
