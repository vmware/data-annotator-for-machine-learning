/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { CommonUtils } from "../general/common-utils";

describe("delete function", () => {
  let myDatasetsName: string;
  let myDatasetsPage: MyDatasetsPage;
  let since = require("jasmine2-custom-message");

  beforeAll(() => {
    myDatasetsName = "e2e Test Data";
    LoginBussiness.verifyLogin();
    myDatasetsPage = new MyDatasetsPage();
  });

  it("Delete the added datasets.", async (done) => {
    await myDatasetsPage.navigateTo();
    await myDatasetsPage.waitForPageLoading();
    await myDatasetsPage.filterDatasetstName(myDatasetsName);
    let Datasets_Count_After_Filter = await myDatasetsPage.getTableLength();
    if (Datasets_Count_After_Filter > 0) {
      console.log("----------start to delete datasets----------");
      await CommonUtils.deleteMyDatasetsLoop(myDatasetsName);
      await myDatasetsPage.filterDatasetstName(myDatasetsName);
      let Datasets_Count_After_Delete = await myDatasetsPage.getTableLength();
      since("the count should be zero after delete")
        .expect(Datasets_Count_After_Delete)
        .toBe(0);
    } else {
      console.log("can not filter out the consitent datasets....");
    }
    done();
  });
});
