/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { Constant } from "../general/constant";
import { CommonPage } from "../general/common-page";
import { browser, by, element } from "protractor";
import { DownloadSharePage } from "../page-object/download-share-page";
import { FunctionUtil } from "../utils/function-util";

describe("Spec- start to preview my dataset page", () => {
  let myDatasetsName: string;
  let myDatasetsPage: MyDatasetsPage;
  let since = require("jasmine2-custom-message");
  let commonPage: CommonPage;
  let downloadSharePage: DownloadSharePage;
  let PREVIEW_CANCEL_BTN = element(by.css("cds-icon[shape=arrow]"));

  beforeAll(() => {
    LoginBusiness.verifyLogin();
    myDatasetsPage = new MyDatasetsPage();
    commonPage = new CommonPage();
    downloadSharePage = new DownloadSharePage();
  });

  it("Should change the page value successfully.", async (done) => {
    await myDatasetsPage.navigateToDatasetsList();
    await myDatasetsPage.waitForPageLoading();
    await commonPage.changePageValue(2);
    done();
  });

  it("Should not delete image dataset successfully without delete the related image project.", async (done) => {
    myDatasetsName = Constant.dataset_name_image;
    await myDatasetsPage.filterDatasetName(myDatasetsName);
    let Datasets_Count_After_Filter = await myDatasetsPage.getTableLength();
    if (Datasets_Count_After_Filter > 0) {
      console.log("log-start to delete image dataset");
      await commonPage.clickActionBtn(1);
      await browser.sleep(1000);
      await commonPage.DELETE_PROJECT_CANCEL_BTN.click();
      await commonPage.clickActionBtn(1);
      await browser.sleep(1000);
      await commonPage.DELETE_PROJECT_OK_BTN.click();
      await browser.sleep(1000);
      since("prompt should show up and content correct")
        .expect((await commonPage.getPromptText()).split("."))
        .toContain("Delete dataset failed");
      await browser.sleep(1000);
    } else {
      console.log("log-can not filter out the consistent datasets....");
    }
    done();
  });

  it("Should preview image dataset successfully.", async (done) => {
    myDatasetsName = Constant.dataset_name_image;
    await myDatasetsPage.navigateToDatasetsList();
    await myDatasetsPage.waitForPageLoading();
    await myDatasetsPage.filterDatasetName(myDatasetsName);
    let Datasets_Count_After_Filter = await myDatasetsPage.getTableLength();
    if (Datasets_Count_After_Filter > 0) {
      console.log("log-start to preview image dataset");
      await commonPage.clickActionBtn(0);
      await browser.sleep(1000);
      await FunctionUtil.elementVisibilityOf(
        downloadSharePage.MODAL_CANCEL_BTN
      );
      await downloadSharePage.MODAL_CANCEL_BTN.click();
      await browser.sleep(1000);
      await commonPage.clickGridFirstCell();
      await browser.sleep(1000);
      await PREVIEW_CANCEL_BTN.click();
    } else {
      console.log("log-can not filter out the consistent datasets....");
    }
    done();
  });
});
