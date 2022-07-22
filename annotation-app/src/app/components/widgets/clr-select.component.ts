/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-clr-select',
  template: `
    <clr-select-container>
      <label *ngIf="data.labelText">{{ data.labelText }}</label>
      <select
        clrSelect
        #clrSelect
        [required]="data.required"
        name="option"
        [(ngModel)]="selectItem"
        (ngModelChange)="onSelecting()"
      >
        <option *ngFor="let item of data.options" [value]="item">
          {{ item }}
        </option>
      </select>
      <clr-control-error>This field is required!</clr-control-error>
    </clr-select-container>
  `,
  styles: [],
})
export class ClrSelectComponent {
  @Output() valueChange = new EventEmitter();
  @Input() data: any;
  selectItem: any;

  ngOnInit() {
    if (this.data.selectItem) {
      this.selectItem = this.data.selectItem;
    }
  }

  onSelecting() {
    this.valueChange.emit(this.selectItem);
  }
}
