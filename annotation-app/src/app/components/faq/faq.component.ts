/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component } from '@angular/core';
import { EnvironmentsService } from 'app/services/environments.service';
@Component({
  styleUrls: ['./faq.component.scss'],
  templateUrl: './faq.component.html',
})
export class FAQComponent {
  constructor(public env: EnvironmentsService) {}
}
