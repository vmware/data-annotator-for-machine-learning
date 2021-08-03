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
  users: any = [];
  userPageSize: number;
  userPage: number;
  totalUsers: number
  msgEdit: any;
  loading: boolean;
  totalItems: number;
  errorMessage: string;
  constructor(
    private avaService: AvaService,

  ) {
    this.userPage = 1;
    this.userPageSize = 10;
  }
  ngOnInit() {
    this.getUsers();
    
  }
  private getUsers() {
    this.loading = true;
    this.avaService.getProjects('projects').subscribe(
      (res) => {
        this.loading = false;
        this.users = res;
        this.totalItems = res.length;
        // this.filterTasks(res.result, params);
      },
      (error: any) => {
        console.log(error);
        this.loading = false;
      },
    );
    // this.users = [{ "id": 1, "name": "Tom", "age": 5, "description": "adcdsf" }, { "id": 2, "name": "yue", "age": 6, "description": "ewqq" },
    // { "id": 3, "name": "uyt", "age": 8, "description": "werwerw" }, { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" },
    // { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" }, { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" },
    // { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" }, { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" },
    // { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" }, { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" },
    // { "id": 4, "name": "rew", "age": 2, "description": "rwerqwre" }];
    this.totalUsers = this.users.length;
  }
  showProjectEdit(info) {
    this.msgEdit = info;
    this.msgEdit.src = 'projects';
  }
  
  onLocalFileChange(event) {
    if (event.target.files.length > 0) {
      this.inputFile = event.target.files[0];
      this.errorMessage = '';
      this.previewHeadDatas = [];
      this.previewContentDatas = [];
      if (!this.env.config.enableAWSS3) {
        this.checkLocalFileExist(this.inputFile.name, this.uploadSet.fileFormat);
      }
    }
  }
  receiveDeleteLabel(e) {
    this.getUsers();
  }
}
