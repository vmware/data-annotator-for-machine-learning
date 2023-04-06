/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { DatasetValidator } from '../../../shared/form-validators/dataset-validator';
import { UnZipService } from 'src/app/services/common/up-zip.service';

import * as _ from 'lodash';
const YAML = require('js-yaml');

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss'],
})
export class UploadFileComponent implements OnInit, OnChanges {
  @Input() msg: any;
  @Output('outFile') outFileEmitter = new EventEmitter();
  files: any[] = [];
  uploadFile: FormGroup;
  errorMessage;
  treeContent: any;

  constructor(
    private formBuilder: FormBuilder,
    private unZipService: UnZipService,
    public env: EnvironmentsService,
    private apiService: ApiService,
  ) {}

  ngOnChanges() {
    if (this.uploadFile && this.uploadFile.get('localFile').value) {
      this.errorMessage = '';
      if (this.env.config.enableAWSS3 && this.msg.page !== 'defineLabels') {
        this.uploadFile
          .get('localFile')
          .setValidators([DatasetValidator.localFile(this.msg.type, this.env.config.enableAWSS3, false)]);
        this.uploadFile.get('localFile').updateValueAndValidity();
        // to check log zip whether has txt and outer file
        this.validIsTxtInLog(this.files[0]).then((res) => {
          this.isOutFile();
        });
      }

      // for os upload file need first check file duplicate then valid file format
      if (!this.env.config.enableAWSS3 && this.files.length > 0 && this.msg.page !== 'defineLabels') {
        this.checkLocalFileExist(this.files[0].name, this.msg.type);
      }

      if (this.msg.page === 'defineLabels') {
        // for upload label file only need check file format
        this.uploadFile
          .get('localFile')
          .setValidators([DatasetValidator.localLabelFile(this.msg.type, this.uploadFile.get('localFile').value)]);
        if (!this.uploadFile.invalid) {
          this.uploadLabelFile();
        }
      }
    }
  }

  ngOnInit(): void {
    this.uploadFile = this.formBuilder.group({
      localFile: [null, [DatasetValidator.localFile(this.msg.type, this.env.config.enableAWSS3, false)]],
    });
  }

  /**
   * on file drop handler
   */
  onFileDropped($event) {
    this.prepareFilesList($event);
  }

  /**
   * handle file from browsing
   */
  fileBrowseHandler(files) {
    this.prepareFilesList(files);
  }

  deleteFile(index) {
    this.files.splice(index, 1);
    this.uploadFile.get('localFile').reset();
    this.errorMessage = '';
    this.outFileEmitter.emit(false);
  }

  /**
   * Simulate the upload process
   */
  uploadFilesSimulator(index: number) {
    setTimeout(() => {
      if (index === this.files.length) {
        return;
      } else {
        const progressInterval = setInterval(() => {
          if (this.files.length > 0) {
            if (this.files[index].progress === 100) {
              clearInterval(progressInterval);
              this.uploadFilesSimulator(index + 1);
              if (this.msg.page !== 'defineLabels') {
                this.isOutFile();
              } else {
                this.outFileEmitter.emit(this.treeContent);
                this.errorMessage = '';
              }
            } else {
              this.files[index].progress += 5;
            }
          }
        }, 200);
      }
    }, 1000);
  }

  checkLocalFileExist(filename, type) {
    this.apiService.checkLocalFileExist(filename).subscribe((res) => {
      if (res) {
        this.uploadFile
          .get('localFile')
          .setValidators([DatasetValidator.localFile(type, this.env.config.enableAWSS3, true)]);
      } else {
        this.uploadFile
          .get('localFile')
          .setValidators([DatasetValidator.localFile(type, this.env.config.enableAWSS3, false)]);
      }
      this.uploadFile.get('localFile').updateValueAndValidity();
      // to check log zip whether has txt and outer file
      this.validIsTxtInLog(this.files[0]).then((res) => {
        this.isOutFile();
      });
    });
  }

  prepareFilesList(files: Array<any>) {
    for (const item of files) {
      item.progress = 0;
      this.files.push(item);
    }
    this.uploadFile.get('localFile').setValue(this.files[0]);
    if (this.env.config.enableAWSS3 && this.msg.page !== 'defineLabels') {
      this.uploadFile
        .get('localFile')
        .setValidators([DatasetValidator.localFile(this.msg.type, this.env.config.enableAWSS3, false)]);
      this.uploadFile.get('localFile').updateValueAndValidity();
    }
    if (!this.env.config.enableAWSS3 && this.msg.page !== 'defineLabels') {
      this.checkLocalFileExist(this.files[0].name, this.msg.type);
    }
    if (this.msg.page == 'defineLabels') {
      this.uploadFile
        .get('localFile')
        .setValidators(DatasetValidator.localLabelFile(this.msg.type, this.uploadFile.get('localFile').value));
      this.uploadFile.get('localFile').updateValueAndValidity();
      this.uploadLabelFile();
    } else {
      // if log zip has no txt in should not run the progress bar out emit file
      this.validIsTxtInLog(this.files[0]).then((res) => {
        if (res) {
          setTimeout(() => {
            if (!this.uploadFile.invalid && !this.errorMessage) {
              this.uploadFilesSimulator(0);
            }
          }, 1000);
        }
      });
    }
  }

  formatBytes(bytes, decimals?) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  isOutFile() {
    if (
      this.uploadFile &&
      !this.uploadFile.invalid &&
      this.files.length > 0 &&
      this.files[0].progress &&
      !this.errorMessage
    ) {
      this.outFileEmitter.emit(this.files[0]);
    } else {
      this.outFileEmitter.emit(false);
    }
  }

  uploadLabelFile() {
    const fileread = new FileReader();
    const _this = this;
    fileread.onload = () => {
      _this.isOutTaxonomyLabel(fileread.result);
    };
    fileread.readAsText(this.files[0]);
  }

  isOutTaxonomyLabel(content: any) {
    let result;
    try {
      if (this.msg.type === 'yaml') {
        result = YAML.load(content);
      } else {
        result = JSON.parse(content);
      }
    } catch (e) {
      this.errorMessage = 'The file format is incorrect, Please check it.';
      return false;
    }
    let name_same_err = false;
    let name_err_flag = false;
    const recursionLabel = (datas: any) => {
      let itemArr = [];
      for (let index = 0; index < datas.length; index++) {
        let item = datas[index];
        if (item.name.includes('.')) {
          name_err_flag = true;
        }
        itemArr.push(item.name);
        if (item.children && item.children.length) {
          recursionLabel(item.children);
        }
      }
      if (itemArr.length !== _.uniq(itemArr).length) {
        name_same_err = true;
      }
    };
    try {
      if (result) {
        recursionLabel(result.data);
      }
    } catch (e) {
      this.errorMessage = 'The file format is incorrect, Please check it.';
      return false;
    }
    if (name_err_flag) {
      this.errorMessage = 'Node name cannot contain points.';
      return false;
    }

    if (name_same_err) {
      this.errorMessage = 'Node names at the same tier cannot be the same.';
      return false;
    }
    //if the json file is ok then run the progress bar and later show the tree
    this.treeContent = result;
    this.uploadFilesSimulator(0);
  }

  validIsTxtInLog(file) {
    return new Promise((resolve, reject) => {
      if (this.msg.type == 'txt' || this.msg.type == 'log') {
        if (file.name.split('.').pop().toLowerCase() == 'zip') {
          this.unZipService.unZipTxt(file).then((e) => {
            if (e.exampleEntries === 0) {
              this.errorMessage =
                'Upload datasets failed, please make sure there has at least one txt type file in the zip/tgz.';
              resolve(false);
            } else {
              this.errorMessage = '';
              resolve(true);
            }
          });
        } else {
          this.unZipService.unTgz(file).then((e) => {
            if (e.exampleEntries === 0) {
              this.errorMessage =
                'Upload datasets failed, please make sure there has at least one txt type file in the zip/tgz.';
              resolve(false);
            } else {
              this.errorMessage = '';
              resolve(true);
            }
          });
        }
      } else {
        this.errorMessage = '';
        resolve(true);
      }
    });
  }
}
