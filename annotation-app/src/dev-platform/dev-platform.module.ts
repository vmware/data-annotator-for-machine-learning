/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppModule } from '../app/app.module';
import { DevPlatformComponent } from './dev-platform/dev-platform.component';

@NgModule({
  declarations: [DevPlatformComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forRoot([
      {
        path: '',
        pathMatch: 'full',
        component: DevPlatformComponent,
        data: { title: 'loop' },
      },
    ]),
    AppModule,
  ],
  bootstrap: [DevPlatformComponent],
})
export class DevPlatformModule {}
