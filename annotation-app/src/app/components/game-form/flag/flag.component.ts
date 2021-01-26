/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { UserAuthService } from '../../../services/user-auth.service';
import { AvaService } from "../../../services/ava.service";
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import * as _ from "lodash";


@Component({
  selector: 'flag',
  templateUrl: './flag.component.html',
  styleUrls: ['./flag.component.scss']
})


export class FlagComponent implements OnInit {

  @Input() msg: any;

  @Output('closeFlagModal') closeFlagModalEmitter = new EventEmitter();


  user: any;
  loading: boolean = true;
  errorMessage: string = '';
  infoMessage: string = '';
  firstLoadTable: boolean = false;
  previewSrsHeader;
  previewSrs;
  flagStatus;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  isInit: number = 1;
  labels: any;


  constructor(
    private avaService: AvaService,
    private userAuthService: UserAuthService
  ) {
    this.user = this.userAuthService.loggedUser().email;

  }

  ngOnInit() {
    this.flagStatus = true;
    this.firstLoadTable = true;
    this.page = 1;
    this.pageSize = 10;
    this.getAllFlag();
    if ((this.msg.labelType && this.msg.labelType == "textLabel") || (!this.msg.labelType)) {
      this.labels = this.msg.categoryList;
    } else if (this.msg.labelType && this.msg.labelType == "numericLabel") {
      this.labels = this.msg.min + "--" + this.msg.max;
    }

  }



  closeFlagModal() {
    this.closeFlagModalEmitter.emit();
  };


  refresh(event) {
    if (event && event.page && this.isInit != 1) {
      this.page = event.page.from / event.page.size + 1;
      this.pageSize = event.page.size;
      this.getAllFlag();
    }
    this.isInit = 0;
  };


  getAllFlag() {
    this.loading = true;
    this.avaService.getAllFlag(this.msg.projectName, this.page, this.pageSize).subscribe(response => {
      this.totalItems = response.totalDocs;
      this.totalPages = response.totalPages;
      let flag = [];
      let cellContent = [];
      response = response.docs;
      for (let i = 0; i < response.length; i++) {
        flag.push(response[i].originalData)
      };
      if (flag.length > 0) {
        let pre = [];
        _.forIn(flag[0], function (value, key) {
          pre.push(key)
        });
        this.previewSrsHeader = pre;
        for (let j = 0; j < flag.length; j++) {
          let a = flag[j];
          let cell = [];
          for (let key in a) {
            cell.push(a[key]);
          }
          cellContent.push(cell);
        };
      };
      for (let k = 0; k < response.length; k++) {
        response[k].originalData = cellContent[k];
      }
      this.previewSrs = response;
      this.loading = false;
      this.firstLoadTable = false;

    }, error => {
      console.log(error);
      this.loading = false;
      this.firstLoadTable = false;

    });
  };


  unflag(data) {
    this.loading = true;
    let param = {
      tid: data.id,
      pid: this.msg.id
    };
    this.avaService.unflag(param).subscribe(response => {
      this.getAllFlag();

    }, error => {
      console.log(error);
      this.loading = false;

    });
  }




}
