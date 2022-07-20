/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const AWS = require('aws-sdk');
const STS = require('./sts');
const config = require('../config/config');
const { ACCESS_TIME_60, AWSRESOURCE } = require('../config/constant');

async function s3Client() {
    console.log('[ S3 ] Utils s3Client.STS.prepareCredentials');
    const data = await STS.prepareCredentials(AWSRESOURCE.S3, ACCESS_TIME_60);

    console.log('[ S3 ] Utils s3Client create AWS.S3');
    return new AWS.S3({
        region: config.region,
        apiVersion: '2006-03-01',
        accessKeyId: data.Credentials.AccessKeyId,
        secretAccessKey: data.Credentials.SecretAccessKey,
        sessionToken: data.Credentials.SessionToken,
        signatureVersion: 'v4'
    });

}

async function deleteAnObject(Key) {
    console.log('[ S3 ] Utils deleteAnObject.s3Client');
    const S3 = await s3Client();
    const deleteParams = {
        Bucket: config.bucketName,
        Key: Key,
    }
    console.log('[ S3 ] Utils deleteAnObject.S3.deleteObject', Key);
    return S3.deleteObject(deleteParams).promise();
}

async function deleteMultiObjects(Keys) {
    console.log('[ S3 ] Utils deleteMultiObjects.s3Client');
    const S3 = await s3Client();
    const deleteParams = {
        Bucket: config.bucketName,
        Delete: {
            Objects: Keys, // [{Key: "max is 1000"}]
            Quiet: true
        }
    }
    console.log('[ S3 ] Utils deleteMultiObjects.S3.deleteObjects', Keys.length);
    return S3.deleteObjects(deleteParams).promise();
}

async function uploadObject(Key, Body) {
    console.log('[ S3 ] Utils uploadObject.s3Client');
    const S3 = await s3Client();
    const uploadParams = {
        Bucket: config.bucketName,
        Key: Key,
        Body: Body
    }
    console.log('[ S3 ] Utils uploadObject.S3.upload', Key);
    return S3.upload(uploadParams).promise();
}

async function signedUrlByS3(operation, key, S3) {
    if (!S3) {
        S3 = await s3Client();
    }
    const params = {
        Bucket: config.bucketName,
        Key: key,
        Expires: ACCESS_TIME_60
    };

    return S3.getSignedUrl(operation, params);

}

module.exports = {
    s3Client,
    deleteAnObject,
    uploadObject,
    signedUrlByS3,
    deleteMultiObjects,

}