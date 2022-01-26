/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import {
  browser,
  element,
  by,
  $,
  $$,
  ExpectedConditions,
  promise,
} from "protractor";
import { Constant } from "../general/constant";
import { FunctionUtil } from "../utils/function-util";
import { CommonPage } from "../general/commom-page";

export class LoginPage extends CommonPage {
  SIGNIN_BTN = $(".header-actions .nav-link.nav-text");
  // BTN_Select = element(by.partialLinkText("Login with My VMware"));
  BTN_Select = $$('.login-group a').last();
  LOGIN_BTN = element(by.css("button[id=login-button]"));
  SINGNIN_BTN = element(by.partialButtonText("SIGN IN"));
  TYPE_SELECT = $('select[name="provider"]');
  USER_NAME = $('input[name="username"]');
  PASSWORD = $('input[name="password"]');
  LOGGED_USER_NAME = $(".nav-text.dropdown-toggle");
  SIGN_UP_LINK = element(by.css("a.signup"));
  SIGN_IN_LINK = element(by.css("a.signup"));
  FIRST_NAME = element(by.css('input[formcontrolname="firstname"]'));
  LAST_NAME = element(by.css('input[formcontrolname="lastname"]'));
  SIGN_UP_BTN = element(by.css('button[type="submit"]'));
  HOME_LINK = element(by.css('a[href="/home"]'));
  ERR_ALERT = element(by.css("div.login-group div.error"));

  async navigateTo() {
    await browser.waitForAngularEnabled(false);
    browser.driver
      .get(browser.baseUrl)
      .then(() => {
        browser.wait(
          ExpectedConditions.visibilityOf(this.SIGNIN_BTN),
          Constant.DEFAULT_TIME_OUT
        );
      })
      .then(() => {
        browser.waitForAngularEnabled(false);
        this.SIGNIN_BTN.click();
      });
  }

  async backToHomePage() {
    await browser.waitForAngularEnabled(false);
    await browser.getCurrentUrl();
    await FunctionUtil.elementVisibilityOf(this.HOME_LINK);
    await this.HOME_LINK.click();
    await browser.waitForAngularEnabled(false);
  }

  async selectAccountType() {
    let url = await browser.getCurrentUrl();
    console.log(url);
    await FunctionUtil.elementVisibilityOf(this.BTN_Select);
    await this.BTN_Select.click();
  }

  async clickSignUpLink() {
    await FunctionUtil.elementVisibilityOf(this.SIGN_UP_LINK);
    await this.SIGN_UP_LINK.click();
  }

  async clickSignInLink() {
    await FunctionUtil.elementVisibilityOf(this.SIGN_IN_LINK);
    await this.SIGN_IN_LINK.click();
  }

  async setFirstname(firstname: string) {
    await FunctionUtil.elementVisibilityOf(this.FIRST_NAME);
    await this.FIRST_NAME.sendKeys(firstname);
  }

  async setLastname(lastname: string) {
    await FunctionUtil.elementVisibilityOf(this.LAST_NAME);
    await this.LAST_NAME.sendKeys(lastname);
  }

  async setUsername(username: string) {
    await FunctionUtil.elementVisibilityOf(this.USER_NAME);
    await this.USER_NAME.sendKeys(username);
  }

  async setPassword(password: string) {
    await FunctionUtil.elementVisibilityOf(this.PASSWORD);
    await this.PASSWORD.sendKeys(password);
  }

  async clickLogInBtn() {
    await FunctionUtil.elementVisibilityOf(this.LOGIN_BTN);
    await this.LOGIN_BTN.click();
  }

  async clickSingnInBtn() {
    await FunctionUtil.elementVisibilityOf(this.SINGNIN_BTN);
    await this.SINGNIN_BTN.click();
  }

  async clickSignUpBtn() {
    await FunctionUtil.elementVisibilityOf(this.SIGN_UP_BTN);
    await browser.waitForAngularEnabled(false);
    await this.SIGN_UP_BTN.click();
  }

  verifyLoggedUserNameDisplayed() {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.LOGGED_USER_NAME),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        return this.LOGGED_USER_NAME.isDisplayed();
      });
  }

  getLoggedUserName() {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.LOGGED_USER_NAME),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        return this.LOGGED_USER_NAME.getText();
      })
      .then((text) => {
        return text.trim();
      });
  }

  async getDivText() {
    await FunctionUtil.elementVisibilityOf(this.ERR_ALERT);
    return this.ERR_ALERT.getText();
  }
}
