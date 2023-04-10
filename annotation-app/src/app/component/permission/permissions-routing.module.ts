/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PermissionsComponent } from './permissions/permissions.component';

const routes: Routes = [
  {
    path: 'users',
    component: PermissionsComponent,
    data: {
      title: 'loopPermissions',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  declarations: [],
})
export class PermissionsRoutingModule {}
