/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { Constant } from "../general/constant";
import { AnnotatePage } from "../page-object/annotate-page";
import { browser } from "protractor";
import { ProjectsPage } from "../page-object/projects-page";
import { CommonPage } from "../general/common-page";
import { FunctionUtil } from "../utils/function-util";
const projectCreateData = require("../resources/project-create-page/test-data");

describe("Spec - annotate project ...", () => {
  let annotatePage: AnnotatePage;
  let projectsPage: ProjectsPage;
  let since = require("jasmine2-custom-message");
  let project_name: string;
  let commonPage: CommonPage;

  beforeAll(() => {
    project_name = Constant.project_name_hierarchical_label;
    LoginBusiness.verifyLogin();
    annotatePage = new AnnotatePage();
    projectsPage = new ProjectsPage();
    commonPage = new CommonPage();
    console.log("log-start to annotate project: " + project_name);
  });

  it("Should annotate hierarchical labels project successfully.", async (done) => {
    if (process.env.IN) {
      await browser.sleep(20000);
    }
    await annotatePage.navigateTo();
    await projectsPage.refreshLabelingTask();
    await annotatePage.waitForGridLoading();
    await annotatePage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log(
      "log-Project_Count_After_Filter:::",
      Project_Count_After_Filter
    );
    console.log("log-Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await annotatePage.clickTaskName();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      await FunctionUtil.click(annotatePage.BACK_LIST_BTN);
      await annotatePage.waitForGridLoading();
      await browser.sleep(2000);
      await annotatePage.filterProjectName(project_name);
      await annotatePage.clickTaskName();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("project info should show up and content correct")
        .expect(annotatePage.getProjectInfo())
        .toEqual({
          name: "Name:  " + project_name,
          owner: "Owner:  " + Constant.username,
          source: "Source:  " + projectCreateData.HierarchicalProject.Source,
          instruction:
            "Instruction:  " +
            projectCreateData.HierarchicalProject.Instruction,
        });
      since("progress should show up and content correct")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions:
            "Total Items:  " +
            String(projectCreateData.HierarchicalProject.ticketSessions),
          annotations: "Labeled Items:  " + "0",
        });

      await commonPage.clickClrTab(1);
      await browser.sleep(1000);
      await commonPage.clickClrTab(0);
      await browser.sleep(1000);
      //  await annotatePage.toResizeTextArea(500);
      await browser.sleep(1000);
      await annotatePage.toExpandTree();
      await annotatePage.selectHierarchicalLabel();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the progress annotations should increase 1")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions:
            "Total Items:  " +
            String(projectCreateData.HierarchicalProject.ticketSessions),
          annotations: "Labeled Items:  " + "1",
        });
      since("the history list should increase 1")
        .expect(await annotatePage.getHistoryLists())
        .toBe(1);
      console.log("log-start to skip this ticket and then history back....");
      await annotatePage.skipTicket();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      await annotatePage.clickHistoryBack();
      await annotatePage.selectHierarchicalLabel();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the content should not be empty")
        .expect(annotatePage.currentTicketContent())
        .not.toEqual("");
      since("the history list should increase 1")
        .expect(await annotatePage.getHistoryLists())
        .toBe(2);
      console.log("log-skip and then history back success....");

      await annotatePage.selectHierarchicalLabelNotSubmit();
      await annotatePage.backToPrevious();
      await browser.sleep(1000);
      await annotatePage.skipTicket();
      await browser.sleep(2000);
      await FunctionUtil.click(annotatePage.ANNOTATE_SUBMIT_BTN);
      await annotatePage.waitForPageLoading();
      console.log("log-start to flag this ticket....");
      await annotatePage.flagTicket();
      await annotatePage.waitForPageLoading();
      since("the content should not be empty")
        .expect(annotatePage.currentTicketContent())
        .not.toEqual("");
      console.log("log-flag success....");

      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
