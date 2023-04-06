/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'mf-dev-platform',
  templateUrl: './dev-platform.component.html',
  styleUrls: ['./dev-platform.component.css'],
})
export class DevPlatformComponent implements OnInit {
  constructor(private router: Router, private titleService: Title) {}

  ngOnInit(): void {
    this.updatePageTitleOnRouteChange();
  }

  private updatePageTitleOnRouteChange() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route: ActivatedRoute = this.router.routerState.root;
          let routeTitle = '';
          while (route!.firstChild) {
            route = route.firstChild;
          }
          if (route.snapshot.data['title']) {
            routeTitle = route!.snapshot.data['title'];
          }
          return routeTitle;
        }),
      )
      .subscribe((title) => {
        if (title) {
          this.titleService.setTitle(`${title} - Microtrains`);
        }
      });
  }
}
