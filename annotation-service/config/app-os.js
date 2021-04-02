/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

module.exports  = {
  //-------------------- mandatory configs --------------------//
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

  //annotation-app url
  WebClientUrl: process.env.WEBCLIENT_URL || 'http://localhost:4200',
  //active-learning-service url
  loopALApiUrl: process.env.LOOP_AL_URL || "http://localhost:8000/api",
  //mongodb url
  mongoDBUrl: process.env.MONGODB_URL || 'mongodb://localhost/loop',

  
  //-------------------- optional configs --------------------//
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
  //teamTitle for sending email
  teamTitle: process.env.TEAM_TITILE || "Data-Annotator-For-Machine-Learning",

};