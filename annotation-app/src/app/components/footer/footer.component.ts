/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { EnvironmentsService } from 'app/services/environments.service';
import { FeedbackService } from 'app/services/feedback.service';
import { UserAuthService } from 'app/services/user-auth.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})

export class FooterComponent implements OnInit {



  constructor(
    public env: EnvironmentsService,
    private feedback: FeedbackService,
    private userAuthService: UserAuthService
  ) { }

  ngOnInit() {
    if (this.env.config.feedbackUrl) {
      this.feedback.showFeedback();
      this.userAuthService.loggedUserListener().subscribe(user => {
        this.feedback.identifyUser(user);
      });
    }

  }

}
