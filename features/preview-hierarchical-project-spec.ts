/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { Constant } from "../general/constant";
import { ProjectsPage } from "../page-object/projects-page";
import { browser, by, element, $ } from "protractor";
const projectCreateData = require("../resources/project-create-page/test-data");
import { NewProjectPage } from "../page-object/new-project-page";
import { FunctionUtil } from "../utils/function-util";

describe("Spec - Enter projects tab...", () => {
  let projectsPage: ProjectsPage;
  let newProjectPage: NewProjectPage;
  let since = require("jasmine2-custom-message");
  let project_name: string;
  let CATEGORY_CHART_FIRST_RECT = element.all(
    by.css(".categoryChartBar g.bars rect")
  );
  let CATEGORY_CHART_FIRST_TICK = element(
    by.css(".categoryChartBar g.x-axis g.tick text")
  );

  beforeAll(() => {
    LoginBusiness.verifyLogin();
    projectsPage = new ProjectsPage();
    newProjectPage = new NewProjectPage();
  });

  it("Should preview hierarchical project successfully", async (done) => {
    project_name = Constant.project_name_hierarchical_label;
    await projectsPage.navigateTo();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(project_name);
    console.log("log-filter project:", project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    console.log(
      "log-Project_Count_After_Filter:::",
      Project_Count_After_Filter
    );
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log("log-Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await projectsPage.clickGridFirstCell();
      await projectsPage.waitForLoading();
      if (process.env.IN) {
        await browser.sleep(20000);
      }
      await browser.sleep(1000);
      await projectsPage.clickProjectPreviewTabs(2);
      console.log("log-finish chart loading and sleeping");
      await projectsPage.clickCategoryBtn();
      await browser.sleep(1000);
      since("category chart rect should show up and have height")
        .expect(
          await projectsPage.getChartRectHeight(CATEGORY_CHART_FIRST_RECT)
        )
        .toBeGreaterThan(0);
      since("category chart tick should show up and correct")
        .expect(await projectCreateData.HierarchicalProject.Label.split(","))
        .toContain(
          await projectsPage.getChartTickText(CATEGORY_CHART_FIRST_TICK)
        );
      // to click bar
      console.log("log-start to click bar");
      await CATEGORY_CHART_FIRST_RECT.first().click();
      await browser.sleep(2000);
      since("category chart children rects should show up and have height")
        .expect(
          await projectsPage.getChartRectHeight(CATEGORY_CHART_FIRST_RECT)
        )
        .toBeGreaterThan(0);
      since(
        "category chart children tick should show up and have label correct"
      )
        .expect(
          await projectCreateData.HierarchicalProject.childLabels.split(",")
        )
        .toContain(
          await projectsPage.getChartTickText(CATEGORY_CHART_FIRST_TICK)
        );
      // to double click bar
      console.log("log-start to double click bar to zoom");
      await browser
        .actions()
        .doubleClick(CATEGORY_CHART_FIRST_RECT.last())
        .perform();
      // to click empty to back to the father label
      await FunctionUtil.mouseMoveToClick(
        $(".categoryChartBar svg"),
        projectCreateData.HierarchicalProject.backPosition
      );
      since("category chart tick should back and show up correctly")
        .expect(await projectCreateData.HierarchicalProject.Label.split(","))
        .toContain(
          await projectsPage.getChartTickText(CATEGORY_CHART_FIRST_TICK)
        );
      done();
    } else {
      done.fail("can not filter out the consistent project....");
    }
  });

  it("Should preview hierarchical project's latest data and mark for review successful", async (done) => {
    await projectsPage.clickProjectPreviewTabs(1);
    await projectsPage.waitForGridLoading();
    await browser.sleep(5000);
    let tableLength = await projectsPage.getAnnotationTableLength();
    console.log("log-tableLength:::", tableLength);
    if (tableLength > 1) {
      console.log("log-start to show the first row's detail");
      await projectsPage.toExpandCell();
      await projectsPage.toPreviewTreeLabel();
      console.log("log-start to click btn mark for review");
      await projectsPage.clickMarkForReviewBtn();
      done();
    } else {
      done.fail("the table is empty no data there");
    }
  });
});
