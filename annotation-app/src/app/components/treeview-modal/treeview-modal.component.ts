/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-treeview-modal',
  templateUrl: './treeview-modal.component.html',
  styleUrls: ['./treeview-modal.component.scss'],
})
export class TreeviewModalComponent implements OnInit {
  @Input() treeData: any;

  @Output('onCloseTreeDialog')
  onCloseTreeDialog = new EventEmitter();
  constructor() {}

  ngOnInit() {}

  onCloseDialog() {
    this.onCloseTreeDialog.emit();
  }
  getChildren = (folder) => folder.children;
}
