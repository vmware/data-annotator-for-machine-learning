/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

module.exports = {

  //-------------------- mandatory configs --------------------//
  //active-learning-service url
  loopALApiUrl: process.env.LOOP_AL_URL || "http://localhost:8000/api",
  //mongodb url
  mongoDBUrl: process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/daml',
  //default admin users can see admin tab at ui
  adminDefault: ['poc-os@poc-os.com', 'poc@poc.com'],

  //-------------------- optional configs --------------------//
  //Login with LDAP, need to provide the LDAP authorization service link, the response schema must have 'emailAddress' or 'email' field
  loginWithLDAP: process.env.LOGIN_WITH_LDAP || null,
  //server port [optional configs]
  serverPort: process.env.SERVER_PORT || 3000,

  //auto update mongodb index, in production recommend use false, to manually update
  mongoDBAutoIndex: process.env.AUTO_INDEX || true,
  //Google Analytics tracking id [optional configs]
  trackingId: process.env.TRACKING_ID || null,


  //IF true will save file to local, If set useAWS=true set it to false
  useLocalFileSys: process.env.USE_LOCAL_FILE_SYS || true,
  //-------------------- aws config --------------------//
  //IF false below aws config can be skip, will not save files to aws-s3
  //IF true will save datasets to S3, should set useLocalFileSys=false
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
  //regular notification recommond local/uat/test env set to false only enable at prod env
  regularNotificatnoEmail: process.env.REGULAR_NOTIFICATNO_EMAIL || true,
  //if enableEmail=true, annotation-app-url should be set as the real value 
  WebClientUrl: process.env.WEBCLIENT_URL || 'http://localhost:4200',
  //if enableEmail=true, annotation-service-url should be set as the real value 
  annotationServiceUrl: process.env.ANNOTATION_SERVICE_URL || 'http://localhost:3000',
  //if enableEmail=true, can set teamTitle for sending email or use default value
  teamTitle: process.env.TEAM_TITILE || "Data-Annotator-For-Machine-Learning",
  //-------------------- send email config end-------------//


  //SLACK
  //If buildSlackApp=true, slackBotUserOAuthToken, slackSigningSecret and slackAppToken must be set. And please follow the path annotation-app/src/environments/environment.ts to set enableSlack=true at the same time.
  buildSlackApp: process.env.BUILD_SLACK_APP || false,
  slackAppName: process.env.SLACK_APP_NAME || null, //If buildSlackApp=true, here should be the slack app display name
  slackBotUserOAuthToken: process.env.SLACK_BOT_USER_OAUTH_TOKEN || null,
  slackSigningSecret: process.env.SLACK_SIGNING_SECRET || null,
  slackAppToken: process.env.SLACK_APP_TOKEN || null


};