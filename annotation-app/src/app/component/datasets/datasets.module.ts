/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { DatasetsRoutingModule } from './datasets-routing.module';
import { MyDatasetsComponent } from './my-datasets/my-datasets.component';
import { ModalDatagridComponent } from './modal-datagrid/modal-datagrid.component';
import { CreateNewDatasetPageComponent } from './create-new-dataset-page/create-new-dataset-page.component';
import { DatasetAnalyzeComponent } from './dataset-analyze/dataset-analyze.component';
import { ProjectsModule } from '../projects/projects.module';

@NgModule({
  declarations: [MyDatasetsComponent, ModalDatagridComponent, CreateNewDatasetPageComponent, DatasetAnalyzeComponent],
  imports: [CommonModule, DatasetsRoutingModule, SharedModule, ProjectsModule],
})
export class DatasetsModule {}
