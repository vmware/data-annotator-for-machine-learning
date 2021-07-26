/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { ClrDatagridStateInterface } from '@clr/angular';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAuthService } from '../../services/user-auth.service';
import { AvaService } from '../../services/ava.service';

@Component({
  selector: 'app-game-form',
  templateUrl: './game-form.component.html',
  styleUrls: ['./game-form.component.scss'],
})
export class GameFormComponent implements OnInit {
  @ViewChild('dataGird', { static: true }) dataGird;
  @ViewChild('reviewDataGird', { static: true }) reviewDataGird;

  user: any;
  datasets: any = [];
  reviewDatasets: any = [];
  datasetClrDatagridStateInterface;
  loading: boolean;
  errorMessage = '';
  refresh: any;
  tableState: ClrDatagridStateInterface;
  pageSize: number;
  page: number;
  totalItems: number;
  pageSizeReview: number;
  pageReview: number;
  totalItemsReview: number;
  isShowReviewTab = false;

  constructor(
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.user = this.userAuthService.loggedUser();
    this.page = 1;
    this.pageSize = 10;
    this.pageReview = 1;
    this.pageSizeReview = 10;
    this.route.queryParams.subscribe((data) => {
      data.outfrom == 'review' ? (this.isShowReviewTab = true) : (this.isShowReviewTab = false);
    });
  }

  ngOnInit() {
    this.loading = false;
    if (!this.isShowReviewTab) {
      this.getProjects();
    }
    if (
      (this.user.role === 'Project Owner' || this.user.role === 'Admin') &&
      this.isShowReviewTab == true
    ) {
      // this.getReviewProjects();
    }
  }

  clickAnnotate() {
    this.getProjects();
  }

  // clickReview() {
  //   this.getReviewProjects();
  // }

  valueChange(value: number) {
    this.pageSize = value;
  }

  reviewValueChange(value: number) {
    this.pageSizeReview = value;
  }

  private getProjects(params?: any) {
    this.loading = true;
    this.avaService.getProjects('annotate').subscribe(
      (res) => {
        res.forEach((project) => {
          if (project.projectType === 'log' && project.creator.indexOf(this.user.email) > -1) {
            project.allowOwnerReview = true;
          }
          project.isExtend = true;
          for (let j = 0; j < project.userCompleteCase.length; j++) {
            if (project.userCompleteCase[j].completeCase > 0) {
              project.disableReview = true;
              break;
            }
          }
        });
        this.datasets = res;
        this.totalItems = res.length;
        this.loading = false;
      },
      (error: any) => {
        console.log(error);
        this.errorMessage = 'Failed to load the datasets';
        this.loading = false;
      },
    );
  }

  startAnnotate(name, type, id, leftCase) {
    this.router.navigate(['annotate'], {
      queryParams: { name, projectType: type, id, from: 'annotate' },
    });
  }

  more(id) {
    for (let i = 0; i < this.datasets.length; i++) {
      if (this.datasets[i].id == id) {
        this.datasets[i].isExtend = !this.datasets[i].isExtend;
      }
    }
  }
}
