/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { Constant } from "../general/constant";
import { AnnotatePage } from "../page-object/annotate-page";
import { browser, $ } from "protractor";
import { ProjectsPage } from "../page-object/projects-page";
import { FunctionUtil } from "../utils/function-util";
import { CommonPage } from "../general/common-page";
const projectEditData = require("../resources/project-edit-page/test-data");
const projectCreateData = require("../resources/project-create-page/test-data");

describe("Spec - annotate project with dropdown labels...", () => {
  let annotatePage: AnnotatePage;
  let projectsPage: ProjectsPage;
  let commonPage: CommonPage;
  let since = require("jasmine2-custom-message");
  let project_name: string;
  let LabelTooltip = $("div.clr-form-group.category label");

  beforeAll(() => {
    project_name = Constant.project_name_text_al;
    LoginBusiness.verifyLogin();
    annotatePage = new AnnotatePage();
    projectsPage = new ProjectsPage();
    commonPage = new CommonPage();
  });

  it("Should annotate project with dropdown labels successfully.", async (done) => {
    console.log("log-start to annotate tab to do annotate....");
    await annotatePage.navigateTo();
    await annotatePage.waitForGridLoading();
    // await commonPage.toShowMoreAnnotators();
    // since("hidden annotators should show up with hide icon")
    //   .expect(commonPage.HIDE_ICON.getText())
    //   .toEqual("hide");
    await annotatePage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    // await commonPage.toShowTableColumns();
    let Project_Name_Text = await projectsPage.getCellText(0);
    let Project_Labels = await projectsPage.getCellText(10);
    if (
      (Project_Name_Text !== "" && Project_Labels.split(",").length > 6) ||
      Project_Count_After_Filter > 0
    ) {
      await annotatePage.clickTaskName();
      await annotatePage.waitForPageLoading();
      await FunctionUtil.elementVisibilityOf(LabelTooltip);
      await browser.sleep(5000);

      since("project info should show up and content correct")
        .expect(annotatePage.getProjectInfo())
        .toEqual({
          name: "Name:  " + project_name,
          owner:
            "Owner:  " +
            Constant.username +
            "," +
            projectEditData.TextProject.Owner2,
          source: "Source:  " + projectCreateData.TextProject.Source,
          instruction:
            "Instruction:  " + projectCreateData.TextProject.Instruction,
        });

      await annotatePage.selectAnnotateLabelInDropdown();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      await FunctionUtil.elementVisibilityOf(LabelTooltip);

      since("the history list should increase 1")
        .expect(await annotatePage.getHistoryLists())
        .toBe(1);

      console.log("log-start to skip this ticket....");
      await annotatePage.skipTicket();
      await annotatePage.waitForPageLoading();
      await browser.sleep(2000);
      since("the content should not be empty")
        .expect(annotatePage.currentTicketContent())
        .not.toEqual("");
      since("the history list should increase 1")
        .expect(await annotatePage.getHistoryLists())
        .toBe(2);
      console.log("log-skip success....");

      console.log("log-start to flag this ticket....");
      await annotatePage.flagTicket();
      await annotatePage.waitForPageLoading();
      let currentTicketContent = await annotatePage.currentTicketContent();
      since("the content should not be empty")
        .expect(currentTicketContent)
        .not.toEqual("");
      console.log("log-flag success....");

      done();
    } else {
      done.fail(
        "can not filter out the consistent project with dropdown labels...."
      );
    }
  });
});
