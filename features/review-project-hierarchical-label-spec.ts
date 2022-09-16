/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { Constant } from "../general/constant";
import { AnnotatePage } from "../page-object/annotate-page";
import { browser } from "protractor";
import { ProjecstPage } from "../page-object/projects-page";
const projectCreateData = require("../resources/project-create-page/test-data");

describe("review project ...", () => {
  let annotatePage: AnnotatePage;
  let projectsPage: ProjecstPage;
  let since = require("jasmine2-custom-message");
  let project_name: string;

  beforeAll(() => {
    project_name = Constant.project_name_hierarchical_label;
    LoginBussiness.verifyLogin();
    annotatePage = new AnnotatePage();
    projectsPage = new ProjecstPage();
    console.log("start to review project: " + project_name);
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
    console.log("Project_Count_After_Filter:::", Project_Count_After_Filter);
    console.log("Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await annotatePage.clickReviewBtn();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("project info should show up and content correct")
        .expect(annotatePage.getProjectInfo())
        .toEqual({
          name: project_name,
          owner: Constant.username,
          source: projectCreateData.HierarchicalProject.Source,
          instruction: projectCreateData.HierarchicalProject.Instruction,
        });
      since("progress shoud show up and content correct")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions: String(
            projectCreateData.HierarchicalProject.ticketSessions
          ),
          annotations: "0",
        });
      // to modify
      await annotatePage.selectHierarchicalLabel();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the progress annotations should increase 1")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions: String(
            projectCreateData.HierarchicalProject.ticketSessions
          ),
          annotations: "1",
        });
      since("the history list should increase 1")
        .expect(await annotatePage.getHistoryLists())
        .toBe(1);
      console.log("log-start to pass this ticket");
      await annotatePage.passTicket();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      await annotatePage.clickModalOkBtn();
      await browser.sleep(2000);
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
