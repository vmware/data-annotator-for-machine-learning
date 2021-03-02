
import { Component, OnInit, Input, Output, EventEmitter, Injectable } from '@angular/core';
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
import * as Pako from 'pako';
import untar from "js-untar";


@Injectable()
export class UnZipService {


    constructor() { }



    unZip(inputFile) {
        let jsZip = new JSZip();
        var that = this;
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
            return res;
        })
    };


    unTgz(inputFile) {
        var that = this;
        var reader = new FileReader();
        let res;
        reader.readAsArrayBuffer(inputFile);

        reader.onload = function (event) {
            res = (event.target as any).result;
            console.log('result:::', res);




        };
        reader.onloadend = function () {
            console.log('result-onloadend:::', res);

            that.aa(res);
        }

    }


    aa(result) {
        console.log('come in aa')
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
                        if (this.validTxtType(element.name)) {
                            example++;
                            txtList.push(element);
                        }
                    }
                });
                let previewExample = txtList.splice(0, 3)
                previewExample.forEach(e => {
                    this.toReadBlobToText(e.blob).then(data => {
                        e.content = data;
                    });
                });
                console.log(99, { previewExample: previewExample, exampleEntries: example })
                return { previewExample: previewExample, exampleEntries: example };

            });
    }



    toReadBlobToText(blob) {
        return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.readAsText(blob)
            reader.onload = function (event) {
                let res: any = (event.target as any).result;
                resolve(res)
            }
        })
    }


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
