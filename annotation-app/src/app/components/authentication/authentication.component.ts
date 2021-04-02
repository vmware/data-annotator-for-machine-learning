/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { UserAuthService } from 'app/services/user-auth.service';
import { map, mergeMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User } from '../../model/user';
import { EnvironmentsService } from 'app/services/environments.service';

@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.component.html',
  styles: [`
    .filter-artifacts {
      text-align: right;
    }
  `],
})
export class AuthenticationComponent implements OnInit {

  returnUrl: string;
  loggedUser: User = null;
  loading: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userAuthService: UserAuthService,
    private location: Location,
    private env: EnvironmentsService,

  ) { }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.loading = true;
    this.route.queryParams.pipe(
      map(params => params),
      mergeMap((data: any) => {
        const code = data['code'];
        const state = data['state'];
        if (state !== this.env.config.STATE) {
          return Observable.throw("Wrong state...");
        }
        let redirectUrl = window.location.origin + this.location.prepareExternalUrl(this.env.config.redirectUrl);
        return this.userAuthService.loging(code, this.env.config.CLIENT_ID, redirectUrl);
      }))
      .subscribe(
        data => {
          this.loading = false;
          this.router.navigate([this.returnUrl]);
        },
        error => {
          this.loading = false;
          this.router.navigate(['/home']);
        },
        () => {
          this.loading = false;
        },
      );
  }
}
