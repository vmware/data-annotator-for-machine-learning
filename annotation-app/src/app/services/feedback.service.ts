/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import { EnvironmentsService } from './environments.service';

declare var common: any;

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  constructor(private env: EnvironmentsService) {}

  showFeedback() {
    let feedbackClientId = '${CLIENT_ID}';
    feedbackClientId = feedbackClientId.startsWith('$')
      ? this.env.config.CLIENT_ID
      : feedbackClientId;
    common.feedback(this.env.config.lumosUrl).init(feedbackClientId, this.env.config.serviceTitle);
  }

  identifyUser(user) {
    common.lumos.identify(user ? user.email : 'Guest');
    common.lumos.metadata({ 'Full Name': user ? user.fullName : 'Guest' });
  }
}
