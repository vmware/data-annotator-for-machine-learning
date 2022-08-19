/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import {
  Component,
  OnInit,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ElementRef,
} from '@angular/core';
import { ClrWizard } from '@clr/angular';
import * as _ from 'lodash';

@Component({
  selector: 'app-set-data',
  templateUrl: './set-data.component.html',
  styleUrls: ['./set-data.component.scss'],
})
export class SetDataComponent implements OnInit, OnChanges {
  @ViewChild('wizard', { static: true }) wizard: ClrWizard;
  @ViewChild('formDatagridConfirm') formDatagridConfirm: ElementRef;
  @ViewChild('formPageFour', { static: true }) formPageFour;

  @Input() wizardData: any;
  @Output() wizardOuter = new EventEmitter<any>();
  @Output() closeWizard = new EventEmitter();

  selectedDropDownItem: string;
  selectDescription = [];
  checkboxColumns = [];
  clrSelectData = {};
  isLoading: boolean;
  formDatagrid: any;

  ngOnInit() {
    this.wizard.navService.updateNavigation();
    if (this.wizardData.projectType === 'ner') {
      this.clrSelectData = {
        required: true,
        options: this.wizardData.csvHeaders,
        labelText: 'Selected Text Column',
      };
      for (let item of this.wizardData.csvHeaders) {
        this.checkboxColumns.push({
          name: item,
          checkboxDisabled: this.wizardData.dropdownSelected === item ? true : false,
          labelChecked: this.wizardData.checkboxChecked.indexOf(item) > -1 ? true : false,
          helptextChecked: this.wizardData.helpfulText.indexOf(item) > -1 ? true : false,
        });
      }
    } else {
      this.checkboxColumns = JSON.parse(JSON.stringify(this.wizardData.csvHeaders));
      this.clrSelectData = {
        required: true,
        options: [...['No Labels'], ...this.wizardData.csvHeaders],
        labelText: 'Selected Label Column',
      };
      this.selectDescription = this.wizardData.checkboxChecked;
    }
    this.selectedDropDownItem = this.wizardData.dropdownSelected;
    this.clrSelectData['selectItem'] = this.wizardData.dropdownSelected;
  }

  async ngOnChanges() {
    if (this.wizardData.status && this.wizardData.status.ok) {
      if (this.wizardData.status.msg) {
        await new Promise((r) => setTimeout(r, 500));
      }
      this.wizard.close();
    }
    if (this.wizardData.status && !this.wizardData.status.ok) {
      this.isLoading = false;
    }
  }
  onReceiveSelectedItem(e) {
    this.selectedDropDownItem = e;
    let that = this;
    this.selectDescription = [];
    if (this.wizardData.projectType === 'ner') {
      this.checkboxColumns.forEach((item) => {
        item.labelChecked = false;
        item.checkboxDisabled = false;
        if (item.name === e) {
          item.labelChecked = false;
          item.checkboxDisabled = true;
        }
      });
    } else {
      this.checkboxColumns = _.remove(
        JSON.parse(JSON.stringify(this.wizardData.csvHeaders)),
        function (n) {
          return n != that.selectedDropDownItem;
        },
      );
    }
  }

  changeCheckbox(data, from) {
    let index = _.findIndex(this.checkboxColumns, function (o) {
      return o.name === data;
    });
    !this.checkboxColumns[index][from];
  }

  goBack(_e): void {
    this.wizard.previous();
  }

  doCancel(): void {
    this.wizard.toggle(false);
  }

  onCommit() {
    this.wizardData.status = null;
    let outMsg = {
      dropdownSelected: this.selectedDropDownItem,
      checkboxChecked: this.selectDescription,
    };
    let nerLabel = [];
    this.isLoading = true;
    if (this.wizardData.projectType === 'ner') {
      for (let item of this.checkboxColumns) {
        if (item.labelChecked) {
          nerLabel.push(item.name);
        }
        if (item.helptextChecked) {
          this.selectDescription.push(item.name);
        }
      }
      outMsg.checkboxChecked = nerLabel;
      outMsg['helpfulText'] = this.selectDescription;
    }
    this.wizardOuter.emit(outMsg);
  }

  clrWizardPageOnLoad(pageID) {
    // according the current page to copy dom to show in confirm page
    if (pageID.includes(3)) {
      this.formDatagrid = document.getElementsByClassName('checkboxDatagrid');
    }

    if (pageID.includes(4)) {
      if (document.getElementsByClassName('checkboxDatagridCopy').length > 0) {
        document.getElementsByClassName('checkboxDatagridCopy')[0].remove();
      }
      let copy = this.formDatagrid[0].cloneNode(true);
      copy.className = 'checkboxDatagridCopy';
      this.formDatagridConfirm.nativeElement.appendChild(copy);
    }
  }

  clrWizardOpenChange(isOpen) {
    if (!isOpen) {
      this.closeWizard.emit(this.wizard);
    }
  }
}
