/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginPage } from "../page-object/login-page";
import { LoginBusiness } from "./login-business";
import { browser, element, by } from "protractor";
import { Constant } from "./constant";
import { FunctionUtil } from "../utils/function-util";

describe("Sign up spec", () => {
  let loginPage: LoginPage;
  let loginBusiness: LoginBusiness;
  let since = require("jasmine2-custom-message");
  let SIGN_IN = element(by.css("a.signup"));
  let LOGGED_USER_NAME = element(by.css(".nav-text.dropdown-toggle"));

  beforeAll((done) => {
    loginPage = new LoginPage();
    loginBusiness = new LoginBusiness();
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

  it("Should sign up with normal user successfully", async (done) => {
    await loginBusiness.signUp(
      Constant.firstname_owner,
      Constant.lastname_owner,
      Constant.username_owner,
      Constant.password_owner
    );
    since("prompt should show up and content correct")
      .expect(loginPage.getPromptText())
      .not.toEqual("");
    if ((await loginPage.getPromptText()) == Constant.sign_up_exist_user_tip) {
      await FunctionUtil.elementVisibilityOf(SIGN_IN);
      await FunctionUtil.click(SIGN_IN);
      await browser.sleep(3000);
      await FunctionUtil.elementVisibilityOf(
        element(by.css("button[id=login-button]"))
      );
    }
    await browser.sleep(5000);
    done();
  });

  it("Should login with normal user successfully", async (done) => {
    await loginBusiness.login(Constant.username_owner, Constant.password_owner);
    console.log("log-succeed to verify login");
    await FunctionUtil.elementVisibilityOf(LOGGED_USER_NAME);
    since("After owner log in there should display user email in header right")
      .expect(loginPage.getLoggedUserName())
      .toBe(Constant.username_owner);
    done();
  });
});
