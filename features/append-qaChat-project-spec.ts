/*
Copyright 2019-2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Constant } from "../general/constant";
import { CommonAppend } from "../general/common-append";

describe("Spec - verify basic project append function", () => {
  const project_name: string = Constant.project_name_qa_chat_existingQA;
  const commonAppend: CommonAppend = new CommonAppend();

  it("Should file append verify select existing file", async () => {
    expect(
      await commonAppend.fileAppendSelectExistingFile(
        Constant.dataset_name_qa_chat_existingQA,
        "qaChat"
      )
    ).toBeTruthy;
  });
});
