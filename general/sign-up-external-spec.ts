/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginPage } from "../page-object/login-page";
import { LoginBussiness } from "./login-bussiness";
import { browser, element, by } from "protractor";
import { Constant } from "./constant";
import { FunctionUtil } from "../utils/function-util";

describe("Service", () => {
  let loginPage: LoginPage;
  let loginBusiness: LoginBussiness;
  let since = require("jasmine2-custom-message");
  let SIGN_IN = element(by.css("a.signup"));
  let PROJECT_TAB = element(by.css('.header-nav a[href="/projects"]'));
  let HEADER_TABS = element.all(by.css("div.header-nav a.nav-link"));

  beforeAll((done) => {
    loginPage = new LoginPage();
    loginBusiness = new LoginBussiness();
    browser
      .sleep(1000)
      .then(() => {
        loginPage.navigateTo();
      })
      .then(() => {
        browser.sleep(1000);
        done();
      });
  });

  it("Sign up with normal owner user successfully", async (done) => {
    await loginBusiness.signUp(
      Constant.firstname_owner,
      Constant.lastname_owner,
      Constant.username_owner,
      Constant.password_owner
    );
    await browser.sleep(5000);
    since("prompt should show up and content correct")
      .expect(loginPage.getPromptText())
      .not.toEqual("");
    done();
  });

  it("Should login with normal owner user successfully", async (done) => {
    await FunctionUtil.elementVisibilityOf(SIGN_IN);
    await SIGN_IN.click();
    await loginBusiness.login(Constant.username_owner, Constant.password_owner);
    await FunctionUtil.elementVisibilityOf(PROJECT_TAB);
    since("After owner log in there should only have 5 tabs in header")
      .expect(await FunctionUtil.getElementsNum(HEADER_TABS))
      .toEqual(5);
    done();
  });
});
