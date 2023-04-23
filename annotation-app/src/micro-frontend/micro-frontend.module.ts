/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { AppModule } from '../app/app.module';
import { EntryComponent } from './entry.component';
@NgModule({
  declarations: [EntryComponent],
  imports: [AppModule],
})
export class MicroFrontendModule implements DoBootstrap {
  constructor(private injector: Injector) {}

  ngDoBootstrap(): void {
    const customElement = createCustomElement(EntryComponent, {
      injector: this.injector,
    });
    window.customElements.define('mf-loop-entry', customElement);
    console.log('Registered custom element mf-loop-entry');
  }
}
