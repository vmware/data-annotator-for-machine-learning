/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from 'app/services/user-auth.service';
import { User } from '../../model/user';
import { AvaService } from '../../services/ava.service';
import { Incentives } from '../../model/incentives';
import { EnvironmentsService } from 'app/services/environments.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  loggedUser: User = null;
  incentives = Incentives;
  showProjectTab = false;
  showAdminTab = false;
  role: string;
  showDatasetTab = false;
  errMessage: string;

  constructor(
    private router: Router,
    private userAuthService: UserAuthService,
    private avaService: AvaService,
    public env: EnvironmentsService,
  ) {}

  ngOnInit() {
    this.userAuthService.loggedUserListener().subscribe((res) => {
      this.loggedUser = res;
      if (this.loggedUser) {
        this.getUserRole();
      }
    });
  }

  login() {
    if (this.env.config.authUrl) {
      this.userAuthService.redirectToLogin();
    } else {
      this.router.navigate(['basicLogin']);
    }
  }

  logOut() {
    this.userAuthService.logout();
    this.router.navigateByUrl('/home');
  }

  getUserRole() {
    this.avaService.getUserRole().subscribe(
      (userInfo) => {
        if (userInfo) {
          this.errMessage = '';
          this.role = userInfo.role;
          const resNew = JSON.parse(localStorage.getItem(this.env.config.serviceTitle));
          resNew.role = this.role;
          localStorage.setItem(this.env.config.serviceTitle, JSON.stringify(resNew));
          if (this.role == 'Project Owner') {
            this.showProjectTab = true;
            this.showDatasetTab = true;
          }
          if (this.role == 'Admin') {
            this.showProjectTab = true;
            this.showAdminTab = true;
            this.showDatasetTab = true;
          }
        }
      },
      (err) => {
        console.log('getUserRoleErr:::', err);
        this.errMessage =
          'Failed to read the user from the database, please refresh the page and log in later';
      },
    );
  }
}
