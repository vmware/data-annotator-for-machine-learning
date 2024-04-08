/*
Copyright 2019-2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { ClrDatagridFilterInterface, ClrDatagridFilter } from '@clr/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ClrLoadingState } from '@clr/angular';

@Component({
  selector: 'my-filter',
  templateUrl: './datagridFilter.component.html',
  styleUrls: ['./datagridFilter.component.scss'],
})
export class MyFilter implements ClrDatagridFilterInterface<any> {
  @Input() filterMsg?: any;
  @Input() filteredTotal;
  @Input() replaceStatus;
  @Output() filter = new EventEmitter();
  @Output() replace = new EventEmitter();

  inputString: string = '';
  inputStringFilter = new Subject<string>();
  changes = new Subject<any>();
  inputString1: string = '';
  loadingReplace: ClrLoadingState = ClrLoadingState.DEFAULT;

  constructor(private filterContainer: ClrDatagridFilter) {
    filterContainer.setFilter(this);
    this.inputStringFilter.pipe(debounceTime(400), distinctUntilChanged()).subscribe((value) => {
      this.loadingReplace = ClrLoadingState.DEFAULT;
      this.filter.emit(value.trim());
    });
  }

  ngOnChanges() {
    if (this.replaceStatus == 'succeed') {
      this.loadingReplace = ClrLoadingState.SUCCESS;
    }
  }

  isActive(): boolean {
    return !(this.inputString.trim().length == 0);
  }

  accepts() {
    return true;
  }

  change() {
    this.loadingReplace = ClrLoadingState.DEFAULT;
  }

  replaceAll() {
    if (
      this.inputString.trim() &&
      this.filteredTotal &&
      this.filteredTotal > 0 &&
      this.inputString1.trim() &&
      this.inputString !== this.inputString1
    ) {
      this.loadingReplace = ClrLoadingState.LOADING;
      let data = {
        filter: this.inputString.trim(),
        replace: this.inputString1.trim(),
      };
      this.replace.emit(data);
    }
  }
}
