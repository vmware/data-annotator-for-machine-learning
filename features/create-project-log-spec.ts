/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { NewProjectPage } from "../page-object/new-project-page";
import { browser, by, element, ExpectedConditions, $, $$ } from "protractor";
import { Constant } from "../general/constant";
import { ProjectsPage } from "../page-object/projects-page";
const projectCreateData = require("../resources/project-create-page/test-data");

describe("Spec - create new project log", () => {
  const Task_Instruction = projectCreateData.LogProject.Instruction;
  const PROJECT_NER_CLASSIFICATION = element(
    by.css('clr-dropdown-menu a[href="/projects/create/log"]')
  );
  const CSV_Path = "/doc/upload-resource/log-test-data.tgz";

  let New_Project_Name: string;
  let New_CSV_Name: string;
  let Serial_Num: string;
  let newProjectPage: NewProjectPage;
  let projectsPage: ProjectsPage;
  let since = require("jasmine2-custom-message");

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project Log " + Serial_Num;
    New_CSV_Name = "e2e Test Data Log" + Serial_Num;
    Constant.project_name_log = New_Project_Name;
    Constant.dataset_name_log = New_CSV_Name;
    LoginBusiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjectsPage();
    console.log("log-start to create log project : " + New_Project_Name);
  });

  afterAll(() => {
    Constant.project_name_log = New_Project_Name;
    Constant.dataset_name_log = New_CSV_Name;
    console.log("log-project name after update: " + Constant.project_name_log);
  });

  it("Should succeed to create project log", async (done) => {
    await newProjectPage.navigateTo();
    await browser.waitForAngular();
    // await newProjectPage.clickNewProjectBtn(PROJECT_NER_CLASSIFICATION);
    // await newProjectPage.uploadCSV(New_CSV_Name, CSV_Path);
    // await newProjectPage.navigateTo();
    // await browser.waitForAngular();
    // await newProjectPage.clickNewProjectBtn(PROJECT_NER_CLASSIFICATION);
    await newProjectPage.setProjectName(New_Project_Name);
    await newProjectPage.selectProjectType(4);
    await newProjectPage.setTaskInstruction(Task_Instruction);
    await newProjectPage.clickNextBtn();
    await newProjectPage.uploadCSVWithModalAndCancel();
    await browser.sleep(1000);
    await newProjectPage.uploadCSVWithModal(New_CSV_Name, CSV_Path);

    // await newProjectPage.selectExistingFile(Constant.dataset_name_log);
    await newProjectPage.isShowFilename();
    await browser.sleep(1000);
    await newProjectPage.clickNextBtn();

    await newProjectPage.setNewLabel(
      projectCreateData.LogProject.Labels.split(",")
    );
    await newProjectPage.clickNextBtn();

    await newProjectPage.setAssignee(Constant.username);
    await newProjectPage.clickNextBtn();

    await newProjectPage.clickCreateBtn();
    // await projectsPage.waitForPageLoading();
    await browser.wait(
      ExpectedConditions.visibilityOf(
        $(".datagrid-host .datagrid-row:nth-child(2)")
      )
    );
    await projectsPage.filterProjectName(New_Project_Name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    let Project_Data_Source = await projectsPage.getCellText(5);
    if (Project_Name_Text !== "" && Project_Count_After_Filter > 0) {
      console.log(
        "log-cell source vs data source:",
        Project_Data_Source,
        "---",
        projectCreateData.LogProject.Source
      );
      since("the project name should same as the user typed name")
        .expect(projectsPage.getCellText(0))
        .toBe(New_Project_Name);
      since("the data source should same as the user uploaded file")
        .expect(Project_Data_Source)
        .toBe(projectCreateData.LogProject.Source);
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
