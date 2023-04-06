/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

export interface Env {
  embedded?: boolean;
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
  googleTrackId?: any;
  enableAWSS3?: boolean;
  contactEmail?: string;
  contactSlack?: string;
  fileSize?: number;
  enableSlack?: boolean;
  slackAppName?: string;
  sessionKey?: string;
  inUrl?: string;
  videoSrc?: string;
  hubService?: string;
}
