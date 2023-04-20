/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from 'src/app/services/api.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { DatasetUtil, UploadData } from '../../../model/index';
import { Papa } from 'ngx-papaparse';
import { UnZipService } from 'src/app/services/common/up-zip.service';
import { S3Service } from 'src/app/services/common/s3.service';
import { DatasetValidator } from '../../../shared/form-validators/dataset-validator';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { InternalApiService } from 'src/app/services/internal-api.service';

@Component({
  selector: 'app-create-new-dataset',
  templateUrl: './create-new-dataset.component.html',
  styleUrls: ['./create-new-dataset.component.scss'],
})
export class CreateNewDatasetComponent implements OnInit, OnChanges {
  @Input() msg: any;
  @Input() msgMfe: string;
  @Input() modelType: string;
  @Output('outFormData') outFormDataEmitter = new EventEmitter();
  @Output('outUploadDone') outUploadDoneEmitter = new EventEmitter();

  userInputQueryUpdate = new Subject<string>();
  nameExist: boolean;
  uploadGroup: FormGroup;
  uploadSet: UploadData;
  errorMessage = '';
  previewHeadDatas: any = [];
  previewContentDatas: any = [];
  inputDsname: string;
  dsInitialRow: number;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    public env: EnvironmentsService,
    private papa: Papa,
    private s3Service: S3Service,
    private router: Router,
    private unZipService: UnZipService,
    private location: Location,
    private internalApiService: InternalApiService,
  ) {
    this.userInputQueryUpdate.pipe(debounceTime(250), distinctUntilChanged()).subscribe((value) => {
      value = value.trim();
      if (value != '') {
        this.inputDsname = value;
        this.checkName(value);
      } else {
        this.nameExist = false;
      }
    });
  }

  ngOnChanges() {
    if (this.msg && this.msg?.createDataBtn > 0) {
      this.saveUpload();
    }
  }

  ngOnInit(): void {
    if (this.msg && this.msg.page === 'createDataset') {
      this.msg.type = 'text';
    }
    this.createUploadForm();
    // to listen the form value change
    this.uploadGroup.valueChanges.subscribe((data) => {
      setTimeout(() => {
        if (!this.uploadGroup.invalid && this.nameExist == false) {
          this.outFormDataEmitter.emit(data);
        } else {
          this.outFormDataEmitter.emit(false);
        }
      }, 450);
    });
  }

  createUploadForm(): void {
    if (!this.uploadSet) {
      this.uploadSet = DatasetUtil.uploadInit();
    }
    if (this.msg?.page == 'inst') {
      if (this.modelType === 'Tabular') {
        this.uploadSet.fileFormat = 'tabular';
        this.msg.type = 'tabular';
      } else if (this.modelType === 'Image Classification') {
        this.uploadSet.fileFormat = 'image';
        this.msg.type = 'image';
      } else {
        this.uploadSet.fileFormat = 'csv';
        this.msg.type = 'text';
      }
    } else if (this.msg.page == 'createLabelingTask' || this.msg.page == 'createDataset') {
      if (this.msg.type == 'tabular') {
        this.uploadSet.fileFormat = 'tabular';
      } else if (this.msg.type == 'image') {
        this.uploadSet.fileFormat = 'image';
      } else if (this.msg.type == 'log') {
        this.uploadSet.fileFormat = 'txt';
      } else {
        this.uploadSet.fileFormat = 'csv';
      }
    }
    this.uploadGroup = this.formBuilder.group({
      datasetsName: ['', DatasetValidator.modelName()],
      localFile: [null, DatasetValidator.required()],
      hasHeader: [this.uploadSet.hasHeader, ''],
      fileFormat: [this.uploadSet.fileFormat, ''],
    });
  }
  checkName(e) {
    return new Promise((resolve, reject) => {
      this.apiService.findDatasetName(e).subscribe((res) => {
        if (res.length != 0) {
          this.nameExist = true;
          resolve(true);
        } else {
          this.nameExist = false;
          resolve(false);
        }
      });
    });
  }

  changeFileFormat(e) {
    this.uploadSet.fileFormat = e;
    this.msg = { type: e, page: 'createDataset' };
  }

  receiveFile(file) {
    this.uploadGroup.get('localFile').setValue(file);
  }

  // papaParse() {
  //   const previewData = [];
  //   const hasHeader = this.uploadGroup.get('hasHeader').value === 'yes' ? true : false;
  //   if (this.uploadGroup.get('localFile').value) {
  //     this.unZipService.parseCSVChunk(this.uploadGroup.get('localFile').value, hasHeader, false).then((res) => {
  //       console.log(151, res);
  //       this.previewHeadDatas = res.previewHeadDatas;
  //       this.previewContentDatas = res.topReview;
  //     });
  //     // return new Promise((resolve, reject) => {
  //     //   this.papa.parse(this.uploadGroup.get('localFile').value, {
  //     //     header: false,
  //     //     // preview: 20,
  //     //     dynamicTyping: true,
  //     //     skipEmptyLines: true,
  //     //     error: (error) => {
  //     //       console.log('parse_error: ', error);
  //     //     },
  //     //     step: (results, parser) => {
  //     //       // check csv headers is empty.
  //     //       if (hasHeader === 'yes') {
  //     //         const data = results.data.map((item) => item && String(item).trim());
  //     //         if (_.sortedUniq(data).includes(null) || _.sortedUniq(data).includes('')) {
  //     //           reject(false);
  //     //         }
  //     //       }
  //     //       if (!(_.sortedUniq(results.data).length == 1 && _.sortedUniq(results.data)[0] == null)) {
  //     //         previewData.push(results.data);
  //     //       }
  //     //       if (previewData.length < 7) {
  //     //         this.previewHeadDatas = [];
  //     //         if (hasHeader == 'yes') {
  //     //           this.previewHeadDatas = previewData[0];
  //     //           this.previewContentDatas = previewData.slice(1, 6);
  //     //           // resolve(null);
  //     //         } else {
  //     //           for (let i = 0; i < previewData[0].length; i++) {
  //     //             this.previewHeadDatas.push('Header' + i);
  //     //           }
  //     //           this.previewContentDatas = previewData.slice(0, 5);
  //     //           // resolve(null);
  //     //         }
  //     //       }
  //     //     },

  //     //   });
  //     // });
  //   }
  // }

  toPostDatasets(uploadFormat, formData, params): void {
    let postData;
    if (this.env.config.enableAWSS3) {
      uploadFormat == 'image' ? (postData = formData) : (postData = params);
    } else {
      postData = formData;
    }
    if (this.msgMfe != 'inst') {
      this.apiService.uploadDateset(postData).subscribe(
        (res) => {
          if (this.msg.page === 'createDataset') {
            this.router.navigate(['loop/datasets/analyze'], {
              queryParams: { data: JSON.stringify(res) },
            });
          }
          this.outUploadDoneEmitter.emit('yes');
        },
        (error) => {
          this.outUploadDoneEmitter.emit('no');
          this.errorMessage = JSON.stringify(error);
        },
      );
    } else {
      Promise.all([this.toLpDataset(postData), this.postInDataset()])
        .then((res) => {
          this.outUploadDoneEmitter.emit('yes');
        })
        .catch((error) => {
          this.outUploadDoneEmitter.emit('no');
          this.errorMessage = JSON.stringify(error);
        });
    }
  }

  toLpDataset(postData) {
    return new Promise((resolve, reject) => {
      this.apiService.uploadDateset(postData).subscribe(
        (res) => {
          resolve(res);
        },
        (error) => {
          reject(error);
        },
      );
    });
  }

  postInDataset() {
    const inputFile = this.uploadGroup.get('localFile').value;
    const uploadFormat = this.uploadGroup.get('fileFormat').value;
    let formData = new FormData();
    const storedUser = localStorage.getItem(this.env.config.sessionKey);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      formData.append('user', user.user.email);
    }
    formData.append('name', this.uploadGroup.get('datasetsName').value);
    formData.append('description', '');
    formData.append('source', '');
    formData.append('hasHeader', uploadFormat === 'image' ? 'yes' : this.uploadGroup.get('hasHeader').value);
    formData.append('isMultiLabel', this.modelType === 'Multi Label Text Classification' ? 'Yes' : 'no');
    formData.append('format', uploadFormat === 'image' ? 'images' : uploadFormat);
    if (inputFile) {
      formData.append('docfile', inputFile, inputFile?.name);
    }
    return new Promise((resolve, reject) => {
      this.internalApiService.postInDataset(formData).subscribe(
        (res) => {
          resolve(res);
        },
        (error) => {
          reject(error);
        },
      );
    });
  }

  updateDatasets(data, fileResponse?) {
    if (data) {
      const formData = new FormData();
      let params;
      const uploadFormat = this.uploadGroup.get('fileFormat').value;
      const inputFile = this.uploadGroup.get('localFile').value;
      if (uploadFormat == 'image') {
        formData.append('dsname', this.uploadGroup.get('datasetsName').value);
        formData.append('fileName', inputFile.name);
        formData.append('fileSize', inputFile.size);
        formData.append('format', uploadFormat);
        formData.append('totalRows', data.length);
        if (this.env.config.enableAWSS3) {
          formData.append('images', JSON.stringify(data));
          formData.append('fileKey', fileResponse.key);
          formData.append('location', fileResponse.key);

          if (this.msgMfe === 'inst') {
            formData.append(
              'dataSynchronize',
              JSON.stringify([
                {
                  system: 'instaml',
                  _id: this.uploadGroup.get('datasetsName').value,
                },
              ]),
            );
          }
        } else {
          formData.append('file', inputFile);
        }
      } else {
        if (this.env.config.enableAWSS3) {
          params = {
            dsname: this.uploadGroup.get('datasetsName').value,
            fileName: inputFile.name,
            fileSize: inputFile.size,
            format: uploadFormat,
            fileKey: data.Key,
            location: data.Key,
            totalRows: uploadFormat == 'txt' ? this.previewContentDatas.exampleEntries : this.dsInitialRow,
            totalColumns: this.previewHeadDatas.length,
          };
          if (this.msgMfe === 'inst') {
            params['dataSynchronize'] = [
              {
                system: 'instaml',
                _id: this.uploadGroup.get('datasetsName').value,
              },
            ];
          }
        } else {
          formData.append('dsname', this.uploadGroup.get('datasetsName').value);
          formData.append('fileName', inputFile.name);
          formData.append('fileSize', inputFile.size);
          formData.append('format', uploadFormat);
          formData.append('file', inputFile);
          formData.append(
            'totalRows',
            uploadFormat == 'txt' ? this.previewContentDatas.exampleEntries : JSON.stringify(this.dsInitialRow),
          );
          formData.append('totalColumns', this.previewHeadDatas.length);
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
          } else {
            formData.append('topReview', JSON.stringify(topReview));
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
              JSON.stringify({
                header: this.previewHeadDatas,
                topRows: this.previewContentDatas,
              }),
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
  uploadToS3(file) {
    this.s3Service.uploadToS3(file, this.uploadSet.fileFormat, 'zip').then((e) => {
      if (e.err) {
        this.errorMessage = JSON.stringify(e.err);
      } else {
        this.updateDatasets(e.data);
      }
    });
  }

  unzipImagesToS3(data: any) {
    this.s3Service.uploadToS3(this.uploadGroup.get('localFile').value, 'image', 'zip').then((e) => {
      if (e.err) {
        this.errorMessage = JSON.stringify(e.err);
      } else {
        this.updateDatasets(e.data, e.fileResponse);
      }
    });
  }
  saveUpload() {
    let inputFile = this.uploadGroup.get('localFile').value;
    this.checkName(this.inputDsname).then((nameExist) => {
      if (!nameExist) {
        if (!this.uploadGroup.invalid) {
          if (
            this.uploadGroup.get('fileFormat').value == 'csv' ||
            this.uploadGroup.get('fileFormat').value == 'tabular'
          ) {
            const hasHeader = this.uploadGroup.get('hasHeader').value === 'yes' ? true : false;
            if (inputFile) {
              this.unZipService
                .parseCSVChunk(inputFile, hasHeader, false, null, [], true)
                .then((res) => {
                  this.dsInitialRow = res.count;
                  this.previewHeadDatas = res.previewHeadDatas;
                  this.previewContentDatas = res.previewContentDatas;
                  if (this.env.config.enableAWSS3) {
                    this.uploadToS3(inputFile);
                  } else {
                    this.updateDatasets('data');
                  }
                })
                .catch((err) => {
                  this.errorMessage = JSON.stringify(err);
                  this.outUploadDoneEmitter.emit('no');
                  return;
                });
            }

            // this.papaParse()
            //   .then((e) => {
            //     if (this.env.config.enableAWSS3) {
            //       this.uploadToS3(inputFile);
            //     } else {
            //       this.updateDatasets('data');
            //     }
            //   })
            //   .catch((err) => {
            //     console.log(err);
            //     this.errorMessage = JSON.stringify(err);
            //     this.outUploadDoneEmitter.emit('no');
            //     return;
            //   });
          }
          if (this.uploadGroup.get('fileFormat').value == 'image') {
            if (this.env.config.enableAWSS3) {
              this.unzipImagesToS3(inputFile);
            } else {
              this.updateDatasets('data');
            }
          }
          if (this.uploadGroup.get('fileFormat').value == 'txt') {
            if (inputFile.name.split('.').pop().toLowerCase() == 'zip') {
              this.unZipService.unZipTxt(inputFile).then((e) => {
                if (e.exampleEntries === 0) {
                  this.errorMessage =
                    'Upload datasets failed, please make sure there has at least one txt type file in the zip/tgz.';
                  return;
                }
                this.previewContentDatas = e;
                if (this.env.config.enableAWSS3) {
                  this.uploadToS3(inputFile);
                } else {
                  this.updateDatasets('data');
                }
              });
            } else {
              this.unZipService.unTgz(inputFile).then((e) => {
                if (e.exampleEntries === 0) {
                  this.errorMessage =
                    'Upload datasets failed, please make sure there has at least one txt type file in the zip/tgz.';
                  return;
                }
                this.previewContentDatas = e;
                if (this.env.config.enableAWSS3) {
                  this.uploadToS3(inputFile);
                } else {
                  this.updateDatasets('data');
                }
              });
            }
          }
        }
      }
    });
  }
}
