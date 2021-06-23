/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { EnvironmentsService } from 'app/services/environments.service';

@Component({
  styleUrls: ['./faq.component.scss'],
  templateUrl: './faq.component.html',
})
export class FAQComponent implements OnInit {
  constructor(public env: EnvironmentsService) {}

  ngOnInit() {}
}
