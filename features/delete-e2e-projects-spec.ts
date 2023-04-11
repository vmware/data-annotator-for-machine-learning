/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { CommonUtils } from "../general/common-utils";
import { Constant } from "../general/constant";
import { browser, $, $$, element, by } from "protractor";
import { FunctionUtil } from "../utils/function-util";

describe("Spec - clear projects and datasets", () => {
  const myDatasetsPage: MyDatasetsPage = new MyDatasetsPage();
  const TABLE_LIST = $$("clr-dg-row");
  const NAV_TEXT = element.all(by.css(".nav-link .nav-text"));
  const ACTION_ICONS = element.all(
    by.css("button cds-icon[shape=ellipsis-vertical]")
  );
  const ACTION_BUTTONS = element.all(
    by.css(".datagrid-action-overflow button")
  );
  const DELETE_DATA_OK_BTN = $(".modal-footer .btn.btn-primary");

  it("Should succeed to delete e2e projects", async () => {
    await browser.sleep(2000);
    await FunctionUtil.clickByText(NAV_TEXT, "Labeling Tasks List");
    await browser.sleep(2000);
    await myDatasetsPage.waitForGridLoading();
    await myDatasetsPage.filterDatasetName(
      Constant.project_name_hierarchical_label
    );
    await browser.sleep(2000);
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
    expect(await FunctionUtil.getElementsNum(TABLE_LIST)).toEqual(0);
  });
});
