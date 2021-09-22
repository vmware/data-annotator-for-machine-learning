/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { of, Subject, Subscription } from 'rxjs';
import { UserAuthService } from '../../services/user-auth.service';
import { AvaService } from '../../services/ava.service';
import { QueryDatasetData, DatasetUtil, UploadData } from '../../model/index';
import { FormValidatorUtil } from '../../shared/form-validators/form-validator-util';
import { DatasetValidator } from '../../shared/form-validators/dataset-validator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Papa } from 'ngx-papaparse';
import * as _ from 'lodash';
import { EnvironmentsService } from 'app/services/environments.service';
import { UnZipService } from 'app/services/common/up-zip.service';
import { S3Service } from 'app/services/common/s3.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
})
export class UploadComponent implements OnInit {
  @Input()
  dataset: QueryDatasetData;

  @Input() msg: any;

  @Output('onCloseDialog')
  onCloseDialogEmitter = new EventEmitter();

  @Output('uploadSuccess')
  uploadSuccessEmitter = new EventEmitter();

  @Output('errorMessage')
  errorMessageEmitter = new EventEmitter();

  user: any;
  uploadGroup: FormGroup;
  loading = false;
  nameExist: boolean;
  errorMessage = '';
  infoMessage = '';
  userQuestionUpdate = new Subject<string>();
  uploadSet: UploadData;
  showAddNewDatasetDialog = false;
  parseErrorTip = false;
  parseError: any;
  inputFile: any;
  uploadComplete = false;
  previewHeadDatas: any = [];
  previewContentDatas: any = [];
  waitingTip = false;
  errorMessageTop: string;
  columnInfo: any = [];
  flagSubscription: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private papa: Papa,
    public env: EnvironmentsService,
    private unZipService: UnZipService,
    private s3Service: S3Service,
  ) {
    this.userQuestionUpdate.pipe(debounceTime(400), distinctUntilChanged()).subscribe((value) => {
      if (value != '') {
        this.checkName(value);
      } else {
        this.nameExist = false;
      }
    });
  }

  ngOnInit() {
    this.user = this.userAuthService.loggedUser().email;
    this.createUploadForm();
  }

  onKeydown(e) {
    e.stopPropagation();
  }

  createUploadForm(): void {
    if (!this.uploadSet) {
      this.uploadSet = DatasetUtil.uploadInit();
    }
    if (this.msg.page == 'datasets') {
      this.uploadSet.fileFormat = 'csv';
    } else if (this.msg.page == 'create') {
      if (this.msg.type == 'tabular') {
        this.uploadSet.fileFormat = 'tabular';
      } else if (this.msg.type == 'text' || this.msg.type == 'ner') {
        this.uploadSet.fileFormat = 'csv';
      } else if (this.msg.type == 'image') {
        this.uploadSet.fileFormat = 'image';
      } else if (this.msg.type == 'log') {
        this.uploadSet.fileFormat = 'txt';
      }
    }
    this.uploadGroup = this.formBuilder.group({
      datasetsName: ['', DatasetValidator.modelName()],
      localFile: [
        null,
        DatasetValidator.localFile(this.msg.type, this.env.config.enableAWSS3, false),
      ],
      hasHeader: [this.uploadSet.hasHeader, ''],
      fileFormat: [this.uploadSet.fileFormat, ''],
    });
  }

  onCloseDialog() {
    this.onCloseDialogEmitter.emit();
  }

  buildFormModel(): any {
    return JSON.parse(JSON.stringify(this.uploadGroup.value));
  }

  onAddingDataset(event) {
    this.showAddNewDatasetDialog = true;
    this.parseErrorTip = false;
  }

  onLocalFileChange(event) {
    if (event.target.files.length > 0) {
      this.inputFile = event.target.files[0];
      this.errorMessage = '';
      this.previewHeadDatas = [];
      this.previewContentDatas = [];
      if (!this.env.config.enableAWSS3) {
        this.checkLocalFileExist(this.inputFile.name, this.uploadSet.fileFormat);
      }
    }
  }

  checkLocalFileExist(filename, type) {
    this.avaService.checkLocalFileExist(filename).subscribe((res) => {
      if (res) {
        this.uploadGroup
          .get('localFile')
          .setValidators(DatasetValidator.localFile(type, this.env.config.enableAWSS3, true));
      } else {
        this.uploadGroup
          .get('localFile')
          .setValidators(DatasetValidator.localFile(type, this.env.config.enableAWSS3, false));
      }
      this.uploadGroup.get('localFile').updateValueAndValidity();
    });
  }

  papaParse() {
    const previewData = [];
    const hasHeader = this.uploadGroup.get('hasHeader').value;
    if (this.inputFile) {
      return new Promise((resolve, reject) => {
        this.papa.parse(this.inputFile, {
          header: false,
          preview: 20,
          dynamicTyping: true,
          skipEmptyLines: true,
          error: (error) => {
            console.log('parse_error: ', error);
          },
          step: (results, parser) => {
            if (
              !(_.sortedUniq(results.data).length == 1 && _.sortedUniq(results.data)[0] == null)
            ) {
              previewData.push(results.data);
            }
            if (previewData.length < 7) {
              this.previewHeadDatas = [];
              if (hasHeader == 'yes') {
                this.previewHeadDatas = previewData[0];
                this.previewContentDatas = previewData.slice(1, 6);
                resolve(null);
              } else {
                for (let i = 0; i < previewData[0].length; i++) {
                  this.previewHeadDatas.push('Header' + i);
                }
                this.previewContentDatas = previewData.slice(0, 5);
                resolve(null);
              }
            }
          },
        });
      });
    }
  }

  updateDatasets(data) {
    if (data) {
      const formData = new FormData();
      let params;
      const uploadFormat = this.uploadGroup.get('fileFormat').value;
      if (uploadFormat == 'image') {
        formData.append('dsname', this.uploadGroup.get('datasetsName').value);
        formData.append('fileName', this.inputFile.name);
        formData.append('fileSize', this.inputFile.size);
        formData.append('format', uploadFormat);
        if (this.env.config.enableAWSS3) {
          formData.append('images', JSON.stringify(data));
        } else {
          formData.append('file', this.inputFile);
        }
      } else {
        if (this.env.config.enableAWSS3) {
          params = {
            dsname: this.uploadGroup.get('datasetsName').value,
            fileName: this.inputFile.name,
            fileSize: this.inputFile.size,
            format: uploadFormat,
            fileKey: data.key,
            location: data.key,
          };
        } else {
          formData.append('dsname', this.uploadGroup.get('datasetsName').value);
          formData.append('fileName', this.inputFile.name);
          formData.append('fileSize', this.inputFile.size);
          formData.append('format', uploadFormat);
          formData.append('file', this.inputFile);
        }
        if (uploadFormat == 'txt') {
          const topReview = [];
          this.previewContentDatas.previewExample.forEach((element) => {
            topReview.push({
              fileName: element.name,
              fileSize: element.size,
              fileContent: element.content.slice(0, 501),
            });
          });
          if (this.env.config.enableAWSS3) {
            params['topReview'] = topReview;
            params['totalRows'] = this.previewContentDatas.exampleEntries;
          } else {
            formData.append('topReview', JSON.stringify(topReview));
            formData.append('totalRows', this.previewContentDatas.exampleEntries);
          }
        } else {
          if (this.env.config.enableAWSS3) {
            params['hasHeader'] = this.uploadGroup.get('hasHeader').value;
            params['topReview'] = {
              header: this.previewHeadDatas,
              topRows: this.previewContentDatas,
            };
          } else {
            formData.append('hasHeader', this.uploadGroup.get('hasHeader').value);
            formData.append(
              'topReview',
              JSON.stringify({ header: this.previewHeadDatas, topRows: this.previewContentDatas }),
            );
          }
        }
      }
      this.toPostDatasets(uploadFormat, formData, params);
    } else {
      this.errorMessage = 'Upload failed, please try again later.';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
    }
  }

  toPostDatasets(uploadFormat, formData, params) {
    let postData;
    if (this.env.config.enableAWSS3) {
      uploadFormat == 'image' ? (postData = formData) : (postData = params);
    } else {
      postData = formData;
    }
    this.avaService.uploadDateset(postData).subscribe(
      (res) => {
        const params = {
          dataSetName: this.uploadGroup.get('datasetsName').value,
          isShowSetHeader: res.format,
          previewHeadDatas:
            uploadFormat == 'image'
              ? ['Id', 'ImageName', 'ImageSize(KB)', 'Image']
              : uploadFormat == 'txt'
              ? ['FileName', 'FileContent']
              : this.previewHeadDatas,
          previewContentDatas:
            uploadFormat == 'image' || uploadFormat == 'txt'
              ? res.topReview
              : this.previewContentDatas,
          chooseLabel:
            uploadFormat == 'image' || uploadFormat == 'txt' ? null : this.previewHeadDatas,
          columnInfo: uploadFormat == 'image' || uploadFormat == 'txt' ? null : res.columnInfo,
          dataSetId: res.id,
          isHasHeader: uploadFormat == 'image' || uploadFormat == 'txt' ? null : res.hasHeader,
          fileName: res.fileName,
          fileSize: res.fileSize,
          location: uploadFormat == 'image' ? null : res.location,
          images: uploadFormat == 'image' ? res.images : null,
          totalRows: uploadFormat == 'txt' ? res.totalRows : null,
        };
        this.uploadSuccessEmitter.emit(params);
        this.showAddNewDatasetDialog = false;
        this.waitingTip = false;
        this.uploadComplete = false;
        this.infoMessage = 'Upload success.';
        this.inputFile = null;
        this.nameExist = false;
        this.uploadGroup.get('localFile').reset();
        this.uploadGroup.get('datasetsName').reset();
        setTimeout(() => {
          this.infoMessage = '';
        }, 3000);
      },
      (error) => {
        console.log('Error:', error);
        this.errorMessageTop = JSON.stringify(error);
        this.errorMessageEmitter.emit(this.errorMessageTop);
        this.uploadComplete = false;
        this.inputFile = null;
      },
    );
  }

  uploadToS3(file) {
    this.s3Service.uploadToS3(file, this.uploadSet.fileFormat, 'zip').then((e) => {
      if (e.err) {
        this.uploadErr(e);
      } else {
        this.updateDatasets(e.data);
      }
    });
  }

  saveUpload() {
    this.uploadGroup.get('localFile').setValue(this.inputFile);
    FormValidatorUtil.markControlsAsTouched(this.uploadGroup);
    if (!this.uploadGroup.invalid && this.nameExist == false) {
      if (this.inputFile.size > 104857600 && this.msg.page == 'create') {
        this.errorMessage =
          'File exceeds 100MB. Please use the My Datasets tab for larger dataset upload. Once completed, data will be available in this menu.';
        this.inputFile = null;
        return;
      } else if (this.inputFile.size > this.env.config.fileSize && this.msg.page == 'datasets') {
        const limitFileSize = this.env.config.fileSize >= (1024 * 1024 * 1024)
          ? this.env.config.fileSize / (1024 * 1024 * 1024) + 'GB'
          : this.env.config.fileSize / (1024 * 1024) + 'MB';
        this.errorMessage =
          `File size exceeds the maximum ${limitFileSize}. Please select a new file to upload. `;
        this.inputFile = null;
        return;
      } else {
        this.uploadComplete = true;
        this.inputFile.size < 10485760 ? (this.waitingTip = false) : (this.waitingTip = true);
        if (this.uploadGroup.get('fileFormat').value == 'csv') {
          this.papaParse().then((e) => {
            if (this.env.config.enableAWSS3) {
              this.uploadToS3(this.inputFile);
            } else {
              this.updateDatasets('data');
            }
          });
        } else if (this.uploadGroup.get('fileFormat').value == 'tabular') {
          this.papaParse().then((e) => {
            if (this.env.config.enableAWSS3) {
              this.uploadToS3(this.inputFile);
            } else {
              this.updateDatasets('data');
            }
          });
        } else if (this.uploadGroup.get('fileFormat').value == 'image') {
          if (this.env.config.enableAWSS3) {
            this.unzipImagesToS3();
          } else {
            this.updateDatasets('data');
          }
        } else if (this.uploadGroup.get('fileFormat').value == 'txt') {
          if (this.inputFile.name.split('.').pop().toLowerCase() == 'zip') {
            this.unZipService.unZipTxt(this.inputFile).then((e) => {
              if (e.exampleEntries === 0) {
                this.uploadErr({
                  err: 'Upload datasets failed, please make sure there has at least one txt type file in the zip/tgz.',
                });
                return;
              }
              this.previewContentDatas = e;
              if (this.env.config.enableAWSS3) {
                this.uploadToS3(this.inputFile);
              } else {
                this.updateDatasets('data');
              }
            });
          } else {
            this.unZipService.unTgz(this.inputFile).then((e) => {
              if (e.exampleEntries === 0) {
                this.uploadErr({
                  err: 'Upload datasets failed, please make sure there has at least one txt type file in the zip/tgz.',
                });

                return;
              }
              this.previewContentDatas = e;
              if (this.env.config.enableAWSS3) {
                this.uploadToS3(this.inputFile);
              } else {
                this.updateDatasets('data');
              }
            });
          }
        }
      }
    }
  }

  checkName(e) {
    this.avaService.findDatasetName(e).subscribe((res) => {
      if (res.length != 0) {
        this.nameExist = true;
      } else {
        this.nameExist = false;
      }
    });
  }

  cancelUpload() {
    this.showAddNewDatasetDialog = false;
    this.uploadGroup.get('localFile').reset();
    this.inputFile = null;
    this.uploadComplete = false;
    this.uploadGroup.get('datasetsName').reset();
    this.waitingTip = false;
    this.nameExist = false;
  }

  unzipImagesToS3() {
    this.s3Service.uploadToS3(this.inputFile, 'image', 'zip').then((e) => {
      if (e.err) {
        this.uploadErr(e);
      } else {
        this.updateDatasets(e.data);
      }
    });
  }

  changeFileFormat(e) {
    this.uploadSet.fileFormat = e;
    if (!this.env.config.enableAWSS3 && this.inputFile) {
      this.checkLocalFileExist(this.inputFile.name, e);
    } else {
      this.uploadGroup
        .get('localFile')
        .setValidators(DatasetValidator.localFile(e, this.env.config.enableAWSS3, false));
      this.uploadGroup.get('localFile').updateValueAndValidity();
    }
  }

  uploadErr(e) {
    this.errorMessageTop = e.err;
    this.errorMessageEmitter.emit(this.errorMessageTop);
    this.uploadComplete = true;
    this.showAddNewDatasetDialog = false;
    this.waitingTip = false;
    this.nameExist = false;
    setTimeout(() => {
      this.errorMessageTop = '';
      this.errorMessageEmitter.emit(this.errorMessageTop);
    }, 5000);
  }
}
