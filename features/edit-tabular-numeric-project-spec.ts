/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Constant } from "../general/constant";
import { browser, $, ExpectedConditions, by, element } from "protractor";
import { ProjectsPage } from "../page-object/projects-page";
import { EditPage } from "../page-object/edit-page";
import { CommonPage } from "../general/common-page";
const projectEditData = require("../resources/project-edit-page/test-data");

describe("Spec - edit project info on projects page..", () => {
  let since = require("jasmine2-custom-message");
  let projectsPage: ProjectsPage;
  let editPage: EditPage;
  let commonPage: CommonPage;
  let PROMPT = $('span[class="alert-text"]');

  beforeAll(() => {
    projectsPage = new ProjectsPage();
    editPage = new EditPage();
    commonPage = new CommonPage();
  });

  it("Should edit tabular numeric project successfully.", async (done) => {
    await editPage.navigateTo();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(Constant.project_name_tabular_numeric);
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
      console.log("log-start to verify the edit");
      await projectsPage.filterProjectName(
        Constant.project_name_tabular_numeric
      );
      let New_Project_Count_After_Filter = await projectsPage.getTableLength();
      let New_Project_Name_Text = await projectsPage.getCellText(0);
      let New_Project_Labels;
      if (New_Project_Name_Text !== "" || New_Project_Count_After_Filter > 0) {
        await commonPage.clickSwitchListColumn(1, 4);
        await browser.sleep(1000);
        New_Project_Labels = await projectsPage.getCellText(10);
        console.log("log-labels:", New_Project_Labels);
      } else {
        console.log("log-can not filter out the projects....");
      }
      since("project labels' number should be 0--200 and content correct")
        .expect(New_Project_Labels)
        .toEqual(projectEditData.TabularNumericProject.Labels);
    } else {
      console.log("log-can not filter out the projects....");
    }
    done();
  });
});
