/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { NewProjectPage } from "../page-object/new-project-page";
import { browser, by, element, ExpectedConditions, $, $$ } from "protractor";
import { Constant } from "../general/constant";
import { ProjecstPage } from "../page-object/projects-page";
import { constants } from "buffer";
const projectCreateData = require("../resources/project-create-page/test-data");

describe("Create new project ", () => {
  const Task_Instruction = projectCreateData.TextProject.Instruction;
  const CSV_Path = "/doc/upload-resource/text-test-data.csv";
  const New_Lable = projectCreateData.TextProject.Labels.split(",");
  const SET_DATA_SECTION = $('ul[role="tablist"] .nav-item:last-child');
  const PROJECT_TEXT_CLASSIFICATION = element(
    by.css('clr-dropdown-menu a[href="/projects/create/text"]')
  );

  let New_Project_Name: string;
  let New_CSV_Name: string;
  let Serial_Num: string;
  let newProjectPage: NewProjectPage;
  let projectsPage: ProjecstPage;
  let since = require("jasmine2-custom-message");

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project" + Serial_Num;
    New_CSV_Name = "e2e Test CSV " + Serial_Num;
    LoginBussiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjecstPage();
    console.log("start to create new project : " + New_Project_Name);
    Constant.dataset_name = New_CSV_Name;
  });

  afterAll(() => {
    Constant.project_name = New_Project_Name;
    console.log("project name after update: " + Constant.project_name);
  });

  it("Should create new project successfully.", async (done) => {
    await newProjectPage.navigateTo();
    await browser.waitForAngular();
    await newProjectPage.clickNewProjectBtn(PROJECT_TEXT_CLASSIFICATION);
    await newProjectPage.setProjectName(New_Project_Name);
    await newProjectPage.setTaskInstruction(Task_Instruction);
    await newProjectPage.uploadCSV(New_CSV_Name, CSV_Path);
    await browser.wait(
      ExpectedConditions.visibilityOf(SET_DATA_SECTION),
      Constant.DEFAULT_TIME_OUT
    );
    await newProjectPage.setData("text");
    await newProjectPage.setMaxAnnotation();
    await newProjectPage.setNewLable(New_Lable);
    await newProjectPage.selectActiveLearningModel(0);
    await newProjectPage.setAssignee(Constant.username);
    await newProjectPage.clickCreateBtn();
    await projectsPage.waitForPageLoading();
    await browser.wait(
      ExpectedConditions.visibilityOf(
        $(".datagrid-host .datagrid-row:nth-child(2)")
      )
    );
    await projectsPage.filterProjectName(New_Project_Name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    if (Project_Name_Text !== "" && Project_Count_After_Filter > 0) {
      since("the project name should same as the user typed name")
        .expect(projectsPage.getCellText(0))
        .toBe(New_Project_Name);
      since("the data source should same as the user uploaded file")
        .expect(projectsPage.getCellText(3))
        .toBe(projectCreateData.TextProject.Source);
      since("the annotar should be the logged user")
        .expect(projectsPage.getAnnotatorCellText())
        .toContain(Constant.username);
      since("the labels should contain the user typed lable")
        .expect(projectsPage.getCellText(5))
        .toContain(New_Lable.join(","));
      since("should have 4 actions")
        .expect(projectsPage.getActionsCount())
        .toBe(5);
      done();
    } else {
      done.fail("can not filter out the consitent project....");
    }
  });
});
