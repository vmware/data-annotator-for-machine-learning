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
