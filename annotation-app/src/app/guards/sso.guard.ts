/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserAuthService } from 'app/services/user-auth.service';

@Injectable({ providedIn: 'root' })
export class SSOGuard implements CanActivate {
  constructor(private userAuthService: UserAuthService) { }

  canActivate(
    route: ActivatedRouteSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    const sso = route.queryParams['sso'];
    if (!this.userAuthService.isLoggedIn() && sso === 'true') {
      this.userAuthService.redirectToLogin();
    }
    return true;
  }
}
