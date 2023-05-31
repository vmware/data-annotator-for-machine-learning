/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { $, $$ } from "protractor";
import { Constant } from "../general/constant";
import { CommonAppend } from "../general/common-append";

describe("Spec - verify image project append function", () => {
  const project_name: string = Constant.project_name_image;
  const commonAppend: CommonAppend = new CommonAppend();

  it("should quick append verify add new line", async () => {
    expect(await commonAppend.appendNewLine(project_name, false)).toBeTruthy;
  });

  it("should quick append verify delete new line", async () => {
    const deleteBTN = $$("clr-dg-row").last().$('cds-icon[shape="trash"]');
    expect(await commonAppend.deleteNewLine(deleteBTN)).toBeTruthy;
  });

  it("should quick append verify publish", async () => {
    const FILE_PATH = "/doc/upload-resource/APPEND_IMAGE.jpg";
    const IMAGE_INPUT = $("#uploadImage0");
    expect(
      await commonAppend.quickAppendSingleFileUpload(FILE_PATH, IMAGE_INPUT)
    ).toBeTruthy;
  });

  it("should file append verify selected existing file", async () => {
    expect(
      await commonAppend.fileAppendSelectExistingFile(
        Constant.dataset_name_image,
        false
      )
    ).toBeTruthy;
  });

  it("should local file change and upload to append", async () => {
    const FILE_1 = "/doc/upload-resource/image-test-data.zip";
    const FILE_2 = "/doc/upload-resource/APPEND_IMAGES_BY_ZIP.zip";
    const dataset_name = "e2e_Test_Data_append_image_file" + Date.now();
    expect(
      await commonAppend.localFileChangeAndUpload(dataset_name, FILE_1, FILE_2)
    ).toBeTruthy;
  });
});
