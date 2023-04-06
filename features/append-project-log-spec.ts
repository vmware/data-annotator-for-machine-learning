/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { browser, $, $$, ExpectedConditions, element, by } from "protractor";
import { Constant } from "../general/constant";
import { CommonAppend } from "../general/common-append";

describe("Spec - verify log project append function", () => {
  const project_name: string = Constant.project_name;
  const commonAppend: CommonAppend = new CommonAppend();

  it("Should quickly append new line", async () => {
    expect(await commonAppend.appendNewLine(project_name, false)).toBeTruthy;
  });

  it("Should quickly delete new line", async () => {
    const deleteBTN = $$("clr-dg-row").last().$('button[title="Delete"]');
    expect(await commonAppend.deleteNewLine(deleteBTN)).toBeTruthy;
  });

  it("Should quickly append single log file and publish", async () => {
    const FILE_PATH = "/doc/upload-resource/APPEND_ERROR LOG.txt";
    const LOG_INPUT = $("#uploadTxt0");
    expect(await commonAppend.quickAppendSingleFileUpload(FILE_PATH, LOG_INPUT))
      .toBeTruthy;
  });

  it("Should succeed to append file through selecting existing log file", async () => {
    console.log("log-constant.dataset_name_log", Constant.dataset_name_log);
    expect(
      await commonAppend.fileAppendSelectExistingFile(
        Constant.dataset_name_log,
        false
      )
    ).toBeTruthy;
  });

  it("Should succeed to change and upload file", async () => {
    const FILE_1 = "/doc/upload-resource/log-test-data.tgz";
    const FILE_2 = "/doc/upload-resource/APPEND_LOGS_BY_ZIP.zip";
    const dataset_name = "e2e Test Data append log file" + Date.now();
    expect(
      await commonAppend.localFileChangeAndUpload(dataset_name, FILE_1, FILE_2)
    ).toBeTruthy;
  });
});
