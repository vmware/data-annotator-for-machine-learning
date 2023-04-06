/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { NewProjectPage } from "../page-object/new-project-page";
import { browser, ExpectedConditions, $ } from "protractor";
import { Constant } from "../general/constant";
import { ProjectsPage } from "../page-object/projects-page";
import { FunctionUtil } from "../utils/function-util";

const projectCreateData = require("../resources/project-create-page/test-data");
const since = require("jasmine2-custom-message");

describe("Spec - create new project", () => {
  const Task_Instruction = projectCreateData.TabularProject.Instruction;
  const New_Labels = projectCreateData.TabularProject.Labels.split(",");

  let New_Project_Name: string;
  let Serial_Num: string;
  let newProjectPage: NewProjectPage;
  let projectsPage: ProjectsPage;
  let New_CSV_Name: string;
  const CSV_Path = "/doc/upload-resource/text-test-data.csv";

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project Tabular " + Serial_Num;
    LoginBusiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjectsPage();
    New_CSV_Name = "e2e Test Data Text " + Serial_Num;
    console.log(
      "log-start to create new tabular project : " + New_Project_Name
    );
  });

  afterAll(() => {
    Constant.project_name_tabular_al = New_Project_Name;
    console.log(
      "log-project name after update: " + Constant.project_name_tabular_al
    );
  });

  it("Should create new tabular project successfully.", async (done) => {
    await newProjectPage.navigateTo();
    await browser.waitForAngular();
    await newProjectPage.setProjectName(New_Project_Name);
    await newProjectPage.selectProjectType(1);
    await newProjectPage.setTaskInstruction(Task_Instruction);
    await newProjectPage.clickNextBtn();
    await newProjectPage.uploadCSVWithModalAndCancel();
    await browser.sleep(1000);
    if (Constant.dataset_name_text) {
      await newProjectPage.selectExistingFile(Constant.dataset_name_text);
    } else {
      await newProjectPage.uploadCSVWithModal(New_CSV_Name, CSV_Path);
      Constant.dataset_name_text = New_CSV_Name;
    }
    await browser.sleep(1000);
    await newProjectPage.clickNextBtn();

    await FunctionUtil.elementVisibilityOf(newProjectPage.LABEL_SELECTOR);
    // to select the no_label option
    await newProjectPage.selectLabels(0);
    await newProjectPage.selectMultipleTicketColumn(0, 4);
    await newProjectPage.clickSureBtn();

    await newProjectPage.shiftLabelType();
    await newProjectPage.setMultiLabels(New_Labels);
    await newProjectPage.clickNextBtn();
    await browser.sleep(1000);
    await newProjectPage.setMaxAnnotation(
      projectCreateData.TabularProject.maxAnnotation
    );
    await newProjectPage.setAssignee(Constant.username);
    await newProjectPage.clickNextBtn();
    await browser.sleep(1000);
    await newProjectPage.selectActiveLearningModel(1);
    await newProjectPage.selectQueryStrategy(0);
    await newProjectPage.selectActiveLearningEncoder(0);
    await newProjectPage.selectActiveLearningEncoder(1);
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
        .expect(projectsPage.getCellText(5))
        .toBe(projectCreateData.TabularProject.Source);
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
