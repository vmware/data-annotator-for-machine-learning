/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { UserAuthService } from 'src/app/services/user-auth.service';
import { map, mergeMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { User } from '../../../model/user';
import { EnvironmentsService } from 'src/app/services/environments.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styles: [
    `
      .filter-artifacts {
        text-align: right;
      }
    `,
  ],
})
export class LoginComponent implements OnInit {
  user = { email: '', password: '' };
  returnUrl!: string;
  errorMessage = '';
  authSource?: number;
  loggedUser: User | null = null;
  loading?: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userAuthService: UserAuthService,
    private location: Location,
    private env: EnvironmentsService,
  ) {}

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.loading = true;
    this.route.queryParams
      .pipe(
        map((params) => params),
        mergeMap((data: any) => {
          const code = data['code'];
          const state = data['state'];
          if (state !== this.env.config.STATE) {
            return throwError('Wrong state...');
          }
          const redirectUrl =
            window.location.origin +
            this.location.prepareExternalUrl(this.env.config.redirectUrl ? this.env.config.redirectUrl : '/loop-home');
          return this.userAuthService.loging(code, this.env.config.CLIENT_ID, redirectUrl);
        }),
      )
      .subscribe(
        (data) => {
          this.loading = false;
          this.router.navigate([this.returnUrl]);
        },
        (error) => {
          this.loading = false;
          this.router.navigate(['/loop-home']);
        },
        () => {
          this.loading = false;
        },
      );
  }
}
