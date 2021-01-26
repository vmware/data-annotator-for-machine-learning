/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

module.exports  = {
  
  //port
  serverPort: process.env.SERVER_PORT || 3000,
  //URL
  WebClientUrl: process.env.WEBCLIENT_URL || 'http://localhost:4200',
  //loop active learning
  loopALApiUrl: process.env.LOOP_AL_URL || "http://localhost:8000/api",
  //DB
  mongoDBUrl: process.env.MONGODB_URL || 'mongodb://localhost/loop',
  //tracking id
  trackingId: process.env.TRACKING_ID || null,
  //default admin users
  adminDefault: ['xxx@xxx.com'],
  
  //email sender address
  enableEmail: process.env.ENABLE_EMAIL || false,
  useAWSSES: process.env.USE_AWS_SES || false,
  sender: process.env.EMAIL_FROM || null,
  emailPassword: process.env.EMAIL_PASSWORD || null,
  emailServerHost: process.env.EMAIL_SERVER_HOST || null,
  emailServerPort: process.env.EMAIL_SERVER_PORT || 465,

  //IAM, AWS CONFIG
  region: process.env.REGION || null,
  accessKeyId: process.env.ACCESSKEY_ID || null,
  secretAccessKey: process.env.SECRET_ACCESS_KEY || null,
  //S3
  bucketName: process.env.BUCKET_NAME || null,
  s3RoleArn: process.env.S3_ROLEARN || null,
  //SQS
  sqsRoleArn: process.env.SQS_ARN || null,
  sqsUrl: process.env.SQS_URL || null,
  //CloudFront
  cloudFrontUrl: process.env.CLOUD_FRONT_URL || null,
  cloudFrontAccessKeyId: process.env.CLOUDFRONT_ACCESS_KEY_ID || null,
  cloudFrontPrivateCert: process.env.CLOUDFRONT_PRIVATE_CERT || null,

};