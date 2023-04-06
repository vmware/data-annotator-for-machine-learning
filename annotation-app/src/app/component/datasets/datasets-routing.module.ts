/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateNewDatasetModalComponent } from './create-new-dataset-modal/create-new-dataset-modal.component';
import { CreateNewDatasetPageComponent } from './create-new-dataset-page/create-new-dataset-page.component';
import { DatasetAnalyzeComponent } from './dataset-analyze/dataset-analyze.component';
import { MyDatasetsComponent } from './my-datasets/my-datasets.component';

const routes: Routes = [
  {
    path: 'list',
    component: MyDatasetsComponent,
    data: {
      title: 'loopDatasets',
    },
  },
  {
    path: 'create',
    component: CreateNewDatasetPageComponent,
    data: {
      title: 'loopDatasetsCreate',
    },
  },
  {
    path: 'create/modal',
    component: CreateNewDatasetModalComponent,
    data: {
      title: 'loopDatasetsCreate',
    },
  },
  {
    path: 'analyze',
    component: DatasetAnalyzeComponent,
    data: {
      title: 'loopDatasetsAnalyze',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  declarations: [],
})
export class DatasetsRoutingModule {}
