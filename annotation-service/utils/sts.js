/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const AWS = require('aws-sdk');
const config = require('../config/config');
const { AWSRESOURCE } = require('../config/constant')
const axios = require('axios')
const qs = require('qs')

async function prepareCredentials(resource, sessionDuration) {

    console.log(`[ STS ] Utils prepareCredentials`);
    if (config.ESP) {
        return prepareESPCredentails(resource, sessionDuration);
    } else {
        return prepareOSCredentails(resource, sessionDuration);
    }
}

async function prepareOSCredentails(resource, sessionDuration) {

    let roleArn = "";
    if (resource === AWSRESOURCE.S3) {
        roleArn = config.s3RoleArn;
    } else if (resource === AWSRESOURCE.SQS) {
        roleArn = config.sqsRoleArn;
    }

    let sts = new AWS.STS({
        endpoint: `https://sts.${config.region}.amazonaws.com`,
        apiVersion: "2011-06-15",
        region: config.region,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
    });

    const stsAssecume = {
        DurationSeconds: sessionDuration,//defalut 1H min 15min
        RoleSessionName: "loop", //can be any value
        RoleArn: roleArn
    };
    console.log(`[ STS ] Utils sts.assumeRole`);
    return sts.assumeRole(stsAssecume).promise();
}

async function prepareESPCredentails(resource, sessionDuration) {
    let params = {
        region: config.region,
        durationInSeconds: sessionDuration
    };
    if (resource === AWSRESOURCE.S3) {
        params.iamRoleArn = config.s3RoleArn;
        params.externalId = config.s3ExternalId
    } else if (resource === AWSRESOURCE.SQS) {
        params.iamRoleArn = config.sqsRoleArn;
        params.externalId = config.sqsExternalId
    }

    let url = config.espTokenAuthorizeUrl;
    const data = qs.stringify({ token: config.espToken });
    let configs = { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    const espToken = await axios.post(url, data, configs);

    url = config.espAwsAuthorizeUrl
    configs = { params: params, headers: { 'Authorization': espToken.data.access_token } }
    const res = await axios.get(url, configs);

    const Credentials = {
        AccessKeyId: res.data.accessKeyId,
        SecretAccessKey: res.data.secretAccessKey,
        SessionToken: res.data.sessionToken
    }
    return { Credentials }

}

module.exports = {
    prepareCredentials,
    prepareOSCredentails,
    prepareESPCredentails,

}