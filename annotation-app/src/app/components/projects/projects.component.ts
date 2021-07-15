/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClrDatagridStateInterface } from '@clr/angular';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAuthService } from '../../services/user-auth.service';
import { AvaService } from '../../services/ava.service';
import { EnvironmentsService } from 'app/services/environments.service';
import { Buffer } from 'buffer';
import { DownloadService } from 'app/services/common/download.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  @ViewChild('dataGird', { static: true }) dataGird;
  download: string;
  user: string;
  datasets: any = [];
  taskParamId: number;
  datasetClrDatagridStateInterface;
  deleteDatasetDialog = false;
  editProjectDialog = false;
  showAnnotatorList: boolean;
  previewDatasetDialog = false;
  selectedDataset;
  previewImage = false;
  previewHeadDatas: any = [];
  previewContentDatas: any = [];
  previewSrs: any = [];
  isBrowsing: boolean;
  loading: boolean;
  errorMessage = '';
  infoMessage = '';
  tableState: ClrDatagridStateInterface;
  pageSize: number;
  page: number;
  totalItems: number;
  showNewDatasetInfo: boolean;
  inputAssigneeValidation: boolean;
  emailReg: boolean;
  shareDatasets = false;
  inputDescription = '';
  unShareDatasets = false;
  inputDescriptionTip = false;
  shareDataComplete = false;
  assignmentLogicEdit: any;
  downloadDatasets: boolean;
  downloadUrl: any;
  editProjectComplete = false;
  showDownloadDatasets = false;
  msg;
  msgGenerate;
  showGenerateDatasets = false;
  labelType = '';
  subscription: Subscription;
  msgEdit: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    public env: EnvironmentsService,
    private downloadService: DownloadService,
  ) {
    this.download = `${this.env.config.annotationService}/api`;
    this.user = this.userAuthService.loggedUser().email;
    this.page = 1;
    this.pageSize = 10;
    this.showAnnotatorList = false;
    this.route.queryParams.subscribe((params) => {
      this.taskParamId = Number(params['id']);
    });
  }

  ngOnInit() {
    this.getProjects();
    this.inputAssigneeValidation = false;
    this.emailReg = true;
    this.downloadDatasets = false;
  }

  valueChange(value: number) {
    this.pageSize = value;
    setTimeout(() => {
      this.dataGird.stateProvider.debouncer._change.next();
    }, 100);
  }

  deleteProject(project): void {
    const payload = {
      pid: project._id,
      pname: project.projectName,
    };
    this.loading = true;
    this.avaService.deleteProject(payload).subscribe(
      (res) => {
        this.infoMessage = 'Project was deleted successfully.';
        this.loading = false;
        this.getProjects();
        setTimeout(() => {
          this.infoMessage = '';
        }, 1000);
      },
      (error: any) => {
        this.errorMessage = 'Unable to delete the project';
        this.loading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      },
    );
  }

  private getProjects() {
    this.loading = true;
    this.avaService.getProjects('projects').subscribe(
      (res) => {
        this.loading = false;
        for (let i = 0; i < res.length; i++) {
          res[i].isExtend = true;
        }
        this.datasets = res;
        this.totalItems = res.length;
        // this.filterTasks(res.result, params);
      },
      (error: any) => {
        console.log(error);
        this.errorMessage = 'Failed to load the datasets';
        this.loading = false;
      },
    );
  }

  showProjectEdit(info) {
    this.msgEdit = info;
    this.msgEdit.src = 'projects';
  }

  generateProject(e) {
    if (e.labelType == 'numericLabel') {
      for (let i = 0; i < this.datasets.length; i++) {
        if (this.datasets[i].id == e.id) {
          this.datasets[i].generateInfo.status = 'generating';
        }
      }
      this.avaService.generate(e.id, this.user, 'standard', 'projects').subscribe(
        (res) => {
          if (res && res.Info != 'undefined') {
            if (res.Info == 'prepare') {
              this.infoMessage =
                'Dataset with annotations is being generated. You will receive an email when download is ready.';
            } else if (res.Info == 'done') {
              for (let i = 0; i < this.datasets.length; i++) {
                if (this.datasets[i].id == e.id) {
                  this.datasets[i].generateInfo.status = 'done';
                }
              }
              this.downloadUrl = this.env.config.enableAWSS3
                ? new Buffer(res.Body.file, 'base64').toString()
                : res.Body.file;
              this.downloadProject();
            } else if (res.Info == 'generating') {
              this.infoMessage =
                'Dataset with annotations is already being generated. Please refresh the page.';
              this.getProjects();
            }
            setTimeout(() => {
              this.infoMessage = '';
            }, 5000);
          }
        },
        (error: any) => {
          console.log(error);
          this.loading = false;
        },
      );
    } else {
      this.showGenerateDatasets = true;
      e.src = 'projects';
      if (e.projectType == 'log') {
        this.avaService.downloadProject(e.id).subscribe(
          (res) => {
            if (res) {
              e.originalDataSets = res.originalDataSets;
              this.msgGenerate = e;
            }
          },
          (error: any) => {
            console.log(error);
            this.showGenerateDatasets = false;
          },
        );
      } else {
        this.msgGenerate = e;
      }
    }
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
            format: res.format,
            downloadUrl: this.env.config.enableAWSS3
              ? new Buffer(res.file, 'base64').toString()
              : res.file,
            datasets: this.datasets,
            id: e.id,
            projectName: e.projectName,
            labelType: e.labelType,
            projectType: e.projectType,
            src: 'projects',
            originalDataSets: res.originalDataSets,
          };
        }
      },
      (error: any) => {
        console.log(error);
        this.showDownloadDatasets = false;
      },
    );
  }

  downloadProject() {
    this.loading = false;
    this.downloadService.downloadFile(this.downloadUrl);
  }

  more(id) {
    for (let i = 0; i < this.datasets.length; i++) {
      if (this.datasets[i].id == id) {
        this.datasets[i].isExtend = !this.datasets[i].isExtend;
      }
    }
  }

  isShare(shareStatus) {
    if (shareStatus == true) {
      this.unShareDatasets = true;
    } else {
      this.shareDatasets = true;
    }
  }

  toggleShare(data) {
    const flag = this.inputDescription.replace(/(\r\n|\n|\r)/gm, '');
    if (data.shareStatus == false && flag.trim() == '') {
      this.inputDescriptionTip = true;
      this.inputDescription = '';
      return;
    } else if ((data.shareStatus == false && flag.trim() != '') || data.shareStatus == true) {
      this.shareDataComplete = true;
      const param = {
        pid: data._id,
        share: !data.shareStatus,
        shareDescription: this.inputDescription,
      };
      this.avaService.shareStatus(param).subscribe((res) => {
        if (res && res.shareStatus == true) {
          this.infoMessage = 'Sharing the annotated data successful.';
          setTimeout(() => {
            this.infoMessage = '';
          }, 2000);
        }
        this.getProjects();
        this.shareDatasets = false;
        this.unShareDatasets = false;
        this.inputDescription = '';
        this.inputDescriptionTip = false;
        this.shareDataComplete = false;
      });
    }
  }

  cancelShare() {
    this.shareDatasets = false;
    this.inputDescriptionTip = false;
    this.shareDataComplete = false;
    this.inputDescription = '';
  }

  availableNewEntry(id, projectName, projectType) {
    for (let i = 0; i < this.datasets.length; i++) {
      if (this.datasets[i].id == id) {
        this.datasets[i].appendSr = 'adding';
        break;
      }
    }
    if (projectType == 'image') {
      this.router.navigate(['appendNewEntries'], {
        queryParams: { id, name: projectName, from: 'projects', projectType },
      });
    } else if (projectType == 'log') {
      this.router.navigate(['appendNewEntries'], {
        queryParams: { id, name: projectName, from: 'projects', projectType },
      });
    } else {
      this.avaService.getSample(id).subscribe(
        (res) => {
          if (res.appendSr == 'adding') {
            this.infoMessage = 'New entries is being inserted, please wait.';
            this.getProjects();
            setTimeout(() => {
              this.infoMessage = '';
            }, 10000);
          } else if (res.appendSr == 'pending' || res.appendSr == 'done') {
            this.router.navigate(['appendNewEntries'], {
              queryParams: {
                id,
                name: projectName,
                from: 'projects',
                projectType,
              },
            });
          }
        },
        (error: any) => {
          console.log(error);
        },
      );
    }
  }

  checkAddStatus(id, projectName, projectType) {
    for (let i = 0; i < this.datasets.length; i++) {
      if (this.datasets[i].id == id) {
        this.datasets[i].appendSr = 'adding';
        break;
      }
    }
    if (projectType == 'image') {
      this.router.navigate(['appendNewEntries'], {
        queryParams: { id, name: projectName, from: 'projects', projectType },
      });
    } else if (projectType == 'log') {
      this.router.navigate(['appendNewEntries'], {
        queryParams: { id, name: projectName, from: 'projects', projectType },
      });
    } else {
      this.avaService.getSample(id).subscribe(
        (res) => {
          if (res.appendSr == 'adding') {
            this.infoMessage = 'New entries is being inserted, please wait.';
            this.getProjects();
            setTimeout(() => {
              this.infoMessage = '';
            }, 10000);
          } else if (res.appendSr == 'done') {
            this.infoMessage = 'New entries has been added, please update first.';
            this.getProjects();
            setTimeout(() => {
              this.infoMessage = '';
            }, 10000);
          } else if (res.appendSr == 'pending') {
            this.router.navigate(['appendNewEntries'], {
              queryParams: {
                id,
                name: projectName,
                from: 'projects',
                projectType,
              },
            });
          }
        },
        (error: any) => {
          console.log(error);
        },
      );
    }
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

  clickToPreview(dataset) {
    this.router.navigate(['projects/preview'], {
      queryParams: {
        name: dataset.projectName,
        labelType: dataset.labelType,
        projectType: dataset.projectType,
        id: dataset.id,
        estimator: dataset.al.estimator,
        threshold: dataset.al.trigger,
        frequency: dataset.al.frequency,
        isMultipleLabel: dataset.isMultipleLabel,
      },
    });
  }

  receiveCloseEdit(e) {
    this.editProjectDialog = false;
  }

  receiveSubmitEdit(e) {
    this.editProjectDialog = false;
    e ? (this.infoMessage = 'Success to edit the project') : (this.errorMessage = 'Failed to edit');
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
