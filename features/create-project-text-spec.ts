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
  const Task_Instruction = projectCreateData.TextProject.Instruction;
  const CSV_Path = "/doc/upload-resource/text-test-data.csv";
  const New_Lable = projectCreateData.TextProject.Labels.split(",");
  const SET_DATA_SECTION = $("clr-wizard.clr-wizard");
  const PROJECT_TEXT_CLASSIFICATION = element(
    by.css('clr-dropdown-menu a[href="/projects/create/text"]')
  );

  let New_Project_Name: string;
  let New_CSV_Name: string;
  let Serial_Num: string;
  let newProjectPage: NewProjectPage;
  let projectsPage: ProjectsPage;
  let PROMPT = $('span[class="alert-text"]');
  // let REVIEW_DATA_BTN = $$("button")
  //   .filter(function (elem, index) {
  //     return elem.getText().then(function (text) {
  //       return text === "REVIEW DATA";
  //     });
  //   })
  //   .first();

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project Text Al " + Serial_Num;
    New_CSV_Name = "e2e Test Data Text " + Serial_Num;
    LoginBusiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjectsPage();
    console.log("log-start to create new project : " + New_Project_Name);
    Constant.dataset_name_text = New_CSV_Name;
    Constant.project_name_text_al = New_Project_Name;
  });

  afterAll(() => {
    Constant.project_name_text_al = New_Project_Name;
    Constant.dataset_name_text = New_CSV_Name;
    console.log(
      "log-project name after update: " + Constant.project_name_text_al
    );
  });

  it("Should create new project text successfully.", async (done) => {
    await newProjectPage.navigateTo();
    await browser.waitForAngular();
    // await newProjectPage.clickNewProjectBtn(PROJECT_TEXT_CLASSIFICATION);
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
    console.log("log-start to set label that more than 50 labels...");
    await newProjectPage.selectLabels(2);
    await newProjectPage.selectMultipleTicketColumn(0, 1);
    await newProjectPage.clickSureBtn();
    await browser.wait(
      ExpectedConditions.visibilityOf(PROMPT),
      Constant.DEFAULT_TIME_OUT
    );
    console.log("log-succeed to test set label that more than 50 labels...");
    console.log("log-start to set label character that more than 50...");
    // await browser.wait(
    //   ExpectedConditions.visibilityOf(REVIEW_DATA_BTN),
    //   Constant.DEFAULT_TIME_OUT
    // );
    // await REVIEW_DATA_BTN.click();
    // await FunctionUtil.elementVisibilityOf(SET_DATA_SECTION);
    // await newProjectPage.clickWizardNext();
    await newProjectPage.selectLabels(3);
    await newProjectPage.selectMultipleTicketColumn(0, 1);
    await newProjectPage.clickSureBtn();
    await browser.wait(
      ExpectedConditions.visibilityOf(PROMPT),
      Constant.DEFAULT_TIME_OUT
    );
    console.log("log-succeed to set label character that more than 50...");

    console.log("log-start to calculate one whole numeric column");
    await newProjectPage.clickWizardBack();
    await newProjectPage.selectLabels(9);
    await newProjectPage.selectMultipleTicketColumn(0, 1);
    await newProjectPage.clickSureBtn();
    await FunctionUtil.elementVisibilityOf(
      element(by.css('div:nth-child(1) > input[type="number"]'))
    );
    console.log("log-succeed to calculate one whole numeric column");

    console.log("log-start to set label to no label option");
    await newProjectPage.clickWizardBack();
    await newProjectPage.selectLabels(0);
    await newProjectPage.selectMultipleTicketColumn(0, 1);
    await newProjectPage.clickSureBtn();
    await newProjectPage.setNewLabel(New_Lable);
    await newProjectPage.setDuplicateLabel(
      projectCreateData.TextProject.duplicateLabel
    );
    await newProjectPage.deleteLabel(projectCreateData.TextProject.deleteLabel);
    await newProjectPage.clickNextBtn();
    console.log("log-start to setMaxAnnotation");
    await newProjectPage.setMaxAnnotation(
      projectCreateData.TextProject.maxAnnotation - 2
    );
    await newProjectPage.setMaxAnnotation(
      projectCreateData.TextProject.maxAnnotation
    );
    console.log("log-succeed to setMaxAnnotation");
    await newProjectPage.setAssignee(Constant.username, Constant.username2);
    await newProjectPage.setDuplicateAnnotator(Constant.username);
    await newProjectPage.setAssignedTicket(
      projectCreateData.TextProject.assignedTickets
    );
    await newProjectPage.deleteAnnotator();
    await newProjectPage.clickNextBtn();

    await newProjectPage.selectActiveLearningModel(0);
    await newProjectPage.selectQueryStrategy(0);
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
        .toBe(projectCreateData.TextProject.Source);
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
