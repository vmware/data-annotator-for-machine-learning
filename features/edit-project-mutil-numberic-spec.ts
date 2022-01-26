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

describe("edit multil numberic project info on projects page..", () => {
  let since = require("jasmine2-custom-message");
  let projectsPage: ProjecstPage;
  let editPage: EditPage;
  let commonPage: CommonPage;
  let PROMPT = $('span[class="alert-text"]');
  let New_Lables = projectEditData.MutilNumbericProject.Labels.split(',');
  let MIN_VAL = projectEditData.MutilNumbericProject.MinVal;
  let MAX_VAL = projectEditData.MutilNumbericProject.MaxVal;
  let LABEL1_INPUT = element(by.css("input[placeholder='test1']"));

  let PROJECT_TAB = $('.header-nav a[href="/projects"]');
  const project_name = Constant.project_name_numberic_mutiple;

  beforeAll(() => {
    projectsPage = new ProjecstPage();
    editPage = new EditPage();
    commonPage = new CommonPage();
  });

  it("Should edit mutil numberic project successfully in project tab.", async (done) => {
    await FunctionUtil.click(PROJECT_TAB);
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log("Project_Count_After_Filter:::", Project_Count_After_Filter);
    console.log("Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      console.log("----------start to edit projects----------");
      await editPage.clickEditButton();
      await editPage.DELETE_CANCEL_BTN.click();
      await editPage.clickEditButton();
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
      console.log("can not filter out the projects....");
    }
    done();
  });

  it("Should edit mutil numberic project successfully in admin tab.", async (done) => {
    await editPage.navigateTo();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log("Project_Count_After_Filter:::", Project_Count_After_Filter);
    console.log("Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      console.log("----------start to edit projects----------");
      await editPage.clickEditButton();
      await editPage.editProjectOwner(
        projectEditData.MutilNumbericProject.Email_Validation,
        projectEditData.MutilNumbericProject.Owner2,
        projectEditData.MutilNumbericProject.Owner3
      );
      await editPage.deleteProjectOwner(projectEditData.MutilNumbericProject.Owner3);
      await editPage.editProjectAnnotator(
        projectEditData.MutilNumbericProject.Email_Validation,
        projectEditData.MutilNumbericProject.Annotator
      );
      await editPage.addMutilNumbericLabel(New_Lables, MIN_VAL, MAX_VAL);
      await editPage.editMutilNumbericThreshold(
        projectEditData.MutilNumbericProject.editMinVal_Err,
        projectEditData.MutilNumbericProject.editMaxVal_Err,
      );
      await browser.sleep(5000);
      await editPage.editMutilNumbericThreshold(
        projectEditData.MutilNumbericProject.editMinVal,
        projectEditData.MutilNumbericProject.editMaxVal,
      );
      await editPage.editMutilNumbericLabel(projectEditData.MutilNumbericProject.editLabel);
      await editPage.deltMutilNumbericLabel(projectEditData.MutilNumbericProject.delIndex_err);
      await browser.sleep(5000);
      await editPage.deltMutilNumbericLabel(projectEditData.MutilNumbericProject.delIndex);
      await browser.sleep(5000);
      await editPage.clickEditSubmitButton();
      await browser.wait(
        ExpectedConditions.visibilityOf(PROMPT),
        Constant.DEFAULT_TIME_OUT
      );
      await projectsPage.waitForGridLoading();
      console.log("----------start to verify the edit----------");
      console.log("project_name:::", project_name);
      await projectsPage.filterProjectName(project_name);
      let New_Project_Count_After_Filter = await projectsPage.getTableLength();
      let New_Project_Name_Text = await projectsPage.getCellText(0);
      let New_Project_Owner;
      let New_Project_Annotator;
      let New_Project_Labels;
      console.log(
        "New_Project_Count_After_Filter:::",
        New_Project_Count_After_Filter
      );
      console.log("New_Project_Name_Text:::", New_Project_Name_Text);
      if (New_Project_Name_Text !== "" || New_Project_Count_After_Filter > 0) {
        New_Project_Owner = await projectsPage.getCellText(1);
        console.log("New_Project_Owner:::", New_Project_Owner);
        New_Project_Annotator = await projectsPage.getCellText(4);
        console.log(
          "New_Project_Annotator:::",
          New_Project_Annotator.split("\n")
        );
        New_Project_Labels = await projectsPage.getCellText(6);
        console.log("New_Project_Labels:::", New_Project_Labels);
      } else {
        console.log("can not filter out the projects....");
      }
      since("project name should be edited")
        .expect(New_Project_Name_Text)
        .toEqual(Constant.project_name_numberic_mutiple);
      since("project owner should be 2 and content correct")
        .expect(New_Project_Owner)
        .toEqual(Constant.username + "," + projectEditData.MutilNumbericProject.Owner2);
      since("project annotator should be 6 and content correct")
        .expect(New_Project_Annotator.split("\n").length)
        .toBeGreaterThan(10);
      since("project labels should be 3 and content correct")
        .expect(New_Project_Labels)
        .toEqual(projectEditData.MutilNumbericProject.after_edited_labels);
    } else {
      console.log("can not filter out the projects....");
    }
    done();
  });
 
});
