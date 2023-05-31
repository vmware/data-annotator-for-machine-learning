/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { Constant } from "../general/constant";
import { browser, $, $$, ExpectedConditions, element, by } from "protractor";
import { FunctionUtil } from "../utils/function-util";
import { CommonUtils } from "../general/common-utils";

describe("Spec - upload new dataset", () => {
  let myDatasetsPage: MyDatasetsPage = new MyDatasetsPage();
  let SerialNum: string = new Date().getTime().toString().substring(0, 9);
  let New_CSV_Name: string = "e2e_Test_Data_" + SerialNum;

  // const PROMPT = $('span[class="alert-text"]');
  const since = require("jasmine2-custom-message");
  const ROUTERLINK = element(by.css('h2[routerlink="/loop/datasets/list"]'));
  const CSV_Path = "/doc/upload-resource/text-test-data.csv";
  const ACTION_ICONS = element.all(
    by.css("button cds-icon[shape=ellipsis-vertical]")
  );
  const ACTION_BUTTONS = element.all(
    by.css(".datagrid-action-overflow button")
  );
  const DELETE_DATA_OK_BTN = $(".modal-footer .btn.btn-primary");

  it("Should upload new dataset successfully.", async (done) => {
    console.log("log-start to create error formart CSV e2e_Test_Data_Img_");
    await myDatasetsPage.navigateTo();
    await myDatasetsPage.uploadErrorFormatCSV("e2e_Test_Data_Img", CSV_Path);

    console.log("log-start to create new CSV : " + New_CSV_Name);
    await myDatasetsPage.uploadCSV(New_CSV_Name, CSV_Path);
    await myDatasetsPage.waitForPageLoading();
    // await browser.wait(
    //   ExpectedConditions.visibilityOf(ROUTERLINK),
    //   Constant.DEFAULT_TIME_OUT
    // );
    console.log("log-succeed to create new CSV : " + New_CSV_Name);

    console.log("log-start to create exist CSV : " + New_CSV_Name);
    await myDatasetsPage.navigateToDatasetsList();
    await FunctionUtil.click(myDatasetsPage.CREATE_DATASET_BTN);
    await myDatasetsPage.uploadExistCSV(New_CSV_Name, CSV_Path);
    console.log("log-succeed to valid that CSV exist alert : " + New_CSV_Name);

    // since("should has share successfully prompt")
    //   .expect(myDatasetsPage.getPromptText())
    //   .toContain("Upload success.");
    await myDatasetsPage.navigateToDatasetsList();
    await myDatasetsPage.filterDatasetName(New_CSV_Name);
    let Datasets_Count_After_Filter = await myDatasetsPage.getTableLength();
    let Datasets_Name_Text = await myDatasetsPage.getCellText(0);
    if (Datasets_Name_Text !== "" && Datasets_Count_After_Filter > 0) {
      since("the datasets name should same as the user typed name")
        .expect(myDatasetsPage.getCellText(0))
        .toBe(New_CSV_Name);
      since("the data source should same as the user uploaded file")
        .expect(myDatasetsPage.getCellText(2))
        .toBe("text-test-data.csv");
      done();
    } else {
      done.fail("can not filter out the consistent datasets....");
    }
  });

  it("Should succeed to delete the new upload dataset", async () => {
    console.log("log-datasetName : " + New_CSV_Name);
    await browser.sleep(2000);
    await myDatasetsPage.filterDatasetName(New_CSV_Name);
    // await myDatasetsPage.deleteDatasets();
    // if (process.env.IN) {
    //   await browser.sleep(10000);
    // }
    await CommonUtils.deleteDataGrid(
      ACTION_ICONS.first(),
      ACTION_BUTTONS.last(),
      DELETE_DATA_OK_BTN
    );
    await myDatasetsPage.filterDatasetName(New_CSV_Name);
    const TABLE_LIST = $$("clr-dg-row");
    await browser.sleep(2000);
    expect(await FunctionUtil.getElementsNum(TABLE_LIST)).toEqual(0);
  });
});
