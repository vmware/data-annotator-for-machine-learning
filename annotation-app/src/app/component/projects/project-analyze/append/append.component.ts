/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Input, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAuthService } from '../../../../services/user-auth.service';
import { ApiService } from '../../../../services/api.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormGroup, FormBuilder } from '@angular/forms';
import { UploadData } from '../../../../model/index';
import { DatasetUtil } from 'src/app/model/index';
import { DatasetValidator } from '../../../../shared/form-validators/dataset-validator';
import { FormValidatorUtil } from '../../../../shared/form-validators/form-validator-util';
import { UnZipService } from 'src/app/services/common/up-zip.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { S3Service } from 'src/app/services/common/s3.service';

@Component({
  selector: 'app-append',
  templateUrl: './append.component.html',
  styleUrls: ['./append.component.scss'],
})
export class AppendComponent implements OnInit {
  @Input() msg: any;
  @ViewChild('uploadFile') uploadFile;

  isQuick: boolean = true;
  user: string;
  loading: boolean;
  errorMessage = '';
  infoMessage = '';
  refresh: any;
  sampleData: any = [];
  newAddedData: any = [];
  userQuestionUpdate = new Subject<string>();
  nameExist: boolean;
  uploadGroup: FormGroup;
  uploadSet: UploadData;
  inputFile: any;
  previewHeadDatas = [];
  previewContentDatas = [];
  loadPreviewTable: boolean;
  showPreviewTable: boolean;
  loadingPublish: boolean;
  fixHeader: any = [];
  originalHead: any = [];
  totalCase: number;
  nonEnglish: number;
  location: string;
  columnInfo: any;
  isLabelBoxShow = true;
  datasetsList: any = [];
  appendErrMessage: string;
  selectLabels: any = [];
  ticketQuestions: any = [];
  isShowExample: boolean;
  msgUploadFile;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private userAuthService: UserAuthService,
    private formBuilder: FormBuilder,
    private router: Router,
    private el: ElementRef,
    private renderer2: Renderer2,
    private UnZipService: UnZipService,
    public env: EnvironmentsService,
    private s3Service: S3Service,
  ) {
    this.user = this.userAuthService.loggedUser().user.email;

    this.userQuestionUpdate.pipe(debounceTime(400), distinctUntilChanged()).subscribe((value) => {
      if (value != '') {
        this.checkName(value);
      } else {
        this.nameExist = false;
      }
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.nameExist = false;
    this.loadPreviewTable = false;
    this.isShowExample = false;
    this.nonEnglish = 0;
    this.totalCase = 0;
    this.getAnExample();
    this.createUploadForm();
    this.getMyDatasets();
    this.msgUploadFile = {
      type:
        this.msg.projectType === 'tabular'
          ? 'tabular'
          : this.msg.projectType === 'image'
          ? 'image'
          : this.msg.projectType === 'log'
          ? 'txt'
          : 'csv',
      page: 'create',
    };
  }

  shiftBtnRadio(val) {
    if (val === 'quick') {
      this.isQuick = true;
    } else {
      this.isQuick = false;
    }
  }

  clickExample() {
    this.isShowExample = !this.isShowExample;
  }

  createUploadForm(): void {
    if (!this.uploadSet) {
      this.uploadSet = DatasetUtil.uploadInit();
    }
    this.uploadGroup = this.formBuilder.group({
      datasetsName: ['', DatasetValidator.modelName()],
      localFile: [null, DatasetValidator.localFile(this.msg.projectType, this.env.config.enableAWSS3, false)],
      selectedDataset: ['', DatasetValidator.required()],
      totalRow: [0, DatasetValidator.validRow()],
      selectLabels: [''],
      ticketQuestions: [''],
    });
  }

  private getAnExample() {
    if (this.msg.projectType == 'image') {
      const flag = {
        src: '/',
        name: '/',
        size: '/',
        sizeInkb: '/',
        format: true,
        file: File,
      };
      this.newAddedData.push(flag);
      this.loading = false;
    } else if (this.msg.projectType == 'log') {
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
      this.apiService.getSample(this.msg._id).subscribe(
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
          this.loading = false;
        },
      );
    }
  }

  addNewRow() {
    let a = {};
    const b = [];
    if (this.msg.projectType == 'image') {
      this.newAddedData.push({
        src: '/',
        name: '/',
        size: '/',
        sizeInkb: '/',
        format: true,
        file: File,
      });
    } else if (this.msg.projectType == 'log') {
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
    e.target.style.color = '#575757';
    this.newAddedData[row].map((element) => {
      if (element.key == column) {
        element.format = true;
      }
    });
  }

  uploadSingleImageToS3() {
    this.s3Service.uploadSingleImageToS3(this.newAddedData).then((e) => {
      this.newAddedData = e.newAddedData;
      this.uploadToS3(e.param1, e.param2);
    });
  }

  uploadSingleInFormdata() {
    const formData = new FormData();
    let images = [];
    this.newAddedData.forEach((element) => {
      if (element.format !== false && element.file && element.size > 0) {
        formData.append('file', element.file);
        images.push({ fileName: element.name, fileSize: element.size });
      }
      // if (this.msg.projectType === 'image') {
      //   images.push({ fileName: element.name, fileSize: element.size });
      // }
    });
    formData.append('pname', this.msg.projectName);
    formData.append('isFile', 'false');
    if (this.msg.projectType === 'image') {
      formData.append('projectType', this.msg.projectType);
      formData.append('images', JSON.stringify(images));
    }
    if (formData.get('file')) {
      this.appendSrs(formData);
    }
  }

  createNewRow() {
    if (this.msg.projectType == 'image') {
      if (this.env.config.enableAWSS3) {
        this.uploadSingleImageToS3();
      } else {
        this.uploadSingleInFormdata();
      }
    } else if (this.msg.projectType == 'log') {
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
          pname: this.msg.projectName,
          isFile: false,
          srdata,
        };
        this.appendSrs(params);
      }
    }
  }

  checkName(e) {
    this.apiService.findDatasetName(e).subscribe((res) => {
      if (res.length != 0) {
        this.nameExist = true;
      } else {
        this.nameExist = false;
      }
    });
  }

  private getMyDatasets() {
    const a =
      this.msg.projectType == 'text' || this.msg.projectType == 'tabular' || this.msg.projectType == 'ner'
        ? 'csv'
        : this.msg.projectType == 'image'
        ? 'image'
        : 'txt';
    this.apiService.getMyDatasets(a).subscribe(
      (res) => {
        if (this.msg.projectType == 'image') {
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
      (error: any) => {},
    );
  }

  toCaculateTotalRow(choosedDataset, originalHead) {
    let count;
    if (this.env.config.enableAWSS3) {
      this.s3Service.toCaculateTotalRow(choosedDataset, originalHead, this.previewContentDatas).then((e) => {
        this.totalCase = e.count;
        this.nonEnglish = e.nonEnglish;
        this.uploadGroup.get('totalRow').setValue(this.totalCase - this.nonEnglish);
        this.loadPreviewTable = false;
      });
    } else {
      const params = {
        columns: choosedDataset.topReview.header,
        location: choosedDataset.location,
        hasHeader: choosedDataset.hasHeader,
      };
      this.apiService.getSetData(params).subscribe(
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
          this.errorMessage = error.error.MSG || error.message;
          setTimeout(() => {
            this.errorMessage = '';
          }, 1000);
        },
      );
    }
  }

  selectedDatasets(e, uploadFile) {
    this.nonEnglish = 0;
    this.previewHeadDatas = [];
    this.previewContentDatas = [];
    this.totalCase = 0;
    this.notValidInputfile();
    this.uploadGroup.get('totalRow').setValue(0);
    this.columnInfo = [];
    this.inputFile = null;
    this.uploadGroup.get('localFile').setValue(null);
    uploadFile.deleteFile(0);

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
        if (this.msg.projectType == 'image' && choosedDataset.format == 'image') {
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
              element.location = `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
                element.location
              }&token=${JSON.parse(localStorage.getItem(this.env.config.sessionKey)).token.access_token}`;
              this.loadPreviewTable = false;
            }
          });
          this.previewContentDatas = flag;
          this.uploadGroup.get('totalRow').setValue(choosedDataset.images.length);
        } else if (this.msg.projectType == 'log') {
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
          this.setExistingLabelsforNer();
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

  onLocalFileChange(file) {
    if (file) {
      this.validInputfile(file.name);
      this.showPreviewTable = true;
      this.loadPreviewTable = true;
      this.inputFile = file;
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

      if (this.msg.projectType == 'image') {
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
              if (objectKey[i].split('/')[1] != '' && that.UnZipService.validImageType(objectKey[i])) {
                cc.push(objectKey[i]);
                if (cc.length == 3) {
                  break;
                }
              }
            }
            for (let j = 0; j < cc.length; j++) {
              entries.files[cc[j]].async('blob').then(function (blob) {
                let file = new File([blob], 'name', { type: 'image/jpeg' });
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = (r) => {
                  that.previewContentDatas.push({
                    _id: a++,
                    fileName: cc[j],
                    fileSize: (blob.size / 1024).toFixed(2),
                    location: reader.result,
                  });
                  that.loadPreviewTable = false;
                  that.uploadGroup.get('totalRow').setValue(flag.realEntryLength);
                };
              });
            }
          },
          (err) => {},
        );
      } else if (this.msg.projectType == 'log') {
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
    }
  }

  parseCSV() {
    let res;
    this.UnZipService.parseCSVChunk(this.inputFile, true, false, this.originalHead, this.previewContentDatas).then(
      (e) => {
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
        this.setExistingLabelsforNer();
        this.loadPreviewTable = false;
      },
    );
  }

  setExistingLabelsforNer() {
    if (this.msg.projectType == 'ner') {
      const enableLabels = this.msg.categoryList.split(',');
      for (let i = 0; i < this.previewHeadDatas.length; i++) {
        this.columnInfo.push({
          name: this.previewHeadDatas[i],
          isOriginal: true,
          labelSelected: false,
          labelSelectedDisable: this.msg.regression == true ? !enableLabels.includes(this.previewHeadDatas[i]) : true,
          textSelected: false,
          textSelectedDisable: false,
        });
      }
    }
  }

  createNewCsv() {
    this.uploadGroup.get('localFile').setValue(this.inputFile);
    FormValidatorUtil.markControlsAsTouched(this.uploadGroup);
    if (!this.uploadGroup.invalid && this.nameExist == false && this.fixHeader.length == 0) {
      this.loadingPublish = true;
      if (this.uploadGroup.get('localFile').value == null) {
        const appendParams = {
          pname: this.msg.projectName,
          isFile: true,
          selectedDataset: this.uploadGroup.get('selectedDataset').value,
        };
        if (this.msg.projectType === 'ner') {
          appendParams['ticketQuestions'] = this.uploadGroup.get('ticketQuestions').value;
          appendParams['selectLabels'] = this.uploadGroup.get('selectLabels').value;
        }
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
    this.loadingPublish = true;
    this.s3Service.uploadToS3(file, this.msg.projectType, addMethod, this.newAddedData).then((e) => {
      if (e.err) {
        this.errorMessage = JSON.stringify(e.err);
        setTimeout(() => {
          this.errorMessage = '';
        }, 10000);
        this.loadingPublish = false;
        this.nameExist = false;
      } else {
        if (this.msg.projectType == 'image') {
          if (addMethod == 'zip') {
            this.updateDatasets(e.data, 'image', 'fromZip');
          } else {
            this.newAddedData = e.newAddedData;
            const appendParams = {
              pname: this.msg.projectName,
              isFile: false,
              projectType: this.msg.projectType,
              images: e.imagesLocation,
            };
            this.appendSrs(appendParams);
          }
        } else {
          this.updateDatasets(e.data, e.key, e.from);
        }
      }
    });
  }

  updateDatasets(data, key, from) {
    const formData = new FormData();
    const params = {
      dsname: from == 'fromSingle' ? new Date().getTime() : this.uploadGroup.get('datasetsName').value,
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
        // params.location = data.Key;
        params.location = data.key;
        params.topReview = {
          header: this.previewHeadDatas,
          topRows: this.previewContentDatas,
        };
        params.columnInfo = this.columnInfo;
        params.format = this.msg.projectType == 'tabular' ? 'tabular' : this.msg.projectType == 'log' ? 'txt' : 'csv';
        if (this.msg.projectType == 'log') {
          params['totalRows'] = this.uploadGroup.get('totalRow').value;
          const a = [];
          this.previewContentDatas.forEach((element) => {
            a.push({
              fileName: element.name,
              fileContent: element.content.slice(0, 501),
            });
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
    this.apiService.uploadDateset(postData).subscribe(
      (res) => {
        const appendParams = {
          pname: this.msg.projectName,
          isFile: true,
          selectedDataset: this.uploadGroup.get('datasetsName').value,
        };
        if (from == 'fromSingle') {
          appendParams.isFile = false;
          appendParams.selectedDataset = null;
        }
        if (this.msg.projectType == 'image' && from == 'fromSingle') {
          appendParams['images'] = data;
        }
        if (this.msg.projectType === 'ner') {
          appendParams['ticketQuestions'] = this.uploadGroup.get('ticketQuestions').value;
          appendParams['selectLabels'] = this.uploadGroup.get('selectLabels').value;
        }
        this.appendSrs(appendParams);
      },
      (error) => {
        this.errorMessage = JSON.stringify(error);
        setTimeout(() => {
          this.errorMessage = '';
        }, 10000);
        this.loadingPublish = false;
        this.inputFile = null;
      },
    );
  }

  toPostBinary(from) {
    const formData = new FormData();
    const format =
      this.msg.projectType == 'tabular'
        ? 'tabular'
        : this.msg.projectType == 'log'
        ? 'txt'
        : this.msg.projectType == 'image'
        ? 'image'
        : 'csv';
    formData.append('file', this.inputFile);
    formData.append('dsname', from == 'fromSingle' ? new Date().getTime() : this.uploadGroup.get('datasetsName').value);
    formData.append('format', format);
    formData.append('fileName', this.inputFile.name);
    formData.append('fileSize', this.inputFile.size);
    if (this.msg.projectType == 'log') {
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
    } else if (this.msg.projectType == 'text' || this.msg.projectType == 'tabular' || this.msg.projectType == 'ner') {
      formData.append('hasHeader', 'yes');
      formData.append(
        'topReview',
        JSON.stringify({
          header: this.previewHeadDatas,
          topRows: this.previewContentDatas,
        }),
      );
    }
    this.toPostDatasets(null, from, format, formData, null);
  }

  appendSrs(params) {
    this.loadingPublish = true;
    this.apiService.appendSrs(params).subscribe(
      (res) => {
        this.loadingPublish = false;
        this.inputFile = null;
        this.nameExist = false;
        this.uploadGroup.get('localFile').reset();
        if (!this.isQuick) {
          this.uploadFile.deleteFile(0);
        }
        this.uploadGroup.get('datasetsName').reset();
        this.fixHeader = [];
        this.previewHeadDatas = [];
        this.previewContentDatas = [];
        this.uploadGroup.get('totalRow').setValue(0);
        this.nonEnglish = 0;
        this.columnInfo = [];
        // after publish to clean data and add new row
        this.newAddedData = [];
        this.getAnExample();
        this.showPreviewTable = false;
        this.uploadGroup.get('selectedDataset').reset();
        this.infoMessage = 'Succeed to append data.';
      },
      (error: any) => {
        this.loadingPublish = false;
        this.appendErrMessage = error;
        this.errorMessage = JSON.stringify(error);
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
        .setValidators(DatasetValidator.localFile(this.msg.projectType, this.env.config.enableAWSS3, false));
    }
    this.uploadGroup.get('localFile').updateValueAndValidity();
    this.uploadGroup.get('selectedDataset').setValue(null);
    this.uploadGroup.get('selectedDataset').setValidators(null);
    this.uploadGroup.get('selectedDataset').updateValueAndValidity();
  }

  checkLocalFileExist(filename) {
    this.apiService.checkLocalFileExist(filename).subscribe((res) => {
      if (res) {
        this.uploadGroup
          .get('localFile')
          .setValidators(DatasetValidator.localFile(this.msg.projectType, this.env.config.enableAWSS3, true));
      } else {
        this.uploadGroup
          .get('localFile')
          .setValidators(DatasetValidator.localFile(this.msg.projectType, this.env.config.enableAWSS3, false));
      }
      this.uploadGroup.get('localFile').updateValueAndValidity();
    });
  }

  changeDatasetName(e) {
    if (this.uploadGroup.get('selectedDataset').value && this.uploadGroup.get('selectedDataset').value !== '') {
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

  changeLabelSelect(isSelected, data) {
    if (isSelected && !this.selectLabels.includes(data)) {
      this.selectLabels.push(data);
    }
    if (!isSelected && this.selectLabels.length > 0 && this.selectLabels.includes(data)) {
      this.selectLabels.splice(this.selectLabels.indexOf(data), 1);
    }
    this.uploadGroup.get('selectLabels').setValue(this.selectLabels);
  }

  changeTextSelect(isSelected, data) {
    if (isSelected && !this.ticketQuestions.includes(data)) {
      this.ticketQuestions.push(data);
    }
    if (!isSelected && this.ticketQuestions.length > 0 && this.ticketQuestions.includes(data)) {
      this.ticketQuestions.splice(this.ticketQuestions.indexOf(data), 1);
    }
    this.uploadGroup.get('ticketQuestions').setValue(this.ticketQuestions);
  }

  receiveFile(file) {
    this.uploadGroup.get('localFile').setValue(file);
    this.onLocalFileChange(file);
    if (file == false) {
      this.showPreviewTable = false;
      this.nonEnglish = 0;
      this.nameExist = false;
      this.uploadGroup.get('datasetsName').reset();
      this.fixHeader = [];
      this.uploadGroup.get('totalRow').setValue(0);
      this.columnInfo = [];
    }
  }
}
