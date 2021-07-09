import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { ClrDatagridFilterInterface, ClrDatagridFilter } from '@clr/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'my-filter',
  templateUrl: './datagridFilter.component.html',
  styleUrls: ['./datagridFilter.component.scss'],
})
export class MyFilter implements OnInit {
  @Output() filter = new EventEmitter();

  filename: string = '';
  filenameFilter = new Subject<string>();

  constructor() {
    console.log(
      1111,
      this.filenameFilter,
      this.filenameFilter.pipe(debounceTime(400), distinctUntilChanged()),
    );
  }

  ngOnInit() {
    this.filenameFilter.pipe(debounceTime(400)).subscribe((value) => {
      if (value.trim() != '') {
        this.filter.emit(value);
      }
    });
  }

  isActive(): boolean {
    return !(this.filename.trim().length == 0);
  }

  accepts(any) {
    return true;
  }
}
