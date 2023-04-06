/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Constant } from "../general/constant";
import { browser, $, ExpectedConditions, by, element } from "protractor";
import { ProjectsPage } from "../page-object/projects-page";
import { EditPage } from "../page-object/edit-page";
import { CommonPage } from "../general/common-page";
import { FunctionUtil } from "../utils/function-util";
import { protractor } from "protractor/built/ptor";
const projectEditData = require("../resources/project-edit-page/test-data");

describe("Spec - edit log project info", () => {
  let since = require("jasmine2-custom-message");
  let projectsPage: ProjectsPage;
  let editPage: EditPage;
  let commonPage: CommonPage;
  let PROMPT = $('span[class="alert-text"]');
  let LABEL1_INPUT = element(by.css("input[placeholder='test1']"));
  let LABEL2_INPUT = element(by.css("input[placeholder='test2']"));
  let LABEL3_INPUT = element(by.css("input[placeholder='test3']"));

  beforeAll(() => {
    projectsPage = new ProjectsPage();
    editPage = new EditPage();
    commonPage = new CommonPage();
  });

  it("Should edit log project successfully.", async (done) => {
    await editPage.navigateTo();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(Constant.project_name_log);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log(
      "log-Project_Count_After_Filter:::",
      Project_Count_After_Filter
    );
    console.log("log-Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      console.log("log-start to edit projects");
      await commonPage.clickActionBtn(1);
      await editPage.editTaskInstructions();
      await editPage.editAssignedTickets(
        projectEditData.LogProject.Annotator,
        projectEditData.LogProject.OverMax
      );
      await editPage.deleteAnnotator();
      await editPage.deleteLabel(LABEL1_INPUT);
      since("prompt should show up and content correct")
        .expect(commonPage.getPromptText())
        .toEqual(projectEditData.LogProject.ErrorMessage_Atleast);
      await editPage.addLabel([projectEditData.LogProject.Labels]);
      await editPage.clickEditSubmitButton();
      await browser.wait(
        ExpectedConditions.visibilityOf(PROMPT),
        Constant.DEFAULT_TIME_OUT
      );
      await projectsPage.waitForGridLoading();

      //enter edit modal again to delete label and to catch another err message
      await projectsPage.filterProjectName(Constant.project_name_log);
      await browser.sleep(1000);
      await commonPage.clickActionBtn(1);
      await editPage.deleteLabel(LABEL1_INPUT);
      since("prompt should show up and content correct")
        .expect(commonPage.getPromptText())
        .toEqual(projectEditData.LogProject.ErrorMessage_Used);
      await browser.sleep(1000);

      await editPage.deleteLabel(LABEL3_INPUT);
      await editPage.editLabel(LABEL2_INPUT, "test3");

      await editPage.showFileName();
      await editPage.assignmentLogic();
      await editPage.clickEditSubmitButton();
      await browser.wait(
        ExpectedConditions.visibilityOf(PROMPT),
        Constant.DEFAULT_TIME_OUT
      );
      await projectsPage.waitForGridLoading();

      // console.log("log-start to verify the edit");
      // await projectsPage.filterProjectName(Constant.project_name_log);
      // let New_Project_Count_After_Filter = await projectsPage.getTableLength();
      // let New_Project_Name_Text = await projectsPage.getCellText(0);
      // let New_Project_Annotator;
      // let New_Project_Labels;
      // if (New_Project_Name_Text !== "" || New_Project_Count_After_Filter > 0) {
      //   New_Project_Annotator = await projectsPage.getCellText(5);
      //   New_Project_Labels = await projectsPage.getCellText(7);
      //   console.log("log-annotator:", New_Project_Annotator);
      //   console.log("log-labels:", New_Project_Labels);
      // } else {
      //   console.log("log-can not filter out the projects....");
      // }
      // since("project annotator should be 1 and content correct")
      //   .expect(New_Project_Annotator.split("\n").length)
      //   .toEqual(2);
      // since("project labels' number should be 2 and content correct")
      //   .expect(New_Project_Labels)
      //   .toEqual(projectEditData.LogProject.editLabels);
    } else {
      console.log("log-can not filter out the projects....");
    }
    done();
  });
});
