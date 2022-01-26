/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { browser } from "protractor";
import { LoginPage } from "../page-object/login-page";
import { Constant } from "../general/constant";

export class LoginBussiness {
  page: LoginPage = new LoginPage();

  navigateToLoginPage() {
    return browser.sleep(1000).then(() => {
      this.page.navigateTo();
    });
  }
  
  async loginWithMyVM(username, password){
    await this.page.setUsername(username);
    await this.page.setPassword(password);
    await this.page.clickSingnInBtn();
    await this.page.verifyLoggedUserNameDisplayed();
    await expect(await this.page.getLoggedUserName()).toBe(username);
    Constant.login = true;
  }
  
  login(username, password) {
    return this.page
      .setUsername(username)
      .then(() => {
        this.page.setPassword(password);
      })
      .then(() => {
        this.page.clickLogInBtn();
      })
      .then(() => {
        return this.page.verifyLoggedUserNameDisplayed();
      })
      .then(
        (bool) => {
          expect(this.page.getLoggedUserName()).toBe(username);
          Constant.login = true;
        },
        (error) => {
          console.log(
            "\x1b[33m%s\x1b[0m",
            "[FATAL ERROR] There is an error when login! see below: "
          );
          console.log("\x1b[31m%s\x1b[0m", "");
          browser.close().then(() => {
            return process.exit(1);
          });
        }
      )
      .then(() => {
        return browser.getCurrentUrl();
      })
      .then((currenturl) => {
        console.log("baseUrl:" + currenturl);
      });
  }

  static verifyLogin() {
    if (Constant.login == false) {
      let loginBusiness = new LoginBussiness();
      loginBusiness.navigateToLoginPage().then(() => {
        loginBusiness.login(Constant.username, Constant.password);
      });
    }
  }

  async signUp(firstname, lastname, username, password) {
    await browser.waitForAngularEnabled(false);
    await this.page.clickSignUpLink();
    await this.page.setFirstname(firstname);
    await this.page.clickSignInLink();
    await this.page.clickSignUpLink();
    await this.page.setFirstname(firstname);
    await this.page.setLastname(lastname);
    await this.page.setUsername(username);
    await this.page.setPassword(password);
    await browser.waitForAngularEnabled(false);
    await this.page.clickSignUpBtn();
    await browser.sleep(5000);
    await this.page.clickSignUpBtn();
  }

  async logValidation(username, password) {
    await browser.waitForAngularEnabled(false);
    await this.page.setUsername(username);
    await this.page.setPassword(password);
    await browser.waitForAngularEnabled(false);
    await this.page.clickLogInBtn();
    await browser.waitForAngularEnabled(false);
    await browser.sleep(5000);
  }
}
