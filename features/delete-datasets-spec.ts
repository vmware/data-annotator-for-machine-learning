/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { browser, $$ } from "protractor";
import { FunctionUtil } from "../utils/function-util";

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
    await myDatasetsPage.deleteDatasets();
    await myDatasetsPage.filterDatasetstName(myDatasetsName);
    const TABLE_LIST = $$('clr-dg-row');
    expect(await FunctionUtil.getElementsNum(TABLE_LIST)).toEqual(0)

  });
});
