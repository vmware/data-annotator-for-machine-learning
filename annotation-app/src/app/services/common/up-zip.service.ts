/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/


import { Injectable } from '@angular/core';
import * as _ from "lodash";
import * as JSZip from 'jszip';
import * as Pako from 'pako';
import untar from "js-untar";


@Injectable()
export class UnZipService {


    constructor() { }



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
                    })
                });
                let res = { previewExample: previewExample, exampleEntries: example }
                resolve(res);
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
                        resolve(res)
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











}
