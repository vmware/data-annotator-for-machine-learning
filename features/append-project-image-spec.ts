/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { browser, $, $$, ExpectedConditions, element, by } from "protractor";
import { Constant } from "../general/constant";
import { CommonAppend } from "../general/common-append";

describe("verify image project append funtion", () => {
  const project_name: string = Constant.project_name_image;
  const commonAppend: CommonAppend = new CommonAppend();

  it("Qick append verify add new line", async () => {
    expect(await commonAppend.appenNewLine(project_name)).toBeTruthy;
  });

  it("Qick append verify delete new line", async () => {
    const deleteBTN = await $$("clr-dg-row")
      .last()
      .$$(".label.labelUpload")
      .first();
    expect(await commonAppend.deleteNewLine(deleteBTN)).toBeTruthy;
  });

  it("Qick append verify publish", async () => {
    const FILE_PATH = "/doc/upload-resource/APPEND_IMAGE.jpg";
    const IMAGE_INPUT = $("#uploadImage0");
    expect(
      await commonAppend.quickAppendSingleFileUpload(FILE_PATH, IMAGE_INPUT)
    ).toBeTruthy;
  });

  it("File append verify selete existing file", async () => {
    expect(await commonAppend.fileAppendSelectExistingFile(project_name))
      .toBeTruthy;
  });
});
