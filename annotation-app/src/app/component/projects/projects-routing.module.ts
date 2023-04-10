/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateProjectComponent } from './create-project/create-project.component';
import { ProjectAnalyzeComponent } from './project-analyze/project-analyze.component';
import { ProjectsComponent } from './labeling-task-list/projects.component';

const routes: Routes = [
  {
    path: 'list',
    component: ProjectsComponent,
    data: {
      title: 'loopProjectList',
    },
  },
  {
    path: 'create',
    component: CreateProjectComponent,
    data: {
      title: 'loopProjectCreate',
    },
  },
  {
    path: 'analyze',
    component: ProjectAnalyzeComponent,
    data: {
      title: 'loopProjectAnalyze',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  declarations: [],
})
export class ProjectsRoutingModule {}
