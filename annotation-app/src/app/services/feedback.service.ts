/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import { EnvironmentsService } from './environments.service';

declare var common: any;

@Injectable({
  providedIn: 'root'
})

export class FeedbackService {


  constructor(
    private env: EnvironmentsService,
  ) { };

  showFeedback() {
    let feedbackClientId = '${CLIENT_ID}';
    feedbackClientId = feedbackClientId.startsWith('$') ? this.env.config.CLIENT_ID : feedbackClientId;
    common.feedback(this.env.config.feedbackUrl).init(feedbackClientId, 'Loop');
  }

  identifyUser(user) {
    common.esp.identify(user ? user.email : 'Guest');
    common.esp.metadata({ "Full Name": user ? user.fullName : 'Guest' });
  }


}
