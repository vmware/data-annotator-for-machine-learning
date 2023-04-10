/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { browser, $, $$ } from "protractor";
import { LoginBusiness } from "./login-business";
import { ProjectsPage } from "../page-object/projects-page";
import { FunctionUtil } from "../utils/function-util";
import { Constant } from "./constant";

describe("Spec - make sure permission page can normally display", () => {
  let since = require("jasmine2-custom-message");
  const PERMISSION_TAB = $('a[href="/loop/permissions/users"]');
  let projectsPage: ProjectsPage;
  let BUTTON_EDIT = $('button[title="Edit User"]');
  let BUTTON_DEL = $('button[title="Delete the User"]');
  let USER_SELECT = $(".prev-info .clr-select-wrapper select");
  let USER_SELECT_OPTION = $$(".prev-info .clr-select-wrapper select option");

  beforeAll(() => {
    LoginBusiness.verifyLogin();
    projectsPage = new ProjectsPage();
  });

  it("Should permission page display successfully.", async (done) => {
    await browser.sleep(2000);
    await browser.refresh();
    await browser.sleep(1000);
    await FunctionUtil.click(PERMISSION_TAB);
    await browser.waitForAngular();
    done();
  });

  it("Should edit user permission successfully", async (done) => {
    projectsPage.filterProjectName(Constant.fullname_owner);
    await browser.sleep(2000);
    let Owner_FullName_Text = await projectsPage.getCellText(0);
    console.log("log-user name is: ", Owner_FullName_Text);
    if (Owner_FullName_Text !== "") {
      await FunctionUtil.elementVisibilityOf(BUTTON_EDIT);
      await FunctionUtil.click(BUTTON_EDIT);
      await browser.sleep(1000);
      await FunctionUtil.click(projectsPage.UPLOAD_CSV_CANCEL_BTN);
      await FunctionUtil.click(BUTTON_EDIT);
      await browser.sleep(1000);
      await FunctionUtil.elementVisibilityOf(USER_SELECT);
      await USER_SELECT_OPTION.get(0).click();
      await browser.sleep(1000);
      await USER_SELECT_OPTION.get(1).click();
      await FunctionUtil.click(projectsPage.UPLOAD_CSV_OK_BTN);
    }
    done();
  });

  it("Should delete user successfully", async (done) => {
    await browser.sleep(1000);
    await FunctionUtil.click(BUTTON_DEL);
    await browser.sleep(1000);
    await FunctionUtil.click(projectsPage.UPLOAD_CSV_CANCEL_BTN);
    await FunctionUtil.click(BUTTON_DEL);
    await browser.sleep(1000);
    await FunctionUtil.click(projectsPage.UPLOAD_CSV_OK_BTN);
    done();
  });
});
