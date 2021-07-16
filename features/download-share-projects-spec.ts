/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Constant } from "../general/constant";
import { $, browser } from "protractor";
import { DownloadSharePage } from "../page-object/download-share-page";
import { CommonPage } from "../general/commom-page";
import { FunctionUtil } from "../utils/function-util";
const path = require("path");

describe("verify generate-download-share funtion", () => {
  const filename = "Export_text-test-data_";
  // const dirPath = process.cwd() + '\\doc\\download';
  const dirPath = require("path").join(__dirname, "../doc/download");

  let commonPage: CommonPage = new CommonPage();
  let downloadSharePage: DownloadSharePage = new DownloadSharePage();
  let project_name: string = Constant.project_name;
  const PROJECT_TAB = $('.header-nav a[href="/projects"]');

  describe("verify project tab", () => {
    beforeEach((down) => {
      downloadSharePage.reMoveDir(dirPath);
      down();
    });

    it("Generate-new-dataset.", async (done) => {
      await FunctionUtil.click(PROJECT_TAB);
      await commonPage.waitForGridLoading();
      console.log("generate_project_name:::", project_name);
      await commonPage.filterProjectName(project_name);
      await downloadSharePage.clickdownloadProject();
      await downloadSharePage.clickGenerateNewDataset();
      expect(
        await downloadSharePage.verifyDownloadFileExisted(filename, dirPath)
      ).toBe(true);
      done();
    });

    it("Download project.", async (done) => {
      await browser.sleep(1000);
      await downloadSharePage.clickdownloadProject();
      await downloadSharePage.downloadPrject();
      expect(
        await downloadSharePage.verifyDownloadFileExisted(filename, dirPath)
      ).toBe(true);
      done();
    });

    it("Share project.", async (done) => {
      if ((await downloadSharePage.verifySharedStatus()) == "folder") {
        await downloadSharePage.clickShareBtn();
        await downloadSharePage.inputShareInfo("e2e test share project");
        await downloadSharePage.shareProject();
        expect(downloadSharePage.verifySharedStatus()).toEqual("folder-open");
        done();
      } else {
        expect(downloadSharePage.verifySharedStatus()).toEqual("folder-open");
        done();
      }
    });
  });

  describe("verify community-dataset tab", () => {
    beforeEach((down) => {
      downloadSharePage.reMoveDir(dirPath);
      down();
    });

    it("Generate-new-dataset", async (done) => {
      const COMMUNITY_DATASETS_TAB = $('.header-nav a[href="/datasets"]');
      await FunctionUtil.click(COMMUNITY_DATASETS_TAB);
      await commonPage.waitForGridLoading();
      await commonPage.filterProjectName(project_name);
      await downloadSharePage.clickdownloadProject();
      await downloadSharePage.clickGenerateNewDataset();
      expect(
        await downloadSharePage.verifyDownloadFileExisted(filename, dirPath)
      ).toBe(true);
      done();
    });

    it("Download project", async (done) => {
      await downloadSharePage.clickdownloadProject();
      await downloadSharePage.downloadPrject();
      expect(
        await downloadSharePage.verifyDownloadFileExisted(filename, dirPath)
      ).toBe(true);
      done();
    });
  });
});
