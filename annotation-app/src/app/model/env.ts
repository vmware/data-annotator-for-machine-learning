/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

export interface Env {
    production: boolean,
    annotationService: string,
    redirectUrl: string,
    serviceTitle: string,
    provider: string,
    USER_KEY: string,
    STATE?: string,
    enableSendEmail?: boolean,
    authUrl?: string,
    tokenUrl?: string,
    logoutUrl?: string,
    CLIENT_ID?: string,
    feedbackUrl?: string,
    videoSrc?: string,
    googleTrackId?: string,
}
