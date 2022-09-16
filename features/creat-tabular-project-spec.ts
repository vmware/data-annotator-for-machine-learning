/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { NewProjectPage } from "../page-object/new-project-page";
import { browser, by, element, ExpectedConditions, $, $$ } from "protractor";
import { Constant } from "../general/constant";
import { ProjecstPage } from "../page-object/projects-page";
import { FunctionUtil } from "../utils/function-util";

const projectCreateData = require("../resources/project-create-page/test-data");
const since = require("jasmine2-custom-message");

describe("Create new project ", () => {
  const Task_Instruction = projectCreateData.TabularProject.Instruction;
  const New_Lable = projectCreateData.TabularProject.Labels.split(",");
  const SET_DATA_SECTION = $("clr-wizard.clr-wizard");
  const PROJECT_TABULAR_CLASSIFICATION = element(
    by.css('clr-dropdown-menu a[href="/projects/create/tabular"]')
  );

  let New_Project_Name: string;
  let Serial_Num: string;
  let newProjectPage: NewProjectPage;
  let projectsPage: ProjecstPage;
  let New_CSV_Name: string;
  const CSV_Path = "/doc/upload-resource/text-test-data.csv";

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project Tabular " + Serial_Num;
    LoginBussiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjecstPage();
    New_CSV_Name = "e2e Test Data Text " + Serial_Num;
    console.log("start to create new tabular project : " + New_Project_Name);
  });

  afterAll(() => {
    Constant.project_name_tabular_al = New_Project_Name;
    console.log(
      "project name after update: " + Constant.project_name_tabular_al
    );
  });

  it("Should create new tabular project successfully.", async (done) => {
    await newProjectPage.navigateTo();
    await browser.waitForAngular();
    await newProjectPage.clickNewProjectBtn(PROJECT_TABULAR_CLASSIFICATION);
    await newProjectPage.setProjectName(New_Project_Name);
    await newProjectPage.setTaskInstruction(Task_Instruction);
    if (Constant.dataset_name_text) {
      await newProjectPage.selectExistingFile(Constant.dataset_name_text);
    } else {
      await newProjectPage.uploadCSV(New_CSV_Name, CSV_Path);
      Constant.dataset_name_text = New_CSV_Name;
    }
    await browser.wait(
      ExpectedConditions.visibilityOf(SET_DATA_SECTION),
      Constant.DEFAULT_TIME_OUT
    );
    await newProjectPage.clickWizardNext();
    await FunctionUtil.elementVisibilityOf(newProjectPage.WIZARD_SELECT_BTN);
    await newProjectPage.setDataLable();
    await newProjectPage.clickWizardNext();
    await newProjectPage.selectMultipleTicketColumn(0, 4);
    await newProjectPage.clickWizardNext();
    await newProjectPage.setDataSubmit();
    await browser.wait(
      ExpectedConditions.invisibilityOf(SET_DATA_SECTION),
      Constant.DEFAULT_TIME_OUT
    );
    await newProjectPage.setMaxAnnotation(
      projectCreateData.TabularProject.maxAnnotation
    );
    await newProjectPage.shiftLabelType();
    await newProjectPage.setNewLable(New_Lable);
    await newProjectPage.selectActiveLearningModel(1);
    await newProjectPage.selectQueryStrategy(0);
    await newProjectPage.selectActiveLearningEncoder(0);
    await newProjectPage.selectActiveLearningEncoder(1);
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
        .expect(projectsPage.getCellText(2))
        .toBe(projectCreateData.TabularProject.Source);
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
      done.fail("can not filter out the consistent project....");
    }
  });
});
