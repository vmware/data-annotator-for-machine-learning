/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserAuthService } from 'src/app/services/user-auth.service';
import { Observable } from 'rxjs';
import { EnvironmentsService } from 'src/app/services/environments.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private userAuthService: UserAuthService, private env: EnvironmentsService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.env.config.embedded) {
      if (this.userAuthService.isLoggedIn()) {
        return this.checkRole(state.url);
      } else {
        if (this.env.config.authUrl) {
          this.userAuthService.redirectToLogin();
          return false;
        } else {
          this.router.navigateByUrl('/login/basic');
        }
      }
    }
  }

  checkRole(url) {
    const role = JSON.parse(localStorage.getItem(this.env.config.sessionKey)).user.role;
    if (role && role != '') {
      if (role != 'Power User' && url.includes('permissions')) {
        this.router.navigate(['loop-home']);
        return false;
      }
      return true;
    } else {
      return false;
    }
  }
}
