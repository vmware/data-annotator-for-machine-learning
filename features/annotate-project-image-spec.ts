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

describe("Spec - annotate project ...", () => {
  let annotatePage: AnnotatePage;
  let projectsPage: ProjectsPage;
  let since = require("jasmine2-custom-message");
  let project_name: string;

  beforeAll(() => {
    project_name = Constant.project_name_image;
    LoginBusiness.verifyLogin();
    annotatePage = new AnnotatePage();
    projectsPage = new ProjectsPage();
    console.log("log-start to annotate project: " + project_name);
  });

  it("Should annotate image project successfully.", async (done) => {
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
      await annotatePage.clickTaskName();
      await annotatePage.waitForPageLoading();
      await browser.sleep(10000);
      since("project info should show up and content correct")
        .expect(await annotatePage.getProjectInfo())
        .toEqual({
          name: "Name:  " + project_name,
          owner: "Owner:  " + Constant.username,
          source: "Source:  " + projectCreateData.ImageProject.Source,
          instruction:
            "Instruction:  " + projectCreateData.ImageProject.Instruction,
        });
      since("progress should show up and content correct")
        .expect(await annotatePage.getProgress())
        .toEqual({
          sessions:
            "Total Items:  " +
            String(projectCreateData.ImageProject.ticketSessions),
          annotations: "Labeled Items:  " + "0",
        });
      await annotatePage.annotateImage();
      await annotatePage.waitForPageLoading();
      await browser.sleep(5000);
      since("the progress annotations should increase")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions:
            "Total Items:  " +
            String(projectCreateData.ImageProject.ticketSessions),
          annotations: "Labeled Items:  " + "1",
        });
      since("the history list should increase")
        .expect(await annotatePage.getHistoryLists())
        .toBe(1);
      await annotatePage.annotateImgByPoly();
      await browser.sleep(2000);
      await annotatePage.clickHistoryBack();
      await browser.sleep(2000);
      await annotatePage.skipTicket();
      await browser.sleep(2000);
      await annotatePage.backToPrevious();
      await browser.sleep(2000);
      await annotatePage.submitLogAnnotate();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      await annotatePage.annotateImage();
      await annotatePage.waitForPageLoading();
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

  it("Should review image project successfully.", async (done) => {
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
      await annotatePage.flagTicket();
      await browser.sleep(2000);
      await annotatePage.annotateImgByPolyNotSubmit();
      await FunctionUtil.click(annotatePage.ANNOTATE_SUBMIT_BTN);
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      await annotatePage.annotateImgByRectNotSubmit();
      await annotatePage.backToPrevious();
      await browser.sleep(1000);
      await annotatePage.skipTicket();
      await browser.sleep(1000);
      await annotatePage.passTicket();
      await browser.sleep(1000);
      await FunctionUtil.click(annotatePage.ANNOTATE_SUBMIT_BTN);
      await annotatePage.waitForPageLoading();
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });

  it("Should review done image project successfully.", async (done) => {
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
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
