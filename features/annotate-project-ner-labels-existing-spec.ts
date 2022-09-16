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
    project_name = Constant.project_name_ner;
    LoginBussiness.verifyLogin();
    annotatePage = new AnnotatePage();
    projectsPage = new ProjecstPage();
    console.log("start to annotate project: " + project_name);
  });

  it("Should annotate ner labels existing project successfully.", async (done) => {
    if (process.env.IN) {
      await browser.sleep(10000);
    }
    await annotatePage.navigateTo();
    await annotatePage.waitForGridLoading();
    await annotatePage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log("Project_Count_After_Filter:::", Project_Count_After_Filter);
    console.log("Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await annotatePage.clickAnnotateStartBtn();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("project info should show up and content correct")
        .expect(annotatePage.getProjectInfo())
        .toEqual({
          name: project_name,
          owner: Constant.username,
          source: projectCreateData.NerLabelsExistingProject.Source,
          instruction: projectCreateData.NerLabelsExistingProject.Instruction,
        });
      since("progress shoud show up and content correct")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions: String(
            projectCreateData.NerLabelsExistingProject.ticketSessions
          ),
          annotations: "0",
        });

      await annotatePage.annotateNer();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      let annotations = await annotatePage.getProgress();
      let historyLists = await annotatePage.getHistoryLists();
      since("the progress annotations should increas 1")
        .expect(annotations)
        .toEqual({
          sessions: String(
            projectCreateData.NerLabelsExistingProject.ticketSessions
          ),
          annotations: "1",
        });

      await annotatePage.backToPrevious();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      await annotatePage.removeAnnotatedNer();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the progress annotations shouldn't be changed")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions: String(
            projectCreateData.NerLabelsExistingProject.ticketSessions
          ),
          annotations: annotations.annotations,
        });
      since("the history list shouldn't be changed")
        .expect(await annotatePage.getHistoryLists())
        .toEqual(historyLists);

      console.log("start to skip this ticket....");
      await annotatePage.skipTicket();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the content should not be empty")
        .expect(annotatePage.currentNerTicketContent())
        .not.toEqual("");
      console.log("current_historylist:", await annotatePage.getHistoryLists());
      console.log("old_historylist_plus_skip:", historyLists + 1);
      since("the history list should increase 1")
        .expect(await annotatePage.getHistoryLists())
        .toEqual(historyLists + 1);
      console.log("skip success....");

      console.log("start to flag this ticket....");
      await annotatePage.flagTicket();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the content should not be empty")
        .expect(annotatePage.currentNerTicketContent())
        .not.toEqual("");
      console.log("flag success....");

      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
