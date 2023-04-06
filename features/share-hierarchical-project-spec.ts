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

describe("Spec - verify share HTL project function", () => {
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
    it("should share project.", async (done) => {
      await browser.sleep(2000);
      await FunctionUtil.click(NAV_TASK_LIST);
      await commonPage.waitForGridLoading();

      await commonPage.filterProjectName(
        Constant.project_name_hierarchical_label
      );
      await browser.sleep(1000);
      await downloadSharePage.shareProject(
        Constant.project_name_hierarchical_label
      );
      expect(downloadSharePage.verifySharedStatus()).toEqual("Unshare");
      done();
    });
  });

  describe("Spec verify community-dataset tab", () => {
    it("Should in community data list page", async (done) => {
      await myDatasetsPage.navigateToDatasetsList();
      await commonPage.waitForGridLoading();
      await browser.sleep(2000);
      await FunctionUtil.click(CLR_TABS.get(1));
      await browser.sleep(1000);
      await commonPage.filterProjectName(
        Constant.project_name_hierarchical_label
      );
      await browser.sleep(1000);
      await FunctionUtil.click(commonPage.VIEW_LIST_ICON);
      await browser.sleep(1000);
      await FunctionUtil.click(downloadSharePage.CLOSE_BTN);
      done();
    });
  });
});
