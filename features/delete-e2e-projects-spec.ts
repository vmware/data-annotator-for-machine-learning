/*
Copyright 2019-2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { CommonUtils } from "../general/common-utils";
import { Constant } from "../general/constant";
import { browser, $, $$, element, by } from "protractor";
import { FunctionUtil } from "../utils/function-util";
import { CommonPage } from "../general/common-page";

describe("Spec - delete projects and datasets", () => {
  const myDatasetsPage: MyDatasetsPage = new MyDatasetsPage();
  const TABLE_LIST = $$("clr-dg-row");
  const NAV_GROUP = element.all(by.css(".nav-group-text"));
  const NAV_TEXT = element.all(by.css(".nav-link .nav-text"));
  const ACTION_ICONS = element.all(
    by.css("button cds-icon[shape=ellipsis-vertical]")
  );
  const ACTION_BUTTONS = element.all(
    by.css(".datagrid-action-overflow button")
  );
  const DELETE_DATA_OK_BTN = $(".modal-footer .btn.btn-primary");
  let commonPage: CommonPage;

  beforeAll(() => {
    commonPage = new CommonPage();
  });

  it("Should succeed to delete e2e projects", async () => {
    await browser.sleep(2000);
    await FunctionUtil.clickByText(NAV_TEXT, "Labeling Tasks List");
    await browser.sleep(2000);
    await myDatasetsPage.waitForGridLoading();
    await myDatasetsPage.filterDatasetName(Constant.project_name);
    await browser.sleep(2000);
    await commonPage.changePageValue(3);
    let dataLength = await FunctionUtil.getElementsNum(TABLE_LIST);
    console.log("log-delete e2e projects-dataLength:", dataLength);
    if (dataLength > 0) {
      for (var i = 0; i < dataLength; i++) {
        await CommonUtils.deleteLabelTaskCancel(
          ACTION_ICONS.first(),
          ACTION_BUTTONS.last()
        );
        await browser.sleep(2000);
        await CommonUtils.deleteDataGrid(
          ACTION_ICONS.first(),
          ACTION_BUTTONS.last(),
          DELETE_DATA_OK_BTN
        );
      }
      await browser.sleep(2000);
    }
    console.log(
      "log-delete e2e projects-dataLength-after:",
      await FunctionUtil.getElementsNum(TABLE_LIST)
    );
    expect(await FunctionUtil.getElementsNum(TABLE_LIST)).toEqual(0);
  });
  it("Should succeed to delete e2e dataset", async () => {
    await browser.sleep(2000);
    // await FunctionUtil.clickByText(NAV_GROUP, "Datasets");
    // await browser.sleep(2000);
    await FunctionUtil.clickByText(NAV_TEXT, "Datasets List");
    await myDatasetsPage.waitForGridLoading();
    await browser.sleep(5000);
    await myDatasetsPage.filterDatasetName(Constant.dataset_name);
    await browser.sleep(2000);
    await commonPage.changePageValue(3);
    let dataLength = await FunctionUtil.getElementsNum(TABLE_LIST);
    console.log("log-delete old e2e dataset-dataLength:", dataLength);
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
