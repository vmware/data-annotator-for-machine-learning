/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { ClrDatagridStateInterface } from '@clr/angular';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { UserAuthService } from '../../services/user-auth.service';
import { AvaService } from '../../services/ava.service';
import { ToolService } from 'app/services/common/tool.service';

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

  constructor(
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private router: Router,
    private toolService: ToolService,
  ) {
    this.user = this.userAuthService.loggedUser();
    this.page = 1;
    this.pageSize = 10;
  }

  ngOnInit() {
    this.loading = false;
    this.getProjects();
  }

  valueChange(value: number) {
    this.pageSize = value;
  }

  private getProjects(params?: any) {
    this.loading = true;
    this.avaService.getProjects('annotate').subscribe(
      (res) => {
        res.forEach((project) => {
          if (project.projectType === 'log' && project.creator.indexOf(this.user.email) > -1) {
            project.allowOwnerReview = true;
          }
          if (project.annotator.indexOf(this.user.email) > -1) {
            project.allowStart = true;
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
        this.datasets.forEach(item => {
          if (item.labelType == 'numericLabel' && item.isMultipleLabel) {
            const categoryList = JSON.parse(item.categoryList);
            const itemKeys = [];
            categoryList.forEach(element => {
              const labels = Object.keys(element);
              itemKeys.push(labels[0]);
            });
            item.mutilNumbericLabels = itemKeys.toString();
          }
        });
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

  clickReview(data) {
    let flag = data.userCompleteCase.sort(this.toolService.sortBy('completeCase', 'descending'));
    let reviewee = '';
    for (let i = 0; i < flag.length; i++) {
      if (flag[i].completeCase > flag[i].reviewed) {
        reviewee = flag[i].user;
        break;
      }
    }
    this.router.navigate(['annotate'], {
      queryParams: {
        name: data.projectName,
        projectType: data.projectType,
        id: data.id,
        from: 'review',
        reviewee: reviewee === '' ? flag[0].user : reviewee,
      },
    });
  }
}
