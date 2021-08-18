/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { browser, $, $$, ExpectedConditions, element, by } from 'protractor'
import { Constant } from '../general/constant'
import { CommonAppend } from '../general/common-append';

describe('verify basic project append funtion', () => {
  const project_name: string = Constant.project_name;
  const commonAppend: CommonAppend = new CommonAppend;

  it('Qick append verify add new line', async () => {
    expect(await commonAppend.appenNewLine(project_name)).toBeTruthy;
  })

  it('Qick append verify delete new line', async () => {
    const deleteBTN = $$('clr-dg-row').last().$('button[title="Delete"]');
    expect(await commonAppend.deleteNewLine(deleteBTN)).toBeTruthy;
  })

  it('Qick append verify publish', async () => {
    expect(await commonAppend.quickAppendCsv()).toBeTruthy;
  })

  it('File append verify selete existing file', async () => {
    expect(await commonAppend.fileAppendSelectExistingFile(project_name)).toBeTruthy;
  })

})
