/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

module.exports  = {
  
  //-------------------- mandatory configs --------------------//
  //active-learning-service url
  loopALApiUrl: process.env.LOOP_AL_URL || "http://localhost:8000/api",
  //mongodb url
  mongoDBUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/loop',
  //default admin users can see admin tab at ui
  adminDefault: ['poc-os@poc-os.com'],
  
  
  //-------------------- optional configs --------------------//
  //server port [optional configs]
  serverPort: process.env.SERVER_PORT || 3000,
  //Google Analytics tracking id [optional configs]
  trackingId: process.env.TRACKING_ID || null,
  //-------------------- aws config --------------------//
  // IF USE DEFAULT value false will use local file system and below aws config can be skip
  useAWS: process.env.USE_AWS || false,
  //if useAWS=true, AWS CONFIG IAM must be set
  region: process.env.REGION || null,
  accessKeyId: process.env.ACCESSKEY_ID || null,
  secretAccessKey: process.env.SECRET_ACCESS_KEY || null,
  //if useAWS=true, S3 config must be set
  bucketName: process.env.BUCKET_NAME || null,
  s3RoleArn: process.env.S3_ROLEARN || null,
  //if useAWS=true, SQS config must be set
  sqsRoleArn: process.env.SQS_ARN || null,
  sqsUrl: process.env.SQS_URL || null,
  //-------------------- aws config end--------------------//

  //-------------------- send email config ----------------//
  //IF USE DEFAULT value false, will not sending email
  //IF enableEmail=true, you can choice to use useAWSSES or email lib to send email
  enableEmail: process.env.ENABLE_EMAIL || false,
  //if enableEmail=true, can choice use aws ses to send email
  useAWSSES: process.env.USE_AWS_SES || false,
  //if enableEmail=true, email sender address must be set
  sender: process.env.EMAIL_FROM || null,
  //if enableEmail=true, can choice email lib to send email
  emailPassword: process.env.EMAIL_PASSWORD || null,
  emailServerHost: process.env.EMAIL_SERVER_HOST || null,
  emailServerPort: process.env.EMAIL_SERVER_PORT || 465,
  //if enableEmail=true, annotation-app-url should be set as the real value 
  WebClientUrl: process.env.WEBCLIENT_URL || 'http://localhost:4200',
  //if enableEmail=true, can set teamTitle for sending email or use default value
  teamTitle: process.env.TEAM_TITILE || "Data-Annotator-For-Machine-Learning",
  //-------------------- send email config end-------------//

};