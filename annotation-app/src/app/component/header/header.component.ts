/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit } from '@angular/core';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { Router } from '@angular/router';
import { UserAuthService } from 'src/app/services/user-auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  loggedUser;
  errMessage: string;
  role: string;

  constructor(private router: Router, private userAuthService: UserAuthService, public env: EnvironmentsService) {}

  ngOnInit(): void {
    if (!this.env.config.embedded) {
      this.userAuthService.loggedUserListener().subscribe((res) => {
        if (res) {
          this.loggedUser = res;
        }
      });
    }
  }

  login() {
    if (!this.env.config.embedded) {
      if (this.env.config.authUrl) {
        this.userAuthService.redirectToLogin();
      } else {
        this.router.navigateByUrl('/login/basic');
      }
    }
  }

  logOut() {
    this.userAuthService.logout();
    this.router.navigateByUrl('/loop-home');
  }
}
