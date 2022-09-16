/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { Constant } from "../general/constant";
import { ProjecstPage } from "../page-object/projects-page";
import { browser } from "protractor";
const projectEditData = require("../resources/project-edit-page/test-data");
import { CommonPage } from "../general/commom-page";

describe("Enter projects tab...", () => {
  let projectsPage: ProjecstPage;
  let commonPage: CommonPage;
  let project_name: string;

  beforeAll(() => {
    LoginBussiness.verifyLogin();
    projectsPage = new ProjecstPage();
    commonPage = new CommonPage();
  });

  it("Should change the page value successfully.", async (done) => {
    await projectsPage.navigateTo();
    await projectsPage.waitForPageLoading();
    await commonPage.changePageValue(1);
    done();
  });

  it("Should preview log project, filter file name and return successfully.", async (done) => {
    project_name = Constant.project_name_log;
    await projectsPage.navigateTo();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log(
      "log-Project_Count_After_Filter:::",
      Project_Count_After_Filter
    );
    console.log("log-Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await projectsPage.clickGridFirstCell();
      await projectsPage.waitForLoading();
      await browser.sleep(1000);
      await projectsPage.filterLogFileName(
        projectEditData.LogProject.Filter_File_Name
      );
      let tableLengthBeforeReturn = await projectsPage.getTableLength();
      console.log("log-tableLengthBeforeReturn", tableLengthBeforeReturn);
      let aa = (await projectsPage.getTableTotalItems()).trim().split(" ")[4];
      console.log("log-table total items", aa);
      await projectsPage.logShowDetails();
      await projectsPage.returnToAnnotatorBtn();
      await browser.sleep(1000);
      await projectsPage.toExpandCell();
    } else {
      done.fail("log-can not filter out the consistent project....");
    }
    done();
  });
});
