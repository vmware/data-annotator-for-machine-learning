/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBusiness } from "../general/login-business";
import { Constant } from "../general/constant";
import { ProjectsPage } from "../page-object/projects-page";
import { browser, by, element, $, $$ } from "protractor";
const projectCreateData = require("../resources/project-create-page/test-data");
import { CommonPage } from "../general/common-page";

describe("Spec - to preview text al project", () => {
  let projectsPage: ProjectsPage;
  let commonPage: CommonPage;
  let since = require("jasmine2-custom-message");
  let project_name: string;
  let USER_CHART_FIRST_RECT = $$(".userChartBar g.bars rect");
  let USER_CHART_FIRST_TICK = $(".userChartBar svg g.x-axis g.tick text");
  let CATEGORY_CHART_FIRST_RECT = element.all(
    by.css(".categoryChartBar g.bars rect")
  );
  let CATEGORY_CHART_FIRST_TICK = element(
    by.css(".categoryChartBar g.x-axis g.tick text")
  );

  beforeAll(() => {
    LoginBusiness.verifyLogin();
    projectsPage = new ProjectsPage();
    commonPage = new CommonPage();
  });

  it("Should preview text al project, user and category charts should display correctly.", async (done) => {
    // project_name = Constant.project_name_text_al;
    // await projectsPage.navigateTo();
    // console.log("log-filter project: projectsPage.navigateTo", project_name);
    // await projectsPage.waitForGridLoading();
    // console.log(
    //   "log-filter project: projectsPage.waitForGridLoading",
    //   project_name
    // );
    // await projectsPage.filterProjectName(project_name);
    // console.log("log-filter project: projectsPage.filterProjectName", project_name);
    // let Project_Count_After_Filter = await projectsPage.getTableLength();
    // console.log("log-Project_Count_After_Filter:::", Project_Count_After_Filter);
    // let Project_Name_Text = await projectsPage.getCellText(0);
    // console.log("log-Project_Name_Text:::", Project_Name_Text);
    // if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
    // await commonPage.toShowMoreAnnotators();
    // since("hidden annotators should show up with hide icon")
    //   .expect(commonPage.HIDE_ICON.getText())
    //   .toEqual("hide");
    // await projectsPage.clickGridFirstCell();

    await projectsPage.clickProjectPreviewTabs(2);

    await projectsPage.waitForUserChartLoading();
    since("user chart rect should show up and have height")
      .expect(projectsPage.getChartRectHeight(USER_CHART_FIRST_RECT))
      .toBeGreaterThan(0);
    since("user chart tick should show up and have full name correct")
      .expect(projectsPage.getChartTickText(USER_CHART_FIRST_TICK))
      .toContain(Constant.fullname);
    // to double click user bar
    console.log("log-start to double click user bar to zoom");
    await browser.actions().doubleClick(USER_CHART_FIRST_RECT.get(0)).perform();
    await element(
      by.css("div.floatRight.btn-sm > div:nth-child(2) > label")
    ).click();
    await projectsPage.waitForCategoryChartLoading();
    if (process.env.IN) {
      await browser.sleep(20000);
    }
    console.log("log-finish chart loading and sleeping");
    await browser.sleep(5000);
    since("category chart rect should show up and have height")
      .expect(projectsPage.getChartRectHeight(CATEGORY_CHART_FIRST_RECT))
      .toBeGreaterThan(0);
    since("category chart tick should show up and have label correct")
      .expect(projectCreateData.TextProject.Labels.split(","))
      .toContain(projectsPage.getChartTickText(CATEGORY_CHART_FIRST_TICK));
    // to double click category bar
    console.log("log-start to double click category bar to zoom");
    try {
      await browser
        .actions()
        .doubleClick(CATEGORY_CHART_FIRST_RECT.get(0))
        .perform();
    } catch {
      await browser
        .actions()
        .doubleClick(CATEGORY_CHART_FIRST_RECT.get(0))
        .perform();
    }

    done();
    // } else {
    //   done.fail("can not filter out the consistent project....");
    // }
  });

  it("Should preview text al project, delete and silence single flagged ticket successfully.", async (done) => {
    await projectsPage.clickProjectPreviewTabs(1);
    await browser.sleep(5000);
    await projectsPage.navigateToFlagTab();
    await projectsPage.waitForGridLoading();
    let tableLength = await projectsPage.getTableLength();
    const originalTableTotalItem = Number(
      (await projectsPage.getTableTotalItems()).trim().split(" ")[4]
    );
    console.log("log-tableLength:::", tableLength);
    console.log("log-originalTableTotalItem:::", originalTableTotalItem);
    if (tableLength > 1) {
      console.log("log-start to delete flagged ticket");
      await projectsPage.clickDeleteTicketBtn();
      await projectsPage.waitForGridLoading();
      if (process.env.IN) {
        await browser.sleep(10000);
      }
      since("table total items should reduce 1")
        .expect(
          Number((await projectsPage.getTableTotalItems()).trim().split(" ")[4])
        )
        .toEqual(originalTableTotalItem - 1);
      console.log("log-delete flagged ticket successfully");

      console.log("log-start to silence flagged ticket");
      await projectsPage.clickSilenceTicketBtn();
      await projectsPage.waitForGridLoading();
      if (process.env.IN) {
        await browser.sleep(10000);
      }
      since("table total items should reduce 1")
        .expect(
          Number((await projectsPage.getTableTotalItems()).trim().split(" ")[4])
        )
        .toEqual(originalTableTotalItem - 2);
      console.log("log-silence flagged ticket successfully");

      done();
    } else {
      done.fail("the flagged tickets here no more than 2....");
    }
  });
});
