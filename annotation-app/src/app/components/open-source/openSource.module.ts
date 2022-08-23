/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenSourceRoutingModule } from './openSource-routing.module';
import { BasicLoginComponent } from './basic-login/basic-login.component';
import { SharedModule } from 'app/shared/shared.module';
import { AvaService } from 'app/services/ava.service';

@NgModule({
  declarations: [BasicLoginComponent],
  imports: [CommonModule, OpenSourceRoutingModule, SharedModule],
})
export class OpenSourceModule {}
