/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { AvaService } from '../../../services/ava.service';
import * as _ from 'lodash';
import { EnvironmentsService } from 'app/services/environments.service';

@Component({
  selector: 'app-assign-slack',
  templateUrl: './assign-slack.component.html',
  styleUrls: ['./assign-slack.component.scss'],
})
export class AssignSlackComponent implements OnInit {
  @Input() slackListMsg: any;
  @Input() inputSlackChannelsMsg: any;

  @Output('slackListOuter')
  slackListOuterEmitter = new EventEmitter();

  @ViewChild('slack')
  slack: ElementRef;

  slackList: any = [];
  inputSlackValidation: string;
  loadingSlack: boolean = false;
  inputSlackChannels: any = [];
  showChannelList: boolean;

  constructor(private avaService: AvaService, public env: EnvironmentsService) {}

  ngOnInit() {
    this.slackList = this.slackListMsg;
    this.inputSlackChannels = this.inputSlackChannelsMsg;
  }

  onEnterSlack(e) {
    if (e) {
      let exist = false;
      if (
        this.slackList.length > 0 &&
        _.findIndex(this.slackList, function (o) {
          return o.slackId == e;
        }) > -1
      ) {
        exist = true;
      }
      if (!exist) {
        this.loadingSlack = true;
        let params = {
          slackId: e,
        };
        this.emitMsg(this.loadingSlack, this.inputSlackValidation, this.slackList);
        this.avaService.validSlackChannel(params).subscribe((res) => {
          this.loadingSlack = false;
          if (res) {
            if (res.is_member) {
              this.slackList.push({ slackName: res.name, slackId: res.id });
              this.slack.nativeElement.value = null;
              this.inputSlackValidation = '';
              this.emitMsg(this.loadingSlack, this.inputSlackValidation, this.slackList);
            } else {
              this.inputSlackValidation = `${this.env.config.slackAppName} not in this channel, please type '/invite @${this.env.config.slackAppName}' and send in this channel first.`;
              this.emitMsg(this.loadingSlack, this.inputSlackValidation, this.slackList);
            }
          } else {
            this.inputSlackValidation = "This channel doesn't exist!";
            this.emitMsg(this.loadingSlack, this.inputSlackValidation, this.slackList);
          }
        });
      }
    }
  }

  slackBlur(e) {
    if (e) {
      this.onEnterSlack(e);
    } else {
      this.loadingSlack = false;
      this.inputSlackValidation = '';
      this.emitMsg(this.loadingSlack, this.inputSlackValidation, this.slackList);
    }
  }

  deleteSlack(index) {
    this.slackList.splice(index, 1);
    this.emitMsg(this.loadingSlack, this.inputSlackValidation, this.slackList);
  }

  reAssignSlack(e) {
    this.showChannelList = true;
    e.target.value = '';
    this.inputSlackValidation = '';
    this.emitMsg(this.loadingSlack, this.inputSlackValidation, this.slackList);
  }

  emitMsg(loadingSlack, inputSlackValidation, slackList) {
    let msg = {
      loadingSlack,
      inputSlackValidation,
      slackList,
    };
    this.slackListOuterEmitter.emit(msg);
  }
}
