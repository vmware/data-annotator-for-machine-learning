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

describe("Spec - Create new project", () => {
  const Task_Instruction =
    projectCreateData.TextMultiNumericProject.Instruction;
  const CSV_Path = "/doc/upload-resource/text-multiNumeric-data.csv";
  const New_Label = projectCreateData.TextMultiNumericProject.Label;
  const MinVal = projectCreateData.TextMultiNumericProject.MinVal;
  const MaxVal = projectCreateData.TextMultiNumericProject.MaxVal;

  let New_Project_Name: string;
  let New_CSV_Name: string;
  let Serial_Num: string;
  let newProjectPage: NewProjectPage;
  let projectsPage: ProjectsPage;

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project Multi Numeric " + Serial_Num;
    New_CSV_Name = "e2e_Test_Data_Multi_Numeric_" + Serial_Num;
    LoginBusiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjectsPage();
    console.log("log-start to create new project : " + New_Project_Name);
    if (!Constant.dataset_name_text) {
      Constant.dataset_name_text = New_CSV_Name;
    }

    Constant.project_name_numeric_multiple = New_Project_Name;
  });

  afterAll(() => {
    Constant.project_name_numeric_multiple = New_Project_Name;
    if (!Constant.dataset_name_text) {
      Constant.dataset_name_text = New_CSV_Name;
    }
    console.log(
      "log-project name after update: " + Constant.project_name_numeric_multiple
    );
  });

  it("Should create new project successfully.", async (done) => {
    await newProjectPage.navigateTo();
    await browser.waitForAngular();
    await newProjectPage.setProjectName(
      New_Project_Name,
      Constant.project_name_log
    );
    await newProjectPage.setTaskInstruction(Task_Instruction);
    await newProjectPage.clickNextBtn();
    await newProjectPage.uploadCSVWithModal(New_CSV_Name, CSV_Path);
    await browser.sleep(1000);
    await newProjectPage.clickNextBtn();
    await FunctionUtil.elementVisibilityOf(newProjectPage.LABEL_SELECTOR);
    // to select the no_label option
    await newProjectPage.selectLabels(0);
    await newProjectPage.selectMultipleTicketColumn(0, 3);
    await newProjectPage.clickSureBtn();

    await FunctionUtil.elementVisibilityOf(newProjectPage.MULTI_LABEL_INPUT);
    await newProjectPage.MULTI_LABEL_INPUT.click();
    // start to add labels
    await browser.sleep(1000);
    await newProjectPage.addMultiNumericLabel(New_Label, MinVal, MaxVal);
    await newProjectPage.delMultiNumericLabel();
    await newProjectPage.clickNextBtn();
    await newProjectPage.setMaxAnnotation(
      projectCreateData.TextMultiNumericProject.maxAnnotation - 2
    );

    console.log("log-start1 to setAssignee annotator");
    await newProjectPage.setAssignee(Constant.username, Constant.username2);
    console.log("log-succeed1 to setAssignee annotator");
    await newProjectPage.setDuplicateAnnotator(Constant.username);
    await newProjectPage.setAssignedTicket(
      projectCreateData.TextMultiNumericProject.assignedTickets
    );
    await newProjectPage.deleteAnnotator();
    await newProjectPage.setMaxAnnotation(
      projectCreateData.TextMultiNumericProject.maxAnnotation
    );
    await browser.sleep(1000);
    await newProjectPage.setMaxAnnotation(1);
    await newProjectPage.clickNextBtn();
    await browser.sleep(1000);
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
        .toBe(projectCreateData.TextMultiNumericProject.Source);
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
