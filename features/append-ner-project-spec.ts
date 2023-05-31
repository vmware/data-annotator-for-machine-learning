/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Constant } from "../general/constant";
import { CommonAppend } from "../general/common-append";

describe("Spec - verify basic project append function", () => {
  const project_name: string = Constant.project_name_ner;
  const commonAppend: CommonAppend = new CommonAppend();

  it("Should quick append verify add new line", async () => {
    expect(await commonAppend.appendNewLine(project_name, true)).toBeTruthy;
  });

  it("Should file append verify select existing file", async () => {
    expect(
      await commonAppend.fileAppendSelectExistingFile(
        Constant.dataset_name_ner,
        true
      )
    ).toBeTruthy;
  });

  it("Should local file change and upload to append", async () => {
    const FILE_1 = "/doc/upload-resource/ner-test-data.csv";
    const FILE_2 = "/doc/upload-resource/APPEND_NER_BY_CSV.csv";
    const dataset_name = "e2e_Test_Data_append_ner_file" + Date.now();
    expect(
      await commonAppend.localFileChangeAndUpload(dataset_name, FILE_1, FILE_2)
    ).toBeTruthy;
  });
});
