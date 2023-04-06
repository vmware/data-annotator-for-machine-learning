/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { CommonPage } from "../general/common-page";
import { browser, by, element, $, ExpectedConditions, $$ } from "protractor";
import { Constant } from "../general/constant";
import { FunctionUtil } from "../utils/function-util";

export class MyDatasetsPage extends CommonPage {
  DELETE_BTN = $('button[title="Delete Project"]');
  DELETE_DATASET_OK_BTN = $(".modal-footer .btn.btn-primary");
  DATASETS_NAME_FILTER_BTN = $$(".datagrid-filter-toggle");
  DATASETS_NAME_FILTER_INPUT = $('.datagrid-filter input[name="search"]');
  CLOSE_FILTER_BTN = $(".datagrid-filter.clr-popover-content cds-icon");
  MY_DATASETS_TAB = element(by.css('a[routerlink="/loop/datasets/create"]'));
  DATASETS_LIST = element(by.css('a[routerlink="/loop/datasets/list"]'));
  DATASETS_NAV = $("clr-vertical-nav-group:nth-child(1)");
  CREATE_LABELING_TASK_BTN = element(by.css("clr-tabs clr-dropdown > button"));
  TABULAR_MENU = element(by.partialLinkText("Tabular"));
  MORE_BTN = $("clr-dg-cell.ellipsisMore div div:nth-child(2)");

  async navigateTo() {
    await FunctionUtil.elementVisibilityOf(this.MY_DATASETS_TAB);
    await browser.waitForAngularEnabled(false);
    await this.MY_DATASETS_TAB.click();
  }

  async navigateToDatasetsList() {
    await FunctionUtil.elementVisibilityOf(this.DATASETS_NAV);
    await browser.waitForAngularEnabled(false);
    await this.DATASETS_NAV.click();
    await FunctionUtil.elementVisibilityOf(this.DATASETS_LIST);
    await browser.waitForAngularEnabled(false);
    await this.DATASETS_LIST.click();
  }

  filterDatasetName(name: string) {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.DATASETS_NAME_FILTER_BTN.first()),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        FunctionUtil.click(this.DATASETS_NAME_FILTER_BTN.first());
        FunctionUtil.elementVisibilityOf(this.PROJECT_NAME_FILTER_INPUT);
        this.PROJECT_NAME_FILTER_INPUT.clear();
        this.PROJECT_NAME_FILTER_INPUT.sendKeys(name);
        FunctionUtil.click(this.CLOSE_FILTER_BTN);
      });
  }

  deleteDatasets() {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.DELETE_DATASET_BTN.first()),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        this.DELETE_DATASET_BTN.first().click();
      })
      .then(() => {
        return browser.wait(
          ExpectedConditions.visibilityOf(this.DELETE_DATASET_OK_BTN),
          Constant.DEFAULT_TIME_OUT
        );
      })
      .then(() => {
        this.DELETE_DATASET_OK_BTN.click();
      });
  }

  async clickDatasetName() {
    await FunctionUtil.elementVisibilityOf(this.FIRST_PROJECT_NAME_CELL);
    await browser.waitForAngularEnabled(false);
    await this.FIRST_PROJECT_NAME_CELL.click();
  }

  async clickCreateLabelingTaskBtn() {
    console.log("log-start to click create labeling task btn");
    await FunctionUtil.elementVisibilityOf(this.CREATE_LABELING_TASK_BTN);
    await browser.waitForAngularEnabled(false);
    await this.CREATE_LABELING_TASK_BTN.click();
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.TABULAR_MENU);
    await browser.waitForAngularEnabled(false);
    await this.TABULAR_MENU.click();
    console.log("log-end to click create labeling task btn");
  }
}
