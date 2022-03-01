/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { browser, $$ } from "protractor";
import { FunctionUtil } from "../utils/function-util";
import { CommonUtils } from "../general/common-utils";

describe("delete function", () => {
  let myDatasetsName: string;
  let myDatasetsPage: MyDatasetsPage;

  beforeAll(() => {
    myDatasetsName = "e2e Test Data";
    LoginBussiness.verifyLogin();
    myDatasetsPage = new MyDatasetsPage();
  });

  it("Delete the added datasets.", async () => {

    await myDatasetsPage.navigateTo();
    await myDatasetsPage.waitForPageLoading();
    await browser.sleep(2000);
    await myDatasetsPage.filterDatasetstName(myDatasetsName);
    
    const TABLE_LIST = $$('clr-dg-row');
    let dataLength = await FunctionUtil.getElementsNum(TABLE_LIST);
    for (var i=0; i<dataLength; i++){
      if (process.env.IN && i > 0) {
        await browser.sleep(5000);
      }
      await CommonUtils.deleteDataGrid(myDatasetsPage.DELETE_DATASET_BTN.first(), myDatasetsPage.DELETE_DATASET_OK_BTN);;
    }
    if (process.env.IN) {
      await browser.sleep(5000);
    } 
    await browser.sleep(2000);
    expect(await FunctionUtil.getElementsNum(TABLE_LIST)).toEqual(0)

  });
});
