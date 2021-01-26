/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { HomeComponent } from "./components/home/home.component";
import { ClarityModule } from "@clr/angular";
import { ROUTING } from "./app.routing";
import { APP_BASE_HREF } from "@angular/common";

describe('AppComponent', () => {

  let fixture: ComponentFixture<any>;
  let compiled: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        HomeComponent
      ],
      imports: [
        // ClarityModule.forRoot(),
        ROUTING
      ],
      providers: [{ provide: APP_BASE_HREF, useValue: '/' }]
    });

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    compiled = fixture.nativeElement;


  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create the app', async(() => {
    expect(compiled).toBeTruthy();
  }));


});
