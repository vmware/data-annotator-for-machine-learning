/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UserAuthService } from '../../../services/user-auth.service';
import { ApiService } from '../../../services/api.service';
import { DownloadService } from 'src/app/services/common/download.service';

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
    private apiService: ApiService,
    private userAuthService: UserAuthService,
    private downloadService: DownloadService,
  ) {
    this.user = this.userAuthService.loggedUser().user.email;
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
      this.apiService.communityDownload(param).subscribe(
        (res) => {
          this.onCloseDownloadDialogEmitter.emit('communityDownload');
        },
        (error: any) => {},
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
    this.apiService.generate(this.msg.id, this.format, this.msg.src, this.onlyLabelled ? 'Yes' : 'No').subscribe(
      (res) => {
        res.Modal = 'generateDownload';
        this.generateDownloadProject.emit(res);
      },
      (error: any) => {
        this.loading = false;
      },
    );
  }

  removeUnlabel(e) {
    this.onlyLabelled = e.target.checked;
  }
}
