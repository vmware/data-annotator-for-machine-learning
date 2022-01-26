/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { browser, $, $$, ExpectedConditions, element, by } from 'protractor'
import { Constant } from '../general/constant'
import { CommonAppend } from '../general/common-append';

describe('verify log project append funtion', () => {
  const project_name: string = Constant.project_name;
  const commonAppend: CommonAppend = new CommonAppend;

  it('Qick append verify add new line', async () => {
    expect(await commonAppend.appenNewLine(project_name, false)).toBeTruthy;
  })

  it('Qick append verify delete new line', async () => {
    const deleteBTN = $$('clr-dg-row').last().$('button[title="Delete"]');
    expect(await commonAppend.deleteNewLine(deleteBTN)).toBeTruthy;
  })

  it('Qick append verify upload sigle log file and publish', async () => {

    const FILE_PATH = "/doc/upload-resource/APPEND_ERROR LOG.txt";
    const LOG_INPUT = $('#uploadTxt0');
    expect(await commonAppend.quickAppendSingleFileUpload(FILE_PATH, LOG_INPUT)).toBeTruthy;
  })

  it('File append verify selete existing log file', async () => {
    console.log('Constant.dataset_name_log', Constant.dataset_name_log);
    expect(await commonAppend.fileAppendSelectExistingFile(project_name, Constant.dataset_name_log, false)).toBeTruthy;
  })

  it('LOCAL file change and upload to append', async () => {
    const FILE_1 = "/doc/upload-resource/log-test-data.tgz";
    const FILE_2 = "/doc/upload-resource/APPEND_LOGS_BY_ZIP.zip";
    const dataset_name = "e2e Test Data append log file" + Date.now();
    expect(await commonAppend.localFileChangeAndUpload(project_name, dataset_name, FILE_1, FILE_2)).toBeTruthy;
  })

})
