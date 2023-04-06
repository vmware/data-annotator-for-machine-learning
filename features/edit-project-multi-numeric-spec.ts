/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Constant } from "../general/constant";
import { browser, $, ExpectedConditions } from "protractor";
import { ProjectsPage } from "../page-object/projects-page";
import { EditPage } from "../page-object/edit-page";
import { CommonPage } from "../general/common-page";
import { protractor } from "protractor/built/ptor";
import { FunctionUtil } from "../utils/function-util";
const projectEditData = require("../resources/project-edit-page/test-data");

describe("Spec - edit multi numeric project info on projects page..", () => {
  let since = require("jasmine2-custom-message");
  let projectsPage: ProjectsPage;
  let editPage: EditPage;
  let commonPage: CommonPage;
  let PROMPT = $('span[class="alert-text"]');
  let New_Labels = projectEditData.MultiNumericProject.Labels.split(",");
  let MIN_VAL = projectEditData.MultiNumericProject.MinVal;
  let MAX_VAL = projectEditData.MultiNumericProject.MaxVal;
  const project_name = Constant.project_name_numeric_multiple;

  beforeAll(() => {
    projectsPage = new ProjectsPage();
    editPage = new EditPage();
    commonPage = new CommonPage();
  });

  it("Should edit multi numeric project successfully in project tab.", async (done) => {
    await editPage.navigateTo();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(project_name);
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
      await editPage.DELETE_CANCEL_BTN.click();
      await commonPage.clickActionBtn(1);
      await editPage.PROJECT_NAME_INPUT.clear();
      await editPage.PROJECT_NAME_INPUT.sendKeys("");
      await editPage.PROJECT_NAME_INPUT.sendKeys(protractor.Key.TAB);
      await editPage.PROJECT_NAME_INPUT.clear();
      await editPage.PROJECT_NAME_INPUT.sendKeys(project_name);
      await editPage.clickEditSubmitButton();
      await browser.wait(
        ExpectedConditions.visibilityOf(PROMPT),
        Constant.DEFAULT_TIME_OUT
      );
      await projectsPage.waitForGridLoading();
    } else {
      console.log("log-can not filter out the projects....");
    }
    done();
  });

  it("Should edit multi numeric project successfully in admin tab.", async (done) => {
    await FunctionUtil.elementVisibilityOf(editPage.ADMIN_TAB);
    await browser.waitForAngularEnabled(false);
    await editPage.ADMIN_TAB.click();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log(
      "log-Project_Count_After_Filter:::",
      Project_Count_After_Filter
    );
    console.log("log-Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      console.log("log-start to edit admin tab project");
      await commonPage.clickActionBtn(1);
      await editPage.editMultiNumericOwner(
        projectEditData.MultiNumericProject.Email_Validation,
        projectEditData.MultiNumericProject.Owner2,
        projectEditData.MultiNumericProject.Owner3
      );
      await editPage.deleteMultiProjectOwner();
      await editPage.editMultiNumberAnnotator(
        projectEditData.MultiNumericProject.Email_Validation,
        projectEditData.MultiNumericProject.Annotator
      );
      await editPage.addMultiNumericLabel(New_Labels, MIN_VAL, MAX_VAL);
      await editPage.editMultiNumericThreshold(
        projectEditData.MultiNumericProject.editMinVal_Err,
        projectEditData.MultiNumericProject.editMaxVal_Err
      );
      await browser.sleep(5000);
      await editPage.editMultiNumericThreshold(
        projectEditData.MultiNumericProject.editMinVal,
        projectEditData.MultiNumericProject.editMaxVal
      );
      await editPage.editMultiNumericLabel(
        projectEditData.MultiNumericProject.editLabel
      );
      await browser.sleep(5000);
      await editPage.deleteMultiNumericLabel(
        projectEditData.MultiNumericProject.delIndex_err
      );
      await browser.sleep(5000);
      await editPage.deleteMultiNumericLabel(
        projectEditData.MultiNumericProject.delIndex
      );
      await editPage.clickEditSubmitButton();
      await browser.wait(
        ExpectedConditions.visibilityOf(PROMPT),
        Constant.DEFAULT_TIME_OUT
      );
      await projectsPage.waitForGridLoading();
      console.log("log-start to verify the edit");
      console.log("log-project_name:::", project_name);
      await projectsPage.filterProjectName(project_name);
      let New_Project_Count_After_Filter = await projectsPage.getTableLength();
      let New_Project_Name_Text = await projectsPage.getCellText(0);
      let New_Project_Owner;
      let New_Project_Annotator;
      let New_Project_Labels;
      console.log(
        "log-New_Project_Count_After_Filter:::",
        New_Project_Count_After_Filter
      );
      console.log("log-New_Project_Name_Text:::", New_Project_Name_Text);
      if (New_Project_Name_Text !== "" || New_Project_Count_After_Filter > 0) {
        await commonPage.clickSwitchListColumn(1, 4);
        await browser.sleep(1000);
        New_Project_Owner = await projectsPage.getCellText(2);
        console.log("log-New_Project_Owner:::", New_Project_Owner);
        New_Project_Annotator = await projectsPage.getCellText(7);
        console.log(
          "log-New_Project_Annotator:::",
          New_Project_Annotator.split("\n")
        );
        New_Project_Labels = await projectsPage.getCellText(10);
        console.log("log-New_Project_Labels:::", New_Project_Labels);
      } else {
        console.log("log-can not filter out the projects....");
      }
      since("project name should be edited")
        .expect(New_Project_Name_Text)
        .toEqual(Constant.project_name_numeric_multiple);
      since("project owner should be 1 and content correct")
        .expect(New_Project_Owner)
        .toEqual("P");
      since("project annotator should be 2 and content correct")
        .expect(New_Project_Annotator.split("\n").length)
        .toBeGreaterThan(1);
      since("project labels should be 3 and content correct")
        .expect(New_Project_Labels)
        .toEqual(projectEditData.MultiNumericProject.after_edited_labels);
    } else {
      console.log("log-can not filter out the projects....");
    }
    done();
  });
});
