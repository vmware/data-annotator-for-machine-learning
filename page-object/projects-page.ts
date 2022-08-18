/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { CommonPage } from "../general/commom-page";
import { browser, by, element, $, $$, ExpectedConditions } from "protractor";
import { Constant } from "../general/constant";
import { FunctionUtil } from "../utils/function-util";

export class ProjecstPage extends CommonPage {
  ANNOTATOR_CELL = $(
    '.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"] .ng-star-inserted >div'
  );
  SHARE_DATASETS_BTN = $('button[title="Share Datasets"]');
  PROJECT_TABLE = $(".datagrid .datagrid-table");
  DATASETS_DESCRIPTION = $("#description");
  DATASETS_OK_BTN = $(
    '.modal-content button[class="btn btn-primary ng-star-inserted"]'
  );
  MY_PROJECTS_TAB = element(by.css('.header-nav a[href="/projects"]'));
  LATEST_DATA_TAB_FLAG = element(
    by.css("ul[role=tablist] li:last-child button")
  );
  TABLE_TOTAL_ITEMS = element(
    by.css("clr-dg-pagination div.pagination-description")
  );
  DELETE_FLAGGED_TICKET_BTN = $(
    '.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"]:last-child button:first-child'
  );
  SILENCE_FLAGGED_TICKET_BTN = $(
    '.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"]:last-child button:last-child'
  );
  SHOW_LOG_DETAILS_BTN = $$("button.signpost-trigger");
  RETURN_TO_ANNOTATOR_BTN = $(
    '.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"]:last-child button'
  );
  EXPAND_CELL = $(
    ".datagrid-host .datagrid-row:nth-child(2) button.datagrid-expandable-caret-button"
  );

  async navigateTo() {
    await FunctionUtil.elementVisibilityOf(this.MY_PROJECTS_TAB);
    await browser.waitForAngularEnabled(false);
    await this.MY_PROJECTS_TAB.click();
  }

  async navigateToFlagTab() {
    await FunctionUtil.elementVisibilityOf(this.LATEST_DATA_TAB_FLAG);
    await browser.waitForAngularEnabled(false);
    await this.LATEST_DATA_TAB_FLAG.click();
  }

  async waitForUserChartLoading() {
    return browser.wait(
      ExpectedConditions.invisibilityOf(
        element.all(by.css(".categoryChart .spinner")).first()
      ),
      Constant.DEFAULT_TIME_OUT
    );
  }

  async waitForCategoryChartLoading() {
    return browser.wait(
      ExpectedConditions.invisibilityOf(
        element.all(by.css(".categoryChart .spinner")).last()
      ),
      Constant.DEFAULT_TIME_OUT
    );
  }

  async getChartRectHeight(rect) {
    return await rect.then(function (arr) {
      console.log("rect-length:::", arr.length);
      return arr[0].getAttribute("height");
    });
  }

  async getChartTickText(tick) {
    await browser.sleep(1000);
    return tick.getText();
  }

  async getTableTotalItems() {
    return this.TABLE_TOTAL_ITEMS.getText();
  }

  async clickDeleteTicketBtn() {
    this.PROJECT_TABLE.scrollLeft = this.PROJECT_TABLE.scrollWidth;
    await FunctionUtil.elementVisibilityOf(this.DELETE_FLAGGED_TICKET_BTN);
    await browser.waitForAngularEnabled(false);
    await this.DELETE_FLAGGED_TICKET_BTN.click();
  }

  async clickSilenceTicketBtn() {
    this.PROJECT_TABLE.scrollLeft = this.PROJECT_TABLE.scrollWidth;
    await FunctionUtil.elementVisibilityOf(this.SILENCE_FLAGGED_TICKET_BTN);
    await browser.waitForAngularEnabled(false);
    await this.SILENCE_FLAGGED_TICKET_BTN.click();
  }

  async logShowDetails() {
    console.log("log-start to logShowDetails...");
    await FunctionUtil.elementVisibilityOf(this.SHOW_LOG_DETAILS_BTN.first());
    console.log("log-elementVisibilityOf(this.SHOW_LOG_DETAILS_BTN.first())");
    await this.SHOW_LOG_DETAILS_BTN.first().click();
    console.log("log-succeed to logShowDetails...");
  }

  async returnToAnnotatorBtn() {
    console.log("start to returnToAnnotatorBtn...");
    this.PROJECT_TABLE.scrollLeft = this.PROJECT_TABLE.scrollWidth;
    await FunctionUtil.elementVisibilityOf(this.RETURN_TO_ANNOTATOR_BTN);
    await this.RETURN_TO_ANNOTATOR_BTN.click();
    console.log("succeed to returnToAnnotatorBtn...");
  }

  async toExpandCell() {
    console.log("start to toExpandCell...");
    await FunctionUtil.elementVisibilityOf(this.EXPAND_CELL);
    await this.EXPAND_CELL.click();
    console.log("succeed to toExpandCell...");
  }
}
