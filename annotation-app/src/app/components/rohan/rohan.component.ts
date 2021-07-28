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
  selector: 'app-rohan',
  templateUrl: './rohan.component.html',
  styleUrls: ['./rohan.component.scss'],
})
export class RohanComponent implements OnInit {
  @ViewChild('dataGird', { static: true }) dataGird;
  download: string;
  user: string;
  datasets: any = [];
  users: any = [];
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
  userPageSize: number;
  userPage: number;
  totalUsers: number;
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
    this.userPage = 1;
    this.userPageSize = 10;
    this.showAnnotatorList = false;
    this.route.queryParams.subscribe((params) => {
      this.taskParamId = Number(params['id']);
    });
  }

  ngOnInit() {
    this.getUsers();
    this.inputAssigneeValidation = false;
    this.emailReg = true;
    this.downloadDatasets = false;
  }




  private getUsers() {
    this.users = [{ "id": 1, "name": "Tom", "age": 5, "description": "adcdsf" }, { "id": 2, "name": "yue", "age": 6, "description": "ewqq" },
    { "id": 3, "name": "uyt", "age": 8, "description": "werwerw" }, { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" },
    { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" }, { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" },
    { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" }, { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" },
    { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" }, { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" },
    { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" }];
    this.totalUsers = this.users.length;
  }
  showProjectEdit(info) {
    this.msgEdit = info;
    this.msgEdit.src = 'projects';
  }


























  receiveCloseEdit(e) {
    this.editProjectDialog = false;
  }

  receiveSubmitEdit(e) {
    this.editProjectDialog = false;
    e ? (this.infoMessage = 'Success to edit the project') : (this.errorMessage = 'Failed to edit');
    this.getUsers();
    setTimeout(() => {
      this.infoMessage = '';
      this.errorMessage = '';
    }, 1000);
  }

  receiveDeleteLabel(e) {
    this.getUsers();
  }
}
