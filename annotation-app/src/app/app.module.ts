/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { AppComponent } from './app.component';
import { ROUTING } from "./app.routing";
import { HomeComponent } from "./components/home/home.component";
import { GameFormComponent } from './components/game-form/game-form.component';
import { HeaderComponent } from './components/header/header.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { AvaService } from "./services/ava.service";
import { UserAuthService } from "./services/user-auth.service";
import { AuthenticationComponent } from './components/authentication/authentication.component';
import { AuthGuard } from "./guards/auth.guard";
import { FullNamePipe } from "./pipes/full-name.pipe";
import { ChartsModule } from 'ng2-charts/ng2-charts';
import { FooterComponent } from "./components/footer/footer.component";
import { ProjectsComponent } from "./components/projects/projects.component";
import { DropdownPage } from "./components/widgets/dropdown-page.component";
import { AnnotateComponent } from "./components/projects/annotate/annotate.component";
import { AdminComponent } from "./components/admin/admin.component";
import { CreateNewComponent } from "./components/projects/create-project.component";
import { CoreModule } from "./core.module";
import { previewProjectsComponent } from "./components/projects/preview/preview-projects.component";
import { DatasetsSharingComponent } from "./components/datasets-sharing/datasets-sharing.component";
import { MyDatasetsComponent } from "./components/my-datasets/my-datasets.component";
import { SupercolliderComponent } from "./components/projects/supercollider.component";
import { AppendNewEntriesComponent } from "./components/projects/appendNewEntries.component";
import { FAQComponent } from "./components/faq/faq.component";
import { DownloadComponent } from "./components/projects/download/download.component";
import { GenerateComponent } from "./components/projects/generate/generate.component";
import { FlagComponent } from "./components/game-form/flag/flag.component";
import { UploadComponent } from "./components/upload/upload.component";
import { ToUpperCasePipe } from './pipes/to-upper-case.pipe';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { LoginComponent } from './components/login/login.component';
import { FeedbackService } from "./services/feedback.service";
import { EditProjectComponent } from './components/edit-project/edit-project.component';
import { LabelStudioService } from "./services/label-studio.service";
import { SharedModule } from "./shared/shared.module";
import { GetElementService } from "./services/common/dom.service";
import { UnZipService } from "./services/common/up-zip.service";
import { DownloadService } from "./services/common/download.service";


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GameFormComponent,
    HeaderComponent,
    AuthenticationComponent,
    FullNamePipe,
    FooterComponent,
    ProjectsComponent,
    DropdownPage,
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
    FlagComponent,
    UploadComponent,
    ToUpperCasePipe,
    PageNotFoundComponent,
    LoginComponent,
    EditProjectComponent,

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
    SharedModule

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
    DownloadService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
