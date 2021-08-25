/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { Constant } from "../general/constant";
import { AnnotatePage } from "../page-object/annotate-page";
import { browser } from "protractor";
import { ProjecstPage } from "../page-object/projects-page";
import { CommonPage } from "../general/commom-page";
const projectCreateData = require("../resources/project-create-page/test-data");

describe("annotate project ...", () => {
  let annotatePage: AnnotatePage;
  let projectsPage: ProjecstPage;
  let commonPage: CommonPage;
  let since = require("jasmine2-custom-message");
  let project_name: string;

  beforeAll(() => {
    project_name = Constant.project_name_text_al;
    LoginBussiness.verifyLogin();
    annotatePage = new AnnotatePage();
    projectsPage = new ProjecstPage();
    commonPage = new CommonPage();
    console.log("start to annotate project: " + project_name);
  });

  it("Should annotate project with less than 6 labels successfully.", async (done) => {
    await annotatePage.navigateTo();
    await annotatePage.waitForGridLoading();
    await commonPage.changePageValue(20);
    await annotatePage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log("Project_Count_After_Filter:::", Project_Count_After_Filter);
    console.log("Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await commonPage.toShowMoreAnnotators();
      since("hidden annotators should show up with hide icon")
        .expect(commonPage.HIDE_ICON.getText())
        .toEqual("hide");
      await annotatePage.clickAnnotateStartBtn(project_name);
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("project info should show up and content correct")
        .expect(annotatePage.getProjectInfo())
        .toEqual({
          name: project_name,
          owner: Constant.username,
          source: projectCreateData.TextProject.Source,
          instruction: projectCreateData.TextProject.Instruction,
        });
      since("progress shoud show up and content correct")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions: String(projectCreateData.TextProject.ticketSessions),
          annotations: "0",
        });

      await annotatePage.selectAnnoteLable();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the progress annotations should increas 1")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions: String(projectCreateData.TextProject.ticketSessions),
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