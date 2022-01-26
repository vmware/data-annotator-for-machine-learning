/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { browser, by, element, $, ExpectedConditions } from "protractor";
import { FunctionUtil } from "../utils/function-util";

describe("Log out service", () => {
  let USERNAME_DROPDOWN = element(by.css("clr-dropdown"));
  let LOG_OUT = element(by.css("clr-dropdown-menu a"));
  let PROJECT_TAB = $('.header-nav a[href="/projects"]');
  let HEADER_TABS = element.all(by.css("div.header-nav a.nav-link"));

  it("Should logout successfully", async (done) => {
    await FunctionUtil.elementVisibilityOf(USERNAME_DROPDOWN);
    await USERNAME_DROPDOWN.click();
    await FunctionUtil.elementVisibilityOf(LOG_OUT);
    await LOG_OUT.click();
    await ExpectedConditions.invisibilityOf(PROJECT_TAB);
    await browser.sleep(5000);
    since("After log out there should only have 3 tabs in header")
      .expect(await FunctionUtil.getElementsNum(HEADER_TABS))
      .toEqual(3);
    done();
  });
});
