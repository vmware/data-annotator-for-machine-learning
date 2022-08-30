/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginPage } from "../page-object/login-page";
import { LoginBussiness } from "../general/login-bussiness";
import { browser } from "protractor";
import { Constant } from "../general/constant";
import { FunctionUtil } from "../utils/function-util";

describe("Service", () => {
  let loginPage: LoginPage;
  let loginBusiness: LoginBussiness;

  beforeAll(async (done) => {
    loginPage = new LoginPage();
    loginBusiness = new LoginBussiness();

    await browser.sleep(1000);
    await loginPage.navigateTo();
    await browser.sleep(10000);
    console.log(await browser.getCurrentUrl())
    await FunctionUtil.elementVisibilityOf(loginPage.BTN_Select);
    console.log("Login with My VMware");
    await loginPage.selectAccountType();
    done();
  });

  it("Should login with normal user successfully", async (done) => {
    await loginBusiness.loginWithMyVM(Constant.username, Constant.password);
    done();
  });
});
