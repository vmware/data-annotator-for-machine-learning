/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { CommonService } from 'src/app/services/common/common.service';
import { DownloadService } from 'src/app/services/common/download.service';
import { ToolService } from 'src/app/services/common/tool.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { UserAuthService } from 'src/app/services/user-auth.service';
import { Buffer } from 'buffer';
import { WebAnalyticsService } from 'src/app/services/web-analytics.service';
import { ClrDatagridStringFilterInterface } from '@clr/angular';
import { forEach } from 'lodash';
declare function dateTransfer(time: any): any;

export class CreateTimeFilter implements ClrDatagridStringFilterInterface<any> {
  accepts(item: any, search: string): boolean {
    return dateTransfer(Number(item.createdDate)).indexOf(String(search)) >= 0;
  }
}

@Component({
  selector: 'app-task-datagrid',
  templateUrl: './task-datagrid.component.html',
  styleUrls: ['./task-datagrid.component.scss'],
})
export class TaskDatagridComponent implements OnInit {
  @Input() msgToTaskList: any;
  loading: boolean;
  projects = [];
  errorMessage = '';
  infoMessage = '';
  user;
  pageSize: number;
  page: number;
  totalItems: number;
  showTreeView: boolean = false;
  treeData: any;
  msgDelete;
  deleteDatasetDialog: boolean = false;
  selectedProject;
  toStopShare: boolean = false;
  toShare: boolean = false;
  msgShare;
  inputDescription = '';
  shareDataComplete: boolean = false;
  showDownloadDatasets = false;
  msg;
  downloadUrl: string;
  msgGenerate;
  showGenerateDatasets = false;
  editProjectDialog = false;
  msgEdit: any;
  createDateFilter = new CreateTimeFilter()

  constructor(
    private router: Router,
    private userAuthService: UserAuthService,
    private apiService: ApiService,
    public env: EnvironmentsService,
    private downloadService: DownloadService,
    private toolService: ToolService,
    private commonService: CommonService,
    private wa: WebAnalyticsService,
  ) {}

  ngOnInit(): void {
    this.user = this.userAuthService.loggedUser()?.user;
  }

  ngOnChanges() {
    this.getProjects();
  }
  getProjects() {
    let param = this.msgToTaskList?.tab;
    this.loading = true;
    this.apiService.getProjects(param).subscribe(
      (res) => {
        this.loading = false;
        this.projects = res.map((item) => {
          return {
            ...item,
            allowOwnerReview: item.creator.includes(this.user.email),
            allowStart: item.annotator.includes(this.user.email),
            disableReview: this.dealDisableReview(item?.userCompleteCase),
            firstLetter: this.dealFirstLetter(item?.annotator),
            firstLetterOwner: this.dealFirstLetter(item?.creator),
            mutilNumbericLabels: this.dealMutilNumbericLabels(item),
            categoryList: item.labelType === 'HTL' ? JSON.parse(item.categoryList) : item.categoryList,
            progress:
              item.projectCompleteCase === item.totalCase
                ? 100
                : Math.round((item.projectCompleteCase / item.totalCase) * 100),
            showButByAssign: this.dealshowButByAssign(item)
          };
        });
        this.totalItems = res.length;
      },
      (error: any) => {
        this.errorMessage = 'Failed to load the projects';
        this.loading = false;
      },
    );
  }
  dealMutilNumbericLabels(item) {
    if (item?.labelType === 'numericLabel' && item?.isMultipleLabel) {
      const categoryList = JSON.parse(item.categoryList);
      const itemKeys = [];
      categoryList.forEach((element) => {
        const labels = Object.keys(element);
        itemKeys.push(labels[0]);
      });
      return itemKeys.toString();
    }
  }
  dealFirstLetter(data) {
    let firstLetter = [];
    data.map((item) => {
      firstLetter.push(item.slice(0, 1).toUpperCase());
    });
    return firstLetter;
  }
  dealDisableReview(data) {
    return data.some((item) => {
      return item.completeCase > 0;
    });
  }
  dealshowButByAssign(item){
    if(this.user.role === 'Power User' && this.msgToTaskList?.tab === 'admin'){
      return false;
    }
    return !item.creator.includes(this.user.email)
  }
  getChildren = (folder) => folder.children;

  clickTreeView(data) {
    this.showTreeView = true;
    this.treeData = data;
  }

  onCloseTreeDialog() {
    this.showTreeView = false;
  }

  toAnalyze(project, from) {
    project.from = from;
    project.tabType = this.msgToTaskList?.tab;
    let flag = project.userCompleteCase.sort(this.toolService.sortBy('completeCase', 'descending'));
    let reviewee = '';
    for (let i = 0; i < flag.length; i++) {
      if (flag[i].completeCase >flag[i].reviewed) {
        reviewee = flag[i].user;
        break;
      }
    }
    if((reviewee ?? '')!== ''){
      project.reviewee = reviewee;
    }else{
      project.reviewee = flag[0].user
    }

    this.router.navigate(['loop/project/analyze'], {
      queryParams: { data: JSON.stringify(project) },
    });
  }

  delete(project) {
    this.selectedProject = project;
    this.deleteDatasetDialog = true;
    this.msgDelete = {
      modalHeader: 'Delete Project',
      modalContent: 'Please be sure this is not reversible, still delete selected project?',
    };
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
        pid: this.selectedProject.id,
      };
      this.apiService.deleteProject(param).subscribe(
        () => {
          this.deleteDatasetDialog = false;
          this.infoMessage = 'Project was deleted successfully.';
          if (this.env.config.embedded && this.env.config.lumosUrl) {
            this.wa.toTrackEventWebAnalytics('Loop-Labeling_Tasks_List-My_Labeling_Task', 'Delete_Task');
          }
          this.getProjects();
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

  share(project) {
    this.selectedProject = project;
    if (project.shareStatus) {
      this.toStopShare = true;
      this.msgShare = {
        modalHeader: 'Share Datasets',
        modalContent: 'Are you sure to un-share this dataset?',
      };
    } else {
      this.toShare = true;
    }
  }

  receiveCloseShare(value?) {
    if (value) {
      this.toStopShare = false;
    }
    this.toShare = false;
  }

  receiveOkBtnShare(value?) {
    const flag = this.inputDescription.replace(/(\r\n|\n|\r)/gm, '');
    if (this.selectedProject.shareStatus == false && flag.trim() == '') {
      this.inputDescription = '';
      return;
    } else if (
      (this.selectedProject.shareStatus == false && flag.trim() != '') ||
      this.selectedProject.shareStatus == true
    ) {
      this.shareDataComplete = true;
      const param = {
        pid: this.selectedProject._id,
        share: !this.selectedProject.shareStatus,
        shareDescription: this.inputDescription,
      };
      this.apiService.shareStatus(param).subscribe((res) => {
        if (res && res.shareStatus == true) {
          this.infoMessage = 'Sharing the annotated data successful.';
          if (this.env.config.embedded && this.env.config.lumosUrl) {
            this.wa.toTrackEventWebAnalytics('Loop-Labeling_Tasks_List-My_Labeling_Task', 'Share_Task');
          }
          setTimeout(() => {
            this.infoMessage = '';
          }, 2000);
        }
        this.getProjects();
        this.toStopShare = false;
        this.toShare = false;
        this.inputDescription = '';
        this.shareDataComplete = false;
      });
    }
  }

  generateProject(e) {
    this.commonService.generateProject(e, this.projects, this.user, 'projects').then((response) => {
      this.projects = response.datasets;
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
            datasets: this.projects,
            id: e.id,
            format: res.format,
            projectName: e.projectName,
            src: 'projects',
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
    this.showDownloadDatasets = false;
    this.msg = null;
    this.msgGenerate = null;
  }

  receiveCloseGenerateInfo(e) {
    this.showGenerateDatasets = false;
  }

  receiveGenerateInfo(e) {
    if (e && e.Body.status != 'undefined') {
      e.Modal == 'generateDownload' ? (this.showDownloadDatasets = false) : (this.showGenerateDatasets = false);
      if (e.Body.status == 'prepare') {
        this.infoMessage =
          'Dataset with annotations is being generated. You will receive an email when download is ready.';
        this.getProjects();
      } else if (e.Body.status == 'done') {
        this.infoMessage = 'Dataset with annotations is already been generated. Please refresh the page.';
        this.downloadUrl = this.env.config.enableAWSS3 ? Buffer.from(e.Body.file, 'base64').toString() : e.Body.file;
        this.downloadProject();
        this.getProjects();
      } else if (e.Body.status == 'generating') {
        this.infoMessage = 'Dataset with annotations is already being generated. Please refresh the page.';
        this.getProjects();
      }
      setTimeout(() => {
        this.infoMessage = '';
      }, 5000);
      this.msg = null;
      this.msgGenerate = null;
    }
  }

  downloadProject() {
    this.loading = false;
    this.downloadService.downloadFile(this.downloadUrl);
  }

  showProjectEdit(info) {
    this.msgEdit = info;
    this.msgEdit.role = this.user.role;
  }

  receiveCloseEdit(e) {
    this.editProjectDialog = false;
  }

  receiveSubmitEdit(e) {
    this.editProjectDialog = false;
    e ? (this.infoMessage = 'Success to edit the project') : (this.errorMessage = 'Failed to edit');
    if (this.env.config.embedded && this.env.config.lumosUrl && e) {
      this.wa.toTrackEventWebAnalytics('Loop-Labeling_Tasks_List-My_Labeling_Task', 'Edit_Task');
    }
    this.getProjects();
    setTimeout(() => {
      this.infoMessage = '';
      this.errorMessage = '';
    }, 1000);
  }

  receiveDeleteLabel(e) {
    this.getProjects();
  }
}
