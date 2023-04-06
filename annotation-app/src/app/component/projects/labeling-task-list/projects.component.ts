/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { UserAuthService } from 'src/app/services/user-auth.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  user;
  msg;

  constructor(private userAuthService: UserAuthService) {}

  ngOnInit(): void {
    this.user = this.userAuthService.loggedUser().user;
    this.msg = { tab: 'annotate' };
  }

  clickTaskTab(tab) {
    this.msg.tab = tab;
  }

  reload() {
    if (this.msg.tab == 'annotate') {
      this.msg.reload = 'annotate';
    } else {
      this.msg.reload = 'admin';
    }
    this.msg = JSON.parse(JSON.stringify(this.msg));
  }
}
