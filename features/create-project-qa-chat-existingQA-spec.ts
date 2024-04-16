/*
Copyright 2019-2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { NewProjectPage } from "../page-object/new-project-page";
import { browser, ExpectedConditions, $ } from "protractor";
import { Constant } from "../general/constant";
import { ProjectsPage } from "../page-object/projects-page";
const projectCreateData = require("../resources/project-create-page/test-data");
const since = require("jasmine2-custom-message");

describe("Spec - Create new project qa chat with existingQA", () => {
  const Task_Instruction = projectCreateData.QAChatProject.Instruction;
  const CSV_Path = "/doc/upload-resource/qa-chat-existingqa.csv";

  let New_Project_Name: string;
  let New_CSV_Name: string;
  let Serial_Num: string;
  let newProjectPage: NewProjectPage;
  let projectsPage: ProjectsPage;

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project qa chat existingQA" + Serial_Num;
    New_CSV_Name = "e2e_Test_Data_QaChat_" + Serial_Num;
    LoginBusiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjectsPage();
    console.log(
      "log-start to create new project qa chat with existingQA: " +
        New_Project_Name
    );
    Constant.project_name_qa_chat_existingQA = New_Project_Name;
    Constant.dataset_name_qa_chat_existingQA = New_CSV_Name;
  });

  afterAll(() => {
    Constant.project_name_qa_chat_existingQA = New_Project_Name;
    Constant.dataset_name_qa_chat_existingQA = New_CSV_Name;
    console.log(
      "log-project name after update: " +
        Constant.project_name_qa_chat_existingQA
    );
  });

  it("Should create new project qa chat with existingQA successfully.", async (done) => {
    await newProjectPage.navigateTo();
    await browser.waitForAngular();
    await newProjectPage.setProjectName(New_Project_Name);
    await newProjectPage.selectProjectType(6);
    await newProjectPage.setTaskInstruction(Task_Instruction);
    await newProjectPage.hasExistingQA();
    await newProjectPage.clickNextBtn();
    await browser.sleep(2000);
    await newProjectPage.uploadCSVWithModal(New_CSV_Name, CSV_Path);
    await browser.sleep(1000);
    await newProjectPage.clickNextBtn();
    await newProjectPage.selectQuestionLabels(0);
    await browser.sleep(1000);
    await newProjectPage.clickSureBtn();
    await newProjectPage.setAssigneeForQaChat(Constant.username);
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
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
