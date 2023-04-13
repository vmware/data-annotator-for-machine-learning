/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { Constant } from "../general/constant";
import { AnnotatePage } from "../page-object/annotate-page";
import { browser } from "protractor";
import { ProjectsPage } from "../page-object/projects-page";
const projectCreateData = require("../resources/project-create-page/test-data");

describe("Spec - annotate project ...", () => {
  let annotatePage: AnnotatePage;
  let projectsPage: ProjectsPage;
  let since = require("jasmine2-custom-message");
  let project_name: string;

  beforeAll(() => {
    project_name = Constant.project_name_ner;
    LoginBusiness.verifyLogin();
    annotatePage = new AnnotatePage();
    projectsPage = new ProjectsPage();
    console.log("log-start to annotate project: " + project_name);
  });

  it("Should annotate ner labels existing project successfully.", async (done) => {
    if (process.env.IN) {
      await browser.sleep(10000);
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
      since("project info should show up and content correct")
        .expect(annotatePage.getProjectInfo())
        .toEqual({
          name: "Name:  " + project_name,
          owner: "Owner:  " + Constant.username,
          source:
            "Source:  " + projectCreateData.NerLabelsExistingProject.Source,
          instruction:
            "Instruction:  " +
            projectCreateData.NerLabelsExistingProject.Instruction,
        });
      since("progress should show up and content correct")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions:
            "Total Items:  " +
            String(projectCreateData.NerLabelsExistingProject.ticketSessions),
          annotations: "Labeled Items:  " + "0",
        });

      await annotatePage.annotateNer();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      let annotations = await annotatePage.getProgress();
      let historyLists = await annotatePage.getHistoryLists();
      since("the progress annotations should increase 1")
        .expect(annotations)
        .toEqual({
          sessions:
            "Total Items:  " +
            String(projectCreateData.NerLabelsExistingProject.ticketSessions),
          annotations: "Labeled Items:  " + "1",
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
          sessions:
            "Total Items:  " +
            String(projectCreateData.NerLabelsExistingProject.ticketSessions),
          annotations: annotations.annotations,
        });
      since("the history list shouldn't be changed")
        .expect(await annotatePage.getHistoryLists())
        .toEqual(historyLists);

      console.log("log-start to skip this ticket....");
      await annotatePage.skipTicket();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the content should not be empty")
        .expect(annotatePage.currentNerTicketContent())
        .not.toEqual("");
      console.log(
        "log-current_history list:",
        await annotatePage.getHistoryLists()
      );
      console.log("log-old_history list_plus_skip:", historyLists + 1);
      since("the history list should increase 1")
        .expect(await annotatePage.getHistoryLists())
        .toEqual(historyLists + 1);
      console.log("log-skip success....");

      console.log("log-start to flag this ticket....");
      await annotatePage.flagTicket();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the content should not be empty")
        .expect(annotatePage.currentNerTicketContent())
        .not.toEqual("");
      console.log("log-flag success....");
      await annotatePage.clickHistory2Back();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      await annotatePage.clickHistoryBack();
      await annotatePage.waitForPageLoading();
      await browser.sleep(1000);
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });

  it("Should review ner project successfully.", async (done) => {
    if (process.env.IN) {
      await browser.sleep(10000);
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
      await annotatePage.setReviewPopupLabel();
      await browser.sleep(1000);
      await annotatePage.skipTicket();
      await browser.sleep(1000);
      await annotatePage.backToPrevious();
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});