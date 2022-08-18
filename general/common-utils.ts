/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { CommonPage } from "./commom-page";
import { ProjecstPage } from "../page-object/projects-page";
import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { browser, ExpectedConditions, by } from "protractor";
import { Constant } from "./constant";
import { FunctionUtil } from "../utils/function-util";

export class CommonUtils extends CommonPage {
  static DEFAULT_TIME_OUT = 100 * 1000;
  static commonPage: CommonPage = new CommonPage();
  static projcetsPage: ProjecstPage = new ProjecstPage();
  static myDatasetsPage: MyDatasetsPage = new MyDatasetsPage();

  static async deleteFunction(name: string) {
    try {
      let nameText = await this.commonPage.Table_LISTS.last()
        .element(by.css('clr-dg-cell[role="gridcell"]:nth-of-type(1)'))
        .getText();
      console.log("nameText is " + nameText);
      if (nameText.match(name + ".*")) {
        console.log("delete project " + nameText);
        await FunctionUtil.elementVisibilityOf(
          this.commonPage.DELETE_PROJECT_BTN
        );
        await this.commonPage.DELETE_PROJECT_BTN.click();
        await FunctionUtil.elementVisibilityOf(
          this.commonPage.DELETE_PROJECT_OK_BTN
        );
        await this.commonPage.DELETE_PROJECT_OK_BTN.click();
        await this.commonPage.waitForPageLoading();
        return true;
      } else {
        console.log("there is no matching projects or datasets");
      }
    } catch (error) {
      console.log("the delete hit exception");
      Promise.reject("application will exit");
      return false;
    }
  }

  static async deleteProjectsLoop(projectsName: string) {
    let loopBool = true;
    while (loopBool) {
      await browser.wait(
        ExpectedConditions.visibilityOf(
          this.projcetsPage.PROJECT_NAME_FILTER_BTN
        ),
        this.DEFAULT_TIME_OUT
      );
      await this.projcetsPage.filterProjectName(projectsName);
      let filtered_Projects_Count = await this.projcetsPage.getTableLength();
      if (filtered_Projects_Count > 0) {
        await CommonUtils.deleteFunction(projectsName);
      } else {
        loopBool = false;
      }
    }
  }

  static async deleteMyDatasetsLoop(myDatasetsName: string) {
    let loopBool = true;
    while (loopBool) {
      await browser.wait(
        ExpectedConditions.visibilityOf(
          this.myDatasetsPage.DATASETS_NAME_FILTER_BTN.first()
        ),
        this.DEFAULT_TIME_OUT
      );
      await this.myDatasetsPage.filterDatasetstName(myDatasetsName);
      let filtered_MyDatasets_Count =
        await this.myDatasetsPage.getTableLength();
      if (filtered_MyDatasets_Count > 0) {
        await CommonUtils.deleteFunction(myDatasetsName);
      } else {
        loopBool = false;
      }
    }
  }

  static async deleteDataGrid(DELETE_BTN, DELETE_DATASET_OK_BTN) {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(DELETE_BTN),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        DELETE_BTN.click();
      })
      .then(() => {
        return browser.wait(
          ExpectedConditions.visibilityOf(DELETE_DATASET_OK_BTN),
          Constant.DEFAULT_TIME_OUT
        );
      })
      .then(() => {
        DELETE_DATASET_OK_BTN.click();
      })
      .then(() => {
        browser.sleep(3000);
      });
  }
}
