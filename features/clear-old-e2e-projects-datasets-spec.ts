/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { CommonUtils } from "../general/common-utils";
import { Constant } from "../general/constant";
import { browser, $, $$, ExpectedConditions } from "protractor";
import { FunctionUtil } from "../utils/function-util";

describe("upload new dataset on myDatasets page..", () => {
  const myDatasetsPage: MyDatasetsPage = new MyDatasetsPage();

  const TABLE_LIST = $$("clr-dg-row");
  const projectName = Constant.project_name;
  const datasetsName = Constant.dataset_name;
  const PROJECT_TAB = $('.header-nav a[href="/projects"]');
  const MYDATASETS_TAB = $('.header-nav a[href="/myDatasets"]');

  const DELETE_BTN = $$('button[title="Delete Project"]');
  const DELETE_DATASET_BTN = $$('button[title="Delete Dataset"]');
  const DELETE_DATASET_OK_BTN = $(".modal-footer .btn.btn-primary");

  it("clear old e2e projects", async () => {
    await browser.sleep(2000);
    await FunctionUtil.click(PROJECT_TAB);
    await myDatasetsPage.waitForGridLoading();
    await myDatasetsPage.filterDatasetstName(projectName);
    let dataLength = await FunctionUtil.getElementsNum(TABLE_LIST);
    console.log("clear old e2e projects-dataLength:", dataLength);
    if (dataLength > 0) {
      for (var i = 0; i < dataLength; i++) {
        await CommonUtils.deleteDataGrid(
          DELETE_BTN.first(),
          DELETE_DATASET_OK_BTN
        );
      }
      await browser.sleep(2000);
    }
    expect(await FunctionUtil.getElementsNum(TABLE_LIST)).toEqual(0);
  });

  it("clear old e2e dataset", async () => {
    await browser.sleep(2000);
    await FunctionUtil.click(MYDATASETS_TAB);
    await myDatasetsPage.waitForGridLoading();
    await myDatasetsPage.filterDatasetstName(datasetsName);
    let dataLength = await FunctionUtil.getElementsNum(TABLE_LIST);
    console.log("log-clear old e2e dataset-dataLength:", dataLength);
    for (var i = 0; i < dataLength; i++) {
      if (process.env.IN && i > 0) {
        await browser.sleep(5000);
      }
      await CommonUtils.deleteDataGrid(
        DELETE_DATASET_BTN.first(),
        DELETE_DATASET_OK_BTN
      );
    }
    if (process.env.IN) {
      await browser.sleep(5000);
    }
    await browser.sleep(2000);
    expect(await FunctionUtil.getElementsNum(TABLE_LIST)).toEqual(0);
  });
});
