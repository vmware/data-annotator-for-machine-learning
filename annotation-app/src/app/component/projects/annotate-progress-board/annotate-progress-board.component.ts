/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as _ from 'lodash';
import { UserAuthService } from 'src/app/services/user-auth.service';

@Component({
  selector: 'app-annotate-progress-board',
  templateUrl: './annotate-progress-board.component.html',
  styleUrls: ['./annotate-progress-board.component.scss'],
})
export class AnnotateProgressBoardComponent implements OnInit {
  @Input() msg;
  @Output('outClickHistory')
  outClickHistoryEmitter = new EventEmitter();
  @Output('outClickReviewOrder')
  outClickReviewOrder = new EventEmitter();
  @Output('outSelectReviewee')
  outSelectReviewee = new EventEmitter();

  reviewOrder: string;
  reviewee: string;
  isAllowedAnnotate: boolean;
  user: any;

  constructor(private userAuthService: UserAuthService) {
    this.user = this.userAuthService.loggedUser().user;
  }

  ngOnInit(): void {}

  ngOnChanges() {
    this.reviewOrder = this.msg.reviewOrder;
    this.reviewee = this.msg.reviewee;
    this.isAllowedAnnotate = this.msg.projectInfo.annotator.indexOf(this.user.email) > -1 ? true : false;
  }

  historyBack(index, id) {
    let value = {
      index,
      id,
    };
    this.outClickHistoryEmitter.emit(value);
  }

  changeReviewOrder(e) {
    this.reviewOrder = e.target.value;
    this.outClickReviewOrder.emit(this.reviewOrder);
  }

  onSelectingReviewee(e) {
    this.outSelectReviewee.emit(this.reviewee);

    // this.outSelectReviewee.emit(_.filter(this.msg.progressInfo.userCompleteCase, ['fullName', this.reviewee])[0].user);
  }

  clickUncertain(e) {
    if (e.target.innerText === 'Uncertain' && this.reviewOrder !== 'most_uncertain') {
      this.changeReviewOrder({ target: { value: 'most_uncertain' } });
    }
  }
}
