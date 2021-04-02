/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const AWS = require('aws-sdk');
const config = require('../config/config');

async function prepareCredentials(roleArn, sessionDuration) {

    console.log(`[ STS ] Utils prepareCredentials`);
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
    return await sts.assumeRole(stsAssecume).promise();
}

module.exports = {
    prepareCredentials,

}