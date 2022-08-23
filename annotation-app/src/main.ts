/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import './polyfills.ts';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { AppModule } from './app/';

if (environment.production && environment.googleTrackId) {
  enableProdMode();
  // Global site tag (gtag.js) - Google Analytics
  const tp = `document.getElementById('track').src ='https://www.googletagmanager.com/gtag/js?id=${environment.googleTrackId}';window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());`;
  const script1 = document.createElement('script');
  script1.async = true;
  script1.id = 'track';
  document.head.appendChild(script1);
  const script2 = document.createElement('script');
  script2.innerText = tp;
  document.head.appendChild(script2);
}

platformBrowserDynamic().bootstrapModule(AppModule);
