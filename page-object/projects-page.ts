/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { CommonPage } from "../general/common-page";
import { browser, by, element, $, $$, ExpectedConditions } from "protractor";
import { Constant } from "../general/constant";
import { FunctionUtil } from "../utils/function-util";

export class ProjectsPage extends CommonPage {
  ANNOTATOR_CELL = $(
    '.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"] .ng-star-inserted >div'
  );
  SHARE_DATASETS_BTN = $('button[title="Share Datasets"]');
  PROJECT_TABLE = $(".datagrid .datagrid-table");
  DATASETS_DESCRIPTION = $("#description");
  DATASETS_OK_BTN = $(
    '.modal-content button[class="btn btn-primary ng-star-inserted"]'
  );
  // MY_PROJECTS_TAB = element(by.css('.header-nav a[href="/projects"]'));
  NAV_TASK_LIST = element(by.css('a[href="/loop/project/list"]'));
  LATEST_DATA_TAB_FLAG = element.all(
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
  MARK_FOR_REVIEW_BTN = $(
    '.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"]:last-child button:first-child'
  );
  SHOW_LOG_DETAILS_BTN = $$("button.signpost-trigger");
  RETURN_TO_ANNOTATOR_BTN = $(
    '.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"]:last-child button'
  );
  EXPAND_CELL = $(
    ".datagrid-host .datagrid-row:nth-child(2) button.datagrid-expandable-caret-button"
  );

  PROJECT_PREVIEW_TABS = element.all(by.css("clr-tabs ul li"));
  CATEGORY_BTN = element(by.css(".radio.btn label[for=btn-demo-radio-2]"));

  SELECT_ALL_CHECKBOX = $(".datagrid-column-title .clr-checkbox-wrapper label");
  CHECKBOX_ROW2 = $(
    "#content1 > div:nth-child(2) > clr-datagrid >div>div>div>div>div>clr-dg-row:nth-child(3) clr-checkbox-wrapper label"
  );
  MARK_ALL_REVIEW_BTN = $('cds-icon[title="To modify the annotated tickets"]');

  async navigateTo() {
    await FunctionUtil.elementVisibilityOf(this.NAV_TASK_LIST);
    await browser.waitForAngularEnabled(false);
    await this.NAV_TASK_LIST.click();
  }

  async clickProjectPreviewTabs(index) {
    await FunctionUtil.elementVisibilityOf(
      this.PROJECT_PREVIEW_TABS.get(index)
    );
    await browser.waitForAngularEnabled(false);
    await this.PROJECT_PREVIEW_TABS.get(index).click();
  }

  async navigateToFlagTab() {
    await FunctionUtil.click(this.LATEST_DATA_TAB_FLAG.last());
  }

  async waitForUserChartLoading() {
    return browser.wait(
      ExpectedConditions.invisibilityOf(
        element(by.css(".categoryChart .spinner"))
      ),
      Constant.DEFAULT_TIME_OUT
    );
  }

  async waitForCategoryChartLoading() {
    return browser.wait(
      ExpectedConditions.invisibilityOf(
        element(by.css(".categoryChart .spinner"))
      ),
      Constant.DEFAULT_TIME_OUT
    );
  }

  async getChartRectHeight(rect) {
    return await rect.then(function (arr) {
      console.log("log-rect-length:::", arr.length);
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
    console.log("log-start to returnToAnnotatorBtn...");
    this.PROJECT_TABLE.scrollLeft = this.PROJECT_TABLE.scrollWidth;
    await FunctionUtil.elementVisibilityOf(this.RETURN_TO_ANNOTATOR_BTN);
    await this.RETURN_TO_ANNOTATOR_BTN.click();
    console.log("log-succeed to returnToAnnotatorBtn...");
  }

  async markAllForReview() {
    console.log("log-start to markAllForReview...");
    await FunctionUtil.elementVisibilityOf(this.SELECT_ALL_CHECKBOX);
    await this.SELECT_ALL_CHECKBOX.click();
    await browser.sleep(3000);
    await FunctionUtil.click(this.CHECKBOX_ROW2);
    await browser.sleep(3000);
    await FunctionUtil.click(this.CHECKBOX_ROW2);
    await browser.sleep(3000);
    await FunctionUtil.click(this.MARK_ALL_REVIEW_BTN);
    console.log("log-succeed to markAllForReview...");
  }

  async toExpandCell() {
    console.log("log-start to toExpandCell...");
    await FunctionUtil.elementVisibilityOf(this.EXPAND_CELL);
    await this.EXPAND_CELL.click();
    console.log("log-succeed to toExpandCell...");
  }

  async clickMarkForReviewBtn() {
    this.PROJECT_TABLE.scrollLeft = this.PROJECT_TABLE.scrollWidth;
    await FunctionUtil.elementVisibilityOf(this.MARK_FOR_REVIEW_BTN);
    await browser.waitForAngularEnabled(false);
    await this.MARK_FOR_REVIEW_BTN.click();
    await browser.sleep(2000);
    console.log("log-succeed to clickMarkForReviewBtn");
  }

  async clickCategoryBtn() {
    await FunctionUtil.elementVisibilityOf(this.CATEGORY_BTN);
    await browser.waitForAngularEnabled(false);
    await this.CATEGORY_BTN.click();
  }
}
