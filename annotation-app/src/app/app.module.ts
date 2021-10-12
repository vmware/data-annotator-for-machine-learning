/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { AppComponent } from './app.component';
import { ROUTING } from './app.routing';
import { HomeComponent } from './components/home/home.component';
import { GameFormComponent } from './components/game-form/game-form.component';
import { HeaderComponent } from './components/header/header.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AvaService } from './services/ava.service';
import { UserAuthService } from './services/user-auth.service';
import { AuthenticationComponent } from './components/authentication/authentication.component';
import { AuthGuard } from './guards/auth.guard';
import { FullNamePipe } from './pipes/full-name.pipe';
import { ChartsModule } from 'ng2-charts/ng2-charts';
import { FooterComponent } from './components/footer/footer.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { DropdownPageComponent } from './components/widgets/dropdown-page.component';
import { AnnotateComponent } from './components/projects/annotate/annotate.component';
import { AdminComponent } from './components/admin/admin.component';
import { CreateNewComponent } from './components/projects/create-project.component';
import { CoreModule } from './core.module';
import { previewProjectsComponent } from './components/projects/preview/preview-projects.component';
import { DatasetsSharingComponent } from './components/datasets-sharing/datasets-sharing.component';
import { MyDatasetsComponent } from './components/my-datasets/my-datasets.component';
import { SupercolliderComponent } from './components/projects/supercollider.component';
import { AppendNewEntriesComponent } from './components/projects/appendNewEntries.component';
import { FAQComponent } from './components/faq/faq.component';
import { DownloadComponent } from './components/projects/download/download.component';
import { GenerateComponent } from './components/projects/generate/generate.component';
import { UploadComponent } from './components/upload/upload.component';
import { ToUpperCasePipe } from './pipes/to-upper-case.pipe';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { LoginComponent } from './components/login/login.component';
import { FeedbackService } from './services/feedback.service';
import { EditProjectComponent } from './components/edit-project/edit-project.component';
import { LabelStudioService } from './services/label-studio.service';
import { SharedModule } from './shared/shared.module';
import { GetElementService } from './services/common/dom.service';
import { UnZipService } from './services/common/up-zip.service';
import { DownloadService } from './services/common/download.service';
import { ToolService } from './services/common/tool.service';
import { SliceTextPipe } from './pipes/sliceText.pipe';
import { MathRoundPipe } from './pipes/math-round.pipe';
import { NgSelectModule } from '@ng-select/ng-select';
import { MyFilter } from './shared/clr-filter/datagridFilter.component';
import { MarkdownParserService } from './services/common/markdown-parser.service';
import { CommonService } from './services/common/common.service';
import { S3Service } from './services/common/s3.service';
import { EmailService } from './services/common/email.service';
import { NgxSliderModule } from "@angular-slider/ngx-slider";

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GameFormComponent,
    HeaderComponent,
    AuthenticationComponent,
    FullNamePipe,
    SliceTextPipe,
    MathRoundPipe,
    FooterComponent,
    ProjectsComponent,
    DropdownPageComponent,
    AnnotateComponent,
    AdminComponent,
    CreateNewComponent,
    previewProjectsComponent,
    DatasetsSharingComponent,
    MyDatasetsComponent,
    SupercolliderComponent,
    AppendNewEntriesComponent,
    FAQComponent,
    DownloadComponent,
    GenerateComponent,
    UploadComponent,
    ToUpperCasePipe,
    PageNotFoundComponent,
    LoginComponent,
    EditProjectComponent,
    MyFilter,
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ClarityModule,
    ROUTING,
    ChartsModule,
    CoreModule,
    SharedModule,
    NgSelectModule,
    NgxSliderModule,
  ],
  providers: [
    AvaService,
    UserAuthService,
    AuthGuard,
    FeedbackService,
    LabelStudioService,
    Title,
    GetElementService,
    UnZipService,
    DownloadService,
    ToolService,
    MarkdownParserService,
    CommonService,
    S3Service,
    EmailService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
