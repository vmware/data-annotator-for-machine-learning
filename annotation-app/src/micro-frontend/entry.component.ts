/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { Subscription } from 'rxjs';

export interface RouterEvent {
  url: string;
  replaceUrl: boolean;
}

@Component({
  template: '<mf-loop></mf-loop>',
})
export class EntryComponent implements OnChanges, OnDestroy {
  @Input() route?: string;
  @Output() routeChange = new EventEmitter<RouterEvent>();

  private subscription: Subscription;

  constructor(private router: Router) {
    const routingSubscription = this.registerOutgoingRouting();
    this.subscription = routingSubscription;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['route'] && this.route) {
      this.router.navigateByUrl(this.route, { state: { fromPlatform: true } });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private registerOutgoingRouting(): Subscription {
    return this.router.events.subscribe((event) => {
      if (event instanceof RoutesRecognized && (!this.isRouteChangeFromPlatform() || this.isRedirect(event))) {
        this.routeChange.next({
          url: event.urlAfterRedirects,
          replaceUrl: this.isRedirect(event),
        });
      }
    });
  }

  private isRouteChangeFromPlatform(): boolean {
    return this.router.getCurrentNavigation()?.extras?.state?.['fromPlatform'];
  }

  private isRedirect(event: RoutesRecognized): boolean {
    return event.url !== event.urlAfterRedirects;
  }
}
