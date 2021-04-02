/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import 'rxjs/Rx'
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAuthService } from '../../services/user-auth.service';
import { AvaService } from "../../services/ava.service";
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormGroup, FormBuilder } from '@angular/forms';
import { UploadData } from '../../model/index';
import { DatasetUtil } from 'app/model/index';
import { DatasetValidator } from '../../shared/form-validators/dataset-validator';
import { FormValidatorUtil } from '../../shared/form-validators/form-validator-util';
import { Papa } from 'ngx-papaparse';
import AWS from 'aws-sdk/lib/aws';
import { Buffer } from 'buffer';
import { DomSanitizer } from '@angular/platform-browser';
import * as JSZip from 'jszip'
import { UnZipService } from 'app/services/common/up-zip.service';
@Component({
    selector: 'app-append',
    templateUrl: './appendNewEntries.component.html',
    styleUrls: ['./appendNewEntries.component.scss']
})
export class AppendNewEntriesComponent implements OnInit {


    user: string;
    loading: boolean;
    errorMessage: string = '';
    infoMessage: string = '';
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
    isLabelBoxShow: boolean = true;
    datasetsList: any = [];
    unzipEntry = new Subject<any>();
    flagSubscription: Subscription;


    constructor(
        private route: ActivatedRoute,
        private avaService: AvaService,
        private userAuthService: UserAuthService,
        private formBuilder: FormBuilder,
        private papa: Papa,
        private router: Router,
        private el: ElementRef,
        private renderer2: Renderer2,
        private sanitizer: DomSanitizer,
        private UnZipService: UnZipService

    ) {
        this.user = this.userAuthService.loggedUser().email;
        this.route.queryParams.subscribe(params => {
            this.projectId = params['id'];
            this.projectName = params['name'];
            this.routeFrom = params['from'];
            this.projectType = params['projectType'];
        });

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
            localFile: [null, DatasetValidator.localFile(this.projectType)],
            selectedDataset: ["", DatasetValidator.required()],
            totalRow: [0, DatasetValidator.validRow()]
        });
    }

    private getAnExample() {
        if (this.projectType == 'image') {
            let flag = { src: "/", name: '/', size: '/', sizeInkb: '/', format: true, file: File };
            this.newAddedData.push(flag);
            this.loading = false;

        } else if (this.projectType == 'log') {
            let flag = { name: '/', size: '/', sizeInkb: '/', format: true, file: null, fileContent: '/' };
            this.newAddedData.push(flag);
            this.loading = false;

        } else {
            this.avaService.getSample(this.projectId).subscribe(res => {
                this.sampleData = res.sampleSr;
                let flag = {};
                for (let i = 0; i < this.sampleData.length; i++) {
                    flag = { key: this.sampleData[i].key, value: '', format: true }
                    this.newAddedData.push(flag);
                    this.originalHead.push(this.sampleData[i].key)
                }
                this.newAddedData = [this.newAddedData];
                this.loading = false;

            }, (error: any) => {
                console.log(error);
                this.loading = false;
            });
        }

    }

    addNewRow() {
        let a = {};
        let b = [];
        if (this.projectType == 'image') {
            this.newAddedData.push({ src: "/", name: '/', size: '/', sizeInkb: '/', format: true, file: File })
        } else if (this.projectType == 'log') {
            this.newAddedData.push({ name: '/', size: '/', sizeInkb: '/', format: true, file: null, fileContent: '/' })

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
        // console.log(e.target.value);
        // console.log(e);
        // console.log(row, column);
        // console.log('inputDescription_newAddedData:', this.newAddedData)

        if (!this.isASCII(e.target.value)) {
            e.target.style.color = 'red';
            this.newAddedData[row].map(element => {
                if (element.key == column) {
                    element.format = false;

                }
            });
        } else {
            e.target.style.color = '#575757';
            this.newAddedData[row].map(element => {
                if (element.key == column) {
                    element.format = true;
                }
            });
        }
    }


    createNewRow() {

        if (this.projectType == 'image') {
            const flag = function (param) {
                return new Promise(function (resolve, reject) {
                    let aa = true;
                    param.forEach(element => {
                        if (element.format == false) {
                            aa = false
                        }
                    });
                    resolve(aa);
                })
            };
            flag(this.newAddedData).then((e) => {
                if (e) {
                    for (let i = 0; i < this.newAddedData.length; i++) {
                        if (this.newAddedData[i].src == '/' && this.newAddedData[i].size == '/') {
                            this.newAddedData.splice(i, 1);
                        }
                    };
                    if (this.newAddedData.length > 0) {
                        this.uploadToS3(null, 'single');
                    }
                }
            })



        } else if (this.projectType == 'log') {
            let formData = new FormData();
            this.newAddedData.forEach(element => {
                if (element.format !== false && element.file) {
                    formData.append('file', element.file);
                }
            });
            formData.append('pname', this.projectName)
            formData.append('isFile', 'false')
            if (formData.get('file')) {
                this.appendSrs(formData);
            }
        } else {
            let srdata = [];
            let allValue = [];
            for (let i = 0; i < this.newAddedData.length; i++) {
                let flag = {};
                let rowArry = [];
                for (let j = 0; j < this.newAddedData[i].length; j++) {
                    if (this.newAddedData[i][j].format == false) {
                        return;
                    };
                    allValue.push(this.newAddedData[i][j].value);
                    rowArry.push(this.newAddedData[i][j].value)
                    flag[this.newAddedData[i][j].key] = this.newAddedData[i][j].value;
                }
                if (rowArry.join('').replace(/(\r\n|\r|\n|\n\r)/g, '').replace(/\s*/g, "") !== '') {
                    srdata.push(flag);
                }
            }
            if (allValue.join('') !== '' && srdata.length > 0) {
                let params = {
                    pname: this.projectName,
                    isFile: false,
                    srdata: srdata
                };
                this.appendSrs(params);
            };
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
    };


    private getMyDatasets() {
        let a = (this.projectType == 'text' || this.projectType == 'tabular' || this.projectType == 'ner') ? 'csv' : (this.projectType == 'image' ? 'image' : 'txt')
        this.avaService.getMyDatasets(a).subscribe(
            (res) => {
                if (this.projectType == 'image') {
                    let flag = [];
                    res.forEach((element) => {
                        if (element.format == 'image') {
                            flag.push(element)
                        }
                    });
                    this.datasetsList = flag;

                } else {
                    let flag = [];
                    res.forEach((element) => {
                        if (element.format !== 'image') {
                            flag.push(element)
                        }
                    });
                    this.datasetsList = flag;
                }
            },
            (error: any) => {
                console.log(error);
            }
        );
    };


    toCaculateTotalRow(choosedDataset, originalHead) {
        let indexArray = [];
        for (let k = 0; k < choosedDataset.topReview.header.length; k++) {
            indexArray.push(originalHead.indexOf(choosedDataset.topReview.header[k]));
        }
        this.avaService.getCloudUrl(choosedDataset.id).subscribe(
            (res) => {
                let count = 0;
                let invalidCount = 0;
                this.papa.parse(res, {
                    header: false,
                    download: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    worker: true,
                    error: (error) => {
                        // console.log('parse_error: ', error);
                    },
                    chunk: (results, parser) => {
                        let chunkData = results.data;
                        count += chunkData.length;
                        let newArray = [];

                        for (let a = 0; a < chunkData.length; a++) {
                            let newArray2 = [];
                            for (let c = 0; c < indexArray.length; c++) {
                                newArray2.push(chunkData[a][indexArray[c]]);
                            };
                            newArray.push(newArray2);
                        };

                        for (let b = 0; b < newArray.length; b++) {
                            if (_.sortedUniq(newArray[b]).length == 1 && _.sortedUniq(newArray[b])[0] == null) {
                                invalidCount += 1;
                            } else {
                                for (let j = 0; j < newArray[b].length; j++) {
                                    if (!this.isASCII(String(newArray[b][j]).trim())) {
                                        invalidCount += 1;
                                        break;
                                    }
                                }
                            }
                        }
                    },
                    complete: (result) => {

                        if (choosedDataset.hasHeader == 'yes') { count = count - 1; };
                        this.totalCase = count;
                        this.nonEnglish = invalidCount;
                        // this.totalRow = this.totalCase - this.nonEnglish;
                        this.uploadGroup.get("totalRow").setValue(this.totalCase - this.nonEnglish);
                        this.loadPreviewTable = false;
                    }
                });
            },
            (error) => {
                console.log("Error:", error);
            }
        );
    }


    selectedDatasets(e) {
        this.nonEnglish = 0;
        this.previewHeadDatas = [];
        this.previewContentDatas = [];
        this.totalCase = 0;
        this.notValidInputfile();
        this.uploadGroup.get("totalRow").setValue(0);
        this.columnInfo = [];
        this.inputFile = null;
        this.uploadGroup.get('localFile').setValue(null);


        // to toggle the name input
        this.uploadGroup.get("datasetsName").setValue(e.target.value)
        this.uploadGroup.get("datasetsName").disable();
        this.nameExist = false;

        for (let i = 0; i < this.datasetsList.length; i++) {
            if (this.datasetsList[i].dataSetName === e.target.value) {
                let choosedDataset = this.datasetsList[i];
                this.location = choosedDataset.location;
                this.showPreviewTable = true;
                this.loadPreviewTable = true;
                if (this.projectType == 'image' && choosedDataset.format == 'image') {
                    this.previewHeadDatas = ['Id', 'ImageName', 'ImageSize(KB)', 'Image'];
                    let a = 0;
                    choosedDataset.topReview.forEach(element => {
                        element.fileSize = (element.fileSize / 1024).toFixed(2);
                        let img = new Image();
                        img.src = element.location;
                        let m = this;
                        img.onload = function () {
                            a++;
                            if (a == Math.round((choosedDataset.topReview.length) / 2)) {
                                m.loadPreviewTable = false;
                            }
                        }
                    });
                    this.previewContentDatas = choosedDataset.topReview;
                    this.uploadGroup.get("totalRow").setValue(choosedDataset.images.length);
                } else if (this.projectType == 'log') {
                    this.previewHeadDatas = ['FileName', 'FileSize(KB)', 'FileContent'];
                    let a = [];
                    choosedDataset.topReview.forEach(element => {
                        a.push({ name: element.fileName, size: (element.fileSize / 1024).toFixed(2), content: element.fileContent })
                    });
                    this.previewContentDatas = a;
                    this.uploadGroup.get("totalRow").setValue(choosedDataset.totalRows);
                    this.loadPreviewTable = false;
                } else {
                    this.previewHeadDatas = choosedDataset.topReview.header;
                    this.previewContentDatas = choosedDataset.topReview.topRows;
                    this.fixHeader = _.difference(this.originalHead, this.previewHeadDatas);
                    if (this.fixHeader.length == 0) {
                        this.toCaculateTotalRow(choosedDataset, this.originalHead)
                    } else {
                        this.loadPreviewTable = false;
                    }
                };
                return;
            };
        }
    }


    onLocalFileChange(event) {
        if (event.target.files.length > 0) {
            this.validInputfile();
            this.showPreviewTable = true;
            this.loadPreviewTable = true;
            this.inputFile = event.target.files[0];
            // to toggle the name input
            this.uploadGroup.get("datasetsName").enable();
            this.uploadGroup.get("selectedDataset").setValue(null);
            this.changeDatasetName(this.uploadGroup.get("datasetsName").value)
            this.fixHeader = [];
            this.previewHeadDatas = [];
            this.previewContentDatas = [];
            this.uploadGroup.get("totalRow").setValue(0);
            this.nonEnglish = 0;
            this.columnInfo = [];
            this.uploadGroup.get('localFile').setValue(this.inputFile);
            // this.unzipEntry.next(null);


            if (this.projectType == 'tabular') {
                this.parseTabular();
            } else if (this.projectType == 'image') {
                this.previewHeadDatas = ['Id', 'ImageName', 'ImageSize(KB)', 'Image'];
                this.localUnzipGetEntries(this.inputFile);
                this.flagSubscription = this.unzipEntry.subscribe(e => {
                    // to preview the img
                    let entries = e.entry;
                    let a = 1
                    var that = this;
                    let objectKey = Object.keys(entries.files)
                    let cc = []
                    for (let i = 0; i < objectKey.length; i++) {
                        if (objectKey[i].split('/')[1] != '' && that.UnZipService.validImageType(objectKey[i])) {
                            cc.push(objectKey[i])
                            if (cc.length == 3) { break }
                        }
                    }
                    for (let j = 0; j < cc.length; j++) {
                        entries.files[cc[j]].async('blob').then(function (blob) {
                            let reader = new FileReader();
                            reader.readAsDataURL(blob);
                            reader.onloadend = (r) => {
                                that.previewContentDatas.push({ _id: a++, fileName: cc[j], fileSize: (blob.size / 1024).toFixed(2), location: that.sanitizer.bypassSecurityTrustUrl((reader.result).toString()) })
                                that.loadPreviewTable = false;
                                that.uploadGroup.get("totalRow").setValue(e.realEntryLength);
                                that.flagSubscription.unsubscribe();
                            };
                        })
                    }
                }, (err) => {
                    console.log(err)
                });
            } else if (this.projectType == 'log') {
                this.previewHeadDatas = ['FileName', 'FileSize(KB)', 'FileContent'];
                let flag;
                if (this.inputFile.name.split('.').pop().toLowerCase() == 'zip') {
                    this.UnZipService.unZip(this.inputFile).then(e => {
                        flag = e;
                        this.previewContentDatas = flag.previewExample;
                        this.uploadGroup.get("totalRow").setValue(flag.exampleEntries);
                        this.loadPreviewTable = false;

                    });
                } else if (this.inputFile.name.split('.').pop().toLowerCase() == 'tgz') {
                    this.UnZipService.unTgz(this.inputFile).then(e => {
                        flag = e;
                        this.previewContentDatas = flag.previewExample;
                        this.uploadGroup.get("totalRow").setValue(flag.exampleEntries);
                        this.loadPreviewTable = false;
                        // setTimeout(() => {
                        //     this.previewContentDatas = flag.previewExample;
                        //     this.previewContentDatas.forEach(element => {
                        //         topReview.push({ fileName: element.name, fileSize: element.size, fileContent: element.content })
                        //     });
                        //     this.previewContentDatas = topReview;
                        //     this.uploadGroup.get("totalRow").setValue(flag.exampleEntries);
                        //     this.loadPreviewTable = false;
                        // }, 1000);

                    });
                };
            } else {
                this.parseCSV();
            };
            event.target.value = '';
        }
    }





    parseCSV() {
        // let previewData = [];
        let count = 0;
        let invalidCount = 0;
        let indexArray = [];
        for (let k = 0; k < this.originalHead.length; k++) {
            indexArray.push(this.previewHeadDatas.indexOf(this.originalHead[k]));
        };
        this.papa.parse(this.inputFile, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            worker: true,
            error: (error) => {
                console.log('parse_error: ', error);
            },
            chunk: (results, parser) => {

                let chunkData = results.data;
                let newArray = [];
                let previewData = [];
                count += chunkData.length;
                previewData = chunkData;
                this.previewHeadDatas = _.keys(previewData[0]);
                if (this.previewContentDatas.length < 5) {
                    for (let i = 0; i < previewData.length; i++) {
                        if (!(_.sortedUniq(_.values(previewData[i])).length == 1 && _.sortedUniq(_.values(previewData[i]))[0] == null)) {
                            this.previewContentDatas.push(_.values(previewData[i]))
                        };
                        if (this.previewContentDatas.length > 4) { break; };

                    };
                }

                for (let a = 0; a < chunkData.length; a++) {
                    let newArray2 = [];
                    for (let c = 0; c < this.originalHead.length; c++) {
                        let key = this.originalHead[c];
                        newArray2.push(chunkData[a][key]);
                    }
                    newArray.push(newArray2);

                };
                for (let b = 0; b < newArray.length; b++) {
                    if (_.sortedUniq(newArray[b]).length == 1 && _.sortedUniq(newArray[b])[0] == null) {
                        invalidCount += 1;
                        // console.log('empty' + b + ':', newArray[b])
                    } else {
                        for (let j = 0; j < newArray[b].length; j++) {
                            if (!this.isASCII(String(newArray[b][j]).trim())) {
                                invalidCount += 1;
                                break;
                            }
                        }
                    }
                };
            },
            complete: () => {
                this.fixHeader = _.difference(this.originalHead, this.previewHeadDatas);
                if (this.fixHeader.length == 0) {
                    this.totalCase = count;
                    this.nonEnglish = invalidCount;
                    // this.totalRow = this.totalCase - this.nonEnglish
                    this.uploadGroup.get("totalRow").setValue(this.totalCase - this.nonEnglish);
                }
                this.columnInfo = [];
                this.loadPreviewTable = false;
            }
        });

    }

    parseTabular() {
        // let previewData = [];
        let count = 0;
        let invalidCount = 0;
        let indexArray = [];
        for (let k = 0; k < this.originalHead.length; k++) {
            indexArray.push(this.previewHeadDatas.indexOf(this.originalHead[k]));
        };
        this.papa.parse(this.inputFile, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            error: (error) => {
                console.log('parse_error: ', error);
            },
            complete: (result) => {
                let chunkData = result.data;
                let newArray = [];
                let previewData = [];
                let tabularArray = [];
                count = chunkData.length;
                previewData = chunkData;
                this.previewHeadDatas = _.keys(previewData[0]);
                for (let i = 0; i < previewData.length; i++) {
                    if (!(_.sortedUniq(_.values(previewData[i])).length == 1 && _.sortedUniq(_.values(previewData[i]))[0] == null)) {
                        this.previewContentDatas.push(_.values(previewData[i]))
                    };
                    if (this.previewContentDatas.length > 4) { break; };

                };
                for (let a = 0; a < chunkData.length; a++) {
                    let newArray2 = [];
                    for (let c = 0; c < this.originalHead.length; c++) {
                        let key = this.originalHead[c];
                        newArray2.push(chunkData[a][key]);
                    }
                    newArray.push(newArray2);

                };
                for (let b = 0; b < newArray.length; b++) {
                    if (_.sortedUniq(newArray[b]).length == 1 && _.sortedUniq(newArray[b])[0] == null) {
                        invalidCount += 1;
                    } else {
                        for (let j = 0; j < newArray[b].length; j++) {
                            if (!this.isASCII(String(newArray[b][j]).trim())) {
                                invalidCount += 1;
                                break;
                            }
                        }
                    }
                };
                this.fixHeader = _.difference(this.originalHead, this.previewHeadDatas);
                if (this.fixHeader.length == 0) {
                    this.totalCase = count;
                    this.nonEnglish = invalidCount;
                    // this.totalRow = this.totalCase - this.nonEnglish
                    this.uploadGroup.get("totalRow").setValue(this.totalCase - this.nonEnglish);

                }
                for (let a = 0; a < chunkData.length; a++) {
                    let newArray2 = [];
                    for (let c = 0; c < this.previewHeadDatas.length; c++) {
                        let key = this.previewHeadDatas[c];
                        newArray2.push(chunkData[a][key]);
                    }
                    tabularArray.push(newArray2);

                };
                this.caculateColumnInfo(this.previewHeadDatas, tabularArray, 'no')
                this.loadPreviewTable = false;
            }
        });
    }


    caculateColumnInfo(head, data, header) {
        let newData = [];
        let columnInfo = [];
        let j;
        header == "yes" ? j = 1 : j = 0;
        head.forEach(element => {
            newData.push([]);
            columnInfo.push({ name: element, type: '', uniqueLength: 0 })
        });
        for (j; j < data.length; j++) {
            for (let k = 0; k < data[j].length; k++) {
                newData[k].push(data[j][k]);
            }
        }
        newData.forEach((element, index) => {
            let dataLength = _.uniq(_.without(element, null)).length;
            dataLength > 50 ? columnInfo[index].type = "Numeric" : columnInfo[index].type = "Categorical";
            columnInfo[index].uniqueLength = dataLength;

        });
        this.columnInfo = columnInfo;
    }



    createNewCsv() {
        this.uploadGroup.get('localFile').setValue(this.inputFile);
        FormValidatorUtil.markControlsAsTouched(this.uploadGroup);
        if (!this.uploadGroup.invalid && this.nameExist == false && this.fixHeader.length == 0) {
            this.addLoading = true;
            if (this.uploadGroup.get('localFile').value == null) {
                // let appendParams = {
                //     pname: this.projectName,
                //     isFile: true,
                //     selectedHeaders: this.originalHead,
                //     location: this.location,
                //     projectType: this.projectType,
                //     selectedDataset: this.uploadGroup.get('selectedDataset').value,
                // }
                let appendParams = {
                    pname: this.projectName,
                    isFile: true,
                    selectedDataset: this.uploadGroup.get('selectedDataset').value,
                }
                this.appendSrs(appendParams);

            } else {
                this.uploadToS3(this.inputFile, 'zip');
            }

        }
    }


    uploadToS3(file, addMethod) {
        this.addLoading = true;
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
                if (this.projectType == 'image') {
                    if (addMethod == 'zip') {
                        this.uploadImages(file, s3, res);
                    } else {
                        let aa = [];
                        this.newAddedData.forEach(element => {
                            if (element.format !== false && element.src !== '/' && element.size !== '/') {
                                aa.push(element)
                            }
                        });
                        this.newAddedData = aa;
                        if (this.newAddedData.length > 0) {
                            this.uploadSingleImage(outNo, s3, res, this.newAddedData)
                        }
                    }

                } else {
                    let uploadParams = { Bucket: new Buffer(res.bucket, 'base64').toString(), Key: new Buffer(res.key, 'base64').toString() + '/' + outNo + '_' + file.name, Body: file };
                    let data = await s3.upload(uploadParams).promise();
                    this.updateDatasets(data, uploadParams.Key, '');
                }
            };
        }, error => {
            this.errorMessage = 'Upload file to S3 failed, please try again later.';
            setTimeout(() => {
                this.errorMessage = '';
            }, 10000);
            console.log(error);
            this.addLoading = false;
            this.nameExist = false;

        });

    }




    updateDatasets(data, key, from) {
        let formData = new FormData();
        let params = {
            dsname: from == 'fromSingle' ? new Date().getTime() : this.uploadGroup.get('datasetsName').value,
            fileName: from == 'fromSingle' ? '' : this.inputFile.name,
            fileSize: from == 'fromSingle' ? '' : this.inputFile.size,
            format: null,
            hasHeader: null,
            fileKey: null,
            location: null,
            topReview: null,
            columnInfo: null,
            images: null
        };
        if (key == 'image') {
            formData.append("dsname", from == 'fromSingle' ? new Date().getTime() : this.uploadGroup.get('datasetsName').value);
            formData.append("fileName", from == 'fromSingle' ? '' : this.inputFile.name);
            formData.append("fileSize", from == 'fromSingle' ? '' : this.inputFile.size);
            formData.append("format", 'image');
            formData.append("images", JSON.stringify(data));
        } else {
            if (data) {

                params.hasHeader = 'yes';
                params.fileKey = key;
                params.location = data.Key;
                params.topReview = { header: this.previewHeadDatas, topRows: this.previewContentDatas };
                params.columnInfo = this.columnInfo;
                params.format = this.projectType == 'tabular' ? 'tabular' : (this.projectType == 'log' ? 'txt' : 'csv');
                if (this.projectType == 'log') {
                    params['totalRows'] = this.uploadGroup.get("totalRow").value;
                    let a = [];
                    this.previewContentDatas.forEach(element => {
                        a.push({ fileName: element.name, fileSize: element.size, fileContent: element.content.slice(0, 501) })
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
        };


        this.avaService.uploadDateset(key == 'image' ? formData : params).subscribe(res => {
            // let appendParams = {
            //     pname: this.projectName,
            //     isFile: from == 'fromSingle' ? false : true,
            //     selectedHeaders: this.originalHead,
            //     location: this.projectType == 'image' ? null : data.Key,
            //     projectType: this.projectType,
            //     images: (this.projectType == 'image' && from == 'fromSingle') ? data : [],
            //     selectedDataset: from == 'fromSingle' ? null : this.uploadGroup.get('datasetsName').value,

            // };
            let appendParams = {
                pname: this.projectName,
                isFile: true,
                selectedDataset: this.uploadGroup.get('datasetsName').value,
            };
            if (from == 'fromSingle') {
                appendParams.isFile = false;
                appendParams.selectedDataset = null;
            };
            if (this.projectType == 'image' && from == 'fromSingle') {
                appendParams['images'] = data;
            }
            this.appendSrs(appendParams);
        }, error => {
            console.log('Error:', error);
            this.errorMessage = 'Save file into db failed, please try again later.';
            setTimeout(() => {
                this.errorMessage = '';
            }, 10000);
            this.addLoading = false;
            this.inputFile = null;
        }
        );
    }


    appendSrs(params) {
        this.addLoading = true;
        this.avaService.appendSrs(params).subscribe(res => {
            this.addLoading = false;
            this.inputFile = null;
            this.nameExist = false;
            this.uploadGroup.get('localFile').reset();
            this.uploadGroup.get('datasetsName').reset();
            this.router.navigateByUrl('/' + this.routeFrom);
            this.fixHeader = [];
            this.previewHeadDatas = [];
            this.previewContentDatas = [];
            this.uploadGroup.get("totalRow").setValue(0);
            this.nonEnglish = 0;
            this.columnInfo = [];

        }, (error: any) => {
            console.log(error);
        });
    };


    onImageChange(e, index) {
        if (e && e.target.files[0]) {
            if (this.UnZipService.validImageType(e.target.files[0].name)) {
                let image = e.target.files[0];
                this.newAddedData[index].name = image.name;
                this.newAddedData[index].sizeInkb = (image.size / 1024).toFixed(2);
                this.newAddedData[index].size = image.size;
                this.newAddedData[index].format = true;
                this.newAddedData[index].file = image;
                let reader = new FileReader();
                reader.readAsDataURL(image);
                reader.onloadend = (e) => {
                    this.newAddedData[index].src = reader.result
                }
            } else {
                this.newAddedData[index].name = '/';
                this.newAddedData[index].size = '/';
                this.newAddedData[index].src = '/';
                this.newAddedData[index].sizeInkb = '/'
                this.newAddedData[index].format = false;
                this.newAddedData[index].file = null;

            }

        }
    };



    enterImage(index) {
        if (this.newAddedData[index].src !== '/') {
            let dom = this.el.nativeElement.querySelector('.' + "labelBox" + index);
            this.renderer2.setStyle(dom, "display", "flex");
            let imageDom = this.el.nativeElement.querySelector('.' + "image" + index);
            this.renderer2.setStyle(imageDom, "opacity", "0.2");
        }

    };


    leaveImage(index) {
        if (this.newAddedData[index].src !== '/') {
            let dom = this.el.nativeElement.querySelector('.' + "labelBox" + index);
            this.renderer2.setStyle(dom, "display", "none");
            let imageDom = this.el.nativeElement.querySelector('.' + "image" + index);
            this.renderer2.setStyle(imageDom, "opacity", "1");

        }
    };



    localUnzipGetEntries(inputFile) {

        let jsZip = new JSZip();
        var that = this;
        jsZip.loadAsync(inputFile).then(function (entries) {
            let realEntryLength = 0;
            entries.forEach((path, file) => {
                if (!file.dir && that.UnZipService.validImageType(path)) {
                    realEntryLength++
                }
            });
            that.unzipEntry.next({ entry: entries, realEntryLength: realEntryLength });
            return that.unzipEntry.asObservable();

        });
    };


    uploadImages(file, s3, s3Config) {
        this.localUnzipGetEntries(file);
        this.unzipEntry.subscribe(e => {
            let entry = e.entry;
            let realEntryLength = e.realEntryLength
            if (entry) {
                let outNo = "";
                for (let i = 0; i < 6; i++) { outNo += Math.floor(Math.random() * 10); }
                outNo = new Date().getTime() + outNo;
                let realEntryIndex = 0;
                let imagesLocation = [];
                let uploadEntries = [];
                let that = this;
                entry.forEach((path, file) => {
                    if (!file.dir && that.UnZipService.validImageType(path)) {
                        file.async('blob').then(async function (blob) {
                            realEntryIndex++;
                            let uploadParams = { Bucket: new Buffer(s3Config.bucket, 'base64').toString(), Key: new Buffer(s3Config.key, 'base64').toString() + '/' + outNo + '/' + path, Body: blob };
                            uploadEntries.push({ uploadParams: uploadParams, fileName: path, fileSize: blob.size });
                            if (realEntryIndex == realEntryLength) {
                                while (uploadEntries.length) {
                                    await Promise.all(uploadEntries.splice(0, 500).map(async e => {
                                        await s3.upload(e.uploadParams).promise().then(function (data, err) {
                                            if (err) {
                                                console.log('uploadImageErr:::', err)
                                            };
                                            if (data) {
                                                imagesLocation.push({ fileName: e.fileName, location: data.Key, fileSize: e.fileSize })
                                            }
                                        })
                                    }));
                                };
                                that.updateDatasets(imagesLocation, 'image', 'fromZip')
                            }

                        })
                    }
                })
            }
        })
    };


    uploadSingleImage(outNo, s3, s3Config, entry) {
        let imagesLocation = [];
        var that = this;
        let realEntryIndex = 0;
        for (let i = 0; i < entry.length; i++) {
            let uploadParams = { Bucket: new Buffer(s3Config.bucket, 'base64').toString(), Key: new Buffer(s3Config.key, 'base64').toString() + '/' + outNo + '/' + entry[i].name, Body: entry[i].file };
            s3.upload(uploadParams, async function (err, data) {
                if (err) { console.log("s3UploadError:::", err) };
                if (data) {
                    await imagesLocation.push({ fileName: entry[i].name, location: data.Key, fileSize: entry[i].size });
                    realEntryIndex++;
                    if (realEntryIndex === entry.length) {
                        let appendParams = {
                            pname: that.projectName,
                            isFile: false,
                            projectType: that.projectType,
                            images: imagesLocation,
                        }
                        that.appendSrs(appendParams);
                    }
                }
            });
        }
    }



    notValidInputfile() {
        this.uploadGroup.get("localFile").setValue(null);
        this.uploadGroup.get("localFile").setValidators(null);
        this.uploadGroup.get("localFile").updateValueAndValidity();
        this.uploadGroup.get("selectedDataset").setValidators(DatasetValidator.required());
        this.uploadGroup.get("selectedDataset").updateValueAndValidity();

    };


    validInputfile() {
        this.uploadGroup.get("localFile").setValidators(DatasetValidator.localFile(this.projectType));
        this.uploadGroup.get("localFile").updateValueAndValidity();
        this.uploadGroup.get("selectedDataset").setValue(null);
        this.uploadGroup.get("selectedDataset").setValidators(null);
        this.uploadGroup.get("selectedDataset").updateValueAndValidity();

    };


    changeDatasetName(e) {
        if (this.uploadGroup.get("selectedDataset").value && this.uploadGroup.get("selectedDataset").value !== '') {
            return;
        };
        this.userQuestionUpdate.next(e);
    }


    onTxtChange(e, index) {
        if (e && e.target.files[0]) {
            if (this.UnZipService.validTxtType(e.target.files[0].name)) {

                for (let i = 0; i < this.newAddedData.length; i++) {
                    if (this.newAddedData[i].name == e.target.files[0].name) {
                        this.newAddedData[index].name = '/';
                        this.newAddedData[index].size = '/';
                        this.newAddedData[index].sizeInkb = '/'
                        this.newAddedData[index].format = false;
                        this.newAddedData[index].file = null;
                        this.newAddedData[index].fileContent = '/';
                        this.newAddedData[index].unique = true;
                        return;
                    }
                }
                let txt = e.target.files[0];
                this.newAddedData[index].name = txt.name;
                this.newAddedData[index].sizeInkb = (txt.size / 1024).toFixed(2);
                this.newAddedData[index].size = txt.size;
                this.newAddedData[index].format = true;
                this.newAddedData[index].file = txt;
                let reader = new FileReader();
                reader.readAsText(txt);
                reader.onloadend = (e) => {
                    this.newAddedData[index].fileContent = reader.result
                };
            } else {
                this.newAddedData[index].name = '/';
                this.newAddedData[index].size = '/';
                this.newAddedData[index].sizeInkb = '/'
                this.newAddedData[index].format = false;
                this.newAddedData[index].file = null;
                this.newAddedData[index].fileContent = '/';

            }

        }
    }



    isASCII(str) {
        // return /^[\x00-\x7F]*$/.test(str);
        return /^[\x00-\xFF\u2013-\u2122]*$/.test(str);

    };







}
