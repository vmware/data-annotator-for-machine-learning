/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { Constant } from "../general/constant";
import { AnnotatePage } from "../page-object/annotate-page";
import { browser, $ } from "protractor";
import { ProjectsPage } from "../page-object/projects-page";
import { CommonPage } from "../general/common-page";
import { FunctionUtil } from "../utils/function-util";
const projectCreateData = require("../resources/project-create-page/test-data");

describe("Spec - annotate project text ...", () => {
  let annotatePage: AnnotatePage;
  let projectsPage: ProjectsPage;
  let commonPage: CommonPage;
  let since = require("jasmine2-custom-message");
  let project_name: string;

  beforeAll(() => {
    project_name = Constant.project_name_text_al;
    LoginBusiness.verifyLogin();
    annotatePage = new AnnotatePage();
    projectsPage = new ProjectsPage();
    commonPage = new CommonPage();
    console.log("log-start to annotate project: " + project_name);
  });

  it("Should annotate project with less than 6 labels successfully.", async (done) => {
    if (process.env.IN) {
      await browser.sleep(20000);
    }
    await annotatePage.navigateTo();
    await annotatePage.waitForGridLoading();
    // await commonPage.changePageValue(2);
    await browser.sleep(10000);
    await commonPage.toClickRefreshBtn();
    await annotatePage.filterProjectName(project_name);
    await annotatePage.waitForGridLoading();
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    console.log(
      "log-Project_Count_After_Filter:::",
      Project_Count_After_Filter
    );
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log("log-Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await browser.sleep(10000);
      await annotatePage.clickTaskName();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      console.log("log-start to get project info");
      since("project info should show up and content correct")
        .expect(annotatePage.getProjectInfo())
        .toEqual({
          name: "Name:  " + project_name,
          owner: "Owner:  " + Constant.username,
          source: "Source:  " + projectCreateData.TextProject.Source,
          instruction:
            "Instruction:  " + projectCreateData.TextProject.Instruction,
        });
      await annotatePage.selectDisplay(1);
      await annotatePage.selectAnnotateLabel();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the history list should increase 1")
        .expect(await annotatePage.getHistoryLists())
        .toBe(1);

      console.log("log-start to skip this ticket....");
      await annotatePage.skipTicket();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      await annotatePage.clickHistoryBack();
      await annotatePage.selectAnnotateLabel();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the content should not be empty")
        .expect(annotatePage.currentTicketContent())
        .not.toEqual("");
      since("the history list should increase 1")
        .expect(await annotatePage.getHistoryLists())
        .toBe(2);
      console.log("log-skip success....");

      console.log("log-start to flag this ticket....");
      await annotatePage.flagTicket();
      await annotatePage.waitForPageLoading();
      since("the content should not be empty")
        .expect(annotatePage.currentTicketContent())
        .not.toEqual("");
      console.log("log-flag success....");
      // if (Constant.project_name_log) {
      //   await annotatePage.selectProjects(Constant.project_name_log);
      //   await annotatePage.waitForPageLoading();
      //   browser.sleep(1000);
      //   await annotatePage.exitAnnotatePage();
      //   await commonPage.waitForGridLoading();
      // }
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
