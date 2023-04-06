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
  styles: [],
})
export class MyFilter implements ClrDatagridFilterInterface<any> {
  @Input() filterMsg?: boolean;
  @Output() filter = new EventEmitter();
  @ViewChild('filenameFilterEl') filenameFilterEl?: ElementRef;

  filename: string = '';
  filenameFilter = new Subject<string>();
  changes = new Subject<any>();

  constructor(private filterContainer: ClrDatagridFilter) {
    filterContainer.setFilter(this);
    this.filenameFilter.pipe(debounceTime(400), distinctUntilChanged()).subscribe((value) => {
      this.filter.emit(value);
    });
  }

  isActive(): boolean {
    return !(this.filename.trim().length == 0);
  }

  accepts() {
    return true;
  }
}
