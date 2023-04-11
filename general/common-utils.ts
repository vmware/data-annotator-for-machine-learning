/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { CommonPage } from "./common-page";
import { ProjectsPage } from "../page-object/projects-page";
import { MyDatasetsPage } from "../page-object/my-datasets-page";
import { browser, ExpectedConditions, by } from "protractor";
import { Constant } from "./constant";
import { FunctionUtil } from "../utils/function-util";

export class CommonUtils extends CommonPage {
  static DEFAULT_TIME_OUT = 100 * 1000;
  static commonPage: CommonPage = new CommonPage();
  static projectsPage: ProjectsPage = new ProjectsPage();
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
          this.projectsPage.PROJECT_NAME_FILTER_BTN
        ),
        this.DEFAULT_TIME_OUT
      );
      await this.projectsPage.filterProjectName(projectsName);
      let filtered_Projects_Count = await this.projectsPage.getTableLength();
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
      await this.myDatasetsPage.filterDatasetName(myDatasetsName);
      let filtered_MyDatasets_Count =
        await this.myDatasetsPage.getTableLength();
      if (filtered_MyDatasets_Count > 0) {
        await CommonUtils.deleteFunction(myDatasetsName);
      } else {
        loopBool = false;
      }
    }
  }

  static async deleteDataGrid(
    ACTION_ICONS,
    ACTION_BUTTONS,
    DELETE_DATA_OK_BTN?
  ) {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(ACTION_ICONS),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        FunctionUtil.click(ACTION_ICONS);
      })
      .then(() => {
        FunctionUtil.click(ACTION_BUTTONS);
      })
      .then(() => {
        return browser.wait(
          ExpectedConditions.visibilityOf(DELETE_DATA_OK_BTN),
          Constant.DEFAULT_TIME_OUT
        );
      })
      .then(() => {
        FunctionUtil.click(DELETE_DATA_OK_BTN);
      })
      .then(() => {
        browser.sleep(3000);
      });
  }

  static async deleteLabelTaskCancel(ACTION_ICONS, ACTION_BUTTONS) {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(ACTION_ICONS),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        FunctionUtil.click(ACTION_ICONS);
      })
      .then(() => {
        FunctionUtil.click(ACTION_BUTTONS);
      })
      .then(() => {
        return browser.wait(
          ExpectedConditions.visibilityOf(
            this.commonPage.DELETE_PROJECT_CANCEL_BTN
          ),
          Constant.DEFAULT_TIME_OUT
        );
      })
      .then(() => {
        FunctionUtil.click(this.commonPage.DELETE_PROJECT_CANCEL_BTN);
      })
      .then(() => {
        browser.sleep(3000);
      });
  }
}
