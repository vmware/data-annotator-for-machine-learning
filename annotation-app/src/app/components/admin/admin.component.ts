/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ClrDatagridStateInterface } from '@clr/angular';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { UserAuthService } from '../../services/user-auth.service';
import { AvaService } from '../../services/ava.service';
import { User } from '../../model/user';
import { EnvironmentsService } from 'app/services/environments.service';
import { Buffer } from 'buffer';
import { DatasetValidator } from '../../shared/form-validators/dataset-validator';
import { DownloadService } from 'app/services/common/download.service';
import { ToolService } from 'app/services/common/tool.service';
import { CommonService } from 'app/services/common/common.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  @ViewChild('dataGird', { static: false }) dataGird;
  @ViewChild('dataGirdUser', { static: false }) dataGirdUser;

  download: string;
  user: User;
  datasets: any = [];
  datasetClrDatagridStateInterface;
  deleteDatasetDialog = false;
  editProjectDialog = false;
  editUserRole = false;
  editUserDialog = false;
  createUserDialog = false;
  selectedDataset;
  previewImage = false;
  previewHeadDatas: any = [];
  previewContentDatas: any = [];
  isBrowsing: boolean;
  loading: boolean;
  errorMessage = '';
  infoMessage = '';
  tableState: ClrDatagridStateInterface;
  pageSize: number;
  page: number;
  totalItems: number;
  pageSizeUser: number;
  pageUser: number;
  totalUserItems: number;
  showAddNewDatasetDialog: boolean;
  showNewDatasetInfo: boolean;
  options = '';
  userRoleInfo: any = {};
  optionsSet = '';
  inputEmail = '';
  projectData: any = [];
  deleteUserDialog: boolean;
  selectedProjectDataset: any;
  notNumber: boolean;
  notTriggerNumber: boolean;
  minThreshold: boolean;
  minFrequency: boolean;
  inputAssigneeValidation: boolean;
  emailReg: boolean;
  emailRegForOwner: boolean;
  shareDatasets = false;
  inputDescription = '';
  unShareDatasets = false;
  inputDescriptionTip = false;
  shareDataComplete = false;
  downloadUrl: any;
  showDownloadDatasets = false;
  msg;
  msgGenerate;
  showGenerateDatasets = false;
  labelType = '';
  alForm: FormGroup;
  trigger = 50;
  frequency = 10;
  loadingSet = false;
  modelExist = false;
  msgEdit: any;
  setUserErrMessage: string;
  inputUserNameUpdate = new Subject<string>();
  showTreeView: boolean = false;
  treeData: any;

  constructor(
    private router: Router,
    private userAuthService: UserAuthService,
    private avaService: AvaService,
    public env: EnvironmentsService,
    private formBuilder: FormBuilder,
    private downloadService: DownloadService,
    private toolService: ToolService,
    private commonService: CommonService,
  ) {
    this.page = 1;
    this.pageSize = 10;
    this.pageUser = 1;
    this.pageSizeUser = 10;
    this.download = `${this.env.config.annotationService}/api`;
    this.inputUserNameUpdate.pipe(debounceTime(400), distinctUntilChanged()).subscribe((value) => {
      let userName = value.trim();
      this.validateUserName(userName);
   });
  }

  ngOnInit() {
    this.loading = false;
    this.user = this.userAuthService.loggedUser();
    this.getAllUsers();
    this.optionsSet = 'Admin';
    this.getProjects();
    this.inputAssigneeValidation = false;
    this.emailReg = true;
    this.emailRegForOwner = true;
    // this.downloadDatasets = false;
    this.notNumber = false;
    this.notTriggerNumber = false;
    this.minThreshold = false;
    this.minFrequency = false;
    this.createForm();
  }

  createForm(): void {
    this.alForm = this.formBuilder.group({
      frequency: [this.frequency, DatasetValidator.threshold()],
      trigger: [this.trigger, DatasetValidator.threshold()],
    });
  }

  valueChange(value: number) {
    this.pageSize = value;
    setTimeout(() => {
      this.dataGird.stateProvider.debouncer._change.next();
    }, 100);
  }

  valueChangeUser(value: number) {
    this.pageSizeUser = value;
    setTimeout(() => {
      this.dataGirdUser.stateProvider.debouncer._change.next();
    }, 100);
  }

  getProjects(params?: any) {
    this.loading = true;
    this.avaService.getProjects('admin').subscribe(
      (res) => {
        this.loading = false;
        for (let i = 0; i < res.length; i++) {
          res[i].isExtend = true;
        }
        this.projectData = res;
        this.projectData.forEach(item => {
          if (item.labelType == 'numericLabel' && item.isMultipleLabel) {
            const categoryList = JSON.parse(item.categoryList);
            const itemKeys = [];
            categoryList.forEach(element => {
              const labels = Object.keys(element);
              itemKeys.push(labels[0]);
            });
            item.mutilNumbericLabels = itemKeys.toString();
          }
          if (item.labelType === 'HTL') {
            item.categoryList = JSON.parse(item.categoryList);
          }
        });
        this.totalItems = res.length;   
      },
      (error: any) => {
        console.log(error);
        this.errorMessage = 'Failed to load the datasets';
        this.loading = false;
      },
    );
  }

  getAllUsers() {
    this.avaService.getAllUsers().subscribe(
      (res) => {
        this.loading = false;
        this.datasets = res;
        this.totalUserItems = res.length;
      },
      (error: any) => {
        console.log(error);
        this.errorMessage = 'Failed to load';
        this.loading = false;
      },
    );
  }

  showProjectEdit(info) {
    this.msgEdit = info;
    this.msgEdit.src = 'admin';
  }

  deleteDataset(data) {
    const param = {
      pid: data._id,
    };
    this.avaService.deleteProject(param).subscribe(
      () => {
        this.infoMessage = 'Success to delete the project';
        this.getProjects();
        this.loading = false;
        setTimeout(() => {
          this.infoMessage = '';
        }, 1000);
      },
      (error: any) => {
        console.log(error);
        this.errorMessage = 'Failed to delete';
        this.loading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 1000);
      },
    );
  }

  changeSetRadio(e) {
    this.optionsSet = e.target.value;
  }

  saveRoleCreate() {
    if (!this.inputEmail) {
      this.setUserErrMessage = 'This field is required';
    } else {
      const emailReg = this.toolService.toRegEmail([this.inputEmail]);
      if (emailReg) {
        this.setUserErrMessage = '';
        const str = this.inputEmail.split('@')[0];
        this.userRoleInfo = {
          email: this.inputEmail,
          role: this.optionsSet,
          name: str.replace(str[0], str[0].toUpperCase()),
        };
        this.avaService.saveUser(this.userRoleInfo).subscribe(
          (res) => {
            this.loading = false;
            this.createUserDialog = false;
            this.infoMessage = 'Success to create the user role';
            this.getAllUsers();
            setTimeout(() => {
              this.infoMessage = '';
            }, 1000);
          },
          (error: any) => {
            console.log(error);
            this.errorMessage = 'Failed to create';
            this.loading = false;
            this.createUserDialog = false;
          },
        );
      } else {
        this.setUserErrMessage = this.env.config.enableAWSS3
          ? 'Wrong format! Email only accept vmware emailbox'
          : 'Wrong format! Only accept email address';
      }
    }
  }

  selectedUser(info) {
    this.options = info.role;
    this.userRoleInfo = {
      role: '',
      user: info.email,
    };
  }

  changeRadio(e) {
    this.options = e.target.value;
  }

  saveRoleEdit() {
    this.loading = true;
    this.userRoleInfo.role = this.options;
    this.avaService.saveRoleEdit(this.userRoleInfo).subscribe(
      (res) => {
        this.loading = false;
        this.infoMessage = 'Success to modify the user role';
        this.getAllUsers();
        setTimeout(() => {
          this.infoMessage = '';
        }, 1000);
      },
      (error: any) => {
        console.log(error);
        this.errorMessage = 'Failed to save';
        this.loading = false;
      },
    );
  }

  deleteUser(info) {
    const param = {
      uid: info._id,
    };
    this.avaService.deleteUser(param).subscribe(
      (res) => {
        this.loading = false;
        this.infoMessage = 'Success to delete the user';
        this.getAllUsers();
        setTimeout(() => {
          this.infoMessage = '';
        }, 1000);
      },
      (error: any) => {
        console.log(error);
        this.errorMessage = 'Failed to save';
        this.loading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 1000);
      },
    );
  }

  generateProject(e) {
    this.commonService
      .generateProject(e, this.projectData, this.user.email, 'admin')
      .then((response) => {
        this.projectData = response.datasets;
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
            format: res.format,
            downloadUrl: this.env.config.enableAWSS3
              ? new Buffer(res.file, 'base64').toString()
              : res.file,
            datasets: this.datasets,
            id: e.id,
            projectName: e.projectName,
            labelType: e.labelType,
            projectType: e.projectType,
            src: 'admin',
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

  more(id) {
    for (let i = 0; i < this.projectData.length; i++) {
      if (this.projectData[i].id == id) {
        this.projectData[i].isExtend = !this.projectData[i].isExtend;
      }
    }
  }

  cancelShare() {
    this.shareDatasets = false;
    this.inputDescriptionTip = false;
    this.shareDataComplete = false;
    this.inputDescription = '';
  }

  checkAddStatus(id, projectName, projectType, categoryList, regression) {
    for (let i = 0; i < this.projectData.length; i++) {
      if (this.projectData[i].id == id) {
        this.projectData[i].appendSr = 'adding';
        break;
      }
    }
    if (projectType == 'image') {
      this.router.navigate(['appendNewEntries'], {
        queryParams: { id, name: projectName, from: 'admin', projectType },
      });
    } else if (projectType == 'log') {
      this.router.navigate(['appendNewEntries'], {
        queryParams: { id, name: projectName, from: 'admin', projectType },
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
              queryParams: { id, name: projectName, from: 'admin', projectType, categoryList, regression },
            });
          }
        },
        (error: any) => {
          console.log(error);
        },
      );
    }
  }

  availableNewEntry(id, projectName, projectType, categoryList, regression) {
    for (let i = 0; i < this.projectData.length; i++) {
      if (this.projectData[i].id == id) {
        this.projectData[i].appendSr = 'adding';
        break;
      }
    }
    if (projectType == 'image') {
      this.router.navigate(['appendNewEntries'], {
        queryParams: { id, name: projectName, from: 'admin', projectType },
      });
    } else if (projectType == 'log') {
      this.router.navigate(['appendNewEntries'], {
        queryParams: { id, name: projectName, from: 'admin', projectType },
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
              queryParams: { id, name: projectName, from: 'admin', projectType, categoryList, regression },
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
    this.router.navigate(['admin/preview'], {
      queryParams: {
        name: dataset.projectName,
        labelType: dataset.labelType,
        id: dataset.id,
        projectType: dataset.projectType,
        estimator: dataset.al.estimator,
        threshold: dataset.al.trigger,
        frequency: dataset.al.frequency,
        isMultipleLabel: dataset.isMultipleLabel,
        queryStrategy: dataset.al.queryStrategy,
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

  validateUserName(value: any) {
    if (value) {
      const emailReg = this.toolService.toRegEmail([this.inputEmail]);
      if (emailReg) {
        this.setUserErrMessage = '';
      } else {
        this.setUserErrMessage = this.env.config.enableAWSS3
          ? 'Wrong format! Email only accept vmware emailbox'
          : 'Wrong format! Only accept email address';
      }  
    } else {
      this.setUserErrMessage = 'This field is required';
    }
  }

  getChildren = (folder) => folder.children;

  clickTreeView(data) {
    this.showTreeView = true;
    this.treeData = data;
  }

  onCloseTreeDialog() {
    this.showTreeView = false;
  }
}
