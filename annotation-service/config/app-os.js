/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

module.exports  = {

  //AWS CONFIG IAM
  region: process.env.REGION || null,
  accessKeyId: process.env.ACCESSKEY_ID || null,
  secretAccessKey: process.env.SECRET_ACCESS_KEY || null,
  //S3
  bucketName: process.env.BUCKET_NAME || null,
  s3RoleArn: process.env.S3_ROLEARN || null,
  //SQS
  sqsRoleArn: process.env.SQS_ARN || null,
  sqsUrl: process.env.SQS_URL || null,
  //CloudFront "https://xxx.cloudfront.net"
  cloudFrontUrl: process.env.CLOUD_FRONT_URL || null,
  cloudFrontAccessKeyId: process.env.CLOUDFRONT_ACCESS_KEY_ID || null,
  //put the cert file into config/certs/ give file name to this value.
  cloudFrontPrivateCert: process.env.CLOUDFRONT_PRIVATE_CERT || null,

  //annotation-app url
  WebClientUrl: process.env.WEBCLIENT_URL || 'http://localhost:4200',
  //active-learning-service url
  loopALApiUrl: process.env.LOOP_AL_URL || "http://localhost:8000/api",
  //mongodb url
  mongoDBUrl: process.env.MONGODB_URL || 'mongodb://localhost/loop',

  //server port [optional configs]
  serverPort: process.env.SERVER_PORT || 3000,
  //default admin users [optional configs]
  adminDefault: ['xxx@xxx.com'],
  //Google Analytics tracking id [optional configs]
  trackingId: process.env.TRACKING_ID || null,
  //email sender address [optional configs]
  enableEmail: process.env.ENABLE_EMAIL || false,
  useAWSSES: process.env.USE_AWS_SES || false,
  sender: process.env.EMAIL_FROM || null,
  emailPassword: process.env.EMAIL_PASSWORD || null,
  emailServerHost: process.env.EMAIL_SERVER_HOST || null,
  emailServerPort: process.env.EMAIL_SERVER_PORT || 465,

};