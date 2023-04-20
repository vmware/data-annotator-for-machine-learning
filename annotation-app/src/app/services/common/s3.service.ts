/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import AWS from 'aws-sdk/lib/aws';
import { ApiService } from '../api.service';
import { Buffer } from 'buffer';
import { UnZipService } from 'src/app/services/common/up-zip.service';
import { InternalApiService } from '../internal-api.service';

@Injectable()
export class S3Service {
  constructor(
    private apiService: ApiService,
    private unZipService: UnZipService,
    private internalApiService: InternalApiService,
  ) {}
  public getS3UploadConfig() {
    let response;
    return new Promise<any>((resolve) => {
      this.internalApiService.getS3UploadConfig().subscribe(
        async (res) => {
          if (res) {
            let outNo = new Date().getTime();
            const s3 = new AWS.S3({
              region: Buffer.from(res.region, 'base64').toString(),
              apiVersion: Buffer.from(res.apiVersion, 'base64').toString(),
              accessKeyId: Buffer.from(res.credentials.accessKeyId, 'base64').toString(),
              secretAccessKey: Buffer.from(res.credentials.secretAccessKey, 'base64').toString(),
              sessionToken: Buffer.from(res.credentials.sessionToken, 'base64').toString(),
            });

            response = {
              err: '',
              res: res,
              s3: s3,
              outNo: outNo,
            };
            resolve(response);
          }
        },
        (error) => {
          response = {
            err: error.message,
          };
          resolve(response);
        },
      );
    });
  }

  public uploadToS3(file, projectType, addMethod, newAddedData?) {
    let response;
    return new Promise<any>((resolve) => {
      this.getS3UploadConfig().then(async (e) => {
        if (e.err) {
          response = {
            err: e.err,
          };
          resolve(response);
        } else {
          if (projectType == 'image') {
            if (addMethod == 'zip') {
              const uploadParams = {
                Bucket: Buffer.from(e.res.bucket, 'base64').toString(),
                Key: Buffer.from(e.res.key, 'base64').toString() + '/' + e.outNo + '_' + file.name,
                Body: file,
              };
              const data = await e.s3.upload(uploadParams).promise();
              response = {
                err: '',
                data: data,
                key: uploadParams.Key,
                from: '',
              };
              this.unzipImagesToS3(file, e.res, e.outNo, e.s3).then((e2) => {
                e2['fileResponse'] = response;
                resolve(e2);
              });
            } else {
              const aa = [];
              newAddedData.forEach((element) => {
                if (element.format !== false && element.src !== '/' && element.size !== '/') {
                  aa.push(element);
                }
              });
              newAddedData = aa;
              if (newAddedData.length > 0) {
                this.uploadSingleImage(e.outNo, e.s3, e.res, newAddedData).then((e3) => {
                  e3.newAddedData = newAddedData;
                  resolve(e3);
                });
              }
            }
          } else {
            const uploadParams = {
              Bucket: Buffer.from(e.res.bucket, 'base64').toString(),
              Key: Buffer.from(e.res.key, 'base64').toString() + '/' + e.outNo + '_' + file.name,
              Body: file,
            };
            const data = await e.s3.upload(uploadParams).promise();
            response = {
              err: '',
              data: data,
              key: uploadParams.Key,
              from: '',
            };
            resolve(response);
          }
        }
      });
    });
  }

  public uploadSingleImage(outNo, s3, s3Config, entry) {
    let response;
    return new Promise<any>((resolve) => {
      const imagesLocation = [];
      const that = this;
      let realEntryIndex = 0;
      for (let i = 0; i < entry.length; i++) {
        const uploadParams = {
          Bucket: Buffer.from(s3Config.bucket, 'base64').toString(),
          Key: Buffer.from(s3Config.key, 'base64').toString() + '/' + outNo + '/' + entry[i].name,
          Body: entry[i].file,
        };
        s3.upload(uploadParams, async function (err, data) {
          if (err) {
          }
          if (data) {
            await imagesLocation.push({
              fileName: entry[i].name,
              location: data.Key,
              fileSize: entry[i].size,
            });
            realEntryIndex++;
            if (realEntryIndex === entry.length) {
              response = {
                imagesLocation: imagesLocation,
              };
              resolve(response);
            }
          }
        });
      }
    });
  }

  public unzipImagesToS3(file, res, outNo, s3) {
    let response;
    return new Promise<any>((resolve) => {
      this.unZipService.unzipImages(file).then(async (e) => {
        const that = this;
        const uploadEntries = [];
        const imagesLocation = [];
        let realEntryLength = e.realEntryLength;
        let realEntryIndex = 0;
        for (const value1 of Object.values(e.entry.files)) {
          if (!(value1 as any).dir && that.unZipService.validImageType((value1 as any).name)) {
            await (value1 as any).async('blob').then(async function (blob) {
              realEntryIndex++;
              const uploadParams = {
                Bucket: Buffer.from(res.bucket, 'base64').toString(),
                Key: Buffer.from(res.key, 'base64').toString() + '/' + outNo + '/' + (value1 as any).name,
                Body: blob,
              };
              uploadEntries.push({
                uploadParams,
                fileName: (value1 as any).name,
                fileSize: blob.size,
              });

              // control the upload req concurrent
              if (realEntryIndex == realEntryLength) {
                while (uploadEntries.length) {
                  await Promise.all(
                    uploadEntries.splice(0, 500).map(async (e2) => {
                      await s3
                        .upload(e2.uploadParams)
                        .promise()
                        .then(function (data, err) {
                          if (data) {
                            imagesLocation.push({
                              fileName: e2.fileName,
                              location: data.Key,
                              fileSize: e2.fileSize,
                            });
                          }
                        });
                    }),
                  );
                }
                response = {
                  err: '',
                  data: imagesLocation,
                };
                resolve(response);
              }
            });
          }
        }
        if (realEntryIndex === 0) {
          response = {
            err: 'Upload datasets failed, please make sure there has at least one image type file in the zip.',
          };
          resolve(response);
        }
      });
    });
  }

  public uploadSingleImageToS3(newAddedData) {
    return new Promise<any>((resolve) => {
      const flag = function (param) {
        return new Promise(function (resol, reject) {
          let aa = true;
          param.forEach((element) => {
            if (element.format == false) {
              aa = false;
            }
          });
          resol(aa);
        });
      };
      flag(newAddedData).then((e) => {
        let response;
        if (e) {
          for (let index of newAddedData.keys()) {
            if (newAddedData[index].src == '/' && newAddedData[index].size == '/') {
              newAddedData.splice(index, 1);
            }
          }
          if (newAddedData.length > 0) {
            response = {
              newAddedData: newAddedData,
              param1: null,
              param2: 'single',
            };
            resolve(response);
          }
        }
      });
    });
  }

  public toCaculateTotalRow(choosedDataset, originalHead, previewContentDatas) {
    let response;
    return new Promise<any>((resolve) => {
      this.internalApiService.getCloudUrl(choosedDataset.id).subscribe(
        (res) => {
          this.unZipService
            .parseCSVChunk(res, false, true, choosedDataset.topReview.header, previewContentDatas)
            .then((e) => {
              if (choosedDataset.hasHeader == 'yes') {
                response = {
                  count: e.count - 1,
                  nonEnglish: e.invalidCount,
                };
                resolve(response);
              }
            });
        },
        (error) => {},
      );
    });
  }
}
