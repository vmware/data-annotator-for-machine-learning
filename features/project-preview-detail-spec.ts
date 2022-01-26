/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { Constant } from "../general/constant";
import { ProjecstPage } from "../page-object/projects-page";
import { browser, by, element, $, $$ } from "protractor";
const projectCreateData = require("../resources/project-create-page/test-data");
const projectEditData = require("../resources/project-edit-page/test-data");
import { CommonPage } from "../general/commom-page";

describe("Enter projects tab...", () => {
  let projectsPage: ProjecstPage;
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

  it("Should preview text al project, user and category charts should display normally.", async (done) => {
    project_name = Constant.project_name_text_al;
    await projectsPage.navigateTo();
    console.log("filter project: projectsPage.navigateTo", project_name);
    await projectsPage.waitForGridLoading();
    console.log("filter project: projectsPage.waitForGridLoading", project_name);
    await projectsPage.filterProjectName(project_name);
    console.log("filter project: projectsPage.filterProjectName", project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    console.log("Project_Count_After_Filter:::", Project_Count_After_Filter);
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log("Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await commonPage.toShowMoreAnnotators();
      since("hidden annotators should show up with hide icon")
        .expect(commonPage.HIDE_ICON.getText())
        .toEqual("hide");
      await projectsPage.clickGridFirstCell();
      await projectsPage.waitForUserChartLoading();
      await projectsPage.waitForCategoryChartLoading();
      await browser.sleep(10000);
      console.log("finish chart loading and sleeping");
      since("user chart rect should show up and have height")
        .expect(projectsPage.getChartRectHeight(USER_CHART_FIRST_RECT))
        .toBeGreaterThan(0);
      since("user chart tick should show up and have fullname correct")
        .expect(projectsPage.getChartTickText(USER_CHART_FIRST_TICK))
        .toContain(Constant.fullname);
      since("category chart rect should show up and have height")
        .expect(projectsPage.getChartRectHeight(CATEGORY_CHART_FIRST_RECT))
        .toBeGreaterThan(0);
      since("category chart tick should show up and have label correct")
        .expect(projectCreateData.TextProject.Labels.split(","))
        .toContain(projectsPage.getChartTickText(CATEGORY_CHART_FIRST_TICK));
      done();
    } else {
      done.fail("can not filter out the consitent project....");
    }
  });

  it("Should preview text al project, delete and silence single flagged ticket successfully.", async (done) => {
    await projectsPage.navigateToFlagTab();
    await projectsPage.waitForGridLoading();
    let tableLength = await projectsPage.getTableLength();
    const originalTableTotalItem = Number(
      (await projectsPage.getTableTotalItems()).trim().split(" ")[4]
    );
    console.log("tableLength:::", tableLength);
    console.log("originalTableTotalItem:::", originalTableTotalItem);
    if (tableLength > 1) {
      console.log("start to delete flagged ticket");
      await projectsPage.clickDeleteTicketBtn();
      await projectsPage.waitForGridLoading();
      await browser.sleep(1000);
      since("table total items should reduce 1")
        .expect(
          Number((await projectsPage.getTableTotalItems()).trim().split(" ")[4])
        )
        .toEqual(originalTableTotalItem - 1);
      console.log("delete flagged ticket successfully");

      console.log("start to silence flagged ticket");
      await projectsPage.clickSilenceTicketBtn();
      await projectsPage.waitForGridLoading();
      await browser.sleep(1000);
      since("table total items should reduce 1")
        .expect(
          Number((await projectsPage.getTableTotalItems()).trim().split(" ")[4])
        )
        .toEqual(originalTableTotalItem - 2);
      console.log("silence flagged ticket successfully");

      done();
    } else {
      done.fail("the flagged tickets here no more than 2....");
    }
  });

  it("Should preview log project, filter file name and return successfully.", async (done) => {
    project_name = Constant.project_name_log;
    await projectsPage.navigateTo();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log("Project_Count_After_Filter:::", Project_Count_After_Filter);
    console.log("Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await projectsPage.clickGridFirstCell();
      await projectsPage.waitForGridLoading();
      await browser.sleep(1000);
      await projectsPage.filterLogFileName(
        projectEditData.LogProject.Filter_File_Name
      );
      let tableLengthBeforeReturn = await projectsPage.getTableLength();
      console.log("tableLengthBeforeReturn", tableLengthBeforeReturn);
      let aa = (await projectsPage.getTableTotalItems()).trim().split(" ")[4];
      console.log("table total items", aa);
      // since("table total items should to be 3 after filter")
      //   .expect(
      //     Number((await projectsPage.getTableTotalItems()).trim().split(" ")[4])
      //   )
      //   .toEqual(tableLengthBeforeReturn);
      await projectsPage.logShowDetails();
      await projectsPage.returnToAnnotatorBtn();
      await browser.sleep(1000);
      // since("should return to annotator successful")
      //   .expect(projectsPage.RETURN_TO_ANNOTATOR_BTN.isEnabled())
      //   .toBe(true);
      await projectsPage.toExpandCell();
    } else {
      done.fail("can not filter out the consitent project....");
    }

    done();
  });

  it("Should preview image project, expand cell successfully.", async (done) => {
    project_name = Constant.project_name_image;
    await projectsPage.navigateTo();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log("Project_Count_After_Filter:::", Project_Count_After_Filter);
    console.log("Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await projectsPage.clickGridFirstCell();
      await projectsPage.waitForGridLoading();
      await browser.sleep(5000);
      await projectsPage.toExpandCell();
    } else {
      done.fail("can not filter out the consitent project....");
    }
    done();
  });

  it("Should preview ner project, expand cell successfully.", async (done) => {
    project_name = Constant.project_name_ner;
    await projectsPage.navigateTo();
    await projectsPage.waitForGridLoading();
    await projectsPage.filterProjectName(project_name);
    let Project_Count_After_Filter = await projectsPage.getTableLength();
    let Project_Name_Text = await projectsPage.getCellText(0);
    console.log("Project_Count_After_Filter:::", Project_Count_After_Filter);
    console.log("Project_Name_Text:::", Project_Name_Text);
    if (Project_Name_Text !== "" || Project_Count_After_Filter > 0) {
      await projectsPage.clickGridFirstCell();
      await projectsPage.waitForGridLoading();
      await browser.sleep(1000);
      await projectsPage.toExpandCell();
    } else {
      done.fail("can not filter out the consitent project....");
    }
    done();
  });
});
