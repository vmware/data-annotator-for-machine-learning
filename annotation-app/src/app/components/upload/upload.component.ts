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
import AWS from 'aws-sdk/lib/aws';
import { Buffer } from 'buffer';
import * as _ from 'lodash';
import * as JSZip from 'jszip';
// import * as Pako from 'pako';
// import untar from "js-untar";
import { EnvironmentsService } from 'app/services/environments.service';
import { UnZipService } from 'app/services/common/up-zip.service';
// import { DomSanitizer } from '@angular/platform-browser';

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
  ) // private sanitizer: DomSanitizer,
  {
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
    console.log(12, this.msg);
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

  parseCSV() {
    // this.uploadGroup.get('localFile').setValue(this.inputFile);
    // this.papaParse();
    // this.columnInfo = [];
  }

  parseTabular() {
    // this.papaParse();
    // this.uploadGroup.get('localFile').setValue(this.inputFile);
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
            fileKey: data.Key,
            location: data.Key,
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
        // setTimeout(() => {
        //   this.errorMessageTop = '';
        //   this.errorMessageEmitter.emit(this.errorMessageTop);
        // }, 10000);
        this.uploadComplete = false;
        this.inputFile = null;
        // let params = {
        //   isShowSetHeader: '',
        // }
        // this.uploadSuccessEmitter.emit(params);
      },
    );
  }

  // toPostBinary() {

  //   let formData = new FormData();
  //   formData.append('file', this.inputFile);
  //   formData.append("dsname", this.uploadGroup.get('datasetsName').value);
  //   formData.append("format", this.uploadGroup.get('fileFormat').value);
  //   // formData.append("fileName", this.inputFile.name);
  //   // formData.append("fileSize", this.inputFile.size);
  //   if (this.uploadGroup.get('fileFormat').value == 'txt') {
  //     let topReview = [];
  //     this.previewContentDatas.previewExample.forEach(element => {
  //       topReview.push({ fileName: element.name, fileSize: element.size, fileContent: element.content.slice(0, 501) })
  //     });
  //     formData.append("topReview", JSON.stringify(topReview));
  //     formData.append("totalRows", this.previewContentDatas.exampleEntries);
  //   } else if (this.uploadGroup.get('fileFormat').value == 'csv' || this.uploadGroup.get('fileFormat').value == 'tabular') {
  //     formData.append("hasHeader", this.uploadGroup.get('hasHeader').value);
  //     formData.append("topReview", JSON.stringify({ header: this.previewHeadDatas, topRows: this.previewContentDatas }));
  //   };
  //   this.toPostDatasets(this.uploadGroup.get('fileFormat').value, formData, null)
  // }

  uploadToS3(file) {
    this.avaService.getS3UploadConfig().subscribe(
      async (res) => {
        if (res) {
          let outNo = '';
          for (let i = 0; i < 6; i++) {
            outNo += Math.floor(Math.random() * 10);
          }
          outNo = new Date().getTime() + outNo;
          const s3 = new AWS.S3({
            region: new Buffer(res.region, 'base64').toString(),
            apiVersion: new Buffer(res.apiVersion, 'base64').toString(),
            accessKeyId: new Buffer(res.credentials.accessKeyId, 'base64').toString(),
            secretAccessKey: new Buffer(res.credentials.secretAccessKey, 'base64').toString(),
            sessionToken: new Buffer(res.credentials.sessionToken, 'base64').toString(),
          });
          const uploadParams = {
            Bucket: new Buffer(res.bucket, 'base64').toString(),
            Key: new Buffer(res.key, 'base64').toString() + '/' + outNo + '_' + file.name,
            Body: file,
          };
          const data = await s3.upload(uploadParams).promise();
          this.updateDatasets(data);
        }
      },
      (error) => {
        this.errorMessageTop = error.message;
        this.errorMessageEmitter.emit(this.errorMessageTop);
        this.uploadComplete = true;
        this.showAddNewDatasetDialog = false;
        this.waitingTip = false;
        this.nameExist = false;

        setTimeout(() => {
          this.errorMessageTop = '';
          this.errorMessageEmitter.emit(this.errorMessageTop);
        }, 5000);
      },
    );
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
      } else {
        this.uploadComplete = true;
        this.inputFile.size < 10485760 ? (this.waitingTip = false) : (this.waitingTip = true);
        if (this.uploadGroup.get('fileFormat').value == 'csv') {
          // this.parseCSV();
          this.papaParse().then((e) => {
            if (this.env.config.enableAWSS3) {
              this.uploadToS3(this.inputFile);
            } else {
              this.updateDatasets('data');
            }
          });
        } else if (this.uploadGroup.get('fileFormat').value == 'tabular') {
          // this.parseTabular();
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
            // let flag;
            // this.unZipService.unzipImages(this.inputFile).then((e) => {
            //   console.log(99, e);
            //   // to preview the img
            //   flag = e;
            //   const entries = flag.entry;
            //   let a = 1;
            //   const that = this;
            //   const objectKey = Object.keys(entries.files);
            //   const cc = [];
            //   for (let i = 0; i < objectKey.length; i++) {
            //     if (
            //       objectKey[i].split('/')[1] != '' &&
            //       that.unZipService.validImageType(objectKey[i])
            //     ) {
            //       cc.push(objectKey[i]);
            //       if (cc.length == 3) {
            //         break;
            //       }
            //     }
            //   }
            //   for (let j = 0; j < cc.length; j++) {
            //     entries.files[cc[j]].async('blob').then(function (blob) {
            //       const reader = new FileReader();
            //       reader.readAsDataURL(blob);
            //       reader.onloadend = (r) => {
            //         that.previewContentDatas.push({
            //           _id: a++,
            //           fileName: cc[j],
            //           fileSize: (blob.size / 1024).toFixed(2),
            //           location: that.sanitizer.bypassSecurityTrustUrl(reader.result.toString()),
            //         });
            //       };
            //     });
            //   }
            //   // this.toPostBinary();
            // });
          }
        } else if (this.uploadGroup.get('fileFormat').value == 'txt') {
          if (this.inputFile.name.split('.').pop().toLowerCase() == 'zip') {
            this.unZipService.unZipTxt(this.inputFile).then((e) => {
              this.previewContentDatas = e;
              if (this.env.config.enableAWSS3) {
                this.uploadToS3(this.inputFile);
              } else {
                this.updateDatasets('data');
              }
            });
          } else {
            this.unZipService.unTgz(this.inputFile).then((e) => {
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
    this.avaService.getS3UploadConfig().subscribe(
      async (res) => {
        if (res) {
          const s3 = new AWS.S3({
            region: new Buffer(res.region, 'base64').toString(),
            apiVersion: new Buffer(res.apiVersion, 'base64').toString(),
            accessKeyId: new Buffer(res.credentials.accessKeyId, 'base64').toString(),
            secretAccessKey: new Buffer(res.credentials.secretAccessKey, 'base64').toString(),
            sessionToken: new Buffer(res.credentials.sessionToken, 'base64').toString(),
          });

          const jsZip = new JSZip();
          const that = this;
          const uploadEntries = [];
          const imagesLocation = [];
          let realEntryLength = 0;
          let realEntryIndex = 0;

          jsZip.loadAsync(that.inputFile).then(function (entries) {
            let outNo = '';
            for (let i = 0; i < 6; i++) {
              outNo += Math.floor(Math.random() * 10);
            }
            outNo = new Date().getTime() + outNo;
            entries.forEach((path, file) => {
              if (!file.dir && that.unZipService.validImageType(path)) {
                realEntryLength++;
              }
            });

            _.forIn(entries.files, function (value1, key1) {
              if (!value1.dir && that.unZipService.validImageType(value1.name)) {
                value1.async('blob').then(async function (blob) {
                  realEntryIndex++;
                  const uploadParams = {
                    Bucket: new Buffer(res.bucket, 'base64').toString(),
                    Key: new Buffer(res.key, 'base64').toString() + '/' + outNo + '/' + value1.name,
                    Body: blob,
                  };
                  uploadEntries.push({
                    uploadParams,
                    fileName: value1.name,
                    fileSize: blob.size,
                  });

                  // control the upload req concurrent
                  if (realEntryIndex == realEntryLength) {
                    while (uploadEntries.length) {
                      await Promise.all(
                        uploadEntries.splice(0, 500).map(async (e) => {
                          await s3
                            .upload(e.uploadParams)
                            .promise()
                            .then(function (data, err) {
                              if (err) {
                                console.log('uploadImageErr:::', err);
                              }
                              if (data) {
                                imagesLocation.push({
                                  fileName: e.fileName,
                                  location: data.Key,
                                  fileSize: e.fileSize,
                                });
                              }
                            });
                        }),
                      );
                    }
                    that.updateDatasets(imagesLocation);
                  }
                });
              }
            });
          });
        }
      },
      (error) => {
        this.errorMessageTop = error.message;
        this.errorMessageEmitter.emit(this.errorMessageTop);
        this.uploadComplete = true;
        this.showAddNewDatasetDialog = false;
        this.waitingTip = false;
        this.nameExist = false;
        setTimeout(() => {
          this.errorMessageTop = '';
          this.errorMessageEmitter.emit(this.errorMessageTop);
        }, 5000);
      },
    );
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

  // validTxtType(fileName) {
  //   let name = fileName.split('/').pop();
  //   if (!(name.startsWith('__MACOSX') || name.startsWith('._'))) {
  //     let types = ['txt'];
  //     let type = name.split('.').pop();
  //     if (types.indexOf(type.toLowerCase()) > -1) {
  //       return true;
  //     } else {
  //       return false;
  //     }
  //   } else {
  //     return false;
  //   }
  // }

  // unTgz() {
  //   var that = this;
  //   var reader = new FileReader();
  //   return new Promise((resolve, reject) => {
  //     reader.readAsArrayBuffer(that.inputFile);
  //     reader.onload = function (event) {
  //       let result: any = (event.target as any).result;
  //       const inflator = new Pako.Inflate();
  //       inflator.push(result);
  //       if (inflator.err) {
  //         console.log('inflator-err:::', inflator.msg);
  //       }
  //       const output = inflator.result;
  //       untar(output.buffer)
  //         .then((extractedFiles) => {
  //           let example = 0;
  //           let txtList = [];
  //           extractedFiles.forEach(element => {
  //             if (element.type == 0 || element.type == null) {
  //               if (that.validTxtType(element.name)) {
  //                 example++;
  //                 txtList.push(element);
  //               }
  //             }
  //           })
  //           let previewExample = txtList.splice(0, 3)
  //           previewExample.forEach(e => {
  //             that.toReadBlobToText(e.blob).then(data => {
  //               e.content = data;
  //             })
  //           })
  //           that.previewContentDatas = { previewExample: previewExample, exampleEntries: example };
  //           setTimeout(() => {
  //             resolve(that.previewContentDatas);
  //           }, 1000);
  //         })
  //     }
  //   })
  // }

  // toReadBlobToText(blob) {
  //   return new Promise(function (resolve) {
  //     var reader = new FileReader();
  //     reader.readAsText(blob)
  //     reader.onload = function (event) {
  //       let res: any = (event.target as any).result;
  //       resolve(res)
  //     }
  //   })
  // }

  // unZip() {
  //   let jsZip = new JSZip();
  //   var that = this;
  //   let example = 0;
  //   let txtList = [];
  //   return new Promise((resolve, reject) => {
  //     jsZip.loadAsync(that.inputFile).then(function (entries) {
  //       entries.forEach((path, file) => {
  //         if (!file.dir && that.validTxtType(path)) {
  //           example++;
  //           txtList.push(file);
  //         }
  //       });
  //       let previewExample = txtList.splice(0, 3)

  //       previewExample.forEach(e => {
  //         jsZip.file(e.name).async('string').then(function success(res) {
  //           e.content = res;
  //           e.size = e._data.uncompressedSize
  //         }, function error(e) {
  //           console.log('error:::', e)
  //         })
  //       })
  //       that.previewContentDatas = { previewExample: previewExample, exampleEntries: example };
  //       setTimeout(() => {
  //         resolve(that.previewContentDatas)
  //       }, 1000);
  //     })
  //   })
  // }
}
