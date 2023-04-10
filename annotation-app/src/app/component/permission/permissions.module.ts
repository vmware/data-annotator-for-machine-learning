/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PermissionsRoutingModule } from './permissions-routing.module';
import { PermissionsComponent } from './permissions/permissions.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [PermissionsComponent],
  imports: [CommonModule, PermissionsRoutingModule, SharedModule],
})
export class PermissionsModule {}
