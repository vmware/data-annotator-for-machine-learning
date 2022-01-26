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
  EDIT_PROJECT_CANCEL_BTN = $(".modal-footer .btn.btn-outline");
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
  DELETE_CANCEL_BTN = element
    .all(by.css(".modal-footer .btn.btn-outline"))
    .last();
  NUMERIC_MIN_LABEL_INPUT = element(by.css("input[id=min]"));
  NUMERIC_MAX_LABEL_INPUT = element(by.css("input[id=max]"));
  OWNER_DELETE_ICON = element(by.css("ul li:last-child clr-icon"));
  ADD_BTN = element(by.css(".btn.btn-icon.add-btn"));
  MUTIL_LABEL_INPUT = element(by.css("div[formarrayname=mutilLabelArray] input[id=multiLabels]"));

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
    await this.PROJECT_NAME_INPUT.sendKeys(protractor.Key.TAB);
    await this.PROJECT_NAME_INPUT.click();
    await this.PROJECT_NAME_INPUT.sendKeys(Constant.project_name_log);
    await this.PROJECT_NAME_INPUT.sendKeys(protractor.Key.TAB);
    await browser.sleep(5000);
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

  async editProjectOwner(email_validation, owner2, owner3) {
    await FunctionUtil.elementVisibilityOf(this.PROJECT_OWNER_INPUT);
    await this.PROJECT_OWNER_INPUT.click();
    await this.PROJECT_OWNER_INPUT.sendKeys(email_validation);
    await browser.sleep(1000);
    await FunctionUtil.pressEnter();
    await this.PROJECT_OWNER_INPUT.clear();
    await this.PROJECT_OWNER_INPUT.sendKeys(Constant.username);
    await browser.sleep(1000);
    await this.PROJECT_OWNER_INPUT.clear();
    await this.PROJECT_OWNER_INPUT.sendKeys(owner2);
    await FunctionUtil.pressEnter();
    await browser.sleep(1000);
    await this.PROJECT_OWNER_INPUT.clear();
    await this.PROJECT_OWNER_INPUT.sendKeys(owner3);
    await FunctionUtil.pressEnter();
    await browser.waitForAngularEnabled(false);
  }

  async deleteProjectOwner(owner) {
    console.log("start to delete project owner...");
    await FunctionUtil.elementVisibilityOf(this.OWNER_DELETE_ICON);
    await this.OWNER_DELETE_ICON.click();
    await browser.waitForAngularEnabled(false);
    console.log("succeed to delete project owner...");
  }

  async editProjectAnnotator(email_validation, annotator) {
    await FunctionUtil.elementVisibilityOf(this.PROJECT_ANNOTATOR_INPUT);
    await this.PROJECT_ANNOTATOR_INPUT.click();
    await this.PROJECT_ANNOTATOR_INPUT.sendKeys(email_validation);
    await browser.sleep(1000);
    await FunctionUtil.pressEnter();
    await this.PROJECT_ANNOTATOR_INPUT.clear();
    await this.PROJECT_ANNOTATOR_INPUT.sendKeys(Constant.username);
    await browser.sleep(1000);
    await this.PROJECT_ANNOTATOR_INPUT.clear();
    let flag = annotator.split(",");
    console.log("annotators:", flag);
    flag.forEach(async (element) => {
      await this.PROJECT_ANNOTATOR_INPUT.sendKeys(element);
      await FunctionUtil.pressEnter();
    });
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

  async editNumericScope(min, min_err, max, max_err) {
    console.log("start to editNumericScope...");
    await FunctionUtil.elementVisibilityOf(this.NUMERIC_MIN_LABEL_INPUT);
    await this.NUMERIC_MIN_LABEL_INPUT.click();
    await this.NUMERIC_MIN_LABEL_INPUT.clear();
    await this.NUMERIC_MIN_LABEL_INPUT.sendKeys(min_err);
    await browser.sleep(1000);
    await this.NUMERIC_MIN_LABEL_INPUT.clear();
    await this.NUMERIC_MIN_LABEL_INPUT.sendKeys(min);
    await this.NUMERIC_MAX_LABEL_INPUT.click();
    await this.NUMERIC_MAX_LABEL_INPUT.clear();
    await this.NUMERIC_MAX_LABEL_INPUT.sendKeys(max_err);
    await browser.sleep(1000);
    await this.NUMERIC_MAX_LABEL_INPUT.clear();
    await this.NUMERIC_MAX_LABEL_INPUT.sendKeys(max);
    await browser.waitForAngularEnabled(false);
    console.log("succeed to editNumericScope...");
  }

  async deleteAnnotator() {
    console.log("start to deleteAnnotator...");
    // await FunctionUtil.elementVisibilityOf(this.ASSIGN_TICKET_DELETE_ICON);
    await this.ASSIGN_TICKET_DELETE_ICON.click();
    await browser.waitForAngularEnabled(false);
    console.log("succeed to deleteAnnotator...");
  }

  async editALProjectThreshold(threshold, threshold_err, validation_string) {
    await FunctionUtil.elementVisibilityOf(this.AL_THRESHOLD_INPUT);
    await this.AL_THRESHOLD_INPUT.clear();
    await this.AL_THRESHOLD_INPUT.sendKeys(threshold_err);
    await this.AL_THRESHOLD_INPUT.sendKeys(protractor.Key.TAB);
    await this.AL_THRESHOLD_INPUT.clear();
    await this.AL_THRESHOLD_INPUT.sendKeys(validation_string);
    await this.AL_THRESHOLD_INPUT.sendKeys(protractor.Key.TAB);
    await this.AL_THRESHOLD_INPUT.clear();
    await this.AL_THRESHOLD_INPUT.sendKeys(threshold);
    await browser.waitForAngularEnabled(false);
  }

  async editALProjectFrequency(frequency, frequency_err, validation_string) {
    await FunctionUtil.elementVisibilityOf(this.AL_FREQUENCY_INPUT);
    await this.AL_FREQUENCY_INPUT.clear();
    await this.AL_FREQUENCY_INPUT.sendKeys(frequency_err);
    await this.AL_FREQUENCY_INPUT.sendKeys(protractor.Key.TAB);
    await this.AL_FREQUENCY_INPUT.clear();
    await this.AL_FREQUENCY_INPUT.sendKeys(validation_string);
    await this.AL_FREQUENCY_INPUT.sendKeys(protractor.Key.TAB);
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

  async cancelEdit(label1) {
    await FunctionUtil.elementVisibilityOf(this.NEW_LABEL_INPUT);
    await FunctionUtil.operationSuspensionElements(
      label1,
      this.DELETE_LABEL_ICON
    );
    await this.DELETE_CANCEL_BTN.click();
    await this.NEW_LABEL_INPUT.clear();
    await this.NEW_LABEL_INPUT.sendKeys("test1");
    await FunctionUtil.pressEnter();
    await this.EDIT_PROJECT_CANCEL_BTN.click();
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
    // await label.sendKeys(Key.COMMAND, "a");
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

  async addMutilNumbericLabel(labels: any, min, max) {
    await FunctionUtil.elementVisibilityOf(this.ADD_BTN);
    for (let i= 0; i < labels.length; i++) {
      await this.ADD_BTN.click();
    }
    await this.setMutilNumericLabel(labels, min, max);
  }

  async setMutilNumericLabel(label, min, max) {
    console.log("start to setMutilNumericLabel...", label);
    await FunctionUtil.elementVisibilityOf(this.MUTIL_LABEL_INPUT);
    element.all(by.css("div[formarrayname=mutilLabelArray] input[id=multiLabels]")).each(async function(element, index) {
      if (index > 1) {
        await element.sendKeys(label[index - 2]);
      }
    });
    element.all(by.css("div[formarrayname=mutilLabelArray] input[formcontrolname=minMutilVal]")).each(async function(element, index) {
      if (index > 1) {
        await element.sendKeys(min);
      }
    });
    element.all(by.css("div[formarrayname=mutilLabelArray] input[formcontrolname=maxMutilVal]")).each(async function(element, index) {
      if (index > 1) {
        await element.sendKeys(max);
      }
    });
    await browser.waitForAngularEnabled(false);
    console.log("succeed to setMutilNumericLabel...");
  }

  async editMutilNumbericThreshold(min, max) {
    console.log("start to editMutilNumbericThreshold...");
    await FunctionUtil.elementVisibilityOf(this.MUTIL_LABEL_INPUT);
    element.all(by.css("div[formarrayname=mutilLabelArray] input[formcontrolname=minMutilVal]")).each(async function(element, index) {
      if (index === 0) {
        await element.clear();
        await element.sendKeys(min);
      }
    });
    element.all(by.css("div[formarrayname=mutilLabelArray] input[formcontrolname=maxMutilVal]")).each(async function(element, index) {
      if (index === 0) {
        await element.clear();
        await element.sendKeys(max);
      }
    });
    await browser.waitForAngularEnabled(false);
    console.log("succeed to editMutilNumbericThreshold...");
  }

  async editMutilNumbericLabel(label) {
    console.log("start to editMutilNumbericThreshold...");
    await FunctionUtil.elementVisibilityOf(this.MUTIL_LABEL_INPUT);
    element.all(by.css("div[formarrayname=mutilLabelArray] input[id=multiLabels]")).each(async function(element, index) {
      if (index === 0) {
        await element.clear();
        await element.sendKeys(label);
      }
    });
  }

  async deltMutilNumbericLabel(delIndex: number) {
    console.log("start to deltMutilNumbericLabel...");
    element.all(by.css("div[formarrayname=mutilLabelArray] clr-icon[shape=times]")).each(async function(element, index) {
      if (index === delIndex) {
        await element.click();
      }
    });
    await browser.sleep(2000);
    console.log("succeed to deltMutilNumbericLabel...");
  }
}
