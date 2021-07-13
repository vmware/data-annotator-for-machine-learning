/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dropdown-pagesize',
  template: `
    <div>
      <label>Show </label>
      <div class="select line">
        <select
          clrSelect
          placeholder="Select One"
          [(ngModel)]="selectValue"
          (change)="selectedChange(selectValue)"
        >
          <option *ngFor="let value of allValues" [ngValue]="value">{{ value }}</option>
        </select>
      </div>
      <label>Entries</label>
    </div>
  `,
  styles: [
    `
      .line {
        display: inline-block;
      }
    `,
  ],
})
export class DropdownPageComponent {
  @Output() valueChange = new EventEmitter();
  @Input() allCounts: number;
  selectValue = 10;
  allValues: any = [10, 20, 50, 100];

  selectedChange(value: number) {
    if (value > this.allCounts) {
      let index = this.allValues.indexOf(value);
      if (index > 0) {
        while (this.allValues[index] > this.allCounts) {
          index--;
        }
        value = this.allCounts < 10 ? 10 : this.allCounts;
      }
    }
    this.valueChange.emit(value);
  }
}
