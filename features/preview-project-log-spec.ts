/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { Constant } from "../general/constant";
import { ProjectsPage } from "../page-object/projects-page";
import { $$, $, by, element, browser } from "protractor";
const projectEditData = require("../resources/project-edit-page/test-data");
import { CommonPage } from "../general/common-page";

describe("Spec - enter labeling task analyze page...", () => {
  let projectsPage: ProjectsPage;
  let commonPage: CommonPage;
  let project_name: string;

  beforeAll(() => {
    LoginBusiness.verifyLogin();
    projectsPage = new ProjectsPage();
    commonPage = new CommonPage();
  });

  // it("Should change the page value successfully.", async (done) => {
  //   await projectsPage.navigateTo();
  //   await projectsPage.waitForPageLoading();
  //   await commonPage.changePageValue(1);
  //   done();
  // });

  it("Should preview log project, filter file name and return successfully.", async (done) => {
    project_name = Constant.project_name_log;
    await projectsPage.navigateTo();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log(
      "log-Project_Count_After_Filter:::",
      Project_Count_After_Filter
    );
    console.log("log-Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await projectsPage.clickGridFirstCell();
      await projectsPage.waitForLoading();
      await browser.sleep(1000);
      await projectsPage.clickProjectPreviewTabs(1);
      await projectsPage.filterLogFileName(
        projectEditData.LogProject.Filter_File_Name
      );
      let tableLengthBeforeReturn = await projectsPage.getTableLength();
      console.log("log-tableLengthBeforeReturn", tableLengthBeforeReturn);
      let aa = (await projectsPage.getTableTotalItems()).trim().split(" ")[4];
      console.log("log-table total items", aa);
      await projectsPage.logShowDetails();
      await projectsPage.returnToAnnotatorBtn();
      await browser.sleep(1000);
      await projectsPage.toExpandCell();
    } else {
      done.fail("log-can not filter out the consistent project....");
    }
    done();
  });

  it("Should mark all for view log project successfully.", async (done) => {
    project_name = Constant.project_name_log;
    await projectsPage.navigateTo();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log(
      "log-Project_Count_After_Filter:::",
      Project_Count_After_Filter
    );
    console.log("log-Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await projectsPage.clickGridFirstCell();
      await projectsPage.waitForLoading();
      await browser.sleep(1000);
      await projectsPage.clickProjectPreviewTabs(1);
      await browser.sleep(3000);
      await projectsPage.markAllForReview();
    } else {
      done.fail("log-can not filter out the consistent project....");
    }
    done();
  });

  it("Should preview log project, d3 chart.", async (done) => {
    await commonPage.clickClrTab(2);
    await element(
      by.css("div.floatRight.btn-sm > div:nth-child(2) > label")
    ).click();
    await done();
  });

  it("Should preview log project, verify show/hide tag.", async (done) => {
    await element(by.css("div.showTag")).click();
    await browser.sleep(500);
    await element(by.css("div.hideTag")).click();
    await done();
  });

  it("Should preview log project, verify view dataset.", async (done) => {
    await element(by.buttonText("View Dataset")).click();
    await browser.sleep(500);
    await done();
  });
});
