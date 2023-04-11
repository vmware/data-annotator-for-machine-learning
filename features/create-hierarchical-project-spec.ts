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
import { CommonPage } from "../general/common-page";
const projectCreateData = require("../resources/project-create-page/test-data");
const since = require("jasmine2-custom-message");

describe("Spec - create new project ", () => {
  const Task_Instruction = projectCreateData.HierarchicalProject.Instruction;
  const CSV_Path = "/doc/upload-resource/text-test-data.csv";
  const LABEL_Path = "/doc/upload-resource/taxonomy_sample.json";
  const LABEL_Path1 =
    "/doc/upload-resource/taxonomy_sample_same_child_err.json";
  const LABEL_Path2 = "/doc/upload-resource/taxonomy_sample_comma_err.yaml";

  let New_Project_Name: string;
  let New_CSV_Name: string;
  let Serial_Num: string;
  let newProjectPage: NewProjectPage;
  let projectsPage: ProjectsPage;
  let commonPage: CommonPage;

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project Hierarchical " + Serial_Num;
    New_CSV_Name = "e2e Test Data Hierarchical " + Serial_Num;
    LoginBusiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjectsPage();
    commonPage = new CommonPage();
    console.log(
      "log-start to create new hierarchical project : " + New_Project_Name
    );
  });

  afterAll(() => {
    Constant.project_name_hierarchical_label = New_Project_Name;
    console.log(
      "log-hierarchical-project name after update: " +
        Constant.project_name_hierarchical_label
    );
  });

  it("Should create new project successfully.", async (done) => {
    await newProjectPage.navigateTo();
    await browser.waitForAngular();
    await newProjectPage.setProjectName(New_Project_Name);
    await newProjectPage.setTaskInstruction(Task_Instruction);
    await newProjectPage.clickNextBtn();
    if (Constant.dataset_name_text) {
      await newProjectPage.selectExistingFile(Constant.dataset_name_text);
    } else {
      await newProjectPage.uploadCSVWithModal(New_CSV_Name, CSV_Path);
    }
    await browser.sleep(1000);
    await newProjectPage.clickNextBtn();
    await FunctionUtil.elementVisibilityOf(newProjectPage.LABEL_SELECTOR);
    // to select the no_label option
    await newProjectPage.selectLabels(0);
    await newProjectPage.selectMultipleTicketColumn(2, 4);
    await newProjectPage.clickSureBtn();
    // select label type
    await FunctionUtil.elementVisibilityOf(newProjectPage.UPLOAD_TAXONOMY_BTN);
    await newProjectPage.UPLOAD_TAXONOMY_BTN.click();
    console.log("log-start to upload taxonomy file");
    await browser.sleep(1000);
    await newProjectPage.uploadTaxonomyFile(LABEL_Path1);
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(newProjectPage.TAXONOMY_FILE_ERROR);
    await newProjectPage.cancelTaxonomyFile();
    // start to upload label file, with comma err
    await newProjectPage.uploadTaxonomyFile(LABEL_Path2);
    await newProjectPage.cancelTaxonomyFile();
    await newProjectPage.changeJsonToYaml();
    await newProjectPage.uploadTaxonomyFile(LABEL_Path2);
    await newProjectPage.cancelTaxonomyFile();
    await newProjectPage.changeYamlToJSON();
    // start to upload label file, with csv format
    await newProjectPage.uploadTaxonomyFile(CSV_Path);
    await newProjectPage.cancelTaxonomyFile();
    // start to upload label file correctly
    await newProjectPage.uploadTaxonomyFile(LABEL_Path);
    console.log("log-succeed to upload taxonomy file");
    await newProjectPage.toPreviewTreeLabel();
    await newProjectPage.clickNextBtn();
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
        .expect(Project_Name_Text)
        .toBe(New_Project_Name);
      since("the data source should same as the user uploaded file")
        .expect(await projectsPage.getCellText(5))
        .toBe(projectCreateData.HierarchicalProject.Source);
      await commonPage.toShowTableColumns();
      await browser.sleep(1000);
      await FunctionUtil.click(commonPage.VIEW_LIST_ICON);
      await browser.sleep(1000);
      await FunctionUtil.click(commonPage.CLOSE_BTN);
      await done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });
});
