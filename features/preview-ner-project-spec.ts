/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { Constant } from "../general/constant";
import { ProjectsPage } from "../page-object/projects-page";
import { browser } from "protractor";
import { CommonPage } from "../general/common-page";

describe("Spec - enter projects tab...", () => {
  let projectsPage: ProjectsPage;
  let commonPage: CommonPage;
  let project_name: string;

  beforeAll(() => {
    LoginBusiness.verifyLogin();
    projectsPage = new ProjectsPage();
    commonPage = new CommonPage();
  });

  it("Should change the page value successfully.", async (done) => {
    await projectsPage.navigateTo();
    await projectsPage.waitForPageLoading();
    await commonPage.changePageValue(1);
    done();
  });

  it("Should preview ner project, expand cell successfully.", async (done) => {
    project_name = Constant.project_name_ner;
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
      await projectsPage.waitForGridLoading();
      await browser.sleep(2000);
      await projectsPage.clickProjectPreviewTabs(1);
      await projectsPage.waitForGridLoading();
      await browser.sleep(5000);
      await projectsPage.toExpandCell();
    } else {
      done.fail("can not filter out the consistent project....");
    }
    done();
  });
});
