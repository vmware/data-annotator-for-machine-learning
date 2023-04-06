/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { Constant } from "../general/constant";
import { AnnotatePage } from "../page-object/annotate-page";
import { browser } from "protractor";
import { ProjectsPage } from "../page-object/projects-page";
import { FunctionUtil } from "../utils/function-util";
const projectCreateData = require("../resources/project-create-page/test-data");

describe("Spec - review project ...", () => {
  let annotatePage: AnnotatePage;
  let projectsPage: ProjectsPage;
  let since = require("jasmine2-custom-message");
  let project_name: string;

  beforeAll(() => {
    project_name = Constant.project_name_hierarchical_label;
    LoginBusiness.verifyLogin();
    annotatePage = new AnnotatePage();
    projectsPage = new ProjectsPage();
    console.log("log-start to review project: " + project_name);
  });

  it("Should review hierarchical labels project successfully.", async (done) => {
    if (process.env.IN) {
      await browser.sleep(20000);
    }
    await annotatePage.navigateTo();
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
      await annotatePage.clickReviewBtn();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("project info should show up and content correct")
        .expect(annotatePage.getReviewProjectInfo())
        .toEqual({
          name: "Name:  " + project_name,
          owner: "Owner:  " + Constant.username,
          source: "Source:  " + projectCreateData.HierarchicalProject.Source,
          instruction:
            "Instruction:  " +
            projectCreateData.HierarchicalProject.Instruction,
        });
      since("progress should show up and content correct")
        .expect(annotatePage.getReviewProgress())
        .toEqual({
          sessions:
            "Total Items:  " +
            String(projectCreateData.HierarchicalProject.ticketSessions),
          reviews: "Reviewed tickets:  " + "0",
        });
      // to modify
      await annotatePage.selectHierarchicalLabelNotSubmit();
      await annotatePage.skipTicket();
      await browser.sleep(1000);
      await FunctionUtil.click(annotatePage.ANNOTATE_SUBMIT_BTN);
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      await annotatePage.selectHierarchicalLabelNotSubmit();
      await annotatePage.backToPrevious();
      await browser.sleep(1000);
      await FunctionUtil.click(annotatePage.ANNOTATE_SUBMIT_BTN);
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the progress annotations should increase 1")
        .expect(annotatePage.getReviewProgress())
        .toEqual({
          sessions:
            "Total Items:  " +
            String(projectCreateData.HierarchicalProject.ticketSessions),
          reviews: "Reviewed tickets:  " + "2",
        });
      since("the history list should increase 2")
        .expect(await annotatePage.getHistoryLists())
        .toBe(2);

      await annotatePage.changeReviewer();
      console.log("log-start to pass this ticket");
      await annotatePage.passTicket();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
