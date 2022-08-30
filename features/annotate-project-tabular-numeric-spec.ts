/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { Constant } from "../general/constant";
import { AnnotatePage } from "../page-object/annotate-page";
import { browser, $, ExpectedConditions } from "protractor";
import { ProjecstPage } from "../page-object/projects-page";
const projectCreateData = require("../resources/project-create-page/test-data");

describe("annotate project ...", () => {
  let annotatePage: AnnotatePage;
  let projectsPage: ProjecstPage;
  let since = require("jasmine2-custom-message");
  let project_name: string;

  beforeAll(() => {
    project_name = Constant.project_name_tabular_numeric;
    LoginBussiness.verifyLogin();
    annotatePage = new AnnotatePage();
    projectsPage = new ProjecstPage();
    console.log("start to annotate project: " + project_name);
  });

  it("Should annotate tabular numeric labels project successfully.", async (done) => {
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
      await annotatePage.clickAnnotateStartBtn(project_name);
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("project info should show up and content correct")
        .expect(annotatePage.getProjectInfo())
        .toEqual({
          name: project_name,
          owner: Constant.username,
          source: projectCreateData.TabularNumericLabelsProject.Source,
          instruction:
            projectCreateData.TabularNumericLabelsProject.Instruction,
        });
      since("progress shoud show up and content correct")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions: String(
            projectCreateData.TabularNumericLabelsProject.ticketSessions
          ),
          annotations: "0",
        });

      await annotatePage.inputNumericLable();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the progress annotations should increas 1")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions: String(
            projectCreateData.TabularNumericLabelsProject.ticketSessions
          ),
          annotations: "1",
        });
      since("the history list should increase 1")
        .expect(await annotatePage.getHistoryLists())
        .toBe(1);

      console.log("start to skip this ticket....");
      await annotatePage.skipTicket();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the content should not be empty")
        .expect(annotatePage.currentTicketContent())
        .not.toEqual("");
      since("the history list should increase 1")
        .expect(await annotatePage.getHistoryLists())
        .toBe(2);
      console.log("skip success....");

      console.log("start to flag this ticket....");
      await annotatePage.flagTicket();
      await annotatePage.waitForPageLoading();
      since("the content should not be empty")
        .expect(annotatePage.currentTicketContent())
        .not.toEqual("");
      console.log("flag success....");

      done();
    } else {
      done.fail("can not filter out the consitent project....");
    }
  });
});
