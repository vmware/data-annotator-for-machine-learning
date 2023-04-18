/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Constant } from "../general/constant";
import { browser, $, ExpectedConditions, by, element, $$ } from "protractor";
import { FunctionUtil } from "../utils/function-util";
import { CommonPage } from "../general/common-page";
import { protractor } from "protractor/built/ptor";

export class EditPage extends CommonPage {
  PROJECT_TABLE = $(".datagrid-host .datagrid");
  LABELING_TASK_LIST = element(by.css('a[href="/loop/project/list"]'));
  EDIT_PROJECT_OK_BTN = $(".modal-footer .btn.btn-primary");
  EDIT_PROJECT_CANCEL_BTN = $(".modal-footer .btn.btn-outline");
  NEW_LABEL_INPUT = element(by.css('input[name="addNewLabel"]'));
  PROJECT_NAME_INPUT = element(by.css("input[id=projectName]"));
  TASK_INSTRUCTION_TEXT = element(by.css("textarea[id=taskInstruction]"));
  PROJECT_OWNER_INPUT = element(by.css("input[id=projectOwner]"));
  PROJECT_EMAIL_INPUT = element.all(by.css("input[id=inputEmail]"));
  AL_THRESHOLD_INPUT = element(by.css("input[id=trigger]"));
  AL_FREQUENCY_INPUT = element(by.css("input[id=frequency]"));
  DELETE_LABEL_ICON = element(by.css("cds-icon.deleteIcon"));
  SHOW_FILE_NAME_RADIO = element(by.css("clr-radio-wrapper label[for='no']"));
  ASSIGNMENT_LOGIC_RADIO = element(
    by.css("clr-radio-wrapper label[for='sequential']")
  );
  ASSIGN_TICKET_INPUT = element.all(
    by.css("input[title='Number of tickets assigned']")
  );
  DELETE_ICON_TRASH = element.all(by.css("cds-icon[shape='trash']"));
  DELETE_OK_BTN = element.all(by.css(".modal-footer .btn.btn-primary")).last();
  DELETE_CANCEL_BTN = element
    .all(by.css(".modal-footer .btn.btn-outline"))
    .last();
  NUMERIC_MIN_LABEL_INPUT = element(by.css("input[id=min]"));
  NUMERIC_MAX_LABEL_INPUT = element(by.css("input[id=max]"));

  MULTI_LABEL_INPUT = element(
    by.css("div[formarrayname=mutilLabelArray] input[id=multiLabels]")
  );
  ADMIN_TAB = element(by.css("ul li:nth-child(2) button"));
  ADD_NEW_OWNER = element(
    by.css("label[for=projectOwner]+div cds-icon[shape=plus]")
  );
  OWNER_INPUT_2 = element(
    by.css("label[for=projectOwner]+div>div:nth-child(2) input")
  );
  OWNER_DELETE_ICON = element(
    by.css("label[for=projectOwner]+div>div:nth-child(2) cds-icon")
  );

  ANNOTATOR_INPUT_2 = element(
    by.css(
      "label[for=assignee]+div>div:nth-child(2)>div>div:nth-child(2) input[type=text]"
    )
  );
  ADD_LABEL_BTN = element(
    by.css("div[formarrayname='mutilLabelArray'] button")
  );
  TRASH_ICON = element.all(by.css("cds-icon[shape='trash']"));
  ICON_PLUS = element.all(by.css("button cds-icon[shape=plus]"));
  ANNOTATE_INPUT = $('label[for="assignee"]+div input[id="inputEmail"]');

  async navigateTo() {
    await FunctionUtil.elementVisibilityOf(this.LABELING_TASK_LIST);
    await browser.waitForAngularEnabled(false);
    await this.LABELING_TASK_LIST.click();
  }

  async editProjectName(name) {
    await FunctionUtil.elementVisibilityOf(this.PROJECT_NAME_INPUT);
    console.log("log-editProjectName_name:::", name);
    Constant.project_name_text_al = name + "edit";
    await this.PROJECT_NAME_INPUT.clear();
    await this.PROJECT_NAME_INPUT.sendKeys(protractor.Key.TAB);
    await this.PROJECT_NAME_INPUT.click();
    await this.PROJECT_NAME_INPUT.sendKeys(Constant.project_name_log);
    await this.PROJECT_NAME_INPUT.sendKeys(protractor.Key.TAB);
    await browser.sleep(5000);
    await this.PROJECT_NAME_INPUT.clear();
    await this.PROJECT_NAME_INPUT.sendKeys(Constant.project_name_text_al);
  }

  async clearProjectName() {
    console.log("log-start clear project name");
    await FunctionUtil.elementVisibilityOf(this.PROJECT_NAME_INPUT);
    await this.PROJECT_NAME_INPUT.click();
    await this.PROJECT_NAME_INPUT.clear();
    await this.PROJECT_NAME_INPUT.sendKeys(" ");
    await this.PROJECT_NAME_INPUT.sendKeys(protractor.Key.TAB);
    await browser.waitForAngularEnabled(false);
    console.log("log-end clear project name");
  }

  async addProjectName(name) {
    await FunctionUtil.elementVisibilityOf(this.PROJECT_NAME_INPUT);
    console.log("log-editProjectName_name:::", name);
    await this.PROJECT_NAME_INPUT.clear();
    await this.PROJECT_NAME_INPUT.sendKeys(name);
    await browser.waitForAngularEnabled(false);
  }

  async editTaskInstructions() {
    await FunctionUtil.elementVisibilityOf(this.TASK_INSTRUCTION_TEXT);
    console.log(
      "log-editTaskInstructions-elementVisibilityOf(this.TASK_INSTRUCTION_TEXT)"
    );
    await this.TASK_INSTRUCTION_TEXT.clear();
    await this.TASK_INSTRUCTION_TEXT.click();
    await this.TASK_INSTRUCTION_TEXT.sendKeys(Constant.task_instruction_log);
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

  async editMultiNumericOwner(email_validation, owner2, owner3) {
    await FunctionUtil.elementVisibilityOf(this.ADD_NEW_OWNER);
    await this.ADD_NEW_OWNER.click();
    await this.OWNER_INPUT_2.sendKeys(email_validation);
    await browser.sleep(1000);

    await this.OWNER_INPUT_2.clear();
    await this.OWNER_INPUT_2.sendKeys(Constant.username || "");
    await browser.sleep(1000);

    await this.OWNER_INPUT_2.clear();
    await this.OWNER_INPUT_2.sendKeys(owner2);

    await browser.sleep(1000);
    await this.OWNER_INPUT_2.clear();
    await this.OWNER_INPUT_2.sendKeys(owner3);
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to editProjectOwner");
  }

  async editProjectOwner(email_validation, owner2, owner3) {
    await FunctionUtil.click(this.ICON_PLUS.first());
    await this.PROJECT_EMAIL_INPUT.get(1).click();
    await this.PROJECT_EMAIL_INPUT.get(1).sendKeys(email_validation);
    await browser.sleep(1000);
    await this.PROJECT_EMAIL_INPUT.get(1).clear();
    await this.PROJECT_EMAIL_INPUT.get(1).sendKeys(Constant.username || "");
    await browser.sleep(1000);
    await this.PROJECT_EMAIL_INPUT.get(1).clear();
    await this.PROJECT_EMAIL_INPUT.get(1).sendKeys(owner2);
    await browser.sleep(1000);
    await FunctionUtil.click(this.ICON_PLUS.first());
    await this.PROJECT_EMAIL_INPUT.get(2).sendKeys(owner3);
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to editProjectOwner");
  }

  async deleteProjectOwner(owner) {
    console.log("log-start to delete project owner...");
    await FunctionUtil.click(this.TRASH_ICON.get(2));
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to delete project owner...");
  }

  async deleteMultiProjectOwner() {
    console.log("log-start to delete project owner...");
    await FunctionUtil.elementVisibilityOf(this.OWNER_DELETE_ICON);
    await this.OWNER_DELETE_ICON.click();
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to delete project owner...");
  }

  async editMultiNumberAnnotator(email_validation, annotator) {
    await FunctionUtil.elementVisibilityOf(this.ANNOTATOR_INPUT_2);
    await this.ANNOTATOR_INPUT_2.click();
    await this.ANNOTATOR_INPUT_2.sendKeys(email_validation);
    await browser.sleep(1000);

    await this.ANNOTATOR_INPUT_2.clear();
    await this.ANNOTATOR_INPUT_2.sendKeys(Constant.username || "");
    await browser.sleep(1000);

    await this.ANNOTATOR_INPUT_2.clear();
    await this.ANNOTATOR_INPUT_2.sendKeys(annotator);
    await browser.sleep(1000);
    await browser.waitForAngularEnabled(false);
  }

  async editProjectAnnotator(email_validation, annotator) {
    await FunctionUtil.click(this.PROJECT_EMAIL_INPUT.last());
    await this.PROJECT_EMAIL_INPUT.last().sendKeys(email_validation);
    await browser.sleep(1000);
    await this.PROJECT_EMAIL_INPUT.last().clear();
    await this.PROJECT_EMAIL_INPUT.last().sendKeys(Constant.username || "");
    await browser.sleep(1000);
    await this.PROJECT_EMAIL_INPUT.last().clear();
    await this.TRASH_ICON.last().click();
    let flag = annotator.split(",");
    console.log("log-annotators:", flag);
    flag.forEach(async (element) => {
      await this.ICON_PLUS.last().click();
      await this.PROJECT_EMAIL_INPUT.last().sendKeys(element);
      await browser.sleep(2000);
    });
    await browser.waitForAngularEnabled(false);
  }

  async editAssignedTickets(annotator, max) {
    console.log("log-start to editAssignedTickets...");
    await FunctionUtil.elementVisibilityOf(this.PROJECT_EMAIL_INPUT.last());
    await this.PROJECT_EMAIL_INPUT.last().click();
    await this.PROJECT_EMAIL_INPUT.last().sendKeys(annotator);
    await browser.sleep(1000);
    await this.ASSIGN_TICKET_INPUT.last().click();
    await this.ASSIGN_TICKET_INPUT.last().sendKeys(max);
    await this.ASSIGN_TICKET_INPUT.last().sendKeys(protractor.Key.TAB);
    await FunctionUtil.acceptAlertPopup();
    console.log("log-succeed to acceptAlertPopup from sendKeys(max)");
    await this.ASSIGN_TICKET_INPUT.last().click();
    await this.ASSIGN_TICKET_INPUT.last().clear();
    await this.ASSIGN_TICKET_INPUT.last().click();
    await this.ASSIGN_TICKET_INPUT.last().sendKeys(-1);
    await this.ASSIGN_TICKET_INPUT.last().sendKeys(protractor.Key.TAB);
    console.log("log-succeed to ASSIGN_TICKET_INPUT.clear()");
    await FunctionUtil.acceptAlertPopup();
    await browser.sleep(1000);
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to editAssignedTickets...");
  }

  async editNumericScope(min, min_err, max, max_err) {
    console.log("log-start to editNumericScope...");
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
    console.log("log-succeed to editNumericScope...");
  }

  async deleteAnnotator() {
    console.log("log-start to deleteAnnotator...");
    await this.DELETE_ICON_TRASH.last().click();
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to deleteAnnotator...");
  }

  async deleteExistAnnotator() {
    console.log("log-start to delete exist annotator...");
    await this.DELETE_ICON_TRASH.get(1).click();
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to delete exist annotator...");
  }

  async addAnnotator(username) {
    console.log("log-start to add annotator...");
    await this.ANNOTATE_INPUT.clear();
    await this.ANNOTATE_INPUT.sendKeys(username);
    await this.ANNOTATE_INPUT.click();
    console.log("log-succeed to add annotator...");
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
      console.log("log-added label is " + element);
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
    console.log("log-start to editLabel...");
    await FunctionUtil.elementVisibilityOf(label);
    await label.click();
    // mac need use commang+a
    // await label.sendKeys(Key.COMMAND, "a");
    // windows and linux need use control
    // await label.sendKeys(Key.CONTROL, "a");
    // await label.sendKeys(value);
    let backspaceSeries = "";
    for (var i = 5; i > 0; --i) {
      backspaceSeries += protractor.Key.BACK_SPACE;
    }
    await label.sendKeys(backspaceSeries + value);
    console.log("log-start to editLabel send value test3...");
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to editLabel...");
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

  async addMultiNumericLabel(labels: any, min, max) {
    await FunctionUtil.elementVisibilityOf(this.ADD_LABEL_BTN);
    for (let i = 0; i < labels.length; i++) {
      await this.ADD_LABEL_BTN.click();
    }
    await this.setMultiNumericLabel(labels, min, max);
  }

  async setMultiNumericLabel(label, min, max) {
    console.log("log-start to setMultiNumericLabel...", label);
    await FunctionUtil.elementVisibilityOf(this.MULTI_LABEL_INPUT);
    element
      .all(by.css("div[formarrayname=mutilLabelArray] input[id=multiLabels]"))
      .each(async function (element, index: any) {
        if (index > 1) {
          await element?.sendKeys(label[index - 2]);
        }
      });
    element
      .all(
        by.css(
          "div[formarrayname=mutilLabelArray] input[formcontrolname=minMutilVal]"
        )
      )
      .each(async function (element, index: any) {
        if (index > 1) {
          await element?.sendKeys(min);
        }
      });
    element
      .all(
        by.css(
          "div[formarrayname=mutilLabelArray] input[formcontrolname=maxMutilVal]"
        )
      )
      .each(async function (element, index: any) {
        if (index > 1) {
          await element?.sendKeys(max);
        }
      });
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to setMultiNumericLabel...");
  }

  async editMultiNumericThreshold(min, max) {
    console.log("log-start to editMultiNumericThreshold...");
    await FunctionUtil.elementVisibilityOf(this.MULTI_LABEL_INPUT);
    element
      .all(
        by.css(
          "div[formarrayname=mutilLabelArray] input[formcontrolname=minMutilVal]"
        )
      )
      .each(async function (element, index) {
        if (index === 0) {
          await element?.clear();
          await element?.sendKeys(min);
        }
      });
    element
      .all(
        by.css(
          "div[formarrayname=mutilLabelArray] input[formcontrolname=maxMutilVal]"
        )
      )
      .each(async function (element, index) {
        if (index === 0) {
          await element?.clear();
          await element?.sendKeys(max);
        }
      });
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to editMultiNumericThreshold...");
  }

  async editMultiNumericLabel(label) {
    console.log("log-start to editMultiNumericThreshold...");
    await FunctionUtil.elementVisibilityOf(this.MULTI_LABEL_INPUT);
    element
      .all(by.css("div[formarrayname=mutilLabelArray] input[id=multiLabels]"))
      .each(async function (element, index) {
        if (index === 0) {
          await element?.clear();
          await element?.sendKeys(label);
        }
      });
  }

  async deleteMultiNumericLabel(delIndex: number) {
    console.log("log-start to deleteMultiNumericLabel...");
    element
      .all(by.css("div[formarrayname=mutilLabelArray] cds-icon[shape=times]"))
      .each(async function (element, index) {
        if (index === delIndex) {
          await element?.click();
        }
      });
    await browser.sleep(2000);
    console.log("log-succeed to deleteMultiNumericLabel...");
  }
}
