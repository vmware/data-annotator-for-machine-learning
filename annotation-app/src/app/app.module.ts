/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from '@clr/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './component/header/header.component';
import { SidenavComponent } from './component/sidenav/sidenav.component';
import { HomeComponent } from './component/home/home.component';
import { CdsIconsService } from './services/cds-icon.service';
import { SharedModule } from './shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from './services/api.service';
import { UserAuthService } from './services/user-auth.service';
import { CoreModule } from './core.module';
import { PageNotFoundComponent } from './component/page-not-found/page-not-found.component';
import { GetElementService } from './services/common/dom.service';
import { UnZipService } from './services/common/up-zip.service';
import { DownloadService } from './services/common/download.service';
import { ToolService } from './services/common/tool.service';
import { MarkdownParserService } from './services/common/markdown-parser.service';
import { CommonService } from './services/common/common.service';
import { S3Service } from './services/common/s3.service';
import { EmailService } from './services/common/email.service';
import { LabelStudioService } from './services/label-studio.service';
import { RouteReuseStrategy } from '@angular/router';
import { ZwRouteReuseStrategy } from './shared/routeReuseStrategy';
import { FAQComponent } from './component/faq/faq.component';
import { InternalApiService } from './services/internal-api.service';

@NgModule({
  declarations: [AppComponent, HeaderComponent, SidenavComponent, HomeComponent, PageNotFoundComponent, FAQComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ClarityModule,
    SharedModule,
    HttpClientModule,
    CoreModule,
  ],
  providers: [
    CdsIconsService,
    ApiService,
    UserAuthService,
    GetElementService,
    UnZipService,
    DownloadService,
    ToolService,
    MarkdownParserService,
    CommonService,
    S3Service,
    EmailService,
    LabelStudioService,
    InternalApiService,
    {
      provide: RouteReuseStrategy,
      useClass: ZwRouteReuseStrategy,
    },
  ],
  exports: [AppComponent],
})
export class AppModule {}
