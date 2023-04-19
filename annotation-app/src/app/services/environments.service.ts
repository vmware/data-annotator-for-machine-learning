/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

declare let gtag: (parameterA: any, parameterB: any, parameterC: any) => void;

@Injectable({
  providedIn: 'root',
})
export class EnvironmentsService {
  private configuration = '${APP_CONFIG}';
  private env: any;
  private nodeEnvironment: string;
  constructor(public router: Router) {
    console.log('LOOP_APP_CONFIG:', this.configuration);
    this.nodeEnvironment =
      this.configuration === '' || this.configuration.startsWith('$') ? '' : `.${this.configuration}`;
    this.env = require('../../environments/environment' + this.nodeEnvironment);
    // Global site tag (gtag.js) - Google Analytics Start
    if (this.configuration == 'prod' && this.env.environment.googleTrackId) {
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          gtag('config', this.env.environment.googleTrackId, {
            page_path: event.urlAfterRedirects,
          });
        }
      });
    }
  }

  get config() {
    return this.env.environment;
  }
}
