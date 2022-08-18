/*
Copyright 2019-2021 VMware, Inc.
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
  let projectsPage: ProjecstPage;
  let PROMPT = $('span[class="alert-text"]');
  let REVIEW_DATA_BTN = $$("button")
    .filter(function (elem, index) {
      return elem.getText().then(function (text) {
        return text === "REVIEW DATA";
      });
    })
    .first();

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project Text Al " + Serial_Num;
    New_CSV_Name = "e2e Test Data Text " + Serial_Num;
    LoginBussiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjecstPage();
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

  it("Should create new project successfully.", async (done) => {
    await newProjectPage.navigateTo();
    await browser.waitForAngular();
    await newProjectPage.clickNewProjectBtn(PROJECT_TEXT_CLASSIFICATION);
    await newProjectPage.setProjectName(
      New_Project_Name,
      Constant.project_name_log
    );
    await newProjectPage.setTaskInstruction(Task_Instruction);
    await newProjectPage.uploadCSV(New_CSV_Name, CSV_Path);
    await browser.wait(
      ExpectedConditions.visibilityOf(SET_DATA_SECTION),
      Constant.DEFAULT_TIME_OUT
    );
    await newProjectPage.clickWizardNext();
    await FunctionUtil.elementVisibilityOf(newProjectPage.WIZARD_SELECT_BTN);
    console.log("log-start to set label that more than 50 labels...");
    await newProjectPage.selectLabels(2);
    await newProjectPage.clickWizardNext();
    await newProjectPage.selectMultipleTicketColumn(0, 1);
    await newProjectPage.clickWizardNext();
    await newProjectPage.setDataSubmit();
    await browser.wait(
      ExpectedConditions.visibilityOf(PROMPT),
      Constant.DEFAULT_TIME_OUT
    );
    console.log("log-succeed to test set label that more than 50 labels...");
    await newProjectPage.clickWizardCancel();

    console.log("log-start to set label charactor that more than 50...");
    await browser.wait(
      ExpectedConditions.visibilityOf(REVIEW_DATA_BTN),
      Constant.DEFAULT_TIME_OUT
    );
    await REVIEW_DATA_BTN.click();
    await FunctionUtil.elementVisibilityOf(SET_DATA_SECTION);
    await newProjectPage.clickWizardNext();
    await newProjectPage.selectLabels(3);
    await newProjectPage.clickWizardNext();
    await newProjectPage.selectMultipleTicketColumn(0, 1);
    await newProjectPage.clickWizardNext();
    await newProjectPage.setDataSubmit();
    await browser.wait(
      ExpectedConditions.visibilityOf(PROMPT),
      Constant.DEFAULT_TIME_OUT
    );
    console.log("log-succeed to set label charactor that more than 50...");

    console.log(
      "log-wizard closed and start to reopen to calculate one whole numeric column"
    );
    await browser.wait(
      ExpectedConditions.invisibilityOf(SET_DATA_SECTION),
      Constant.DEFAULT_TIME_OUT
    );
    await browser.wait(
      ExpectedConditions.visibilityOf(REVIEW_DATA_BTN),
      Constant.DEFAULT_TIME_OUT
    );
    await REVIEW_DATA_BTN.click();
    await browser.wait(
      ExpectedConditions.visibilityOf(SET_DATA_SECTION),
      Constant.DEFAULT_TIME_OUT
    );
    await newProjectPage.clickWizardNext();
    await newProjectPage.selectLabels(9);
    await newProjectPage.clickWizardNext();
    await newProjectPage.selectMultipleTicketColumn(0, 1);
    await newProjectPage.clickWizardNext();
    await newProjectPage.setDataSubmit();
    await browser.wait(
      ExpectedConditions.invisibilityOf(SET_DATA_SECTION),
      Constant.DEFAULT_TIME_OUT
    );
    console.log(
      "log-wizard closed and succeed to calculate one whole numeric column"
    );

    // await newProjectPage.setData("text");
    // await newProjectPage.setLabelValidation(
    //   projectCreateData.TextProject.duplicateLabelColumn
    // );
    // await newProjectPage.setLabelValidation(
    //   projectCreateData.TextProject.categoryLabelColumn
    // );
    // await newProjectPage.setDataSubmit();
    // await newProjectPage.setLabelValidation(
    //   projectCreateData.TextProject.labelColumn
    // );
    // await newProjectPage.setDataSubmit();
    console.log("log-start to setMaxAnnotation");
    await newProjectPage.setMaxAnnotation(
      projectCreateData.TextProject.maxAnnotation - 2
    );
    console.log("log-succeed to setMaxAnnotation");

    console.log("log-start to set label to no label option");
    await browser.wait(
      ExpectedConditions.visibilityOf(REVIEW_DATA_BTN),
      Constant.DEFAULT_TIME_OUT
    );
    await REVIEW_DATA_BTN.click();
    await browser.wait(
      ExpectedConditions.visibilityOf(SET_DATA_SECTION),
      Constant.DEFAULT_TIME_OUT
    );
    await newProjectPage.clickWizardNext();
    await newProjectPage.selectLabels(0);
    await newProjectPage.clickWizardNext();
    await newProjectPage.selectMultipleTicketColumn(0, 1);
    await newProjectPage.clickWizardNext();
    await newProjectPage.setDataSubmit();
    await browser.wait(
      ExpectedConditions.invisibilityOf(SET_DATA_SECTION),
      Constant.DEFAULT_TIME_OUT
    );
    await newProjectPage.setNewLable(New_Lable);
    await newProjectPage.setDuplicateLable(
      projectCreateData.TextProject.duplicateLabel
    );
    await newProjectPage.deleteLable(projectCreateData.TextProject.deleteLabel);
    await newProjectPage.selectActiveLearningModel(0);
    await newProjectPage.selectQueryStrategy(0);
    await newProjectPage.setAssignee(Constant.username, Constant.username2);
    await newProjectPage.setDuplicateAnnotator(Constant.username);
    await newProjectPage.setAssignedTicket(
      projectCreateData.TextProject.assignedTickets
    );
    await newProjectPage.deleteAnnotator();
    await newProjectPage.setMaxAnnotation(
      projectCreateData.TextProject.maxAnnotation
    );
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
        .toBe(projectCreateData.TextProject.Source);
      since("the annotar should be the logged user")
        .expect(projectsPage.getAnnotatorCellText())
        .toContain(Constant.username);
      since("the labels should contain the user typed lable")
        .expect(projectsPage.getCellText(5))
        .toContain(New_Lable.join(","));
      since("should have 5 actions")
        .expect(projectsPage.getActionsCount())
        .toBe(5);
      done();
    } else {
      done.fail("can not filter out the consitent project....");
    }
  });
});
