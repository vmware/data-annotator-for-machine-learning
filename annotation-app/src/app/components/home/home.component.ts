/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { UserAuthService } from '../../services/user-auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EnvironmentsService } from 'app/services/environments.service';

@Component({
  styleUrls: ['./home.component.scss'],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userAuthService: UserAuthService,
    public env: EnvironmentsService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const isUserLandingFromOutside = !params['hash'] || String(params['hash']).length == 0;
      if (isUserLandingFromOutside) {
        const user = this.userAuthService.loggedUser();
        if (user && user.points > 0) {
          this.router.navigate(['game']);
        }
      }
    });
  }
}
