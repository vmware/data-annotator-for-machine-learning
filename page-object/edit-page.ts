/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Constant } from "../general/constant";
import { browser, $, ExpectedConditions, by, element, Key } from "protractor";
import { FunctionUtil } from "../utils/function-util";
import { CommonPage } from "../general/commom-page";
import { protractor } from "protractor/built/ptor";

export class EditPage {
  PROJECT_TABLE = $(".datagrid-host .datagrid");
  ADMIN_TAB = element(by.css('.header-nav a[href="/admin"]'));
  EDIT_PROJECT_OK_BTN = $(".modal-footer .btn.btn-primary");
  NEW_LABEL_INPUT = element(by.css('input[name="addNewLabel"]'));
  PROJECT_NAME_INPUT = element(by.css("input[id=projectName]"));
  PROJECT_OWNER_INPUT = element(by.css("input[id=projectOwner]"));
  PROJECT_ANNOTATOR_INPUT = element(by.css("input[id=assignee]"));
  AL_THRESHOLD_INPUT = element(by.css("input[id=trigger]"));
  AL_FREQUENCY_INPUT = element(by.css("input[id=frequency]"));
  DELETE_LABEL_ICON = element(by.css("clr-icon.deleteIcon"));
  SHOW_FILE_NAME_RADIO = element(by.css("clr-radio-wrapper label[for='no']"));
  ASSIGNMENT_LOGIC_RADIO = element(
    by.css("clr-radio-wrapper label[for='sequential']")
  );
  ASSIGN_TICKET_INPUT = element(
    by.css("ul li:first-child input.assignTicketNumber")
  );
  ASSIGN_TICKET_DELETE_ICON = element(by.css("ul li:last-child clr-icon"));
  DELETE_OK_BTN = element.all(by.css(".modal-footer .btn.btn-primary")).last();

  async navigateTo() {
    await FunctionUtil.elementVisibilityOf(this.ADMIN_TAB);
    await browser.waitForAngularEnabled(false);
    await this.ADMIN_TAB.click();
  }

  async clickEditButton() {
    this.PROJECT_TABLE.scrollLeft = this.PROJECT_TABLE.scrollWidth;
    await FunctionUtil.elementVisibilityOf($('button[title="Edit Project"]'));
    await browser.waitForAngularEnabled(false);
    await $('button[title="Edit Project"]').click();
    await FunctionUtil.elementVisibilityOf(this.EDIT_PROJECT_OK_BTN);
  }

  async editProjectName(name) {
    await FunctionUtil.elementVisibilityOf(this.PROJECT_NAME_INPUT);
    console.log("editProjectName_name:::", name);
    Constant.project_name_text_al = name + "edit";
    await this.PROJECT_NAME_INPUT.clear();
    await this.PROJECT_NAME_INPUT.sendKeys(Constant.project_name_text_al);
    await browser.waitForAngularEnabled(false);
  }

  async editDuplicateProjectName(log_name, text_al_name) {
    await FunctionUtil.elementVisibilityOf(this.PROJECT_NAME_INPUT);
    await this.PROJECT_NAME_INPUT.clear();
    await this.PROJECT_NAME_INPUT.sendKeys(text_al_name);
    await browser.sleep(1000);
    await this.PROJECT_NAME_INPUT.sendKeys(log_name);
    await browser.waitForAngularEnabled(false);
  }

  async editProjectOwner(email_validation, owner) {
    await FunctionUtil.elementVisibilityOf(this.PROJECT_OWNER_INPUT);
    await this.PROJECT_OWNER_INPUT.click();
    await this.PROJECT_OWNER_INPUT.sendKeys(email_validation);
    await browser.sleep(1000);
    await FunctionUtil.pressEnter();
    await this.PROJECT_OWNER_INPUT.clear();
    await this.PROJECT_OWNER_INPUT.sendKeys(owner);
    await browser.waitForAngularEnabled(false);
  }

  async editProjectAnnotator(email_validation, annotator) {
    await FunctionUtil.elementVisibilityOf(this.PROJECT_ANNOTATOR_INPUT);
    await this.PROJECT_ANNOTATOR_INPUT.click();
    await this.PROJECT_ANNOTATOR_INPUT.sendKeys(email_validation);
    await browser.sleep(1000);
    await FunctionUtil.pressEnter();
    await this.PROJECT_ANNOTATOR_INPUT.clear();
    await this.PROJECT_ANNOTATOR_INPUT.sendKeys(annotator);
    await browser.waitForAngularEnabled(false);
  }

  async editAssignedTickets(annotator, max) {
    console.log("start to editAssignedTickets...");
    await FunctionUtil.elementVisibilityOf(this.PROJECT_ANNOTATOR_INPUT);
    await this.PROJECT_ANNOTATOR_INPUT.click();
    await this.PROJECT_ANNOTATOR_INPUT.sendKeys(annotator);
    await browser.sleep(1000);
    await FunctionUtil.pressEnter();
    await this.ASSIGN_TICKET_INPUT.click();
    await this.ASSIGN_TICKET_INPUT.sendKeys(max);
    await this.ASSIGN_TICKET_INPUT.sendKeys(protractor.Key.TAB);
    await FunctionUtil.acceptAlertPopup();
    await this.ASSIGN_TICKET_INPUT.click();
    await this.ASSIGN_TICKET_INPUT.clear();
    await FunctionUtil.acceptAlertPopup();
    await browser.sleep(1000);
    await browser.waitForAngularEnabled(false);
    console.log("succeed to editAssignedTickets...");
  }

  async deleteAnnotator() {
    await FunctionUtil.elementVisibilityOf(this.ASSIGN_TICKET_DELETE_ICON);
    await this.ASSIGN_TICKET_DELETE_ICON.click();
    await browser.waitForAngularEnabled(false);
  }

  async editALProjectThreshold(threshold) {
    await FunctionUtil.elementVisibilityOf(this.AL_THRESHOLD_INPUT);
    await this.AL_THRESHOLD_INPUT.clear();
    await this.AL_THRESHOLD_INPUT.sendKeys(threshold);
    await browser.waitForAngularEnabled(false);
  }

  async editALProjectFrequency(frequency) {
    await FunctionUtil.elementVisibilityOf(this.AL_FREQUENCY_INPUT);
    await this.AL_FREQUENCY_INPUT.clear();
    await this.AL_FREQUENCY_INPUT.sendKeys(frequency);
    await browser.waitForAngularEnabled(false);
  }

  async addLabel(label: any) {
    await FunctionUtil.elementVisibilityOf(this.NEW_LABEL_INPUT);
    await this.NEW_LABEL_INPUT.clear();
    label.forEach(async (element) => {
      console.log(element);
      await this.NEW_LABEL_INPUT.sendKeys(element);
      await FunctionUtil.pressEnter();
    });
  }

  async deleteLabel(label: any) {
    await FunctionUtil.elementVisibilityOf(this.NEW_LABEL_INPUT);
    await FunctionUtil.operationSuspensionElements(
      label,
      this.DELETE_LABEL_ICON
    );
    await this.DELETE_OK_BTN.click();
    await browser.sleep(1000);
  }

  async editLabel(label, value) {
    console.log("start to editLabel...");
    await FunctionUtil.elementVisibilityOf(label);
    await label.click();
    await label.sendKeys(Key.COMMAND, "a");
    await label.sendKeys(Key.CONTROL, "a");
    await label.sendKeys(value);
    await browser.waitForAngularEnabled(false);
    console.log("succeed to editLabel...");
  }

  async showFileName() {
    await this.SHOW_FILE_NAME_RADIO.click();
    await browser.waitForAngularEnabled(false);
  }

  async assignmentLogic() {
    await this.ASSIGNMENT_LOGIC_RADIO.click();
    await browser.waitForAngularEnabled(false);
  }

  async clickEditSubmitButton() {
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.EDIT_PROJECT_OK_BTN);
    await browser.waitForAngularEnabled(false);
    await this.EDIT_PROJECT_OK_BTN.click();
    await browser.wait(
      ExpectedConditions.invisibilityOf($(".btn.uploadLoading")),
      Constant.DEFAULT_TIME_OUT
    );
  }
}
