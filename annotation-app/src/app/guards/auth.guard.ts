/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserAuthService } from 'app/services/user-auth.service';
import { Observable } from 'rxjs';
import { EnvironmentsService } from 'app/services/environments.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private userAuthService: UserAuthService,
    private env: EnvironmentsService,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (this.userAuthService.isLoggedIn()) {
      return this.checkRole(state.url);
    } else {
      if (this.env.config.authUrl) {
        this.userAuthService.redirectToLogin();
        return false;
      } else {
        this.router.navigate(['basicLogin']);
      }
    }
  }

  checkRole(url) {
    const role = JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).role;
    if (role && role != '') {
      if (
        role == 'Annotator' &&
        (url.includes('projects') ||
          url.includes('admin') ||
          url.includes('myDatasets') ||
          url.includes('appendNewEntries'))
      ) {
        this.router.navigate(['home']);
        return false;
      }
      if (role == 'Project Owner' && url.includes('admin')) {
        this.router.navigate(['home']);
        return false;
      }
      return true;
    } else {
      return false;
    }
  }
}
