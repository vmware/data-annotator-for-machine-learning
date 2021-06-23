/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const STS = require('../utils/sts');
const S3 = require('../utils/s3');
const config = require('../config/config');
const USER = require('../db/user-db');
const { ACCESS_TIME_60 } = require('../config/constant');
const localFileSysService = require('./localFileSys.service');

async function prepareS3Configs(req) {
    console.log(`[ S3 ] Service prepareS3Configs user: `, req.auth.email);
    const user = await USER.queryUserById(req.auth.email);
    if (!user) {
        throw "unauthorized";
    }
    console.log(`[ S3 ] Service check if is valid user`);

    let reponse = {
        bucket: Buffer.from(config.bucketName).toString('base64'),
        region: Buffer.from(config.region).toString('base64'),
        key: Buffer.from(`upload/${user._id}`).toString('base64'),
        apiVersion: Buffer.from('2006-03-01').toString('base64'),
        credentials: ""
    }
    const data = await STS.prepareCredentials(config.s3RoleArn, ACCESS_TIME_60);
    reponse.credentials = {
        accessKeyId: Buffer.from(data.Credentials.AccessKeyId).toString('base64'),
        secretAccessKey: Buffer.from(data.Credentials.SecretAccessKey).toString('base64'),
        sessionToken: Buffer.from(data.Credentials.SessionToken).toString('base64')
    }
    console.log(`[ S3 ] Service prepare sts access credentials `);
    return reponse;
}


async function deleteOriginalFile(key) {
    console.log(`[ S3 ] Service deleteOriginalFile.S3.deleteAnObject`, key);
    return S3.deleteAnObject(key);
}

async function uploadFileToS3(file, key) {
    console.log(`[ S3 ] Service uploadFileToS3 read temp file stream`, file);
    let fileStream = await localFileSysService.readFileFromLocalSys(file);

    console.log(`[ S3 ] Service uploadFileToS3.S3.uploadObject`, key);
    return S3.uploadObject(key, fileStream);

}

module.exports = {
    prepareS3Configs,
    deleteOriginalFile,
    uploadFileToS3,

}