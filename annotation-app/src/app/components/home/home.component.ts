/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { UserAuthService } from '../../services/user-auth.service';
import { ActivatedRoute } from '@angular/router';
import { EnvironmentsService } from 'app/services/environments.service';

@Component({
  styleUrls: ['./home.component.scss'],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  unsubscribe: boolean;
  isUnsubscribe: boolean;

  constructor(
    private route: ActivatedRoute,
    private userAuthService: UserAuthService,
    public env: EnvironmentsService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const isUserLandingFromOutside = !params['hash'] || String(params['hash']).length == 0;
      if (params['o'] == 'email') {
        this.isUnsubscribe = true;
        this.unsubscribe = String(params['s']) == '1' ? true : false;
      } else {
        this.isUnsubscribe = false;
      }
      if (isUserLandingFromOutside || this.unsubscribe) {
        const user = this.userAuthService.loggedUser();
      }
      if (this.isUnsubscribe) {
        setTimeout(() => {
          this.isUnsubscribe = false;
        }, 10000);
      }
    });
  }
}
