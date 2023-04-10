/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { UserAuthService } from 'src/app/services/user-auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  unsubscribe: boolean;
  isUnsubscribe: boolean;

  constructor(
    private route: ActivatedRoute,
    private userAuthService: UserAuthService,
    public env: EnvironmentsService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const isUserLandingFromOutside = !params['hash'] || String(params['hash']).length == 0;
      if (params['o'] == 'email') {
        this.isUnsubscribe = true;
        this.unsubscribe = String(params['s']) == '1' ? true : false;
      } else {
        this.isUnsubscribe = false;
      }
      // if (isUserLandingFromOutside || this.unsubscribe) {
      //   const user = this.userAuthService.loggedUser().user;
      // }
      if (this.isUnsubscribe) {
        setTimeout(() => {
          this.isUnsubscribe = false;
        }, 10000);
      }
    });
  }
}
