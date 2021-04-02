/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { AvaService } from "../../services/ava.service";
import { QueryDatasetData, DatasetUtil } from '../../model/index';
import { FormValidatorUtil } from '../../shared/form-validators/form-validator-util';
import { DatasetValidator } from '../../shared/form-validators/dataset-validator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EnvironmentsService } from 'app/services/environments.service';

@Component({
  selector: 'supercollider',
  templateUrl: './supercollider.component.html',
  styleUrls: ['./supercollider.component.scss']
})
export class SupercolliderComponent implements OnInit {

  @Input()
  dataset: QueryDatasetData;

  @Output('onCloseDialog')
  onCloseDialogEmitter = new EventEmitter();

  @Output('onQueriedDataset')
  onQueryDsEmitter: EventEmitter<QueryDatasetData> = new EventEmitter<QueryDatasetData>();

  user: any;
  dsForm: FormGroup;
  loading: boolean = false;
  querySQL: boolean = false;
  nameExist: boolean;
  errorMessage: string = '';
  infoMessage: string = '';
  placeholder = "select * from cpbu_sandbox.history__vc__esx__generation";
  userQuestionUpdate = new Subject<string>();


  constructor(
    private formBuilder: FormBuilder,
    private avaService: AvaService,
    public env: EnvironmentsService,

  ) {
    this.userQuestionUpdate.pipe(
      debounceTime(400),
      distinctUntilChanged())
      .subscribe(value => {
        if (value != '') {
          this.checkName(value);
        } else {
          this.nameExist = false;
        }
      });
  }

  ngOnInit() {
    this.infoMessage = "You should test and validate your query before trying to run the query on" + this.env.config.serviceTitle + ".";
    this.createForm();
  }


  onKeydown(e) {
    e.stopPropagation();
  }


  createForm(): void {
    if (!this.dataset) {
      this.dataset = DatasetUtil.sqlInit();
    }
    this.dsForm = this.formBuilder.group({
      name: [this.dataset.name || '', DatasetValidator.datasetName()],
      description: [this.dataset.description, null],
      source: [this.dataset.source, null],
      query: [this.dataset.query || '']
    });
  }


  onCloseDialog() {
    this.onCloseDialogEmitter.emit();
  }

  buildFormModel(): any {
    let formModel = JSON.parse(JSON.stringify(this.dsForm.value));
    return formModel;
  }

  onSubmit(): void {
    FormValidatorUtil.markControlsAsTouched(this.dsForm);
    if (!this.dsForm.invalid && this.nameExist == false) {
      this.querySQL = true;
      this.infoMessage = "SuperCollider queries may take a long time to complete";
      let param = {
        dsname: this.dsForm.value.name,
        description: this.dsForm.value.description,
        sql: this.dsForm.value.query == '' ? this.placeholder : this.dsForm.value.query,
      };
      this.avaService.sendSQL(param).subscribe(res => {
        this.onQueryDsEmitter.emit(res);
      },
        error => {
          console.log(error);
          this.querySQL = false;
          this.errorMessage = 'SuperCollider queries falied, please try again later.';
          this.infoMessage = '';
        });
    }
  }


  checkName(e) {
    this.avaService.findDatasetName(e).subscribe(res => {
      if (res.length != 0) {
        this.nameExist = true;
      } else {
        this.nameExist = false;
      }
    });
  }

}
