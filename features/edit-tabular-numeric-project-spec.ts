/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Constant } from "../general/constant";
import { browser, $, ExpectedConditions, by, element } from "protractor";
import { ProjecstPage } from "../page-object/projects-page";
import { EditPage } from "../page-object/edit-page";
import { CommonPage } from "../general/commom-page";
import { FunctionUtil } from "../utils/function-util";
import { protractor } from "protractor/built/ptor";
const projectEditData = require("../resources/project-edit-page/test-data");
const projectCreateData = require("../resources/project-create-page/test-data");

describe("edit project info on projects page..", () => {
  let since = require("jasmine2-custom-message");
  let projectsPage: ProjecstPage;
  let editPage: EditPage;
  let commonPage: CommonPage;
  let PROMPT = $('span[class="alert-text"]');

  beforeAll(() => {
    projectsPage = new ProjecstPage();
    editPage = new EditPage();
    commonPage = new CommonPage();
  });

  it("Should edit tabular numeric project successfully.", async (done) => {
    await editPage.navigateTo();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(Constant.project_name_tabular_numeric);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log("Project_Count_After_Filter:::", Project_Count_After_Filter);
    console.log("Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      console.log("----------start to edit projects----------");
      await editPage.clickEditButton();
      await editPage.editNumericScope(
        projectEditData.TabularNumericProject.Min,
        projectEditData.TabularNumericProject.Min_Validation,
        projectEditData.TabularNumericProject.Max,
        projectEditData.TabularNumericProject.Max_Validation
      );
      await editPage.clickEditSubmitButton();
      await browser.wait(
        ExpectedConditions.visibilityOf(PROMPT),
        Constant.DEFAULT_TIME_OUT
      );
      await projectsPage.waitForGridLoading();
      console.log("----------start to verify the edit----------");
      await projectsPage.filterProjectName(
        Constant.project_name_tabular_numeric
      );
      let New_Project_Count_After_Filter = await projectsPage.getTableLength();
      let New_Project_Name_Text = await projectsPage.getCellText(0);
      let New_Project_Labels;
      if (New_Project_Name_Text !== "" || New_Project_Count_After_Filter > 0) {
        New_Project_Labels = await projectsPage.getCellText(6);
        console.log("labels:", New_Project_Labels);
      } else {
        console.log("can not filter out the projects....");
      }
      since("project labels' number should be 0--100 and content correct")
        .expect(New_Project_Labels)
        .toEqual(projectEditData.TabularNumericProject.Labels);
    } else {
      console.log("can not filter out the projects....");
    }
    done();
  });
});
