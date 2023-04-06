/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { browser, $, $$, ExpectedConditions, element, by } from "protractor";
import { Constant } from "../general/constant";
import { CommonAppend } from "../general/common-append";

describe("Spec - verify basic project append function", () => {
  const project_name: string = Constant.project_name_text_al;
  const commonAppend: CommonAppend = new CommonAppend();

  it("Should quickly append verify add new line", async () => {
    expect(await commonAppend.appendNewLine(project_name, false)).toBeTruthy;
  });

  it("Should quickly append verify delete new line", async () => {
    const deleteBTN = $$("clr-dg-row").last().$('button[title="Delete"]');
    expect(await commonAppend.deleteNewLine(deleteBTN)).toBeTruthy;
  });

  it("Should quickly append verify publish", async () => {
    expect(await commonAppend.quickAppendCsv()).toBeTruthy;
  });

  it("Should file append verify select existing file", async () => {
    expect(
      await commonAppend.fileAppendSelectExistingFile(
        Constant.dataset_name_text,
        false
      )
    ).toBeTruthy;
  });

  it("Should local file change and upload to append", async () => {
    const FILE_1 = "/doc/upload-resource/text-test-data.csv";
    const FILE_2 = "/doc/upload-resource/APPEND_TXT_BY_CSV.csv";
    const dataset_name = "e2e Test Data append txt al file" + Date.now();
    expect(
      await commonAppend.localFileChangeAndUpload(dataset_name, FILE_1, FILE_2)
    ).toBeTruthy;
  });
});
