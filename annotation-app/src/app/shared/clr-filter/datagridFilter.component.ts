/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { ClrDatagridFilterInterface, ClrDatagridFilter } from '@clr/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'my-filter',
  templateUrl: './datagridFilter.component.html',
  styleUrls: ['./datagridFilter.component.scss'],
})
export class MyFilter implements ClrDatagridFilterInterface<any> {
  @Input() filterMsg?: any;
  @Input() filteredTotal;
  @Output() filter = new EventEmitter();
  @Output() replace = new EventEmitter();

  // @ViewChild('filenameFilterEl') filenameFilterEl?: ElementRef;
  // @ViewChild('filterEl') filterEl?: ElementRef;

  inputString: string = '';
  inputStringFilter = new Subject<string>();
  changes = new Subject<any>();
  inputString1: string = '';

  constructor(private filterContainer: ClrDatagridFilter) {
    setTimeout(() => {
      console.log(666, this.filterMsg);
    }, 500);
    filterContainer.setFilter(this);
    this.inputStringFilter.pipe(debounceTime(400), distinctUntilChanged()).subscribe((value) => {
      console.log(555, this.inputString, value);
      this.filter.emit(value.trim());
    });
  }

  isActive(): boolean {
    return !(this.inputString.trim().length == 0);
  }

  accepts() {
    return true;
  }

  replaceAll() {
    if (this.inputString.trim() && this.filteredTotal && this.filteredTotal > 0 && this.inputString1.trim()) {
      let data = {
        filter: this.inputString.trim(),
        replace: this.inputString1.trim(),
      };
      this.replace.emit(data);
    }
  }
}
