/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UserAuthService } from '../../../services/user-auth.service';
import { AvaService } from '../../../services/ava.service';
import { DownloadService } from 'app/services/common/download.service';

@Component({
  selector: 'app-generate',
  templateUrl: './generate.component.html',
  styleUrls: ['./generate.component.scss'],
})
export class GenerateComponent implements OnInit {
  @Input() msg: any;

  @Output('onCloseGenerateDialog')
  onCloseGenerateDialogEmitter = new EventEmitter();

  @Output() private refreshProject = new EventEmitter<any>();

  user: any;
  loading = false;
  errorMessage = '';
  infoMessage = '';
  format = '';
  loadingGenerate = false;
  onlyLabelled = true;

  constructor(
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private downloadService: DownloadService,
  ) {
    this.user = this.userAuthService.loggedUser().email;
  }

  ngOnInit() {
    this.format = 'standard';
  }

  onCloseGenerateDialog() {
    this.onCloseGenerateDialogEmitter.emit();
  }

  generateNewProject() {
    this.loadingGenerate = true;
    this.avaService
      .generate(this.msg.id, this.format, this.msg.src, this.onlyLabelled ? 'Yes' : 'No')
      .subscribe(
        (res) => {
          res.Modal = 'generate';
          this.refreshProject.emit(res);
        },
        (error: any) => {
          console.log(error);
          this.loadingGenerate = false;
          this.loading = false;
        },
      );
  }

  removeUnlabel(e) {
    this.onlyLabelled = e.target.checked;
  }

  downloadOriginal(urls) {
    this.downloadService.downloadMultiple(urls);
  }
}
