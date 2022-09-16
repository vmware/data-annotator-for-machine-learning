/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness";
import { ProjecstPage } from "../page-object/projects-page";
import { CommonUtils } from "../general/common-utils";

describe("delete function", () => {
  let projectName: string;
  let projectsPage: ProjecstPage;
  let since = require("jasmine2-custom-message");

  beforeAll(() => {
    projectName = "e2e Test Project";
    LoginBussiness.verifyLogin();
    projectsPage = new ProjecstPage();
  });

  it("Delete the added projects.", async (done) => {
    await projectsPage.navigateTo();
    await projectsPage.waitForPageLoading();
    await projectsPage.filterProjectName(projectName);
    let Projects_Count_After_Filter = await projectsPage.getTableLength();
    if (Projects_Count_After_Filter > 0) {
      console.log("----------start to delete projects----------");
      await CommonUtils.deleteProjectsLoop(projectName);
      await projectsPage.filterProjectName(projectName);
      let Projects_Count_After_Delete = await projectsPage.getTableLength();
      since("the count should be zero after delete")
        .expect(Projects_Count_After_Delete)
        .toBe(0);
    } else {
      console.log("can not filter out the consistent projects....");
    }
    done();
  });
});
