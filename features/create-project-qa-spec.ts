/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { NewProjectPage } from "../page-object/new-project-page";
import { browser, by, element, ExpectedConditions, $, $$ } from "protractor";
import { Constant } from "../general/constant";
import { ProjectsPage } from "../page-object/projects-page";
import { FunctionUtil } from "../utils/function-util";
const projectCreateData = require("../resources/project-create-page/test-data");
const since = require("jasmine2-custom-message");

describe("Spec - Create new project ", () => {
  const Task_Instruction = projectCreateData.QAProject.Instruction;
  const CSV_Path = "/doc/upload-resource/text-test-data.csv";

  let New_Project_Name: string;
  let New_CSV_Name: string;
  let Serial_Num: string;
  let newProjectPage: NewProjectPage;
  let projectsPage: ProjectsPage;
  let PROMPT = $('span[class="alert-text"]');

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project qa " + Serial_Num;
    New_CSV_Name = "e2e_Test_Data_Text_" + Serial_Num;
    LoginBusiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjectsPage();
    console.log("log-start to create new project : " + New_Project_Name);
    Constant.project_name_qa = New_Project_Name;
  });

  afterAll(() => {
    Constant.project_name_qa = New_Project_Name;
    console.log("log-project name after update: " + Constant.project_name_qa);
  });

  it("Should create new project text successfully.", async (done) => {
    await newProjectPage.navigateTo();
    await browser.waitForAngular();
    // await newProjectPage.clickNewProjectBtn(PROJECT_TEXT_CLASSIFICATION);
    await newProjectPage.setProjectName(New_Project_Name);
    await newProjectPage.selectProjectType(5);
    await newProjectPage.setTaskInstruction(Task_Instruction);
    await newProjectPage.clickNextBtn();

    if (Constant.dataset_name_text) {
      await newProjectPage.selectExistingFile(Constant.dataset_name_text);
    } else {
      await newProjectPage.uploadCSVWithModal(New_CSV_Name, CSV_Path);
    }
    await browser.sleep(1000);
    await newProjectPage.clickNextBtn();
    await browser.sleep(1000);
    await newProjectPage.selectLabels(2);
    // Select Question Column
    await newProjectPage.selectQuestionLabels(3);

    await newProjectPage.clickSureBtn();
    await browser.sleep(2000);
    await newProjectPage.setAssignee(Constant.username);
    await newProjectPage.clickNextBtn();
    await browser.sleep(1000);
    await newProjectPage.clickCreateBtn();
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
        .toBe(projectCreateData.QAProject.Source);
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
