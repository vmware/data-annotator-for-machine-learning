/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { NewProjectPage } from "../page-object/new-project-page";
import { browser, by, element, ExpectedConditions, $ } from "protractor";
import { Constant } from "../general/constant";
import { ProjecstPage } from "../page-object/projects-page";
import { FunctionUtil } from "../utils/function-util";
import { DownloadSharePage } from "../page-object/download-share-page";
const projectCreateData = require("../resources/project-create-page/test-data");
const since = require("jasmine2-custom-message");

describe("Create new project ", () => {
  const Task_Instruction = projectCreateData.HierarchicalProject.Instruction;
  const CSV_Path = "/doc/upload-resource/text-test-data.csv";
  const LABEL_Path = "/doc/upload-resource/taxonomy_sample.json";
  const LABEL_Path1 = "/doc/upload-resource/taxonomy_sample_samechilderr.json";
  const LABEL_Path2 = "/doc/upload-resource/taxonomy_sample_commaerr.yaml";
  const SET_DATA_SECTION = $("clr-wizard.clr-wizard");
  const PROJECT_TEXT_CLASSIFICATION = element(
    by.css('clr-dropdown-menu a[href="/projects/create/text"]')
  );
  const downloadSharePage: DownloadSharePage = new DownloadSharePage();

  let New_Project_Name: string;
  let New_CSV_Name: string;
  let Serial_Num: string;
  let newProjectPage: NewProjectPage;
  let projectsPage: ProjecstPage;

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project Hierarchical " + Serial_Num;
    New_CSV_Name = "e2e Test Data Hierarchical " + Serial_Num;
    LoginBussiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjecstPage();
    console.log("log-start to create new project : " + New_Project_Name);
  });

  afterAll(() => {
    Constant.project_name_hierarchical_label = New_Project_Name;
    console.log(
      "hierarchical-project name after update: " +
        Constant.project_name_hierarchical_label
    );
  });

  it("Should create new project successfully.", async (done) => {
    await newProjectPage.navigateTo();
    await browser.waitForAngular();
    await newProjectPage.clickNewProjectBtn(PROJECT_TEXT_CLASSIFICATION);
    await newProjectPage.setProjectName(New_Project_Name);
    await newProjectPage.setTaskInstruction(Task_Instruction);
    if (Constant.dataset_name_text) {
      await newProjectPage.selectExistingFile(Constant.dataset_name_text);
    } else {
      await newProjectPage.uploadCSV(New_CSV_Name, CSV_Path);
    }
    await browser.wait(
      ExpectedConditions.visibilityOf(SET_DATA_SECTION),
      Constant.DEFAULT_TIME_OUT
    );
    await newProjectPage.clickWizardNext();
    await FunctionUtil.elementVisibilityOf(newProjectPage.WIZARD_SELECT_BTN);
    // to select the no_label option
    await newProjectPage.setDataLable();
    await newProjectPage.clickWizardNext();
    await newProjectPage.selectMultipleTicketColumn(0, 1);
    await newProjectPage.clickWizardNext();
    await newProjectPage.setDataSubmit();
    await browser.wait(
      ExpectedConditions.invisibilityOf(SET_DATA_SECTION),
      Constant.DEFAULT_TIME_OUT
    );
    await newProjectPage.setMaxAnnotation(
      projectCreateData.HierarchicalProject.maxAnnotation
    );
    // start to upload label file, with same child err
    await newProjectPage.uploadTaxonomyFile(LABEL_Path1);
    await newProjectPage.clickOkBtn();
    await newProjectPage.clickCancelBtn();
    // start to upload label file, with comma err
    await newProjectPage.uploadTaxonomyFile(LABEL_Path2);
    await newProjectPage.clickOkBtn();
    await newProjectPage.clickCancelBtn();
    // start to upload label file, with csv format
    await newProjectPage.uploadTaxonomyFile(CSV_Path);
    await newProjectPage.clickOkBtn();
    await newProjectPage.clickCancelBtn();
    // start to upload label file correctly
    await newProjectPage.uploadTaxonomyFile(LABEL_Path);
    await newProjectPage.changeJsonYamlFormat();
    await newProjectPage.clickOkBtn();
    await newProjectPage.toPreviewTreeLabel();

    console.log("log-start to setAssignee annotator");
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
        .expect(await projectsPage.getCellText(0))
        .toBe(New_Project_Name);
      since("the data source should same as the user uploaded file")
        .expect(await projectsPage.getCellText(2))
        .toBe(projectCreateData.HierarchicalProject.Source);
      since("the annotator should be the logged user")
        .expect(await projectsPage.getAnnotatorCellText())
        .toContain(Constant.username);
      since("should have 5 actions")
        .expect(await projectsPage.getActionsCount())
        .toBe(5);
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });

  it("Should share hierarchical project successful.", async (done) => {
    await downloadSharePage.shareProject(New_Project_Name);
    if (process.env.IN) {
      expect(downloadSharePage.verifySharedStatus()).toEqual("folder");
    } else {
      expect(downloadSharePage.verifySharedStatus()).toEqual("folder-open");
    }
    done();
  });
});
