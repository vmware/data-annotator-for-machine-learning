/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { RouterModule } from '@angular/router';
import { ModalConfirmComponent } from './modal-confirm/modal-confirm.component';
import { MyFilter } from './clr-filter/datagridFilter.component';
import { FullNamePipe } from '../pipes/full-name.pipe';
import { MathRoundPipe } from '../pipes/math-round.pipe';
import { SliceTextPipe } from '../pipes/sliceText.pipe';
import { UploadFileComponent } from '../component/datasets/upload-file/upload-file.component';
import { DndDirective } from '../component/datasets/dnd.directive';
import { CreateNewDatasetModalComponent } from '../component/datasets/create-new-dataset-modal/create-new-dataset-modal.component';
import { CreateNewDatasetComponent } from '../component/datasets/create-new-dataset/create-new-dataset.component';

@NgModule({
  declarations: [
    ModalConfirmComponent,
    MyFilter,
    FullNamePipe,
    MathRoundPipe,
    SliceTextPipe,
    UploadFileComponent,
    DndDirective,
    CreateNewDatasetComponent,
    CreateNewDatasetModalComponent,
  ],
  imports: [CommonModule, ClarityModule, FormsModule, ReactiveFormsModule, RouterModule],
  exports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    ClarityModule,
    ModalConfirmComponent,
    MyFilter,
    FullNamePipe,
    MathRoundPipe,
    SliceTextPipe,
    UploadFileComponent,
    DndDirective,
    CreateNewDatasetModalComponent,
    CreateNewDatasetComponent,
  ],
})
export class SharedModule {}
