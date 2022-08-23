/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

export interface Env {
  production?: boolean;
  annotationService?: string;
  redirectUrl?: string;
  serviceTitle?: string;
  provider?: string;
  USER_KEY?: string;
  STATE?: string;
  enableSendEmail?: boolean;
  authUrl?: string;
  tokenUrl?: string;
  logoutUrl?: string;
  CLIENT_ID?: string;
  lumosUrl?: string;
  videoSrc?: string;
  googleTrackId?: string;
  enableAWSS3?: boolean;
  contactEmail?: string;
  contactSlack?: string;
  fileSize?: number;
  enableSlack?: boolean;
  slackAppName?: string;
}
