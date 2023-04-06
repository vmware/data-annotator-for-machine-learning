/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginPage } from "../page-object/login-page";
import { LoginBusiness } from "./login-business";
import { browser } from "protractor";
import { Constant } from "./constant";

describe("Spec - log in", () => {
  let loginPage: LoginPage;
  let loginBusiness: LoginBusiness;
  let since = require("jasmine2-custom-message");

  beforeAll((done) => {
    loginPage = new LoginPage();
    loginBusiness = new LoginBusiness();
    browser
      .sleep(1000)
      .then(() => {
        loginPage.backToHomePage();
      })
      .then(() => {
        loginPage.navigateTo();
      })
      .then(() => {
        browser.waitForAngularEnabled(false);
        browser.sleep(1000);
        done();
      });
  });

  it("Should login with non-existing user failed", async (done) => {
    await loginBusiness.logValidation(Constant.username, Constant.passwordErr);
    since("Err alert show up")
      .expect(await loginPage.getDivText())
      .toEqual("Invalid user name or password");
    done();
  });

  it("Sign up with normal user successfully", async (done) => {
    await loginBusiness.signUp(
      Constant.firstname,
      Constant.lastname,
      Constant.username,
      Constant.password
    );
    since("prompt should show up and content correct")
      .expect(loginPage.getPromptText())
      .not.toEqual("");
    await browser.waitForAngularEnabled(false);
    await browser.sleep(5000);
    done();
  });

  it("Should login with normal user successfully", async (done) => {
    await loginPage.backToHomePage();
    await loginPage.navigateTo();
    await loginBusiness.login(Constant.username, Constant.password);
    done();
  });
});
