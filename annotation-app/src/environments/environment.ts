/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

import { Env } from 'app/model/index';

export const environment: Env = {
  // This section is required
  production: false,
  annotationService: 'http://localhost:3000', // Annotation service url

  // This section is optional
  serviceTitle: 'Data Annotator for Machine Learning', // UI name of annotation-app.
  redirectUrl: '/home', // redirect URL after logout or token is expired
  videoSrc: null, // demo video link in home page, or set null to show nothing
  googleTrackId: null, // google track ID
  enableSendEmail: false, // Set to true to enable email notification for project creation, annotator assignment or edit project owner
  enableAWSS3: false, // Set to true to upload and download files with AWS S3 that requires some related AWS CONFIG IAM to be configured in annotation-service
  enableSlack: false, // Set to true to allow annotator use slack to post message and do annotate. And please follow the path annotation-service/config/app-os.js to set buildSlackApp=true at the same time. While first of all, in order to support this feature you need to create an app from an app manifest which containing basic info, scopes, settings, and features. You can find this yaml file in the path vmware/data-annotator-for-machine-learning/master/docs/manifest.yml.
  slackAppName: '', //If enableSlack=true, here should be the slack app name

  // This value is default file size limit for upload
  fileSize: 1024 * 1024 * 1024,
};
