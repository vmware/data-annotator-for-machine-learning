/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/


import { Injectable } from '@angular/core';
import * as _ from "lodash";
import * as JSZip from 'jszip';
import * as Pako from 'pako';
import untar from "js-untar";
import { Papa } from 'ngx-papaparse';
import { ToolService } from 'app/services/common/tool.service';


@Injectable()
export class UnZipService {


    constructor(
        private papa: Papa,
        private toolService: ToolService

    ) { }



    unZipTxt(inputFile) {

        var that = this;
        return new Promise(function (resolve) {
            let jsZip = new JSZip();
            let example = 0;
            let txtList = [];
            jsZip.loadAsync(inputFile).then(function (entries) {
                entries.forEach((path, file) => {
                    if (!file.dir && that.validTxtType(path)) {
                        example++;
                        txtList.push(file);
                    }
                });
                let previewExample = txtList.splice(0, 3)
                previewExample.forEach(e => {
                    jsZip.file(e.name).async('string').then(function success(res) {
                        e.content = res;
                        e.size = e._data.uncompressedSize
                    }, function error(e) {
                        console.log('error:::', e)
                    })
                });
                let res = { previewExample: previewExample, exampleEntries: example }
                setTimeout(() => {
                    resolve(res)
                }, 1000);
            });

        })
    };



    unTgz(inputFile) {
        var that = this;
        return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.readAsArrayBuffer(inputFile);
            reader.onload = function (event) {
                let result: any = (event.target as any).result;
                const inflator = new Pako.Inflate();
                inflator.push(result);
                if (inflator.err) {
                    console.log('inflator-err:::', inflator.msg);
                }
                const output = inflator.result;
                untar(output.buffer)
                    .then((extractedFiles) => {
                        let example = 0;
                        let txtList = [];
                        extractedFiles.forEach(element => {
                            if (element.type == 0 || element.type == null) {
                                if (that.validTxtType(element.name)) {
                                    example++;
                                    txtList.push(element);
                                }
                            }
                        });
                        let previewExample = txtList.splice(0, 3)
                        previewExample.forEach(e => {
                            that.toReadBlobToText(e.blob).then(data => {
                                e.content = data;
                            });
                        });
                        let res = { previewExample: previewExample, exampleEntries: example }
                        setTimeout(() => {
                            resolve(res)
                        }, 1000);
                    });
            };
        });
    };


    unzipImages(inputFile) {

        var that = this;
        return new Promise(function (resolve) {
            let jsZip = new JSZip();
            jsZip.loadAsync(inputFile).then(function (entries) {
                let realEntryLength = 0;
                entries.forEach((path, file) => {
                    if (!file.dir && that.validImageType(path)) {
                        realEntryLength++
                    }
                });
                let res = { entry: entries, realEntryLength: realEntryLength };
                resolve(res);
            });
        });
    };


    toReadBlobToText(blob) {
        return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.readAsText(blob)
            reader.onload = function (event) {
                let res: any = (event.target as any).result;
                resolve(res)
            };
        });
    };


    validTxtType(fileName) {
        let name = fileName.split('/').pop();
        if (!(name.startsWith('__MACOSX') || name.startsWith('._'))) {
            let types = ['txt'];
            let type = name.split('.').pop();
            if (types.indexOf(type.toLowerCase()) > -1) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
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


    parseCSVChunk(file, header, download, originalHead, previewHeadDatas, previewContentDatas) {
        let count = 0;
        let invalidCount = 0;
        let indexArray = [];
        for (let k = 0; k < originalHead.length; k++) {
            indexArray.push(previewHeadDatas.indexOf(originalHead[k]));
        }
        return new Promise((resolve, reject) => {

            this.papa.parse(file, {
                header: header,
                download: download,
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
                    previewHeadDatas = _.keys(previewData[0]);
                    if (previewContentDatas.length < 5) {
                        for (let i = 0; i < previewData.length; i++) {
                            if (!(_.sortedUniq(_.values(previewData[i])).length == 1 && _.sortedUniq(_.values(previewData[i]))[0] == null)) {
                                previewContentDatas.push(_.values(previewData[i]))
                            }
                            if (previewContentDatas.length > 4) { break; }

                        }
                    }

                    for (let a = 0; a < chunkData.length; a++) {
                        let newArray2 = [];
                        for (let c = 0; c < originalHead.length; c++) {
                            let key = originalHead[c];
                            newArray2.push(chunkData[a][key]);
                        }
                        newArray.push(newArray2);

                    };
                    for (let b = 0; b < newArray.length; b++) {
                        if (_.sortedUniq(newArray[b]).length == 1 && _.sortedUniq(newArray[b])[0] == null) {
                            invalidCount += 1;
                        } else {
                            for (let j = 0; j < newArray[b].length; j++) {
                                if (!this.toolService.isASCII(String(newArray[b][j]).trim())) {
                                    invalidCount += 1;
                                    break;
                                }
                            }
                        }
                    }
                },
                complete: () => {
                    let res = { originalHead: originalHead, previewHeadDatas: previewHeadDatas, previewContentDatas: previewContentDatas, count: count, invalidCount: invalidCount }
                    resolve(res);
                }
            });
        });
    }











}
