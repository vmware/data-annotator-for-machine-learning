/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { Constant } from "../general/constant";
import { browser, $, $$, ExpectedConditions } from "protractor";
import { FunctionUtil } from "../utils/function-util";

describe("upload new dataset on myDatasets page..", () => {
  
  let myDatasetsPage: MyDatasetsPage = new MyDatasetsPage();
  let SerialNum: string = new Date().getTime().toString().substring(0, 9);
  let New_CSV_Name: string = "e2e Test Data " + SerialNum;

  const PROMPT = $('span[class="alert-text"]');
  const CSV_Path = "/doc/upload-resource/text-test-data.csv";
  let since = require("jasmine2-custom-message");

  it("Should upload new dataset successfully.", async (done) => {
    console.log("start to create error formart CSV e2e Test Data Img ");
    await myDatasetsPage.navigateTo();
    await myDatasetsPage.uploadErrorFormatCSV("e2e Test Data Img", CSV_Path);

    console.log("start to create new CSV : " + New_CSV_Name);
    await myDatasetsPage.uploadCSV(New_CSV_Name, CSV_Path);
    await myDatasetsPage.waitForPageLoading();
    await browser.wait(
      ExpectedConditions.visibilityOf(PROMPT),
      Constant.DEFAULT_TIME_OUT
    );

    console.log("start to create exist CSV : " + New_CSV_Name);
    await myDatasetsPage.navigateTo();
    await myDatasetsPage.uploadExistCSV(New_CSV_Name, CSV_Path);

    since("should has share successfully prompt")
      .expect(myDatasetsPage.getPromptText())
      .toContain("Upload success.");
    await myDatasetsPage.filterDatasetstName(New_CSV_Name);
    let Datasets_Count_After_Filter = await myDatasetsPage.getTableLength();
    let Datasets_Name_Text = await myDatasetsPage.getCellText(0);
    if (Datasets_Name_Text !== "" && Datasets_Count_After_Filter > 0) {
      since("the datasets name should same as the user typed name")
        .expect(myDatasetsPage.getCellText(0))
        .toBe(New_CSV_Name);
      since("the creator should be the logged user")
        .expect(myDatasetsPage.getCellText(1))
        .toBe(Constant.username);
      since("the creator should be the logged user")
        .expect(myDatasetsPage.getCellText(2))
        .not.toBeNull();
      since("the creator should be the logged user")
        .expect(myDatasetsPage.getCellText(4))
        .not.toBeNull();
      since("the data source should same as the user uploaded file")
        .expect(myDatasetsPage.getCellText(3))
        .toBe("text-test-data.csv");
      done();
    } else {
      done.fail("can not filter out the consitent datasets....");
    }
  });

  it('delete the new upload dataset', async () => {
    console.log("datasetName : " + New_CSV_Name);
    await browser.sleep(2000);
    await myDatasetsPage.filterDatasetstName(New_CSV_Name);
    await myDatasetsPage.deleteDatasets();
    await myDatasetsPage.filterDatasetstName(New_CSV_Name);
    const TABLE_LIST = $$('clr-dg-row');
    await browser.sleep(2000);
    expect(await FunctionUtil.getElementsNum(TABLE_LIST)).toEqual(0)
  });


});
