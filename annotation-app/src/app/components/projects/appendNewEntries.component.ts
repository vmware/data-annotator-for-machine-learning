/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { Subject } from 'rxjs';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAuthService } from '../../services/user-auth.service';
import { AvaService } from '../../services/ava.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormGroup, FormBuilder } from '@angular/forms';
import { UploadData } from '../../model/index';
import { DatasetUtil } from 'app/model/index';
import { DatasetValidator } from '../../shared/form-validators/dataset-validator';
import { FormValidatorUtil } from '../../shared/form-validators/form-validator-util';
import AWS from 'aws-sdk/lib/aws';
import { Buffer } from 'buffer';
import { DomSanitizer } from '@angular/platform-browser';
import { UnZipService } from 'app/services/common/up-zip.service';
import { EnvironmentsService } from 'app/services/environments.service';
import { ToolService } from 'app/services/common/tool.service';

@Component({
  selector: 'app-append',
  templateUrl: './appendNewEntries.component.html',
  styleUrls: ['./appendNewEntries.component.scss'],
})
export class AppendNewEntriesComponent implements OnInit {
  user: string;
  loading: boolean;
  errorMessage = '';
  infoMessage = '';
  refresh: any;
  projectId: any;
  sampleData: any = [];
  newAddedData: any = [];
  projectName: string;
  userQuestionUpdate = new Subject<string>();
  nameExist: boolean;
  uploadGroup: FormGroup;
  uploadSet: UploadData;
  inputFile: any;
  previewHeadDatas = [];
  previewContentDatas = [];
  loadPreviewTable: boolean;
  showPreviewTable: boolean;
  addLoading: boolean;
  fixHeader: any = [];
  originalHead: any = [];
  routeFrom: string;
  totalCase: number;
  nonEnglish: number;
  location: string;
  projectType: string;
  columnInfo: any;
  isLabelBoxShow = true;
  datasetsList: any = [];
  appendErrMessage: string;

  constructor(
    private route: ActivatedRoute,
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private formBuilder: FormBuilder,
    private router: Router,
    private el: ElementRef,
    private renderer2: Renderer2,
    private sanitizer: DomSanitizer,
    private UnZipService: UnZipService,
    public env: EnvironmentsService,
    private toolService: ToolService,
  ) {
    this.user = this.userAuthService.loggedUser().email;
    this.route.queryParams.subscribe((params) => {
      this.projectId = params['id'];
      this.projectName = params['name'];
      this.routeFrom = params['from'];
      this.projectType = params['projectType'];
    });

    this.userQuestionUpdate.pipe(debounceTime(400), distinctUntilChanged()).subscribe((value) => {
      if (value != '') {
        this.checkName(value);
      } else {
        this.nameExist = false;
      }
    });
  }

  ngOnInit() {
    this.loading = true;
    this.nameExist = false;
    this.loadPreviewTable = false;
    this.nonEnglish = 0;
    this.totalCase = 0;
    this.getAnExample();
    this.createUploadForm();
    this.getMyDatasets();
  }

  createUploadForm(): void {
    if (!this.uploadSet) {
      this.uploadSet = DatasetUtil.uploadInit();
    }
    this.uploadGroup = this.formBuilder.group({
      datasetsName: ['', DatasetValidator.modelName()],
      localFile: [
        null,
        DatasetValidator.localFile(this.projectType, this.env.config.enableAWSS3, false),
      ],
      selectedDataset: ['', DatasetValidator.required()],
      totalRow: [0, DatasetValidator.validRow()],
    });
  }

  private getAnExample() {
    if (this.projectType == 'image') {
      const flag = { src: '/', name: '/', size: '/', sizeInkb: '/', format: true, file: File };
      this.newAddedData.push(flag);
      this.loading = false;
    } else if (this.projectType == 'log') {
      const flag = {
        name: '/',
        size: '/',
        sizeInkb: '/',
        format: true,
        file: null,
        fileContent: '/',
      };
      this.newAddedData.push(flag);
      this.loading = false;
    } else {
      this.avaService.getSample(this.projectId).subscribe(
        (res) => {
          this.sampleData = res.sampleSr;
          let flag = {};
          for (let i = 0; i < this.sampleData.length; i++) {
            flag = { key: this.sampleData[i].key, value: '', format: true };
            this.newAddedData.push(flag);
            this.originalHead.push(this.sampleData[i].key);
          }
          this.newAddedData = [this.newAddedData];
          this.loading = false;
        },
        (error: any) => {
          console.log(error);
          this.loading = false;
        },
      );
    }
  }

  addNewRow() {
    let a = {};
    const b = [];
    if (this.projectType == 'image') {
      this.newAddedData.push({
        src: '/',
        name: '/',
        size: '/',
        sizeInkb: '/',
        format: true,
        file: File,
      });
    } else if (this.projectType == 'log') {
      this.newAddedData.push({
        name: '/',
        size: '/',
        sizeInkb: '/',
        format: true,
        file: null,
        fileContent: '/',
      });
    } else {
      for (let j = 0; j < this.newAddedData[0].length; j++) {
        a = { key: this.newAddedData[0][j].key, value: '', format: true };
        b.push(a);
      }
      this.newAddedData.push(b);
    }
  }

  deleteRow(e, index) {
    if (this.newAddedData.length > 1) {
      this.newAddedData.splice(index, 1);
    }
  }

  inputDescription(e, row, column) {
    if (!this.toolService.isASCII(e.target.value)) {
      e.target.style.color = 'red';
      this.newAddedData[row].map((element) => {
        if (element.key == column) {
          element.format = false;
        }
      });
    } else {
      e.target.style.color = '#575757';
      this.newAddedData[row].map((element) => {
        if (element.key == column) {
          element.format = true;
        }
      });
    }
  }

  uploadSingleImageToS3() {
    const flag = function (param) {
      return new Promise(function (resolve, reject) {
        let aa = true;
        param.forEach((element) => {
          if (element.format == false) {
            aa = false;
          }
        });
        resolve(aa);
      });
    };
    flag(this.newAddedData).then((e) => {
      if (e) {
        for (let i = 0; i < this.newAddedData.length; i++) {
          if (this.newAddedData[i].src == '/' && this.newAddedData[i].size == '/') {
            this.newAddedData.splice(i, 1);
          }
        }
        if (this.newAddedData.length > 0) {
          this.uploadToS3(null, 'single');
        }
      }
    });
  }

  uploadSingleInFormdata() {
    const formData = new FormData();
    let images = [];
    this.newAddedData.forEach((element) => {
      if (element.format !== false && element.file) {
        formData.append('file', element.file);
      }
      if (this.projectType === 'image') {
        images.push({ fileName: element.name, fileSize: element.size });
      }
    });
    formData.append('pname', this.projectName);
    formData.append('isFile', 'false');
    if (this.projectType === 'image') {
      formData.append('projectType', this.projectType);
      formData.append('images', JSON.stringify(images));
    }
    if (formData.get('file')) {
      this.appendSrs(formData);
    }
  }

  createNewRow() {
    if (this.projectType == 'image') {
      if (this.env.config.enableAWSS3) {
        this.uploadSingleImageToS3();
      } else {
        this.uploadSingleInFormdata();
      }
    } else if (this.projectType == 'log') {
      this.uploadSingleInFormdata();
    } else {
      const srdata = [];
      const allValue = [];
      for (let i = 0; i < this.newAddedData.length; i++) {
        const flag = {};
        const rowArry = [];
        for (let j = 0; j < this.newAddedData[i].length; j++) {
          if (this.newAddedData[i][j].format == false) {
            return;
          }
          allValue.push(this.newAddedData[i][j].value);
          rowArry.push(this.newAddedData[i][j].value);
          flag[this.newAddedData[i][j].key] = this.newAddedData[i][j].value;
        }
        if (
          rowArry
            .join('')
            .replace(/(\r\n|\r|\n|\n\r)/g, '')
            .replace(/\s*/g, '') !== ''
        ) {
          srdata.push(flag);
        }
      }
      if (allValue.join('') !== '' && srdata.length > 0) {
        const params = {
          pname: this.projectName,
          isFile: false,
          srdata,
        };
        this.appendSrs(params);
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

  private getMyDatasets() {
    const a =
      this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'ner'
        ? 'csv'
        : this.projectType == 'image'
        ? 'image'
        : 'txt';
    this.avaService.getMyDatasets(a).subscribe(
      (res) => {
        if (this.projectType == 'image') {
          const flag = [];
          res.forEach((element) => {
            if (element.format == 'image') {
              flag.push(element);
            }
          });
          this.datasetsList = flag;
        } else {
          const flag = [];
          res.forEach((element) => {
            if (element.format !== 'image') {
              flag.push(element);
            }
          });
          this.datasetsList = flag;
        }
      },
      (error: any) => {
        console.log(error);
      },
    );
  }

  toCaculateTotalRow(choosedDataset, originalHead) {
    let flag;
    let count;
    if (this.env.config.enableAWSS3) {
      this.avaService.getCloudUrl(choosedDataset.id).subscribe(
        (res) => {
          this.UnZipService.parseCSVChunk(
            res,
            false,
            true,
            choosedDataset.topReview.header,
            originalHead,
            this.previewContentDatas,
          ).then((e) => {
            flag = e;
            if (choosedDataset.hasHeader == 'yes') {
              count = flag.count - 1;
            }
            this.totalCase = flag.count;
            this.nonEnglish = flag.invalidCount;
            this.uploadGroup.get('totalRow').setValue(this.totalCase - this.nonEnglish);
            this.loadPreviewTable = false;
          });
        },
        (error) => {
          console.log('Error:', error);
        },
      );
    } else {
      const params = {
        columns: choosedDataset.topReview.header,
        location: choosedDataset.location,
        hasHeader: choosedDataset.hasHeader,
      };
      this.avaService.getSetData(params).subscribe(
        (res) => {
          if (choosedDataset.hasHeader == 'yes') {
            count = res.totalCase - 1;
          }
          this.totalCase = res.totalCase + res.removedCase;
          this.nonEnglish = res.removedCase;
          this.uploadGroup.get('totalRow').setValue(this.totalCase - this.nonEnglish);
          this.loadPreviewTable = false;
        },
        (error) => {
          console.log('Error:', error);
        },
      );
    }
  }

  selectedDatasets(e) {
    this.nonEnglish = 0;
    this.previewHeadDatas = [];
    this.previewContentDatas = [];
    this.totalCase = 0;
    this.notValidInputfile();
    this.uploadGroup.get('totalRow').setValue(0);
    this.columnInfo = [];
    this.inputFile = null;
    this.uploadGroup.get('localFile').setValue(null);

    // to toggle the name input
    this.uploadGroup.get('datasetsName').setValue(e.target.value);
    this.uploadGroup.get('datasetsName').disable();
    this.nameExist = false;

    for (let i = 0; i < this.datasetsList.length; i++) {
      if (this.datasetsList[i].dataSetName === e.target.value) {
        const choosedDataset = this.datasetsList[i];
        this.location = choosedDataset.location;
        this.showPreviewTable = true;
        this.loadPreviewTable = true;
        if (this.projectType == 'image' && choosedDataset.format == 'image') {
          this.previewHeadDatas = ['Id', 'ImageName', 'ImageSize(KB)', 'Image'];
          let a = 0;
          let flag = JSON.parse(JSON.stringify(choosedDataset.topReview));
          flag.forEach((element) => {
            element.fileSize = (element.fileSize / 1024).toFixed(2);
            if (this.env.config.enableAWSS3) {
              const img = new Image();
              let m = this;
              img.src = element.location;
              img.onload = function () {
                a++;
                if (a == Math.round(flag.length / 2)) {
                  m.loadPreviewTable = false;
                }
              };
            } else {
              element.location = `${
                this.env.config.annotationService
              }/api/v1.0/datasets/set-data?file=${element.location}&token=${
                JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token.access_token
              }`;
            }
          });
          this.previewContentDatas = flag;
          this.uploadGroup.get('totalRow').setValue(choosedDataset.images.length);
        } else if (this.projectType == 'log') {
          this.previewHeadDatas = ['FileName', 'FileContent'];
          const a = [];
          choosedDataset.topReview.forEach((element) => {
            a.push({ name: element.fileName, content: element.fileContent });
          });
          this.previewContentDatas = a;
          this.uploadGroup.get('totalRow').setValue(choosedDataset.totalRows);
          this.loadPreviewTable = false;
        } else {
          this.previewHeadDatas = choosedDataset.topReview.header;
          this.previewContentDatas = choosedDataset.topReview.topRows;
          this.fixHeader = _.difference(this.originalHead, this.previewHeadDatas);
          if (this.fixHeader.length == 0) {
            this.toCaculateTotalRow(choosedDataset, this.originalHead);
          } else {
            this.loadPreviewTable = false;
          }
        }
        return;
      }
    }
  }

  onLocalFileChange(event) {
    if (event.target.files.length > 0) {
      this.validInputfile(event.target.files[0].name);
      this.showPreviewTable = true;
      this.loadPreviewTable = true;
      this.inputFile = event.target.files[0];
      // to toggle the name input
      this.uploadGroup.get('datasetsName').enable();
      this.uploadGroup.get('selectedDataset').setValue(null);
      this.changeDatasetName(this.uploadGroup.get('datasetsName').value);
      this.fixHeader = [];
      this.previewHeadDatas = [];
      this.previewContentDatas = [];
      this.uploadGroup.get('totalRow').setValue(0);
      this.nonEnglish = 0;
      this.columnInfo = [];
      this.uploadGroup.get('localFile').setValue(this.inputFile);

      if (this.projectType == 'image') {
        this.previewHeadDatas = ['Id', 'ImageName', 'ImageSize(KB)', 'Image'];
        let flag;
        this.UnZipService.unzipImages(this.inputFile).then(
          (e) => {
            // to preview the img
            flag = e;
            const entries = flag.entry;
            let a = 1;
            const that = this;
            const objectKey = Object.keys(entries.files);
            const cc = [];
            for (let i = 0; i < objectKey.length; i++) {
              if (
                objectKey[i].split('/')[1] != '' &&
                that.UnZipService.validImageType(objectKey[i])
              ) {
                cc.push(objectKey[i]);
                if (cc.length == 3) {
                  break;
                }
              }
            }
            for (let j = 0; j < cc.length; j++) {
              entries.files[cc[j]].async('blob').then(function (blob) {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = (r) => {
                  that.previewContentDatas.push({
                    _id: a++,
                    fileName: cc[j],
                    fileSize: (blob.size / 1024).toFixed(2),
                    location: that.sanitizer.bypassSecurityTrustUrl(reader.result.toString()),
                  });
                  that.loadPreviewTable = false;
                  that.uploadGroup.get('totalRow').setValue(flag.realEntryLength);
                };
              });
            }
          },
          (err) => {
            console.log(err);
          },
        );
      } else if (this.projectType == 'log') {
        this.previewHeadDatas = ['FileName', 'FileContent'];
        let flag;
        if (this.inputFile.name.split('.').pop().toLowerCase() == 'zip') {
          this.UnZipService.unZipTxt(this.inputFile).then((e) => {
            flag = e;
            this.previewContentDatas = flag.previewExample;
            this.uploadGroup.get('totalRow').setValue(flag.exampleEntries);
            this.loadPreviewTable = false;
          });
        } else if (this.inputFile.name.split('.').pop().toLowerCase() == 'tgz') {
          this.UnZipService.unTgz(this.inputFile).then((e) => {
            flag = e;
            this.previewContentDatas = flag.previewExample;
            this.uploadGroup.get('totalRow').setValue(flag.exampleEntries);
            this.loadPreviewTable = false;
          });
        }
      } else {
        this.parseCSV();
      }
      event.target.value = '';
    }
  }

  parseCSV() {
    let res;
    this.UnZipService.parseCSVChunk(
      this.inputFile,
      true,
      false,
      this.originalHead,
      this.previewHeadDatas,
      this.previewContentDatas,
    ).then((e) => {
      res = e;
      this.originalHead = res.originalHead;
      this.previewContentDatas = res.previewContentDatas;
      this.previewHeadDatas = res.previewHeadDatas;
      this.fixHeader = _.difference(this.originalHead, this.previewHeadDatas);
      if (this.fixHeader.length == 0) {
        this.totalCase = res.count;
        this.nonEnglish = res.invalidCount;
        this.uploadGroup.get('totalRow').setValue(this.totalCase - this.nonEnglish);
      }
      this.columnInfo = [];
      this.loadPreviewTable = false;
    });
  }

  createNewCsv() {
    this.uploadGroup.get('localFile').setValue(this.inputFile);
    FormValidatorUtil.markControlsAsTouched(this.uploadGroup);
    if (!this.uploadGroup.invalid && this.nameExist == false && this.fixHeader.length == 0) {
      this.addLoading = true;
      if (this.uploadGroup.get('localFile').value == null) {
        const appendParams = {
          pname: this.projectName,
          isFile: true,
          selectedDataset: this.uploadGroup.get('selectedDataset').value,
        };
        this.appendSrs(appendParams);
      } else {
        if (this.env.config.enableAWSS3) {
          this.uploadToS3(this.inputFile, 'zip');
        } else {
          this.toPostBinary('fromZip');
        }
      }
    }
  }

  uploadToS3(file, addMethod) {
    this.addLoading = true;
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
          if (this.projectType == 'image') {
            if (addMethod == 'zip') {
              this.uploadImages(file, s3, res);
            } else {
              const aa = [];
              this.newAddedData.forEach((element) => {
                if (element.format !== false && element.src !== '/' && element.size !== '/') {
                  aa.push(element);
                }
              });
              this.newAddedData = aa;
              if (this.newAddedData.length > 0) {
                this.uploadSingleImage(outNo, s3, res, this.newAddedData);
              }
            }
          } else {
            const uploadParams = {
              Bucket: new Buffer(res.bucket, 'base64').toString(),
              Key: new Buffer(res.key, 'base64').toString() + '/' + outNo + '_' + file.name,
              Body: file,
            };
            const data = await s3.upload(uploadParams).promise();
            this.updateDatasets(data, uploadParams.Key, '');
          }
        }
      },
      (error) => {
        // this.errorMessage = 'Upload file to S3 failed, please try again later.';
        this.errorMessage = JSON.stringify(error);
        setTimeout(() => {
          this.errorMessage = '';
        }, 10000);
        console.log(error);
        this.addLoading = false;
        this.nameExist = false;
      },
    );
  }

  updateDatasets(data, key, from) {
    const formData = new FormData();
    const params = {
      dsname:
        from == 'fromSingle' ? new Date().getTime() : this.uploadGroup.get('datasetsName').value,
      fileName: from == 'fromSingle' ? '' : this.inputFile.name,
      fileSize: from == 'fromSingle' ? '' : this.inputFile.size,
      format: null,
      hasHeader: null,
      fileKey: null,
      location: null,
      topReview: null,
      columnInfo: null,
      images: null,
    };
    if (key == 'image') {
      formData.append(
        'dsname',
        from == 'fromSingle' ? new Date().getTime() : this.uploadGroup.get('datasetsName').value,
      );
      formData.append('fileName', from == 'fromSingle' ? '' : this.inputFile.name);
      formData.append('fileSize', from == 'fromSingle' ? '' : this.inputFile.size);
      formData.append('format', 'image');
      formData.append('images', JSON.stringify(data));
    } else {
      if (data) {
        params.hasHeader = 'yes';
        params.fileKey = key;
        params.location = data.Key;
        params.topReview = { header: this.previewHeadDatas, topRows: this.previewContentDatas };
        params.columnInfo = this.columnInfo;
        params.format =
          this.projectType == 'tabular' ? 'tabular' : this.projectType == 'log' ? 'txt' : 'csv';
        if (this.projectType == 'log') {
          params['totalRows'] = this.uploadGroup.get('totalRow').value;
          const a = [];
          this.previewContentDatas.forEach((element) => {
            a.push({ fileName: element.name, fileContent: element.content.slice(0, 501) });
          });
          params.topReview = a;
        }
      } else {
        this.errorMessage = 'Upload failed, please try again later.';
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
        return;
      }
    }
    this.toPostDatasets(data, from, key, formData, params);
  }

  toPostDatasets(data, from, key, formData, params) {
    let postData;
    if (this.env.config.enableAWSS3) {
      postData = key == 'image' ? formData : params;
    } else {
      postData = formData;
    }
    this.avaService.uploadDateset(postData).subscribe(
      (res) => {
        const appendParams = {
          pname: this.projectName,
          isFile: true,
          selectedDataset: this.uploadGroup.get('datasetsName').value,
        };
        if (from == 'fromSingle') {
          appendParams.isFile = false;
          appendParams.selectedDataset = null;
        }
        if (this.projectType == 'image' && from == 'fromSingle') {
          appendParams['images'] = data;
        }
        this.appendSrs(appendParams);
      },
      (error) => {
        console.log('Error:', error);
        this.errorMessage = JSON.stringify(error);
        setTimeout(() => {
          this.errorMessage = '';
        }, 10000);
        this.addLoading = false;
        this.inputFile = null;
      },
    );
  }

  toPostBinary(from) {
    const formData = new FormData();
    const format =
      this.projectType == 'tabular'
        ? 'tabular'
        : this.projectType == 'log'
        ? 'txt'
        : this.projectType == 'image'
        ? 'image'
        : 'csv';
    formData.append('file', this.inputFile);
    formData.append(
      'dsname',
      from == 'fromSingle' ? new Date().getTime() : this.uploadGroup.get('datasetsName').value,
    );
    formData.append('format', format);
    formData.append('fileName', this.inputFile.name);
    formData.append('fileSize', this.inputFile.size);
    if (this.projectType == 'log') {
      const a = [];
      this.previewContentDatas.forEach((element) => {
        a.push({
          fileName: element.name,
          fileSize: element.size,
          fileContent: element.content.slice(0, 501),
        });
      });
      formData.append('topReview', JSON.stringify(a));
      formData.append('totalRows', this.uploadGroup.get('totalRow').value);
    } else if (
      this.projectType == 'text' ||
      this.projectType == 'tabular' ||
      this.projectType == 'ner'
    ) {
      formData.append('hasHeader', 'yes');
      formData.append(
        'topReview',
        JSON.stringify({ header: this.previewHeadDatas, topRows: this.previewContentDatas }),
      );
    }
    this.toPostDatasets(null, from, format, formData, null);
  }

  appendSrs(params) {
    this.addLoading = true;
    this.avaService.appendSrs(params).subscribe(
      (res) => {
        this.addLoading = false;
        this.inputFile = null;
        this.nameExist = false;
        this.uploadGroup.get('localFile').reset();
        this.uploadGroup.get('datasetsName').reset();
        this.router.navigateByUrl('/' + this.routeFrom);
        this.fixHeader = [];
        this.previewHeadDatas = [];
        this.previewContentDatas = [];
        this.uploadGroup.get('totalRow').setValue(0);
        this.nonEnglish = 0;
        this.columnInfo = [];
      },
      (error: any) => {
        this.appendErrMessage = error;
        console.log(error);
      },
    );
  }

  onImageChange(e, index) {
    if (e && e.target.files[0]) {
      if (this.UnZipService.validImageType(e.target.files[0].name)) {
        const image = e.target.files[0];
        this.newAddedData[index].name = image.name;
        this.newAddedData[index].sizeInkb = (image.size / 1024).toFixed(2);
        this.newAddedData[index].size = image.size;
        this.newAddedData[index].format = true;
        this.newAddedData[index].file = image;
        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onloadend = (e) => {
          this.newAddedData[index].src = reader.result;
        };
      } else {
        this.newAddedData[index].name = '/';
        this.newAddedData[index].size = '/';
        this.newAddedData[index].src = '/';
        this.newAddedData[index].sizeInkb = '/';
        this.newAddedData[index].format = false;
        this.newAddedData[index].file = null;
      }
    }
  }

  enterImage(index) {
    if (this.newAddedData[index].src !== '/') {
      const dom = this.el.nativeElement.querySelector('.' + 'labelBox' + index);
      this.renderer2.setStyle(dom, 'display', 'flex');
      const imageDom = this.el.nativeElement.querySelector('.' + 'image' + index);
      this.renderer2.setStyle(imageDom, 'opacity', '0.2');
    }
  }

  leaveImage(index) {
    if (this.newAddedData[index].src !== '/') {
      const dom = this.el.nativeElement.querySelector('.' + 'labelBox' + index);
      this.renderer2.setStyle(dom, 'display', 'none');
      const imageDom = this.el.nativeElement.querySelector('.' + 'image' + index);
      this.renderer2.setStyle(imageDom, 'opacity', '1');
    }
  }

  uploadImages(file, s3, s3Config) {
    let flag;
    this.UnZipService.unzipImages(file).then((e) => {
      flag = e;
      const entry = flag.entry;
      const realEntryLength = flag.realEntryLength;
      if (entry) {
        let outNo = '';
        for (let i = 0; i < 6; i++) {
          outNo += Math.floor(Math.random() * 10);
        }
        outNo = new Date().getTime() + outNo;
        let realEntryIndex = 0;
        const imagesLocation = [];
        const uploadEntries = [];
        const that = this;
        entry.forEach((path, file) => {
          if (!file.dir && that.UnZipService.validImageType(path)) {
            file.async('blob').then(async function (blob) {
              realEntryIndex++;
              const uploadParams = {
                Bucket: new Buffer(s3Config.bucket, 'base64').toString(),
                Key: new Buffer(s3Config.key, 'base64').toString() + '/' + outNo + '/' + path,
                Body: blob,
              };
              uploadEntries.push({
                uploadParams,
                fileName: path,
                fileSize: blob.size,
              });
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
                that.updateDatasets(imagesLocation, 'image', 'fromZip');
              }
            });
          }
        });
      }
    });
  }

  uploadSingleImage(outNo, s3, s3Config, entry) {
    const imagesLocation = [];
    const that = this;
    let realEntryIndex = 0;
    for (let i = 0; i < entry.length; i++) {
      const uploadParams = {
        Bucket: new Buffer(s3Config.bucket, 'base64').toString(),
        Key: new Buffer(s3Config.key, 'base64').toString() + '/' + outNo + '/' + entry[i].name,
        Body: entry[i].file,
      };
      s3.upload(uploadParams, async function (err, data) {
        if (err) {
          console.log('s3UploadError:::', err);
        }
        if (data) {
          await imagesLocation.push({
            fileName: entry[i].name,
            location: data.Key,
            fileSize: entry[i].size,
          });
          realEntryIndex++;
          if (realEntryIndex === entry.length) {
            const appendParams = {
              pname: that.projectName,
              isFile: false,
              projectType: that.projectType,
              images: imagesLocation,
            };
            that.appendSrs(appendParams);
          }
        }
      });
    }
  }

  notValidInputfile() {
    this.uploadGroup.get('localFile').setValue(null);
    this.uploadGroup.get('localFile').setValidators(null);
    this.uploadGroup.get('localFile').updateValueAndValidity();
    this.uploadGroup.get('selectedDataset').setValidators(DatasetValidator.required());
    this.uploadGroup.get('selectedDataset').updateValueAndValidity();
  }

  validInputfile(filename) {
    if (!this.env.config.enableAWSS3) {
      this.checkLocalFileExist(filename);
    } else {
      this.uploadGroup
        .get('localFile')
        .setValidators(
          DatasetValidator.localFile(this.projectType, this.env.config.enableAWSS3, false),
        );
    }
    this.uploadGroup.get('localFile').updateValueAndValidity();
    this.uploadGroup.get('selectedDataset').setValue(null);
    this.uploadGroup.get('selectedDataset').setValidators(null);
    this.uploadGroup.get('selectedDataset').updateValueAndValidity();
  }

  checkLocalFileExist(filename) {
    this.avaService.checkLocalFileExist(filename).subscribe((res) => {
      if (res) {
        this.uploadGroup
          .get('localFile')
          .setValidators(
            DatasetValidator.localFile(this.projectType, this.env.config.enableAWSS3, true),
          );
      } else {
        this.uploadGroup
          .get('localFile')
          .setValidators(
            DatasetValidator.localFile(this.projectType, this.env.config.enableAWSS3, false),
          );
      }
      this.uploadGroup.get('localFile').updateValueAndValidity();
    });
  }

  changeDatasetName(e) {
    if (
      this.uploadGroup.get('selectedDataset').value &&
      this.uploadGroup.get('selectedDataset').value !== ''
    ) {
      return;
    }
    this.userQuestionUpdate.next(e);
  }

  onTxtChange(e, index) {
    if (e && e.target.files[0]) {
      if (this.UnZipService.validTxtType(e.target.files[0].name)) {
        for (let i = 0; i < this.newAddedData.length; i++) {
          if (this.newAddedData[i].name == e.target.files[0].name) {
            this.newAddedData[index].name = '/';
            this.newAddedData[index].size = '/';
            this.newAddedData[index].sizeInkb = '/';
            this.newAddedData[index].format = false;
            this.newAddedData[index].file = null;
            this.newAddedData[index].fileContent = '/';
            this.newAddedData[index].unique = true;
            return;
          }
        }
        const txt = e.target.files[0];
        this.newAddedData[index].name = txt.name;
        this.newAddedData[index].sizeInkb = (txt.size / 1024).toFixed(2);
        this.newAddedData[index].size = txt.size;
        this.newAddedData[index].format = true;
        this.newAddedData[index].file = txt;
        const reader = new FileReader();
        reader.readAsText(txt);
        reader.onloadend = (e) => {
          this.newAddedData[index].fileContent = reader.result;
        };
      } else {
        this.newAddedData[index].name = '/';
        this.newAddedData[index].size = '/';
        this.newAddedData[index].sizeInkb = '/';
        this.newAddedData[index].format = false;
        this.newAddedData[index].file = null;
        this.newAddedData[index].fileContent = '/';
      }
    }
  }
}
