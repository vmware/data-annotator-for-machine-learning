/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const awsCloudfrontSign = require('aws-cloudfront-sign');
const config = require('../config/config');

async function cloudfrontSignedUrl( requestUrl, expireTime ){
  // console.log('[ CLOUDFRONT ] Utils cloudfrontSignedUrl');
  const options = {
    keypairId: config.cloudFrontAccessKeyId,
    privateKeyPath: `./config/certs/${config.cloudFrontPrivateCert}`,
    expireTime: expireTime
  }
  return await awsCloudfrontSign.getSignedUrl(requestUrl, options);
}

module.exports={
    cloudfrontSignedUrl
}
