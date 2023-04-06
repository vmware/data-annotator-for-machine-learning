/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BasicLoginComponent } from './basic-login/basic-login.component';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  {
    path: 'basic',
    component: BasicLoginComponent,
    data: {
      title: 'loopBasicLogin',
    },
  },
  {
    path: 'authenticate',
    component: LoginComponent,
    data: { title: 'loopAuthenticateLogin' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  declarations: [],
})
export class LoginRoutingModule {}
