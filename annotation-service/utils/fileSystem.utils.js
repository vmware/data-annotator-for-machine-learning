
/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const config = require("../config/config");
const localFileSysService = require('../services/localFileSys.service');
const request = require('request');
const S3Utils = require('./s3');
const { S3OPERATIONS } = require('../config/constant');
const MESSAGE = require('../config/code_msg')

async function handleFileStream(fileLocation) {

  if (config.ESP || !config.useLocalFileSys && config.useAWS &&  config.bucketName && config.s3RoleArn) {
  
    console.log(`[ FILE_SYSTEM ] Utils S3Utils.signedUrlByS3`);
    const signedUrl = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, fileLocation);
    return request.get(signedUrl);
  
  }else if (config.useLocalFileSys && !config.useAWS) {
    
    console.log(`[ FILE_SYSTEM ] Utils localFileSysService.readFileFromLocalSys`);
    return localFileSysService.readFileFromLocalSys(fileLocation);

  }else{

    throw MESSAGE.VALIDATION_FILE_SYS;
  
  }

}


module.exports={
  handleFileStream,
}