/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { DevPlatformModule } from './dev-platform/dev-platform.module';
import { environment } from './environments/environment';
import { MicroFrontendModule } from './micro-frontend/micro-frontend.module';
import { enableProdMode } from '@angular/core';

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

const bootstrapModule = environment.embedded ? MicroFrontendModule : DevPlatformModule;

platformBrowserDynamic()
  .bootstrapModule(bootstrapModule)
  .catch((err) => console.error('platformBrowserDynamic:::', err));
