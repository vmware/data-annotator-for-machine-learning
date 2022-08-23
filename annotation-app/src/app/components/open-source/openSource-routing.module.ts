/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BasicLoginComponent } from './basic-login/basic-login.component';

const routes: Routes = [
  { path: '', redirectTo: 'basicLogin', pathMatch: 'full' },
  {
    path: 'basicLogin',
    component: BasicLoginComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  declarations: [],
})
export class OpenSourceRoutingModule {}
