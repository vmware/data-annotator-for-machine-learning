/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { UserAuthService } from '../../services/user-auth.service';
import { AvaService } from "../../services/ava.service";
import { QueryDatasetData, DatasetUtil, UploadData } from '../../model/index';
import { FormValidatorUtil } from '../../shared/form-validators/form-validator-util';
import { DatasetValidator } from '../../shared/form-validators/dataset-validator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Papa } from 'ngx-papaparse';
import AWS from 'aws-sdk/lib/aws';
import { Buffer } from 'buffer';
import * as _ from "lodash";
import * as JSZip from 'jszip';


@Component({
  selector: 'upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
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
  loading: boolean = false;
  nameExist: boolean;
  errorMessage: string = '';
  infoMessage: string = '';
  userQuestionUpdate = new Subject<string>();
  uploadSet: UploadData;
  showAddNewDatasetDialog: boolean = false;
  parseErrorTip: boolean = false;
  parseError: any;
  inputFile: any;
  uploadComplete: boolean = false;
  previewHeadDatas: any = [];
  previewContentDatas: any = [];
  waitingTip: boolean = false;
  errorMessageTop: string;
  columnInfo: any = [];

  constructor(
    private formBuilder: FormBuilder,
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private papa: Papa,

  ) {
    this.userQuestionUpdate.pipe(
      debounceTime(400),
      distinctUntilChanged())
      .subscribe(value => {
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
    };
    let flag;
    if (this.msg.page == 'datasets') {
      flag = "csv";
    } else if ((this.msg.page == 'create')) {
      if (this.msg.type == 'tabular') {
        flag = 'tabular';
      } else if (this.msg.type == 'text' || this.msg.type == 'ner') {
        flag = 'csv'
      } else if (this.msg.type == 'image') {
        flag = 'image'
      }
    }
    this.uploadGroup = this.formBuilder.group({
      datasetsName: ['', DatasetValidator.modelName()],
      localFile: [null, DatasetValidator.localFile(this.msg.type)],
      hasHeader: [this.uploadSet.hasHeader, ''],
      fileFormat: [flag, '']
    });
  }


  onCloseDialog() {
    this.onCloseDialogEmitter.emit();
  }

  buildFormModel(): any {
    let formModel = JSON.parse(JSON.stringify(this.uploadGroup.value));
    return formModel;
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
    }
  }


  parseCSV() {
    this.papaParse();
    this.uploadGroup.get('localFile').setValue(this.inputFile);
    this.columnInfo = [];
  }


  parseTabular() {
    this.papaParse();
    this.uploadGroup.get('localFile').setValue(this.inputFile);
  }

  papaParse() {
    let previewData = [];
    if (this.inputFile) {
      this.papa.parse(this.inputFile, {
        header: false,
        preview: 50,
        dynamicTyping: true,
        skipEmptyLines: true,
        error: (error) => {
          console.log('parse_error: ', error);
        },
        step: (results, parser) => {
          if (!(_.sortedUniq(results.data).length == 1 && _.sortedUniq(results.data)[0] == null)) {
            previewData.push(results.data)
          }
          if (previewData.length == 6) {
            if (this.uploadGroup.get('hasHeader').value == 'yes') {
              this.previewHeadDatas = previewData[0];
              this.previewContentDatas = previewData.slice(1, 6);
            } else {
              for (let i = 0; i < previewData[0].length; i++) {
                this.previewHeadDatas.push('Header' + i);
              };
              this.previewContentDatas = previewData.slice(0, 5);
            };
            parser.abort();
          };
        }
      });
    }
  }

  updateDatasets(data, key) {

    let formData = new FormData();
    let params = {
      dsname: this.uploadGroup.get('datasetsName').value,
      fileName: this.inputFile.name,
      fileSize: this.inputFile.size,
      format: this.uploadGroup.get('fileFormat').value,
      hasHeader: null,
      fileKey: null,
      location: null,
      topReview: null,
      columnInfo: null,
      images: null
    }
    if (key == 'image') {
      formData.append("dsname", this.uploadGroup.get('datasetsName').value);
      formData.append("fileName", this.inputFile.name);
      formData.append("fileSize", this.inputFile.size);
      formData.append("format", this.uploadGroup.get('fileFormat').value);
      formData.append("images", JSON.stringify(data));
    } else {
      if (data) {
        params.hasHeader = this.uploadGroup.get('hasHeader').value;
        params.fileKey = key;
        params.location = data.Location;
        params.topReview = { header: this.previewHeadDatas, topRows: this.previewContentDatas };
        params.columnInfo = this.columnInfo;
      } else {
        this.errorMessage = 'Upload failed, please try again later.';
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    };


    this.avaService.uploadDateset(key == 'image' ? formData : params).subscribe(
      res => {

        let params = {
          dataSetName: this.uploadGroup.get('datasetsName').value,
          isShowSetHeader: res.format,
          previewHeadDatas: key == 'image' ? ['Id', 'ImageName', 'ImageSize(KB)', 'Image'] : this.previewHeadDatas,
          previewContentDatas: key == 'image' ? res.topReview : this.previewContentDatas,
          chooseLabel: key == 'image' ? null : this.previewHeadDatas,
          columnInfo: key == 'image' ? null : res.columnInfo,
          dataSetId: res.id,
          isHasHeader: key == 'image' ? null : res.hasHeader,
          fileName: res.fileName,
          fileSize: res.fileSize,
          location: key == 'image' ? null : data.Location,
          images: key == 'image' ? res.images : null,

        }
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
      error => {
        console.log('Error:', error);
        this.errorMessageTop = 'Save data into database failed';
        this.errorMessageEmitter.emit(this.errorMessageTop);
        setTimeout(() => {
          this.errorMessageTop = '';
          this.errorMessageEmitter.emit(this.errorMessageTop);
        }, 5000);
        this.uploadComplete = false;
        this.inputFile = null;

        let params = {
          isShowSetHeader: '',
        }
        this.uploadSuccessEmitter.emit(params);
      }
    );


  }



  uploadToS3(file) {

    this.avaService.getS3UploadConfig().subscribe(async res => {

      if (res) {
        let outNo = "";
        for (let i = 0; i < 6; i++) {
          outNo += Math.floor(Math.random() * 10);
        }
        outNo = new Date().getTime() + outNo;
        const s3 = new AWS.S3(
          {
            region: new Buffer(res.region, 'base64').toString(),
            apiVersion: new Buffer(res.apiVersion, 'base64').toString(),
            accessKeyId: new Buffer(res.credentials.accessKeyId, 'base64').toString(),
            secretAccessKey: new Buffer(res.credentials.secretAccessKey, 'base64').toString(),
            sessionToken: new Buffer(res.credentials.sessionToken, 'base64').toString()
          }
        );
        let uploadParams = { Bucket: new Buffer(res.bucket, 'base64').toString(), Key: new Buffer(res.key, 'base64').toString() + '/' + outNo + '_' + file.name, Body: file };
        let data = await s3.upload(uploadParams).promise();
        this.updateDatasets(data, uploadParams.Key);
      };
    },
      error => {
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
      });

  }


  saveUpload() {
    this.uploadGroup.get('localFile').setValue(this.inputFile);
    FormValidatorUtil.markControlsAsTouched(this.uploadGroup);
    if (!this.uploadGroup.invalid && this.nameExist == false) {
      if (this.inputFile.size > 104857600 && this.msg.page == "create") {
        this.errorMessage =
          "File exceeds 100MB. Please use the My Datasets tab for larger dataset upload. Once completed, data will be available in this menu.";
        this.inputFile = null;
        // this.isShowSetHeader = false;
        return;

      } else {
        this.uploadComplete = true;
        this.inputFile.size < 10485760 ? this.waitingTip = false : this.waitingTip = true;
        if (this.uploadGroup.get('fileFormat').value == "csv") {
          this.parseCSV();
          this.uploadToS3(this.inputFile);

        } else if (this.uploadGroup.get('fileFormat').value == "tabular") {
          this.parseTabular();
          this.uploadToS3(this.inputFile);

        } else if (this.uploadGroup.get('fileFormat').value == "image") {
          this.unzipImages();
        };
      }
    }
  }


  checkName(e) {
    this.avaService.findDatasetName(e).subscribe(res => {
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
  };



  unzipImages() {
    this.avaService.getS3UploadConfig().subscribe(async res => {
      if (res) {

        const s3 = new AWS.S3(
          {
            region: new Buffer(res.region, 'base64').toString(),
            apiVersion: new Buffer(res.apiVersion, 'base64').toString(),
            accessKeyId: new Buffer(res.credentials.accessKeyId, 'base64').toString(),
            secretAccessKey: new Buffer(res.credentials.secretAccessKey, 'base64').toString(),
            sessionToken: new Buffer(res.credentials.sessionToken, 'base64').toString(),

          }
        );

        let jsZip = new JSZip();
        var that = this;
        let uploadEntries = [];
        let imagesLocation = [];
        let realEntryLength = 0;
        let realEntryIndex = 0;


        jsZip.loadAsync(that.inputFile).then(function (entries) {

          let outNo = "";
          for (let i = 0; i < 6; i++) { outNo += Math.floor(Math.random() * 10); }
          outNo = new Date().getTime() + outNo;
          entries.forEach((path, file) => {
            if (!file.dir && that.validImageType(path)) {
              realEntryLength++;
            }
          });

          _.forIn(entries.files, function (value1, key1) {
            if (!value1.dir && that.validImageType(value1.name)) {
              value1.async('blob').then(async function (blob) {
                realEntryIndex++;
                let uploadParams = { Bucket: new Buffer(res.bucket, 'base64').toString(), Key: new Buffer(res.key, 'base64').toString() + '/' + outNo + '/' + value1.name, Body: blob };
                uploadEntries.push({ uploadParams: uploadParams, fileName: value1.name, fileSize: blob.size });


                // control the upload req concurrent
                if (realEntryIndex == realEntryLength) {
                  while (uploadEntries.length) {
                    await Promise.all(uploadEntries.splice(0, 500).map(async e => {
                      await s3.upload(e.uploadParams).promise().then(function (data, err) {
                        if (err) {
                          console.log('uploadImageErr:::', err)
                        };
                        if (data) {
                          imagesLocation.push({ fileName: e.fileName, location: data.Location, fileSize: e.fileSize })
                        }
                      })
                    }));
                  };
                  that.updateDatasets(imagesLocation, 'image')
                }
              })
            }
          });
        })
      };
    }, error => {
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
    });
  };



  validImageType(fileName) {
    if (!fileName.startsWith('__MACOSX')) {
      let types = ['png', 'jpg', 'jpeg', 'tif', 'bmp'];
      let type = fileName.split('.').pop();
      if (types.indexOf(type.toLowerCase()) > -1) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };


  changeFileFormat(e) {
    this.uploadGroup.get("localFile").setValidators(DatasetValidator.localFile(e));
    this.uploadGroup.get("localFile").updateValueAndValidity();

  }





}
