/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { Constant } from "../general/constant";
import { ProjecstPage } from "../page-object/projects-page";
import { browser, by, element, $, $$ } from "protractor";
const projectCreateData = require("../resources/project-create-page/test-data");
import { CommonPage } from "../general/commom-page";
import { NewProjectPage } from "../page-object/new-project-page";
import { FunctionUtil } from "../utils/function-util";

describe("Enter projects tab...", () => {
  let projectsPage: ProjecstPage;
  let commonPage: CommonPage;
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
    LoginBussiness.verifyLogin();
    projectsPage = new ProjecstPage();
    commonPage = new CommonPage();
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
    console.log("Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await projectsPage.clickGridFirstCell();
      await projectsPage.waitForCategoryChartLoading();
      if (process.env.IN) {
        await browser.sleep(20000);
      }
      console.log("log-finish chart loading and sleeping");
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
    let tableLength = await projectsPage.getTableLength();
    console.log("log-tableLength:::", tableLength);
    if (tableLength > 1) {
      console.log("log-start to show the first row's detail");
      await projectsPage.toExpandCell();
      await newProjectPage.toPreviewTreeLabel();
      console.log("log-start to click btn mark for review");
      await projectsPage.clickMarkForReviewBtn();
      done();
    } else {
      done.fail("the table is empty no data there");
    }
  });

  it("Should jump to community tab and click tree label successful.", async (done) => {
    await FunctionUtil.click($('.header-nav a[href="/datasets"]'));
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(
      Constant.project_name_hierarchical_label
    );
    console.log("log-start to click the hierarchical label in datagrid cell");
    await FunctionUtil.elementVisibilityOf(
      $(
        ".datagrid-host .datagrid-row:nth-child(2) clr-dg-cell:nth-of-type(9) div clr-icon"
      )
    );
    await FunctionUtil.click(
      $(
        ".datagrid-host .datagrid-row:nth-child(2) clr-dg-cell:nth-of-type(9) div"
      )
    );
    console.log("log-tree modal should opened");
    await FunctionUtil.elementVisibilityOf(
      $("app-treeview-modal clr-icon[shape='close']")
    );
    await FunctionUtil.click($("app-treeview-modal clr-icon[shape='close']"));
    console.log("log-succeed to close tree modal");
    done();
  });
});
