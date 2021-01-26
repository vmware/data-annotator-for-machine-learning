/*
Copyright 2019-2021 VMware, Inc.
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
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  loggedUser: User = null;
  incentives = Incentives;
  showProjectTab = false;
  showAdminTab = false;
  role: string;
  showDatasetTab = false;
  isVisible: boolean;

  constructor(
    private router: Router,
    private userAuthService: UserAuthService,
    private avaService: AvaService,
    public env: EnvironmentsService,

  ) {
    this.isVisible = false;
  }


  ngOnInit() {
    this.userAuthService.loggedUserListener().subscribe(res => {
      this.loggedUser = res;
      if (this.loggedUser) {
        this.getUserRole();
      }
    });
  }


  login() {
    if (this.env.config.authUrl && this.env.config.authUrl != '') {
      this.userAuthService.redirectToLogin();
    } else {
      this.router.navigate(['basicLogin'])
    }
  }


  logOut() {
    this.userAuthService.logout();
    this.router.navigateByUrl('/home');
  }


  reLogOut() {
    this.isVisible = false;
    this.logOut();
  }


  reLogin() {
    this.isVisible = false;
    this.login();
  };


  getUserRole() {
    this.avaService.getUserRole().subscribe(userInfo => {
      if (userInfo) {
        this.role = userInfo.role;
        let resNew = JSON.parse(localStorage.getItem(this.env.config.USER_KEY));
        resNew.role = this.role;
        localStorage.setItem(this.env.config.USER_KEY, JSON.stringify(resNew));
        // this.handleRole.handler.next(this.role);
        if (this.role == 'Project Owner') {
          this.showProjectTab = true;
          this.showDatasetTab = true;
        };
        if (this.role == 'Admin') {
          this.showProjectTab = true;
          this.showAdminTab = true;
          this.showDatasetTab = true;
        };
      }
    })
  }


}
