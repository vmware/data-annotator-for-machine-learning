/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Constant } from "../general/constant";
import { $, browser, by, element } from "protractor";
import { DownloadSharePage } from "../page-object/download-share-page";
import { CommonPage } from "../general/common-page";
import { FunctionUtil } from "../utils/function-util";
import { MyDatasetsPage } from "../page-object/my-datasets-page";

describe("Spec - verify generate-download-share function", () => {
  const filename = "Export_text-test-data_";
  const dirPath = require("path").join(__dirname, "../doc/download");

  let commonPage: CommonPage;
  let downloadSharePage: DownloadSharePage;
  let myDatasetsPage: MyDatasetsPage;
  const NAV_TASK_LIST = $('a[href="/loop/project/list"]');
  const CLR_TABS = element.all(by.css("clr-tabs ul li"));

  beforeAll(() => {
    myDatasetsPage = new MyDatasetsPage();
    commonPage = new CommonPage();
    downloadSharePage = new DownloadSharePage();
  });

  describe("Spec - verify project tab", () => {
    beforeEach((down) => {
      downloadSharePage.reMoveDir(dirPath);
      down();
    });

    it("Should generate-new-dataset.", async (done) => {
      await browser.sleep(2000);
      await FunctionUtil.click(NAV_TASK_LIST);
      await commonPage.waitForGridLoading();
      await browser.sleep(1000);
      await commonPage.filterProjectName(Constant.project_name_text_multiple);
      await browser.sleep(3000);
      await commonPage.clickActionBtn(3);
      await browser.sleep(1000);
      await downloadSharePage.clickGenerateNewDataset();
      expect(
        await downloadSharePage.verifyDownloadFileExisted(filename, dirPath)
      ).toBe(true);
      done();
    });

    it("Should download project.", async (done) => {
      await commonPage.clickActionBtn(3);
      await browser.sleep(1000);
      await downloadSharePage.clickGenerateNewDataset();
      expect(
        await downloadSharePage.verifyDownloadFileExisted(filename, dirPath)
      ).toBe(true);
      done();
    });

    it("should share project.", async (done) => {
      await downloadSharePage.shareProject(Constant.project_name_text_multiple);
      expect(downloadSharePage.verifySharedStatus()).toEqual("Unshare");
      done();
    });
  });

  describe("Spec verify community-dataset tab", () => {
    beforeEach((down) => {
      downloadSharePage.reMoveDir(dirPath);
      down();
    });

    it("Should in community data list page", async (done) => {
      await myDatasetsPage.navigateToDatasetsList();
      await commonPage.waitForGridLoading();
      await FunctionUtil.click(CLR_TABS.get(1));
      await commonPage.toClickRefreshBtn();
      await browser.sleep(2000);
      done();
    });

    it("Should generate-new-dataset", async (done) => {
      await commonPage.waitForGridLoading();
      await commonPage.changePageValue(2);
      await commonPage.filterProjectName(Constant.project_name_text_multiple);
      await downloadSharePage.clickDownloadProject();
      await downloadSharePage.clickGenerateNewDataset();
      expect(
        await downloadSharePage.verifyDownloadFileExisted(filename, dirPath)
      ).toBe(true);
      done();
    });

    it("Should download project", async (done) => {
      await downloadSharePage.clickDownloadProject();
      await downloadSharePage.downloadProject();
      expect(
        await downloadSharePage.verifyDownloadFileExisted(filename, dirPath)
      ).toBe(true);
      done();
    });

    it("Should preview dataset in your datasets tab", async (done) => {
      await myDatasetsPage.navigateToDatasetsList();
      await browser.sleep(2000);
      await FunctionUtil.click(CLR_TABS.get(0));
      await commonPage.waitForGridLoading();
      await commonPage.toClickRefreshBtn();
      await browser.sleep(1000);
      await commonPage.filterProjectName(Constant.dataset_name_text);
      await browser.sleep(2000);
      await commonPage.clickActionBtn(0);
      await browser.sleep(1000);
      await FunctionUtil.elementVisibilityOf(
        downloadSharePage.MODAL_CANCEL_BTN
      );
      await downloadSharePage.MODAL_CANCEL_BTN.click();
      await browser.sleep(1000);
      await downloadSharePage.clickLabelingTask();
      await browser.sleep(1000);
      await FunctionUtil.click(downloadSharePage.CLOSE_BTN);
      await browser.sleep(1000);
      let labelingTaskLen = await FunctionUtil.getElementsNum(
        downloadSharePage.DATASET_LABELING_TASK_LINK_ALL
      );
      console.log("log-labeling task num is: ", labelingTaskLen);
      if (labelingTaskLen > 1) {
        await await FunctionUtil.click(myDatasetsPage.MORE_BTN);
      }
      done();
    });

    it("Should in power user datasets tab", async (done) => {
      await myDatasetsPage.navigateToDatasetsList();
      await browser.sleep(2000);
      await FunctionUtil.click(CLR_TABS.get(2));
      await commonPage.waitForGridLoading();
      await commonPage.toClickRefreshBtn();
      await browser.sleep(1000);
      done();
    });
  });
});
