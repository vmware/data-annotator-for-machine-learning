/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Constant } from "../general/constant";
import { $, browser, element, by } from "protractor";
import { DownloadSharePage } from "../page-object/download-share-page";
import { CommonPage } from "../general/common-page";
import { FunctionUtil } from "../utils/function-util";

describe("Spec - verify generate-download-share function", () => {
  const filename = "Export_text-test-data_";
  const logFileName = "Export_log-test-data_";
  const dirPath = require("path").join(__dirname, "../doc/download");

  let commonPage: CommonPage = new CommonPage();
  let downloadSharePage: DownloadSharePage = new DownloadSharePage();
  const NAV_TASK_LIST = $('a[href="/loop/project/list"]');

  const CLR_TABS = element.all(by.css("clr-tabs ul li"));

  describe("Spec - verify project tab", () => {
    beforeEach((down) => {
      downloadSharePage.reMoveDir(dirPath);
      down();
    });

    it("Should in labeling task list page.", async (done) => {
      await browser.sleep(2000);
      await FunctionUtil.click(NAV_TASK_LIST);
      await commonPage.waitForGridLoading();
      done();
    });

    it("Should share log project.", async (done) => {
      await downloadSharePage.shareProject(Constant.project_name_log);
      expect(downloadSharePage.verifySharedStatus()).toEqual("Unshare");
      done();
    });
  });

  describe("Spec - verify community-dataset tab", () => {
    beforeEach((down) => {
      downloadSharePage.reMoveDir(dirPath);
      down();
    });

    it("Should preview dataset in community page", async (done) => {
      await FunctionUtil.click($('a[href="/loop/datasets/list"]'));
      await browser.sleep(1000);
      await FunctionUtil.click(CLR_TABS.get(0));
      await commonPage.waitForGridLoading();
      await commonPage.clickActionBtn(0);
      await browser.sleep(1000);
      await FunctionUtil.elementVisibilityOf(
        downloadSharePage.MODAL_CANCEL_BTN
      );
      await FunctionUtil.click(downloadSharePage.MODAL_CANCEL_BTN);
      await browser.sleep(1000);
      done();
    });

    it("Should in community data list page", async (done) => {
      await FunctionUtil.click(CLR_TABS.get(1));
      await commonPage.waitForGridLoading();
      done();
    });

    it("Should download log project", async (done) => {
      await commonPage.filterProjectName(Constant.project_name_log);
      await downloadSharePage.clickDownloadProject();
      await downloadSharePage.clickGenerateNewDataset();
      expect(
        await downloadSharePage.verifyDownloadFileExisted(logFileName, dirPath)
      ).toBe(true);
      done();
    });

    it("Should download log original datasets", async (done) => {
      await commonPage.filterProjectName(Constant.project_name_log);
      await commonPage.waitForGridLoading();
      await downloadSharePage.clickDownloadProject();
      await downloadSharePage.downloadLogOriginalDataAndClose();
      const log_dataset = "log-test-data.tgz";
      expect(
        await downloadSharePage.verifyDownloadFileExisted(log_dataset, dirPath)
      ).toBe(true);
      done();
    });

    it("Should unshare log project", async (done) => {
      await FunctionUtil.click(NAV_TASK_LIST);
      await commonPage.waitForGridLoading();
      await commonPage.filterProjectName(Constant.project_name_log);
      await commonPage.waitForGridLoading();
      await browser.sleep(1000);
      await downloadSharePage.unshareProject();
      await commonPage.waitForGridLoading();
      await commonPage.filterProjectName(Constant.project_name_log);
      expect(downloadSharePage.verifySharedStatus()).toEqual("Share");
      done();
    });
  });
});
