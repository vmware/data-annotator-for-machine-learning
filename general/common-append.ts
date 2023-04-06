/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { browser, $, $$, ExpectedConditions, element, by } from "protractor";
import { CommonPage } from "./common-page";
import { FunctionUtil } from "../utils/function-util";

export class CommonAppend {
  commonPage: CommonPage = new CommonPage();

  COMMUNITY_DATASETS_TAB = $('.header-nav a[href="/projects"]');
  COMMUNITY_ADMIN_TAB = $('.header-nav a[href="/admin"]');

  // APPEND_BTN = $('button[title="Click to Append New Entries"]');
  APP_NEW_LINE_BTN = element(by.partialButtonText("ADD New Entry"));
  APPEND_PUBLISH_BTN = element(by.partialButtonText("Publish"));
  APPEND_BY_FILE_TAB = element(by.css("label[for=btn-demo-radio-2]"));
  APPEND_BY_QUICK_TAB = element(by.css("label[for=btn-demo-radio-1]"));

  TABLE_LIST = $$("clr-dg-row");
  DROPDOWN_SELECT = $("#select-basic");
  // APPEND_DONE_CLASS =
  //   "btn btn-icon actionClass btn-success greenBtn ng-star-inserted";

  UPLOAD_INPUT_ELEMENT = $("#upfiles");
  DATASET_NAME_ELEMENT = $("#datasetsName");

  SET_DATA_TAB = $('ul[role="tablist"] .nav-item:last-child');
  TICKET_COLUMN_CHECKBOX_FOR_TEXT = element(
    by.css("clr-dg-row:nth-child(4) .clr-checkbox-wrapper label")
  );
  TICKET_COLUMNS = element.all(by.css("clr-dg-row label"));
  PROJECT_ANALYZE_TABS = element.all(by.css("clr-tabs li button"));
  PROMPT = $('span[class="alert-text"]');
  CHOOSE_FILE_BTN = $('input[name="localFile"]');
  CLOSE_ICON = element.all(by.css("cds-icon[shape=window-close]"));
  DELETE_FILE_BTN = $(".clr-col-6.text-right.delete");
  VIEW_EXAMPLE_ICON = $("cds-icon.exampleAngle");

  async appendNewLine(project_name, isNer) {
    await FunctionUtil.click(this.PROJECT_ANALYZE_TABS.last());
    if (isNer) {
      await FunctionUtil.click(this.VIEW_EXAMPLE_ICON);
      await browser.sleep(1000);
    }
    await FunctionUtil.click(this.APP_NEW_LINE_BTN);
    await browser.sleep(1000);
    if (
      (await FunctionUtil.getElementsNum(this.TABLE_LIST)) === (isNer ? 2 : 3)
    ) {
      return true;
    }
    return false;
  }

  async deleteNewLine(deleteBTN) {
    await browser.sleep(1000);
    await FunctionUtil.click(deleteBTN);
    if ((await FunctionUtil.getElementsNum(this.TABLE_LIST)) == 2) {
      return true;
    }
    return false;
  }

  async quickAppendCsv() {
    await browser.sleep(1000);
    await $$("clr-dg-row")
      .last()
      .$$("clr-dg-cell")
      .each(async (ele: any, index: any) => {
        if (await (await ele.$("textarea").isPresent()).valueOf()) {
          await FunctionUtil.sendText(ele.$("textarea"), index.toString());
        }
      });
    await FunctionUtil.click(this.APPEND_PUBLISH_BTN);

    await browser.sleep(5000);
    await FunctionUtil.elementVisibilityOf(this.PROMPT);
    if ((await this.PROMPT.getText()) == "Succeed to append data.") {
      console.log("log-prompt succeed to append data");
      return true;
    }
    return false;
  }

  async quickAppendSingleFileUpload(UPLOAD_FILE_PATH, UPLOAD_INPUT_ELEMENT) {
    await browser.sleep(1000);
    console.log("log-start to quickAppendSingleFileUpload");
    let path = process.cwd().replace("\\", "/") + UPLOAD_FILE_PATH;
    await UPLOAD_INPUT_ELEMENT.sendKeys(path);
    await browser.sleep(5000);
    console.log("log-succeed to UPLOAD_INPUT_ELEMENT.sendKeys(path)");
    await FunctionUtil.click(this.APPEND_PUBLISH_BTN);
    await browser.sleep(5000);
    await FunctionUtil.elementVisibilityOf(this.PROMPT);
    if ((await this.PROMPT.getText()) == "Succeed to append data.") {
      console.log("log-prompt succeed to append data");
      return true;
    }
    return false;
  }

  async fileAppendSelectExistingFile(dataset_name, isNer) {
    console.log("log-start to fileAppendSelectExistingFile");
    // await this.locateProjectAppend(project_name);
    await FunctionUtil.click(this.APPEND_BY_FILE_TAB);
    if (isNer) {
      await browser.sleep(1000);
      await FunctionUtil.click(this.APPEND_BY_QUICK_TAB);
      await browser.sleep(1000);
      await FunctionUtil.click(this.APPEND_BY_FILE_TAB);
    }
    await browser.sleep(2000);
    await FunctionUtil.click(this.DROPDOWN_SELECT);
    await browser.sleep(2000);
    $$("option").each(async function (element: any) {
      if ((await element.getText()) == dataset_name) {
        // if (process.env.IN) {
        //   console.log("log-dataset_name: ", dataset_name);
        //   await browser.sleep(5000);
        //   await FunctionUtil.elementVisibilityOf(element);
        // }
        await FunctionUtil.click(element);
      }
    });
    await browser.sleep(2000);
    if (isNer) {
      await this.clickExistingLabel(2, 4);
    }
    // if (process.env.IN) {
    //   await browser.sleep(10000);
    // }
    await browser.sleep(2000);
    // if (process.env.IN) {
    //   console.log("log-show publish btn");
    //   await FunctionUtil.elementVisibilityOf(this.APPEND_PUBLISH_BTN);
    // }
    await FunctionUtil.click(this.APPEND_PUBLISH_BTN);
    // if (process.env.IN) {
    //   await browser.sleep(20000);
    //   console.log("log-change to admin tab");
    //   await FunctionUtil.click(this.COMMUNITY_ADMIN_TAB);
    //   await browser.sleep(10000);
    //   await FunctionUtil.click(this.COMMUNITY_DATASETS_TAB);
    // }

    await FunctionUtil.elementVisibilityOf(this.PROMPT);
    if ((await this.PROMPT.getText()) == "Succeed to append data.") {
      console.log("log-end click publish btn");
      this.CLOSE_ICON.first().click();
      return true;
    }
    console.log("log-succeed to fileAppendSelectExistingFile");
    return false;
  }

  async clickExistingLabel(startIndex, endIndex) {
    await FunctionUtil.elementVisibilityOf(this.SET_DATA_TAB);
    await this.SET_DATA_TAB.click();
    await FunctionUtil.elementVisibilityOf(
      this.TICKET_COLUMN_CHECKBOX_FOR_TEXT
    );
    this.TICKET_COLUMNS.then(async (column) => {
      for (let i = startIndex; i <= endIndex; i++) {
        await column[i].click();
      }
    });
    await browser.sleep(2000);
    this.TICKET_COLUMNS.then(async (column) => {
      for (let i = endIndex; i < endIndex + 1; i++) {
        await column[i].click();
      }
    });
  }

  // async locateProjectAppend(project_name) {
  //   await FunctionUtil.click(this.COMMUNITY_DATASETS_TAB);
  //   await this.commonPage.waitForGridLoading();
  //   await this.commonPage.filterProjectName(project_name);

  //   await FunctionUtil.click(this.APPEND_BTN);
  //   await browser.sleep(1000);
  // }

  async localFileChangeAndUpload(dataset_name, UPLOAD_FILE_1, UPLOAD_FILE_2) {
    // await this.locateProjectAppend(project_name);
    // await FunctionUtil.click(this.APPEND_BY_FILE_TAB);
    // await browser.sleep(2000);
    let file1 = process.cwd().replace("\\", "/") + UPLOAD_FILE_1;
    await this.CHOOSE_FILE_BTN.sendKeys(file1);
    await browser.sleep(10000);
    let file2 = process.cwd().replace("\\", "/") + UPLOAD_FILE_2;
    await FunctionUtil.elementVisibilityOf(this.DELETE_FILE_BTN);
    this.DELETE_FILE_BTN.click();
    await this.CHOOSE_FILE_BTN.sendKeys(file2);
    await browser.sleep(10000);
    await this.DATASET_NAME_ELEMENT.sendKeys(dataset_name);
    // if (process.env.IN) {
    //   await browser.sleep(10000);
    //   await FunctionUtil.elementVisibilityOf(this.APPEND_PUBLISH_BTN);
    // }
    await FunctionUtil.click(this.APPEND_PUBLISH_BTN);
    // if (process.env.IN) {
    //   await browser.sleep(20000);
    //   await FunctionUtil.click(this.COMMUNITY_ADMIN_TAB);
    //   await browser.sleep(10000);
    //   await FunctionUtil.click(this.COMMUNITY_DATASETS_TAB);
    // }
    await browser.sleep(5000);
    await FunctionUtil.elementVisibilityOf(this.PROMPT);
    if ((await this.PROMPT.getText()) == "Succeed to append data.") {
      console.log("log-succeed to localFileChangeAndUpload");
      this.CLOSE_ICON.first().click();
      return true;
    }

    return false;
  }
}
