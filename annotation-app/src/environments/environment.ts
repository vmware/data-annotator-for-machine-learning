/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Env } from 'src/app/model/index';

export const environment: Env = {
  // This section is required
  production: false,
  annotationService: 'http://localhost:3000', // Annotation service url
  // This section is optional
  serviceTitle: 'Data Annotator for Machine Learning', // UI name of annotation-app.
  googleTrackId: null, // google track ID
  redirectUrl: '/', // redirect URL after logout or token is expired
  enableSendEmail: false, // Set to true to enable email notification for project creation, annotator assignment or edit project creator
  enableAWSS3: false, // Set to true to upload and download files with AWS S3 that requires some related AWS CONFIG IAM to be configured in annotation-service
  enableSlack: false, // Set to true to allow annotator use slack to post message and do annotate. And please follow the path annotation-service/config/app-os.js to set buildSlackApp=true at the same time. While first of all, in order to support this feature you need to create an app from an app manifest which containing basic info, scopes, settings, and features. You can find this yaml file in the path vmware/data-annotator-for-machine-learning/master/docs/manifest.yml.
  slackAppName: '', // If enableSlack=true, here should be the slack app name
  embedded: false, // Set to true to wrap the service into angular custom element 'mf-loop-entry', and run the script bundle_<ENV> to build one complete static js which is required for an micro-front-end app
  sessionKey: 'app-session', // All token and user info is saved after this key name in local storage
};
