/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FAQComponent } from './component/faq/faq.component';
import { HomeComponent } from './component/home/home.component';
import { PageNotFoundComponent } from './component/page-not-found/page-not-found.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'loop-home', pathMatch: 'full' },
  { path: 'loop-home', component: HomeComponent },
  {
    path: 'login',
    loadChildren: () => import('./component/login/login.module').then((m) => m.LoginsModule),
  },
  {
    path: 'loop/datasets',
    loadChildren: () => import('./component/datasets/datasets.module').then((m) => m.DatasetsModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'loop/project',
    loadChildren: () => import('./component/projects/projects.module').then((m) => m.ProjectsModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'loop/permissions',
    loadChildren: () => import('./component/permission/permissions.module').then((m) => m.PermissionsModule),
  },
  { path: 'loop/faq', component: FAQComponent },
  { path: '404', component: PageNotFoundComponent },
  { path: '**', redirectTo: '404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
