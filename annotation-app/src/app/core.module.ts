/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { JwtModule, JWT_OPTIONS } from '@auth0/angular-jwt';
import { UserAuthService } from '../app/services/user-auth.service';
import { EnvironmentsService } from '../app/services/environments.service';

export function jwtOptionsFactory(authService: UserAuthService, env: EnvironmentsService) {
  return {
    tokenGetter: () => {
      if (authService.loggedUser()) {
        return authService.loggedUser().token ? authService.loggedUser().token.access_token : null;
      }
    },
    whitelistedDomains: [
      `${env.config.annotationService}`.replace(/(http|https):\/\//, ''),
      `${env.config.authUrl}`.replace(/(http|https):\/\//, ''),
    ],
  };
}

@NgModule({
  declarations: [],
  imports: [
    HttpClientModule,
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
        deps: [UserAuthService, EnvironmentsService],
      },
    }),
  ],
  exports: [],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() core: CoreModule) {
    if (core) {
      throw new Error('You should import core module only in the root module');
    }
  }
}
