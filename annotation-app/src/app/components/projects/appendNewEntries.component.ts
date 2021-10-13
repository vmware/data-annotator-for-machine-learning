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
import { UnZipService } from 'app/services/common/up-zip.service';
import { EnvironmentsService } from 'app/services/environments.service';
import { ToolService } from 'app/services/common/tool.service';
import { S3Service } from 'app/services/common/s3.service';

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
  selectLabels: any = [];
  ticketQuestions: any = [];

  constructor(
    private route: ActivatedRoute,
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private formBuilder: FormBuilder,
    private router: Router,
    private el: ElementRef,
    private renderer2: Renderer2,
    private UnZipService: UnZipService,
    public env: EnvironmentsService,
    private toolService: ToolService,
    private s3Service: S3Service,
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
      selectLabels: [''],
      ticketQuestions: [''],
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
    let count;
    if (this.env.config.enableAWSS3) {
      this.s3Service
        .toCaculateTotalRow(choosedDataset, originalHead, this.previewContentDatas)
        .then((e) => {
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
              this.loadPreviewTable = false;
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
          const disabedLabels = [];
          this.sampleData.forEach(elem => {
            disabedLabels.push(elem.key);
          });
          for (let i = 0; i < this.previewHeadDatas.length; i++) {
            this.columnInfo.push({
              name: this.previewHeadDatas[i],
              isOriginal: true,
              labelSelected: false,
              labelSelectedDisable: disabedLabels.includes(this.previewHeadDatas[i]),
              textSelected: false,
              textSelectedDisable: false,
            });
          }
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
        if (this.projectType === 'ner') {
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
    this.addLoading = true;
    this.s3Service.uploadToS3(file, this.projectType, addMethod, this.newAddedData).then((e) => {
      if (e.err) {
        this.errorMessage = JSON.stringify(e.err);
        setTimeout(() => {
          this.errorMessage = '';
        }, 10000);
        console.log(e.err);
        this.addLoading = false;
        this.nameExist = false;
      } else {
        if (this.projectType == 'image') {
          if (addMethod == 'zip') {
            this.updateDatasets(e.data, 'image', 'fromZip');
          } else {
            this.newAddedData = e.newAddedData;
            const appendParams = {
              pname: this.projectName,
              isFile: false,
              projectType: this.projectType,
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
        // params.location = data.Key;
        params.location = data.key;
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

  changeLabelSelect(isSelected, data) {
    if (isSelected && (!this.selectLabels.includes(data))) {
      this.selectLabels.push(data);
    }
    if (!isSelected && this.selectLabels.length > 0 && this.selectLabels.includes(data)) {
      this.selectLabels.splice(this.selectLabels.indexOf(data), 1);
    }
    this.uploadGroup.get('selectLabels').setValue(this.selectLabels);
  }

  changeTextSelect(isSelected, data) {
    if (isSelected && (!this.ticketQuestions.includes(data))) {
      this.ticketQuestions.push(data);
    }
    if (!isSelected && this.ticketQuestions.length > 0 && this.ticketQuestions.includes(data)) {
      this.ticketQuestions.splice(this.ticketQuestions.indexOf(data), 1);
    }
    this.uploadGroup.get('ticketQuestions').setValue(this.ticketQuestions);
  }
}
