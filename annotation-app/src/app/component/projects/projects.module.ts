/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { ProjectsRoutingModule } from './projects-routing.module';
import { GenerateComponent } from './generate/generate.component';
import { DownloadComponent } from './download/download.component';
import { TreeviewModalComponent } from './treeview-modal/treeview-modal.component';
import { CdsIconsService } from 'src/app/services/cds-icon.service';
import { CreateProjectComponent } from './create-project/create-project.component';
import { ProjectsComponent } from './labeling-task-list/projects.component';
import { ProjectAnalyzeComponent } from './project-analyze/project-analyze.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { AnnotateProgressBoardComponent } from './annotate-progress-board/annotate-progress-board.component';
import { LabelStudioService } from 'src/app/services/label-studio.service';
import { LatestAnnotationDataComponent } from './project-analyze/latest-annotation-data/latest-annotation-data.component';
import { UserCategoryD3Component } from './project-analyze/user-category-d3/user-category-d3.component';
import { AppendComponent } from './project-analyze/append/append.component';
import { EditProjectComponent } from './labeling-task-list/edit-project/edit-project.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { TaskDatagridComponent } from './labeling-task-list/task-datagrid/task-datagrid.component';

@NgModule({
  declarations: [
    GenerateComponent,
    DownloadComponent,
    TreeviewModalComponent,
    CreateProjectComponent,
    ProjectsComponent,
    ProjectAnalyzeComponent,
    AnnotateProgressBoardComponent,
    LatestAnnotationDataComponent,
    UserCategoryD3Component,
    AppendComponent,
    EditProjectComponent,
    TaskDatagridComponent,
  ],
  imports: [CommonModule, ProjectsRoutingModule, SharedModule, NgxSliderModule, NgSelectModule],
  providers: [CdsIconsService, LabelStudioService],
  exports: [GenerateComponent, DownloadComponent, TreeviewModalComponent],
})
export class ProjectsModule {}
