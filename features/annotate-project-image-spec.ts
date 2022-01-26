/*
Copyright 2019-2021 VMware, Inc.
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
    project_name = Constant.project_name_image;
    LoginBussiness.verifyLogin();
    annotatePage = new AnnotatePage();
    projectsPage = new ProjecstPage();
    console.log("start to annotate project: " + project_name);
  });

  it("Should annotate image project successfully.", async (done) => {
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
      await browser.sleep(10000);
      since("project info should show up and content correct")
        .expect(await annotatePage.getProjectInfo())
        .toEqual({
          name: project_name,
          owner: Constant.username,
          source: projectCreateData.ImageProject.Source,
          instruction: projectCreateData.ImageProject.Instruction,
        });
      since("progress shoud show up and content correct")
        .expect(await annotatePage.getProgress())
        .toEqual({
          sessions: String(projectCreateData.ImageProject.ticketSessions),
          annotations: "0",
        });

      await annotatePage.annotateImage();
      await annotatePage.waitForPageLoading();
      await browser.sleep(5000);
      since("the progress annotations should increas")
        .expect(annotatePage.getProgress())
        .toEqual({
          sessions: String(projectCreateData.ImageProject.ticketSessions),
          annotations: "1",
        });
      since("the history list should increase")
        .expect(await annotatePage.getHistoryLists())
        .toBe(1);
      await annotatePage.annotateImgbyPoly();
      await browser.sleep(2000);
      await annotatePage.clickHistoryBack();
      await browser.sleep(2000);
      await annotatePage.skipTicket();
      await browser.sleep(2000);
      await annotatePage.backToPrevious();
      await browser.sleep(2000);
      await annotatePage.submitLogAnnotate();
      await annotatePage.waitForPageLoading();
      done();
    } else {
      done.fail("can not filter out the consitent project....");
    }
  });
});
