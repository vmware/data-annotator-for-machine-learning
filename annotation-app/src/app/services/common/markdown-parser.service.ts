/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import * as marked from 'marked';

@Injectable()
export class MarkdownParserService {
  private md: any;
  constructor() {
    this.md = marked;
    this.md.setOptions({
      renderer: new marked.Renderer(),
      pedantic: false,
      gfm: true,
      breaks: true,
      sanitize: false,
      smartLists: true,
      smartypants: false,
      xhtml: false,
    });
  }

  convert(markdown) {
    return this.md.parse(markdown);
  }
}
