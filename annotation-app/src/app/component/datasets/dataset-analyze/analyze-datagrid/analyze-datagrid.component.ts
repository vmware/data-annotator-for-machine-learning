/*
Copyright 2019-2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-analyze-datagrid',
  templateUrl: './analyze-datagrid.component.html',
  styleUrls: ['./analyze-datagrid.component.scss'],
})
export class AnalyzeDatagridComponent implements OnInit {
  @Input() configData: any;
  @Input() gridloading: false;

  errorImg = false;

  constructor() {
    this.configData = {
      columnData: [],
      tableData: [],
      pageSizeOption: [10, 20, 50],
      type: '',
    };
  }

  ngOnInit(): void {}

  setDefaultImage() {
    this.errorImg = true;
  }
}
