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

describe("Spec - annotate multi numeric project ...", () => {
  let annotatePage: AnnotatePage;
  let projectsPage: ProjectsPage;
  let since = require("jasmine2-custom-message");
  let project_name: string;

  beforeAll(() => {
    project_name = Constant.project_name_numeric_multiple;
    LoginBusiness.verifyLogin();
    annotatePage = new AnnotatePage();
    projectsPage = new ProjectsPage();
    console.log("log-start to annotate multi numeric project: " + project_name);
  });

  it("Should annotate multiple numeric labels project successfully.", async (done) => {
    if (process.env.IN) {
      await browser.sleep(10000);
    }
    await annotatePage.navigateTo();
    await annotatePage.waitForGridLoading();
    await projectsPage.refreshLabelingTask();
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
            "Source:  " + projectCreateData.TextMultiNumericProject.Source,
          instruction:
            "Instruction:  " +
            projectCreateData.TextMultiNumericProject.Instruction,
        });
      since("progress should show up and content correct")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions:
            "Total Items:  " +
            String(projectCreateData.TextMultiNumericProject.ticketSessions),
          annotations: "Labeled Items:  " + "0",
        });
      await annotatePage.selectMultipleNumericLabel(
        projectCreateData.TextMultiNumericProject.sliderValue
      );
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the progress annotations should increase 1")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions:
            "Total Items:  " +
            String(projectCreateData.TextMultiNumericProject.ticketSessions),
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
      await annotatePage.setMultipleNumericByInput(
        projectCreateData.TextMultiNumericProject.inputValue
      );
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the content should not be empty")
        .expect(annotatePage.currentTicketContent())
        .not.toEqual("");
      since("the history list should increase 1")
        .expect(await annotatePage.getHistoryLists())
        .toBe(2);
      console.log("log-skip and then history back success....");
      await browser.sleep(2000);
      await annotatePage.clickHistoryBack();
      await annotatePage.setMultipleNumericByInputNotSubmit(
        projectCreateData.TextMultiNumericProject.inputValue2
      );
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
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

  it("Should review multiple numeric labels project successfully.", async (done) => {
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
      await annotatePage.selectMultipleNumericLabelNotSubmit(
        projectCreateData.TextMultiNumericProject.reviewSliderValue
      );
      await browser.sleep(1000);
      await annotatePage.skipTicket();
      await browser.sleep(1000);
      await annotatePage.unselectMultipleNumericLabelNotSubmit();
      await annotatePage.skipTicket();
      await done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
