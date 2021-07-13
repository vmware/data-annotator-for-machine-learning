/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UserAuthService } from '../../../services/user-auth.service';
import { AvaService } from '../../../services/ava.service';
import { DownloadService } from 'app/services/common/download.service';

@Component({
  selector: 'app-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.scss'],
})
export class DownloadComponent implements OnInit {
  @Input() msg: any;

  @Output('onCloseDownloadDialog')
  onCloseDownloadDialogEmitter = new EventEmitter();

  @Output() generateDownloadProject = new EventEmitter();

  user: any;
  loading = false;
  errorMessage = '';
  infoMessage = '';
  format = '';
  loadingGenerate = false;
  loadingDownload = false;
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

  onCloseDownloadDialog() {
    this.onCloseDownloadDialogEmitter.emit();
  }

  downloadOriginal(urls) {
    this.downloadService.downloadMultiple(urls);
  }

  downloadProject(url) {
    this.loading = false;
    this.downloadService.downloadFile(url);
    // let backend know download
    if (this.msg.src == 'community') {
      this.loadingDownload = true;
      const param = {
        pid: this.msg.id,
        src: 'community',
      };
      this.avaService.communityDownload(param).subscribe(
        (res) => {
          this.onCloseDownloadDialogEmitter.emit('communityDownload');
        },
        (error: any) => {
          console.log(error);
        },
      );
    } else {
      this.onCloseDownloadDialogEmitter.emit();
    }
  }

  generateProject() {
    this.loadingGenerate = true;
    for (let i = 0; i < this.msg.datasets.length; i++) {
      if (this.msg.datasets[i].id == this.msg.id) {
        this.msg.datasets[i].generateInfo.status = 'generating';
      }
    }
    this.avaService
      .generate(this.msg.id, this.format, this.msg.src, this.onlyLabelled ? 'Yes' : 'No')
      .subscribe(
        (res) => {
          res.Modal = 'generateDownload';
          this.generateDownloadProject.emit(res);
        },
        (error: any) => {
          console.log(error);
          this.loading = false;
        },
      );
  }

  removeUnlabel(e) {
    this.onlyLabelled = e.target.checked;
  }
}
