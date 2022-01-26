import { LoginBussiness } from "../general/login-bussiness";
import { Constant } from "../general/constant";
import { ProjecstPage } from "../page-object/projects-page";
import { browser } from "protractor";
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
});