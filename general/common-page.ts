/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import {
  $$,
  $,
  browser,
  by,
  element,
  ExpectedConditions,
  ElementFinder,
} from "protractor";
import { Constant } from "./constant";
import { FunctionUtil } from "../utils/function-util";

export class CommonPage {
  PROJECT_TABLE = $(".datagrid .datagrid-table");
  PROJECT_NAME_HEADER = $('clr-dg-column[ng-reflect-field="projectName"]');
  PROJECT_NAME_FILTER_BTN = element(
    by.css("clr-dg-column:nth-child(1) clr-dg-filter:nth-child(1) button")
  );
  LOG_FILE_NAME_FILTER_BTN = element(
    by.css("clr-dg-column:nth-child(3) cds-icon[shape=filter-grid]")
  );
  LOG_FILE_NAME_FILTER_INPUT = element(
    by.css("input.filenameFilter[placeholder='Enter value here']")
  );
  PROJECT_NAME_FILTER_INPUT = $('.datagrid-filter input[name="search"]');
  CLOSE_FILTER_BTN = $(
    ".datagrid-filter .datagrid-filter-close-wrapper button"
  );
  Table_LISTS = $$(".datagrid-host .datagrid-scrolling-cells");
  FIRST_ROW_CELLS = $$(
    '.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"]'
  );
  FIRST_PROJECT_NAME_CELL = $(
    '.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"]:nth-of-type(1)'
  );
  GENERATE_PROJECT_BTN = $('button[title="Generate Project"]');
  PROMPT = $('span[class="alert-text"]');
  ANNOTATOR_CELL = $(
    ".datagrid-host .datagrid-row:nth-child(2) .annotatorCell"
  );
  SHARE_DATASETS_BTN = $('button[title="Share Datasets"]');
  DATASETS_DESCRIPTION = $("#description");
  DATASETS_OK_BTN = $(
    '.modal-content button[class="btn btn-primary ng-star-inserted"]'
  );
  UPLOAD_DATASET_BTN = $(".btn-primary.add-doc");
  UPLOAD_CSV_BTN = $(".btn-primary.add-doc.float-right");
  CHOOSE_FILE_BTN = $('input[name="localFile"]');
  UPLOAD_CSV_OK_BTN = $(".btn.btn-primary");
  UPLOAD_CSV_CANCEL_BTN = $(".modal-footer .btn.btn-outline");
  CSV_UPLOAD = $("#select-basic");
  CSV_UPLOAD_OPTIONS = $$("#select-basic option");
  CSV_NAME = $(".clr-input-wrapper #datasetsName");
  DELETE_PROJECT_BTN = $(
    '.datagrid-row.ng-star-inserted:last-of-type button[title="Delete Project"]'
  );
  DELETE_PROJECT_OK_BTN = $(".modal-footer .btn.btn-primary");
  DELETE_PROJECT_CANCEL_BTN = $(".modal-footer .btn.btn-outline");
  ACTIONS = $$(
    '.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"] .actionClass'
  );
  DELETE_DATASET_BTN = $$('button[title="Delete Dataset"]');
  PAGE_SIZE_SELECT = element(by.css(".clr-select-wrapper select"));
  PAGE_SIZE_SELECT_OPTION = element.all(
    by.css(".clr-select-wrapper select option")
  );
  SHOW_ICON = element(by.css("clr-icon.showIcon"));
  // HIDE_ICON = element(by.css("div.isShowHide"));
  IMG_RADIO = element(by.css(".clr-radio-wrapper label[for='image']"));
  CSV_RADIO = element(by.css(".clr-radio-wrapper label[for='csv']"));
  TXT_RADIO = element(by.css(".clr-radio-wrapper label[for='txt']"));
  CLOSE_ICON = element(by.css("cds-icon[shape=window-close]"));
  ICON_PLUS = element.all(by.css("button cds-icon[shape=plus]"));
  ACTION_ICONS = element.all(
    by.css("button cds-icon[shape=ellipsis-vertical]")
  );
  ACTION_BUTTONS = element.all(by.css(".datagrid-action-overflow button"));
  CLR_TABS = element.all(by.css("clr-tabs ul li"));
  TABLE_COLUMN_HIDE = element(by.css(".column-switch-wrapper button"));
  REFRESH_BTN = element(by.css(".clr-row.pageTitle div:nth-child(2) div"));
  ANNOTATION_Table_LISTS = $$(
    ".datagrid-host:nth-child(1) .datagrid-scrolling-cells"
  );
  CLOSE_TREE_PREVIEW_BTN = element(by.css(".modal-dialog .close"));
  TREE_ICON = element(by.css(".tree-icon:nth-child(1)"));
  SWITCH_COLUMN_LIST = element.all(by.css(".switch-content li"));
  DATASET_LABELING_TASK_LINK = element(
    by.css(".ellipsisMore > div > div:nth-child(1) > a:nth-child(1)")
  );
  DATASET_LABELING_TASK_LINK_ALL = element.all(
    by.css(".ellipsisMore > div > div:nth-child(1) > a")
  );
  VIEW_LIST_ICON = element(by.css('cds-icon[shape="view-list"]'));
  CREATE_DATASET_BTN = element(by.partialButtonText("Create New Dataset"));
  OK_BTN = element(by.css('button[class="btn btn-primary"]'));
  CLOSE_BTN = $('button[class="close"]');

  async toClickRefreshBtn() {
    await FunctionUtil.click(element(by.css("div.refreshBtn")));
  }

  async toShowTableColumns() {
    await FunctionUtil.click(this.TABLE_COLUMN_HIDE);
    await browser.waitForAngularEnabled(false);
    await FunctionUtil.click(element(by.buttonText("Select All Button")));
    await FunctionUtil.click(element(by.css('cds-icon[shape="window-close"]')));
  }

  async clickClrTab(index) {
    await FunctionUtil.elementVisibilityOf(this.CLR_TABS.get(index));
    await browser.waitForAngularEnabled(false);
    await this.CLR_TABS.get(index).click();
    await browser.sleep(500);
  }

  async refreshLabelingTask() {
    await browser.sleep(5000);
    console.log("log-start to refresh Labeling task");
    await FunctionUtil.elementVisibilityOf(this.REFRESH_BTN);
    await browser.waitForAngularEnabled(false);
    await this.REFRESH_BTN.click();
    console.log("log-succeed to refresh Labeling task");
  }

  async getTableLength() {
    return this.Table_LISTS.count();
  }

  async getAnnotationTableLength() {
    return this.Table_LISTS.count();
  }

  async clickActionBtn(button_index) {
    console.log("log-locate this.ACTION_ICONS.first() ");
    await FunctionUtil.elementVisibilityOf(this.ACTION_ICONS.first());
    await browser.waitForAngularEnabled(false);
    await this.ACTION_ICONS.first().click();
    await browser.sleep(1000);
    await this.ACTION_BUTTONS.get(button_index).click();
  }

  async filterProjectName(name: string) {
    await FunctionUtil.click(this.PROJECT_NAME_FILTER_BTN);
    await FunctionUtil.elementVisibilityOf(this.PROJECT_NAME_FILTER_INPUT);
    await FunctionUtil.sendText(this.PROJECT_NAME_FILTER_INPUT, name);
    await FunctionUtil.click(this.CLOSE_FILTER_BTN);
  }

  async filterLogFileName(name) {
    console.log("log-start to filterLogFileName...", name);
    await FunctionUtil.elementVisibilityOf(this.LOG_FILE_NAME_FILTER_BTN);
    console.log("log-start to filterLogFileName1...", name);
    await FunctionUtil.click(this.LOG_FILE_NAME_FILTER_BTN);
    console.log("log-start to filterLogFileName2...", name);
    await FunctionUtil.elementVisibilityOf(this.LOG_FILE_NAME_FILTER_INPUT);
    console.log("log-start to filterLogFileName3...", name);
    await this.LOG_FILE_NAME_FILTER_INPUT.click();
    console.log("log-start to filterLogFileName4...", name);
    await this.LOG_FILE_NAME_FILTER_INPUT.sendKeys(name);
    console.log("log-succeed to filterLogFileName...");
  }

  getCellText(index: number) {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.FIRST_PROJECT_NAME_CELL),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        if (index === 0) {
          return this.FIRST_PROJECT_NAME_CELL.getText();
        }
        if (index >= 1 && index <= 12) {
          return this.FIRST_ROW_CELLS.then((list) => {
            return list[index].getText();
          });
        }
      });
  }

  async clickGridFirstCell() {
    await FunctionUtil.elementVisibilityOf(this.FIRST_PROJECT_NAME_CELL);
    await this.FIRST_PROJECT_NAME_CELL.click();
  }

  getActionsCount() {
    return this.ACTIONS.count();
  }

  waitForPageLoading() {
    return browser.wait(
      ExpectedConditions.invisibilityOf($(".loadingSpan")),
      Constant.DEFAULT_TIME_OUT
    );
  }

  waitForGridLoading() {
    return browser.wait(
      ExpectedConditions.invisibilityOf($("clr-datagrid .datagrid-spinner")),
      Constant.DEFAULT_TIME_OUT
    );
  }

  waitForLoading() {
    return browser.wait(
      ExpectedConditions.invisibilityOf($("span.spinner")),
      Constant.DEFAULT_TIME_OUT
    );
  }

  generateProject() {
    browser
      .wait(
        ExpectedConditions.visibilityOf(this.GENERATE_PROJECT_BTN),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        this.scrollToFarRight(this.PROJECT_TABLE);
        this.GENERATE_PROJECT_BTN.click();
      });
  }

  async getPromptText() {
    await FunctionUtil.elementVisibilityOf(this.PROMPT);
    return this.PROMPT.getText();
  }

  scrollToFarRight(element: ElementFinder) {
    return browser
      .wait(ExpectedConditions.visibilityOf(element), Constant.DEFAULT_TIME_OUT)
      .then(() => {
        element.scrollLeft = element.scrollWidth;
      });
  }

  scrollToBottom(element: ElementFinder) {
    return browser
      .wait(ExpectedConditions.visibilityOf(element), Constant.DEFAULT_TIME_OUT)
      .then(() => {
        element.scrollTop = element.scrollHeight;
      });
  }

  getAnnotatorCellText() {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.ANNOTATOR_CELL),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        return this.ANNOTATOR_CELL.getText();
      })
      .then((text) => {
        return text.trim();
      });
  }

  shareDatasets() {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.PROJECT_TABLE),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        this.PROJECT_TABLE.scrollTop = this.PROJECT_TABLE.scrollHeight;
        return browser.wait(
          ExpectedConditions.visibilityOf(this.SHARE_DATASETS_BTN),
          Constant.DEFAULT_TIME_OUT
        );
      })
      .then(() => {
        this.SHARE_DATASETS_BTN.click();
        return browser.wait(
          ExpectedConditions.visibilityOf(this.DATASETS_DESCRIPTION),
          Constant.DEFAULT_TIME_OUT
        );
      })
      .then(() => {
        this.DATASETS_DESCRIPTION.clear();
        this.DATASETS_DESCRIPTION.sendKeys("e2e test to share datasets");
        this.DATASETS_OK_BTN.click();
      })
      .then(() => {
        this.waitForShareComplete();
      });
  }

  waitForShareComplete() {
    return browser.wait(
      ExpectedConditions.invisibilityOf($(".btn.uploadLoading")),
      Constant.DEFAULT_TIME_OUT
    );
  }

  setLocalCSVPath(localCsvPath: string) {
    let path = process.cwd().replace("\\", "/") + localCsvPath;
    this.CHOOSE_FILE_BTN.sendKeys(path);
  }

  clickUploadDatasetBtn() {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.UPLOAD_DATASET_BTN),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        this.UPLOAD_DATASET_BTN.click();
      });
  }

  async uploadCSV(csvName: string, localCsvPath: string) {
    // await FunctionUtil.elementVisibilityOf(this.UPLOAD_CSV_BTN);
    // await this.UPLOAD_CSV_BTN.click();
    // await this.UPLOAD_CSV_CANCEL_BTN.click();
    // await this.UPLOAD_CSV_BTN.click();
    await FunctionUtil.elementVisibilityOf(this.CSV_NAME);
    await this.CSV_NAME.clear();
    await this.CSV_NAME.sendKeys(csvName);
    await this.CSV_RADIO.click();
    await this.CLOSE_ICON.click();
    await this.setLocalCSVPath(localCsvPath);
    await browser.sleep(10000);
    await FunctionUtil.elementVisibilityOf(this.UPLOAD_CSV_OK_BTN);
    await this.UPLOAD_CSV_OK_BTN.click();
    await this.waitForUploadloading();
  }

  async uploadCSVWithModalAndCancel() {
    await FunctionUtil.elementVisibilityOf(this.ICON_PLUS.first());
    await this.ICON_PLUS.first().click();
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.UPLOAD_CSV_CANCEL_BTN);
    await this.UPLOAD_CSV_CANCEL_BTN.click();
    await this.waitForUploadloading();
  }

  async uploadCSVWithModal(csvName: string, localCsvPath: string) {
    await FunctionUtil.elementVisibilityOf(this.ICON_PLUS.first());
    await this.ICON_PLUS.first().click();
    // await this.UPLOAD_CSV_CANCEL_BTN.click();
    // await this.UPLOAD_CSV_BTN.click();
    await FunctionUtil.elementVisibilityOf(this.CSV_NAME);
    await this.CSV_NAME.clear();
    await this.CSV_NAME.sendKeys(csvName);
    await this.setLocalCSVPath(localCsvPath);
    await browser.sleep(10000);
    await FunctionUtil.elementVisibilityOf(this.UPLOAD_CSV_OK_BTN);
    await this.UPLOAD_CSV_OK_BTN.click();
    await this.waitForUploadloading();
  }

  async uploadExistCSV(csvName: string, localCsvPath: string) {
    // await FunctionUtil.elementVisibilityOf(this.UPLOAD_CSV_BTN);
    // await this.UPLOAD_CSV_BTN.click();
    await this.CSV_NAME.clear();
    await this.CSV_NAME.sendKeys(csvName);
    await this.setLocalCSVPath(localCsvPath);
    await browser.sleep(10000);
    // await FunctionUtil.elementVisibilityOf(this.UPLOAD_CSV_OK_BTN);
    // await this.UPLOAD_CSV_OK_BTN.click();
    // await browser.sleep(2000);
    // await this.UPLOAD_CSV_CANCEL_BTN.click();
    // await this.waitForUploadloading();
  }

  async uploadErrorFormatCSV(csvName: string, localCsvPath: string) {
    // await FunctionUtil.elementVisibilityOf(this.UPLOAD_CSV_BTN);
    // await this.UPLOAD_CSV_BTN.click();
    await FunctionUtil.elementVisibilityOf(this.CSV_NAME);
    await this.CSV_NAME.clear();
    await this.CSV_NAME.sendKeys(csvName);
    await this.setLocalCSVPath(localCsvPath);
    await browser.sleep(10000);
    console.log("log-after setLocalCSVPath");
    await this.IMG_RADIO.click();
    console.log("log-after this.IMG_RADIO.click()");
    await browser.sleep(5000);
    // await FunctionUtil.elementVisibilityOf(this.UPLOAD_CSV_OK_BTN);
    // await this.UPLOAD_CSV_OK_BTN.click();
    // await browser.sleep(2000);
    // await this.UPLOAD_CSV_CANCEL_BTN.click();
    // await browser.sleep(2000);
  }

  waitForUploadloading() {
    return browser.wait(
      ExpectedConditions.invisibilityOf($(".btn clr-spinner")),
      Constant.DEFAULT_TIME_OUT
    );
  }

  async changePageValue(index) {
    console.log("log-start to changePageValue...");
    await FunctionUtil.elementVisibilityOf(this.PAGE_SIZE_SELECT);
    await browser.waitForAngularEnabled(false);
    await this.PAGE_SIZE_SELECT.click();
    await this.PAGE_SIZE_SELECT_OPTION.get(index).click();
    console.log("log-succeed to changePageValue...");
  }

  async toShowMoreAnnotators() {
    await FunctionUtil.elementVisibilityOf(this.SHOW_ICON);
    await browser.waitForAngularEnabled(false);
    await this.SHOW_ICON.click();
  }

  async toPreviewTreeLabel() {
    console.log("log-start toPreviewTreeLabel");
    await FunctionUtil.elementVisibilityOf(this.TREE_ICON);
    await this.TREE_ICON.click();
    await browser.sleep(2000);
    await FunctionUtil.elementVisibilityOf(this.CLOSE_TREE_PREVIEW_BTN);
    await this.CLOSE_TREE_PREVIEW_BTN.click();
    console.log("log-succeed toPreviewTreeLabel");
  }

  async clickSwitchListColumn(index, index2?) {
    console.log("log-start to click switch column list");
    await FunctionUtil.elementVisibilityOf(this.TABLE_COLUMN_HIDE);
    await this.TABLE_COLUMN_HIDE.click();
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.SWITCH_COLUMN_LIST.get(index));
    await browser.waitForAngularEnabled(false);
    await this.SWITCH_COLUMN_LIST.get(index).click();
    if (index2) {
      await FunctionUtil.elementVisibilityOf(
        this.SWITCH_COLUMN_LIST.get(index2)
      );
      await browser.waitForAngularEnabled(false);
      await this.SWITCH_COLUMN_LIST.get(index2).click();
    }
    await this.CLOSE_ICON.click();
    console.log("log-end to click switch column list");
  }
}
