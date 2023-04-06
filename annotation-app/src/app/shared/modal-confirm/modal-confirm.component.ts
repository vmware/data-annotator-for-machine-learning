/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-modal-confirm',
  templateUrl: './modal-confirm.component.html',
})
export class ModalConfirmComponent implements OnInit {
  @Input() msg;
  @Output('cancelBtn')
  onCloseConfirmDialogEmitter = new EventEmitter();
  @Output('okBtn')
  okBtnEmitter = new EventEmitter();

  showModal = true;
  clickOkBtn = false;
  constructor() {}

  ngOnInit(): void {}

  cancelBtn() {
    this.onCloseConfirmDialogEmitter.emit(true);
  }
  okBtn() {
    this.clickOkBtn = true;
    this.okBtnEmitter.emit(true);
  }
}
