/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { EnvironmentsService } from './services/environments.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  shellUrl: string;
  constructor(private titleService: Title, private env: EnvironmentsService) {}

  ngOnInit() {
    this.shellUrl = this.env.config.shellUrl;
    this.getTitleInfo();
  }

  getTitleInfo() {
    this.titleService.setTitle(this.env.config.serviceTitle);
  }
}
