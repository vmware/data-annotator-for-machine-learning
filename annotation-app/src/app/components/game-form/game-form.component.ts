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
  @ViewChild('reviewDataGird', { static: true }) reviewDataGird;

  user: any;
  datasets: any = [];
  reviewDatasets: any = [];
  datasetClrDatagridStateInterface;
  // deleteDatasetDialog: boolean = false;
  // previewDatasetDialog: boolean = false;
  // selectedDataset;
  // isBrowsing: boolean;
  // taskParamId: number;

  loading: boolean;
  errorMessage: string = '';
  refresh: any;
  tableState: ClrDatagridStateInterface;
  pageSize: number;
  page: number;
  totalItems: number;
  showFlagModal: boolean = false;
  flagData;
  pageSizeReview: number;
  pageReview: number;
  totalItemsReview: number;

  constructor(
    // private route: ActivatedRoute,
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private router: Router

  ) {

    this.user = this.userAuthService.loggedUser();
    this.page = 1;
    this.pageSize = 10;
    this.pageReview = 1;
    this.pageSizeReview = 10;

    // this.route.queryParams.subscribe(params => {
    //   this.taskParamId = Number(params['id']);
    // });


  }

  ngOnInit() {

    this.loading = false;
    // this.isBrowsing = (this.taskParamId) ? false : true;
    this.getProjects();
    if (this.user.role === 'Project Owner' || this.user.role === 'Admin') {
      this.getReviewProjects();
    }
  }

  valueChange(value: number) {
    this.pageSize = value;
    setTimeout(() => {
      this.dataGird.stateProvider.debouncer._change.next();
    }, 100);
  }

  reviewValueChange(value: number) {
    this.pageSizeReview = value;
    setTimeout(() => {
      this.reviewDataGird.stateProvider.debouncer._change.next();
    }, 100);
  }


  getReviewProjects() {
    this.avaService.getProjectsReviewList().subscribe(res => {
      for (let i = 0; i < res.length; i++) {
        res[i].isExtend = true;
        for (let j = 0; j < res[i].userCompleteCase.length; j++) {
          if (res[i].userCompleteCase[j].completeCase > 0) {
            res[i].disableReview = true;
            break;
          }
        }
      };
      this.reviewDatasets = res;
      this.totalItemsReview = res.length;
    }, (error) => {
      console.log(error);
      this.errorMessage = "Failed to load the datasets";
    })
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
  };


  startAnnotate(name, type, id, leftCase) {
    this.router.navigate(['annotate'], { queryParams: { name: name, projectType: type, id: id, from: 'annotate' } })
  };


  more(id) {
    for (let i = 0; i < this.reviewDatasets.length; i++) {
      if (this.reviewDatasets[i].id == id) {
        this.reviewDatasets[i].isExtend = !this.reviewDatasets[i].isExtend;
      }
    }
  }


}
