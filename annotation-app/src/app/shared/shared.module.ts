/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [CommonModule, ClarityModule, FormsModule, ReactiveFormsModule, RouterModule],
  exports: [FormsModule, CommonModule, ReactiveFormsModule, ClarityModule],
})
export class SharedModule {}
