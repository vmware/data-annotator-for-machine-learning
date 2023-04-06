/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { UserAuthService } from 'src/app/services/user-auth.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent implements OnInit {
  navCollapsible: any;
  index;
  userRole;

  constructor(public env: EnvironmentsService, private userAuthService: UserAuthService) {}

  ngOnInit(): void {
    this.navCollapsible = true;
    if (!this.env.config.embedded) {
      this.userAuthService.loggedUserListener().subscribe((res) => {
        if (res) {
          this.userRole = res.user.role;
        }
      });
    }
  }
}
