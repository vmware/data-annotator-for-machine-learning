/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { browser, by, element, $, ExpectedConditions } from "protractor";
import { FunctionUtil } from "../utils/function-util";

describe("Log out spec", () => {
  let since = require("jasmine2-custom-message");
  let USERNAME_DROPDOWN = element(by.css("clr-dropdown"));
  let LOG_OUT = element(by.css("clr-dropdown-menu a"));
  let SIGNIN_BTN = $(".header-actions .nav-link.nav-text");

  it("Should logout successfully", async (done) => {
    await FunctionUtil.elementVisibilityOf(USERNAME_DROPDOWN);
    await USERNAME_DROPDOWN.click();
    await FunctionUtil.elementVisibilityOf(LOG_OUT);
    await LOG_OUT.click();
    await browser.sleep(5000);
    since("After log out there should display sign in in header").expect(
      await FunctionUtil.elementVisibilityOf(SIGNIN_BTN)
    );
    done();
  });
});
