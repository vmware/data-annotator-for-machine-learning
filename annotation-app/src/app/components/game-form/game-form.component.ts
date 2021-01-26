/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { ClrDatagridStateInterface } from '@clr/angular';
import 'rxjs/Rx'
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAuthService } from '../../services/user-auth.service';
import { AvaService } from "../../services/ava.service";

@Component({
  selector: 'app-game-form',
  templateUrl: './game-form.component.html',
  styleUrls: ['./game-form.component.scss']
})
export class GameFormComponent implements OnInit {

  @ViewChild('dataGird', { static: true }) dataGird;

  user: string;
  datasets: any = [];

  taskParamId: number;
  datasetClrDatagridStateInterface;
  deleteDatasetDialog: boolean = false;
  previewDatasetDialog: boolean = false;
  selectedDataset;
  isBrowsing: boolean;

  loading: boolean;
  errorMessage: string = '';
  infoMessage: string = '';
  refresh: any;
  tableState: ClrDatagridStateInterface;
  pageSize: number;
  page: number;
  totalItems: number;
  showFlagModal: boolean = false;
  flagData;

  constructor(
    private route: ActivatedRoute,
    private avaService: AvaService,
    private userAuthService: UserAuthService,
  ) {

    this.user = this.userAuthService.loggedUser().email;
    this.page = 1;
    this.pageSize = 10;

    this.route.queryParams.subscribe(params => {
      this.taskParamId = Number(params['id']);
    });


  }

  ngOnInit() {

    this.loading = false;
    this.isBrowsing = (this.taskParamId) ? false : true;
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
    this.avaService.getProjects('annotate').subscribe(res => {
      this.loading = false;
      this.datasets = res;
      this.totalItems = res.length;
      // this.filterTasks(res.result, params);
    }, (error: any) => {
      console.log(error);
      this.errorMessage = "Failed to load the datasets";
      this.loading = false;
    });
  };



  clickProjectName(data) {
    this.showFlagModal = true;
    this.flagData = data;
  };


  receiveCloseFlagModal(e) {
    this.showFlagModal = false;
    this.flagData = null;
  }


}
