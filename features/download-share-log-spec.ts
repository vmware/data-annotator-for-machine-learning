/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Constant } from "../general/constant";
import { $, browser } from "protractor";
import { DownloadSharePage } from "../page-object/download-share-page";
import { CommonPage } from "../general/commom-page";
import { FunctionUtil } from "../utils/function-util";

describe("verify generate-download-share function", () => {
  const filename = "Export_text-test-data_";
  const logFileName = "Export_log-test-data_";
  const dirPath = require("path").join(__dirname, "../doc/download");

  let commonPage: CommonPage = new CommonPage();
  let downloadSharePage: DownloadSharePage = new DownloadSharePage();
  let project_name: string = Constant.project_name_text_multiple;
  const PROJECT_TAB = $('.header-nav a[href="/projects"]');
  const COMMUNITY_DATASETS_TAB = $('.header-nav a[href="/datasets"]');

  describe("verify project tab", () => {
    beforeEach((down) => {
      downloadSharePage.reMoveDir(dirPath);
      down();
    });

    it("Generate-new-project.", async (done) => {
      await browser.sleep(2000);
      await FunctionUtil.click(PROJECT_TAB);
      await commonPage.waitForGridLoading();
      done();
    });

    it("Share log project.", async (done) => {
      await downloadSharePage.shareProject(Constant.project_name_log);
      if (process.env.IN) {
        expect(downloadSharePage.verifySharedStatus()).toEqual("folder");
      } else {
        expect(downloadSharePage.verifySharedStatus()).toEqual("folder-open");
      }
      done();
    });
  });

  describe("verify community-dataset tab", () => {
    beforeEach((down) => {
      downloadSharePage.reMoveDir(dirPath);
      down();
    });

    it("Generate-new-dataset", async (done) => {
      await FunctionUtil.click(COMMUNITY_DATASETS_TAB);
      await commonPage.waitForGridLoading();
      done();
    });

    it("Download log project", async (done) => {
      await commonPage.filterProjectName(Constant.project_name_log);
      await downloadSharePage.clickdownloadProject();
      await downloadSharePage.clickGenerateNewDataset();
      expect(
        await downloadSharePage.verifyDownloadFileExisted(logFileName, dirPath)
      ).toBe(true);
      done();
    });

    it("Download log original datasets", async (done) => {
      await commonPage.filterProjectName(Constant.project_name_log);
      await downloadSharePage.clickdownloadProject();
      await downloadSharePage.downloadLogOriginalDataAndClose();
      const log_dataset = "log-test-data.tgz";
      expect(
        await downloadSharePage.verifyDownloadFileExisted(log_dataset, dirPath)
      ).toBe(true);
      done();
    });

    it("Unshare log project", async (done) => {
      await FunctionUtil.click(PROJECT_TAB);
      await commonPage.waitForGridLoading();
      await commonPage.filterProjectName(Constant.project_name_log);
      await downloadSharePage.unshareProject();
      await commonPage.waitForGridLoading();
      await commonPage.filterProjectName(Constant.project_name_log);
      expect(downloadSharePage.verifySharedStatus()).toEqual("folder");
      done();
    });
  });
});
