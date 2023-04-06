/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginRoutingModule } from './login-routing.module';
import { BasicLoginComponent } from './basic-login/basic-login.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { LoginComponent } from './login/login.component';

@NgModule({
  declarations: [BasicLoginComponent, LoginComponent],
  imports: [CommonModule, LoginRoutingModule, SharedModule],
})
export class LoginsModule {}
