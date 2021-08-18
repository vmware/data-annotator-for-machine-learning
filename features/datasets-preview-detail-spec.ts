/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { Constant } from "../general/constant";
import { CommonPage } from "../general/commom-page";
import { browser, by, element } from "protractor";

describe("delete function", () => {
  let myDatasetsName: string;
  let myDatasetsPage: MyDatasetsPage;
  let since = require("jasmine2-custom-message");
  let commonPage: CommonPage;
  let PREVIEW_CANCEL_BTN = element(
    by.css("div.modal-footer button.btn[type=button]")
  );

  beforeAll(() => {
    LoginBussiness.verifyLogin();
    myDatasetsPage = new MyDatasetsPage();
    commonPage = new CommonPage();
  });

  it("Should preview text dataset successfully.", async (done) => {
    myDatasetsName = Constant.dataset_name_text;
    await myDatasetsPage.navigateTo();
    await myDatasetsPage.waitForPageLoading();
    await myDatasetsPage.filterDatasetstName(myDatasetsName);
    let Datasets_Count_After_Filter = await myDatasetsPage.getTableLength();
    if (Datasets_Count_After_Filter > 0) {
      console.log("----------start to preview text dataset----------");
      await commonPage.clickGridFirstCell();
      await browser.sleep(1000);
      await PREVIEW_CANCEL_BTN.click();
    } else {
      console.log("can not filter out the consitent datasets....");
    }
    done();
  });

  it("Should preview log dataset successfully.", async (done) => {
    myDatasetsName = Constant.dataset_name_log;
    await myDatasetsPage.navigateTo();
    await myDatasetsPage.waitForPageLoading();
    await myDatasetsPage.filterDatasetstName(myDatasetsName);
    let Datasets_Count_After_Filter = await myDatasetsPage.getTableLength();
    if (Datasets_Count_After_Filter > 0) {
      console.log("----------start to preview log dataset----------");
      await commonPage.clickGridFirstCell();
      await browser.sleep(1000);
      await PREVIEW_CANCEL_BTN.click();
    } else {
      console.log("can not filter out the consitent datasets....");
    }
    done();
  });

  it("Should preview image dataset successfully.", async (done) => {
    myDatasetsName = Constant.dataset_name_image;
    await myDatasetsPage.navigateTo();
    await myDatasetsPage.waitForPageLoading();
    await myDatasetsPage.filterDatasetstName(myDatasetsName);
    let Datasets_Count_After_Filter = await myDatasetsPage.getTableLength();
    if (Datasets_Count_After_Filter > 0) {
      console.log("----------start to preview image dataset----------");
      await commonPage.clickGridFirstCell();
      await browser.sleep(1000);
      await PREVIEW_CANCEL_BTN.click();
    } else {
      console.log("can not filter out the consitent datasets....");
    }
    done();
  });
});
