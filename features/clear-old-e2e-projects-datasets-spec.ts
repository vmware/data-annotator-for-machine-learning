/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { CommonUtils } from "../general/common-utils";
import { Constant } from "../general/constant";
import { browser, $, $$, ExpectedConditions, element, by } from "protractor";
import { FunctionUtil } from "../utils/function-util";

describe("Spec - clear projects and datasets", () => {
  const myDatasetsPage: MyDatasetsPage = new MyDatasetsPage();
  const TABLE_LIST = $$("clr-dg-row");
  const projectName = Constant.project_name;
  const datasetsName = Constant.dataset_name;
  const NAV_GROUP = element.all(by.css(".nav-group-text"));
  const NAV_TEXT = element.all(by.css(".nav-link .nav-text"));
  // const PROJECT_TAB = $('.header-nav a[href="/projects"]');
  // const MYDATASETS_TAB = $('.header-nav a[href="/myDatasets"]');
  // const DELETE_BTN = $$('button[title="Delete Project"]');
  // const DELETE_DATASET_BTN = $$('button[title="Delete Dataset"]');
  const ACTION_ICONS = element.all(
    by.css("button cds-icon[shape=ellipsis-vertical]")
  );
  const ACTION_BUTTONS = element.all(
    by.css(".datagrid-action-overflow button")
  );
  const DELETE_DATA_OK_BTN = $(".modal-footer .btn.btn-primary");

  it("Should succeed to clear old e2e projects", async () => {
    await browser.sleep(2000);
    await FunctionUtil.clickByText(NAV_GROUP, "Labeling Tasks");
    await browser.sleep(2000);
    await FunctionUtil.clickByText(NAV_TEXT, "Labeling Tasks List");
    await browser.sleep(10000);
    await myDatasetsPage.waitForGridLoading();
    await myDatasetsPage.filterDatasetName(projectName);
    let dataLength = await FunctionUtil.getElementsNum(TABLE_LIST);
    console.log("log-clear old e2e projects-dataLength:", dataLength);
    if (dataLength > 0) {
      for (var i = 0; i < dataLength; i++) {
        await CommonUtils.deleteDataGrid(
          ACTION_ICONS.first(),
          ACTION_BUTTONS.last(),
          DELETE_DATA_OK_BTN
        );
      }
      await browser.sleep(2000);
    }
    expect(await FunctionUtil.getElementsNum(TABLE_LIST)).toEqual(0);
  });

  it("Should succeed to clear old e2e dataset", async () => {
    await browser.sleep(2000);
    await FunctionUtil.clickByText(NAV_GROUP, "Datasets");
    await browser.sleep(2000);
    await FunctionUtil.clickByText(NAV_TEXT, "Datasets List");
    await myDatasetsPage.waitForGridLoading();
    await browser.sleep(5000);
    await myDatasetsPage.filterDatasetName(datasetsName);
    await browser.sleep(2000);
    let dataLength = await FunctionUtil.getElementsNum(TABLE_LIST);
    console.log("log-clear old e2e dataset-dataLength:", dataLength);
    for (var i = 0; i < dataLength; i++) {
      if (process.env.IN && i > 0) {
        await browser.sleep(5000);
      }
      await CommonUtils.deleteDataGrid(
        ACTION_ICONS.first(),
        ACTION_BUTTONS.last(),
        DELETE_DATA_OK_BTN
      );
    }
    if (process.env.IN) {
      await browser.sleep(5000);
    }
    await browser.sleep(2000);
    expect(await FunctionUtil.getElementsNum(TABLE_LIST)).toEqual(0);
  });
});
