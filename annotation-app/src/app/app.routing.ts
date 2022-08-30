/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { ModuleWithProviders } from '@angular/compiler/src/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { GameFormComponent } from './components/game-form/game-form.component';
import { AuthenticationComponent } from './components/authentication/authentication.component';
import { AuthGuard } from './guards/auth.guard';
import { ProjectsComponent } from './components/projects/projects.component';
import { AnnotateComponent } from './components/projects/annotate/annotate.component';
import { AdminComponent } from './components/admin/admin.component';
import { CreateNewComponent } from './components/projects/create-project.component';
import { previewProjectsComponent } from './components/projects/preview/preview-projects.component';
import { DatasetsSharingComponent } from './components/datasets-sharing/datasets-sharing.component';
import { MyDatasetsComponent } from './components/my-datasets/my-datasets.component';
import { AppendNewEntriesComponent } from './components/projects/appendNewEntries.component';
import { FAQComponent } from './components/faq/faq.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { LoginComponent } from './components/login/login.component';
import { SSOGuard } from './guards/sso.guard';

export const ROUTES: Routes = [
  {
    path: '',
    canActivate: [SSOGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'game', component: GameFormComponent, canActivate: [AuthGuard] },
      { path: 'login/authenticate', component: LoginComponent, data: { title: 'Login' } },
      { path: 'projects', component: ProjectsComponent, canActivate: [AuthGuard] },
      { path: 'annotate', component: AnnotateComponent, canActivate: [AuthGuard] },
      { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
      { path: 'projects/create/:param', component: CreateNewComponent, canActivate: [AuthGuard] },
      { path: 'projects/preview', component: previewProjectsComponent, canActivate: [AuthGuard] },
      { path: 'admin/preview', component: previewProjectsComponent, canActivate: [AuthGuard] },
      { path: 'datasets', component: DatasetsSharingComponent, canActivate: [AuthGuard] },
      { path: 'myDatasets', component: MyDatasetsComponent, canActivate: [AuthGuard] },
      { path: 'appendNewEntries', component: AppendNewEntriesComponent, canActivate: [AuthGuard] },
      { path: 'faq', component: FAQComponent },
      {
        path: 'basicLogin',
        loadChildren: () =>
          import('./components/open-source/openSource.module').then((m) => m.OpenSourceModule),
      },
      { path: '404', component: PageNotFoundComponent },
      { path: '**', redirectTo: '404' },
    ],
  },
];

export const ROUTING: ModuleWithProviders = RouterModule.forRoot(ROUTES);
