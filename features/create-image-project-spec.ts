/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { NewProjectPage } from "../page-object/new-project-page";
import { browser, ExpectedConditions, $ } from "protractor";
import { Constant } from "../general/constant";
import { ProjectsPage } from "../page-object/projects-page";
const projectCreateData = require("../resources/project-create-page/test-data");

describe("Spec - Create new project", () => {
  const Task_Instruction = projectCreateData.ImageProject.Instruction;
  const CSV_Path = "/doc/upload-resource/image-test-data.zip";

  let New_Project_Name: string;
  let New_CSV_Name: string;
  let Serial_Num: string;
  let newProjectPage: NewProjectPage;
  let projectsPage: ProjectsPage;
  let since = require("jasmine2-custom-message");

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project Image " + Serial_Num;
    New_CSV_Name = "e2e_Test_Data_Image" + Serial_Num;
    Constant.project_name_image = New_Project_Name;
    Constant.dataset_name_image = New_CSV_Name;
    LoginBusiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjectsPage();
    console.log("log-start to create image project : " + New_Project_Name);
  });

  afterAll(() => {
    Constant.project_name_image = New_Project_Name;
    Constant.dataset_name_image = New_CSV_Name;
    console.log(
      "log-project name after update: " + Constant.project_name_image
    );
  });

  it("Should create image project successfully.", async (done) => {
    await newProjectPage.navigateTo();
    await browser.waitForAngular();
    await newProjectPage.setProjectName(New_Project_Name);
    await newProjectPage.selectProjectType(3);
    await newProjectPage.setTaskInstruction(Task_Instruction);
    await newProjectPage.clickNextBtn();
    console.log("log-start to upload csv");
    await newProjectPage.uploadCSVWithModalAndCancel();
    await browser.sleep(1000);
    await newProjectPage.uploadCSVWithModal(New_CSV_Name, CSV_Path);
    console.log("log-end to upload csv");
    await newProjectPage.imageLoaded();
    await browser.sleep(5000);
    await newProjectPage.selectExistingFile(Constant.dataset_name_image);
    await browser.sleep(2000);
    await newProjectPage.clickNextBtn();
    await newProjectPage.setNewLabel(
      projectCreateData.ImageProject.Labels.split(",")
    );
    await newProjectPage.clickNextBtn();
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
        .expect(projectsPage.getCellText(5))
        .toBe(projectCreateData.ImageProject.Source);
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
