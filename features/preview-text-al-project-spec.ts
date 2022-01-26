import { LoginBussiness } from "../general/login-bussiness";
import { Constant } from "../general/constant";
import { ProjecstPage } from "../page-object/projects-page";
import { browser, by, element, $, $$ } from "protractor";
const projectCreateData = require("../resources/project-create-page/test-data");
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
});