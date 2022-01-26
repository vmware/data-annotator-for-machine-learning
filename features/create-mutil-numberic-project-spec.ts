import { LoginBussiness } from "../general/login-bussiness";
import { NewProjectPage } from "../page-object/new-project-page";
import { browser, by, element, ExpectedConditions, $, $$ } from "protractor";
import { Constant } from "../general/constant";
import { ProjecstPage } from "../page-object/projects-page";
import { EditPage } from "../page-object/edit-page";
const projectCreateData = require("../resources/project-create-page/test-data");

describe("Create new project ", () => {
  const Task_Instruction = projectCreateData.TextMutilNumbericProject.Instruction;
  const CSV_Path = "/doc/upload-resource/text-mutilNumberic-data.csv";
  const New_Lable = projectCreateData.TextMutilNumbericProject.Label;
  const MinVal = projectCreateData.TextMutilNumbericProject.MinVal;
  const MaxVal = projectCreateData.TextMutilNumbericProject.MaxVal;
  const SET_DATA_SECTION = $('ul[role="tablist"] .nav-item:last-child');
  const PROJECT_TEXT_CLASSIFICATION = element(
    by.css('clr-dropdown-menu a[href="/projects/create/text"]')
  );

  let New_Project_Name: string;
  let New_CSV_Name: string;
  let Serial_Num: string;
  let newProjectPage: NewProjectPage;
  let projectsPage: ProjecstPage;
  let since = require("jasmine2-custom-message");

  beforeAll(() => {
    Serial_Num = new Date().getTime().toString();
    New_Project_Name = "e2e Test Project Mutil Numberic " + Serial_Num;
    New_CSV_Name = "e2e Test Data Mutil Numberic " + Serial_Num;
    LoginBussiness.verifyLogin();
    newProjectPage = new NewProjectPage();
    projectsPage = new ProjecstPage();
    console.log("start to create new project : " + New_Project_Name);
    Constant.dataset_name_text = New_CSV_Name;
    Constant.project_name_numberic_mutiple = New_Project_Name;
  });

  afterAll(() => {
    Constant.project_name_numberic_mutiple = New_Project_Name;
    Constant.dataset_name_text = New_CSV_Name;
    console.log("project name after update: " + Constant.project_name_numberic_mutiple);
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

    await newProjectPage.setData("text");
    await newProjectPage.setLabelValidation(
      projectCreateData.TextMutilNumbericProject.duplicateLabelColumn
    );
    await newProjectPage.setLabelValidation(
      projectCreateData.TextMutilNumbericProject.categoryLabelColumn
    );
    await newProjectPage.setDataSubmit();
    await newProjectPage.setLabelValidation(
      projectCreateData.TextMutilNumbericProject.labelColumn
    );
    await newProjectPage.setDataSubmit();
    await newProjectPage.setMaxAnnotation(
      projectCreateData.TextMutilNumbericProject.maxAnnotation - 2
    );

    await newProjectPage.addMutilNumericLabel(New_Lable, MinVal, MaxVal);
    await newProjectPage.delMutilNumericLabel();

    console.log('start1 to setAssignee annotator');
    await newProjectPage.setAssignee(
      Constant.username,
      Constant.username2
    );
    console.log('succeed1 to setAssignee annotator');
    await newProjectPage.setDuplicateAnnotator(
      Constant.username
    );
    await newProjectPage.setAssignedTicket(
      projectCreateData.TextMutilNumbericProject.assignedTickets
    );
    await newProjectPage.deleteAnnotator();
    await newProjectPage.setMaxAnnotation(
      projectCreateData.TextMutilNumbericProject.maxAnnotation
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
        .toBe(projectCreateData.TextMutilNumbericProject.Source);
      since("the annotar should be the logged user")
        .expect(projectsPage.getAnnotatorCellText())
        .toContain(Constant.username);
      since("should have 4 actions")
        .expect(projectsPage.getActionsCount())
        .toBe(5);
      done();
    } else {
      done.fail("can not filter out the consitent project....");
    }
  });
});
