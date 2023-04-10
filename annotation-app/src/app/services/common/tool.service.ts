/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { Console } from 'console';

@Injectable()
export class ToolService {
  constructor(public env: EnvironmentsService) {}

  hexToRgb(c) {
    if (c && c.length == 4) {
      c = '#' + [c[1], c[1], c[2], c[2], c[3], c[3]].join('');
    }
    c = '0x' + c?.substring(1);
    return 'rgb(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',0.4)';
  }

  highToRgb(c) {
    if (c && c.length == 4) {
      c = '#' + [c[1], c[1], c[2], c[2], c[3], c[3]].join('');
    }
    c = '0x' + c.substring(1);
    return 'rgb(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',0.2)';
  }

  regexExec(reg, text) {
    let regex = new RegExp('/', 'g');
    const a = [...text.matchAll(RegExp(reg.replace(regex, ''), 'g'))];
    return a;
  }

  isASCII(str) {
    return /^[\x00-\xFF\u2013-\u2122]*$/.test(str);
  }

  toRegEmail(emails) {
    if (this.env.config.authUrl) {
      for (let i = 0; i < emails.length; i++) {
        if (!/^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@vmware.com$/.test(emails[i].trim())) {
          return false;
        }
      }
      return true;
    } else {
      for (let i = 0; i < emails.length; i++) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emails[i].trim())) {
          return false;
        }
      }
      return true;
    }
  }

  sortBy(field, order) {
    return function (a, b) {
      if (order == 'ascending') {
        return a[field] - b[field];
      } else {
        return b[field] - a[field];
      }
    };
  }
}
