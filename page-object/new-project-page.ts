/*
Copyright 2019-2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { browser, by, element, ExpectedConditions, $, $$ } from "protractor";
import { Constant } from "../general/constant";
import { CommonPage } from "../general/common-page";
import { FunctionUtil } from "../utils/function-util";
import { protractor } from "protractor/built/ptor";

export class NewProjectPage extends CommonPage {
  CREATE_PROJECT_BTN = $(".createBtn .add-doc");
  PROJECT_NAME = $("#projectName");
  TASK_INSTRUCTION = $("#taskInstruction");
  UPLOAD_CSV_BTN = $(".clr-input-wrapper .btn.btn-sm.add-doc");
  CHOOSE_FILE_BTN = $('input[name="localFile"]');

  CHOOSE_FILE_LABEL = $('label[for="localFile"]');
  UPLOAD_CSV_OK_BTN = $(".modal-footer .btn.btn-primary");
  UPLOAD_CSV_CANCEL_BTN = $(".modal-footer .btn.btn-outline");
  SET_DATA_TAB = $("clr-wizard clr-datagrid");
  WIZARD_SELECT_BTN = element(by.css("clr-wizard .clr-select-wrapper"));
  WIZARD_SELECT_OPTIONS = element.all(by.css("clr-wizard select option"));
  TICKET_COLUMN_CHECKBOX_FOR_TEXT = element(
    by.css("clr-dg-row:nth-child(4) .clr-checkbox-wrapper label")
  );
  SET_DATA_BTN = $("clr-wizard-button:nth-child(4)");
  MAX_ANNOTATIONS = $("#maxAnnotations");
  ADD_NEW_LABEL = $$(
    ".clr-input-wrapper input[placeholder='Enter Text Label Here']"
  );
  ASSIGNEE = $$("#inputEmail");
  TICKETS_INPUT = $('input[placeholder="Number of tickets assigned"]');
  CREATE_BTN = $("clr-wizard-button[type=finish]");
  CSV_NAME = $(".modal-content #datasetsName");
  LABELING_TASK_NAV = $("clr-vertical-nav-group:nth-child(2)");
  CREATE_LABELING_TASK__NAV = element(
    by.css('.nav-group-children a[href="/loop/project/create"]')
  );
  MY_PROJECTS_TAB = element(by.css('a[href="/loop/project/create"]'));
  PROJECT_TABULAR_CLASSIFICATION = element(
    by.css('clr-dropdown-menu a[href="/projects/create/tabular"]')
  );
  PROJECT_NER_CLASSIFICATION = element(
    by.css('clr-dropdown-menu a[href="/projects/create/ner"]')
  );
  PROJECT_IMAGE_CLASSIFICATION = element(
    by.css('clr-dropdown-menu a[href="/projects/create/image"]')
  );
  PROJECT_LOG_CLASSIFICATION = element(
    by.css('clr-dropdown-menu a[href="/projects/create/log"]')
  );
  SELECT_AL_CLASSIFIER = element(
    by.css("select[formcontrolname=selectedClassifier]")
  );
  SELECT_PROJECT_TYPE = element(by.css("select[formcontrolname=projectType]"));
  SELECT_AL_QUERY_STRATEGY = element(
    by.css("select[formcontrolname=selectedqueryStrategy]")
  );
  SELECT_AL_ENCODER = element(
    by.css("select[formcontrolname=selectedEncoder]")
  );
  FILE_SELECT = element(by.css("select[formcontrolname=selectedDataset]"));
  FILE_SELECT_OPTION = element.all(
    by.css("select[formcontrolname=selectedDataset] option")
  );
  ALLOW_MULTIPLE = element(by.css(".labelsList label[for=multipleLabel]"));
  TICKET_COLUMNS = element.all(by.css("clr-dg-row label"));
  NUMERIC_OPTION = element(by.css("label[for=numericLabel]"));
  TAXONOMY_OPTION = element(by.css("clr-radio-wrapper label[for=uploadLabel]"));
  TEXT_LABEL_TYPE_OPTION = element(by.css("label[for=textLabel]"));
  MIN_LABEL_INPUT = element(by.css("input[placeholder='Enter minimum value']"));
  MAX_LABEL_INPUT = element(by.css("input[placeholder='Enter maximum value']"));
  MULTI_LABEL_INPUT = element(
    by.css("clr-radio-wrapper label[for=mutilNumericLabel]")
  );
  UPLOAD_TAXONOMY_BTN = element(
    by.css("clr-radio-wrapper label[for=uploadLabel]")
  );
  SHOW_FILENAME_CHECKBOX = element(by.css("label[for=isShowFilename]"));
  IMAGE_LOADING = element(by.css("span .loadingSpan"));
  ASSIGN_TICKET_INPUT = element.all(
    by.css('input[placeholder="Number of tickets assigned"]')
  );
  DELETE_LABEL = element
    .all(by.css("div.labelsList div:last-child span"))
    .last();
  DELETE_LABEL_ICON = element(by.css("clr-icon[shape=times]"));
  ASSIGN_TICKET_DELETE_ICON = element(by.css("ul li:last-child clr-icon"));
  SHOW_POP_LABEL_CHECK = element(by.css("label[for=y]"));
  DELETE_POP_LABEL = element
    .all(
      by.css(
        "#clr-wizard-page-4 > div:nth-child(5) > div > div:nth-child(3) > div > div > cds-icon"
      )
    )
    .last();
  ADD_POP_LABEL = $("label[for=y]");
  // WIZARD_NEXT_BTN = $("clr-wizard-button:nth-child(3)");
  JSON_RADIO = element(by.css("clr-radio-wrapper label[for='json']"));
  YAML_RADIO = element(by.css("clr-radio-wrapper label[for='yaml']"));
  CLOSE_TREE_MODAL_BTN = element(
    by.css("app-treeview-modal clr-icon[shape='close']")
  );
  WIZARD_NEXT_BTN = element(by.css("clr-wizard-button[type=next]"));
  WIZARD_CANCEL_BTN = element(by.buttonText("Back"));

  YES_RADIO = element(by.css("clr-radio-wrapper label[for=yes]"));
  ICON_PLUS = element.all(by.css("button cds-icon[shape=plus]"));

  LABEL_SELECTOR = element(by.css(".clr-select-wrapper:last-child"));
  LABEL_SELECTOR_OPTIONS = $$(
    ".clr-select-wrapper:last-child select option"
  ).filter(function (elem, index) {
    return elem.getText().then(function (text) {
      return text !== "";
    });
  });
  SELECT_COLUMN_DATA_GRID = element(
    by.css(".clr-col-12.clr-col-md-9 clr-datagrid")
  );
  LABEL_TRASH_ICONS = element.all(by.css("div > cds-icon.labelTrash"));
  EMAIL_TRASH_ICONS = element.all(
    by.css("#clr-wizard-page-5 cds-icon[shape=trash]")
  );

  SLACK_TRASH_ICONS = element.all(by.css("div > cds-icon.slackTrash"));

  SURE_BTN = element(by.css(".clr-wizard-btn--primary"));
  TAXONOMY_FILE_ERROR = element(by.css("cds-icon[shape=error-standard]"));
  TAXONOMY_FILE_CANCEL = element(by.css("cds-icon[shape=window-close]"));
  TREE_TOGGLE = element(by.css(".clr-toggle-wrapper"));
  ADD_LABEL_BTN = element(
    by.css("#clr-wizard-page-4 .btn.btn-sm.btn-link cds-icon[shape=plus]")
  );

  SELECT_QUESTION_SELECTOR = element(
    by.css("#clr-wizard-page-3 > div > div:nth-child(1) > div")
  );
  SELECT_QUESTION_SELECTOR_OPTION = $$(
    "#clr-wizard-page-3 div select option"
  ).filter(function (elem, index) {
    return elem.getText().then(function (text) {
      return text !== "";
    });
  });
  QA_QUESTION_TYPE = element(
    by.css("#clr-wizard-page-3 clr-radio-wrapper label[for=y]")
  );
  QA_CHAT_EXISTINGQA_LABEL_INPUT = element(
    by.css("clr-radio-wrapper label[for=yExistingQa]")
  );

  async navigateTo() {
    console.log("log-go to labeling task");
    await FunctionUtil.elementVisibilityOf(this.LABELING_TASK_NAV);
    await browser.waitForAngularEnabled(false);
    await this.LABELING_TASK_NAV.click();
    await FunctionUtil.elementVisibilityOf(this.CREATE_LABELING_TASK__NAV);
    await browser.waitForAngularEnabled(false);
    await this.CREATE_LABELING_TASK__NAV.click();
  }

  async clickNewProjectBtn(projectType) {
    await FunctionUtil.elementVisibilityOf(this.CREATE_PROJECT_BTN);
    await browser.waitForAngularEnabled(false);
    await this.CREATE_PROJECT_BTN.click();
    await FunctionUtil.elementVisibilityOf(projectType);
    await projectType.click();
  }

  async setProjectName(name: string, name_err?) {
    await FunctionUtil.elementVisibilityOf(this.PROJECT_NAME);
    if (name_err) {
      await this.PROJECT_NAME.clear();
      await this.PROJECT_NAME.sendKeys("");
      await this.PROJECT_NAME.sendKeys(protractor.Key.TAB);
      await browser.sleep(1000);
      await this.PROJECT_NAME.clear();
      await this.PROJECT_NAME.sendKeys(name_err);
      await this.PROJECT_NAME.sendKeys(protractor.Key.TAB);
    }
    await this.PROJECT_NAME.clear();
    await this.PROJECT_NAME.sendKeys(name);
  }

  async setTaskInstruction(instruction: string) {
    await FunctionUtil.elementVisibilityOf(this.TASK_INSTRUCTION);
    await this.TASK_INSTRUCTION.clear();
    await this.TASK_INSTRUCTION.sendKeys(instruction);
  }

  async selectProjectType(index) {
    await FunctionUtil.elementVisibilityOf(this.SELECT_PROJECT_TYPE);
    await this.SELECT_PROJECT_TYPE.click();
    await element
      .all(by.css("select[formcontrolname=projectType] option"))
      .get(index)
      .click();
  }

  clickUploadCSVBtn() {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.UPLOAD_CSV_BTN),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        this.UPLOAD_CSV_BTN.click();
      });
  }

  setLocalCSVPath(localCsvPath: string) {
    let path = process.cwd().replace("\\", "/") + localCsvPath;
    this.CHOOSE_FILE_BTN.sendKeys(path);
  }

  async selectTextTicketColumn() {
    await FunctionUtil.elementVisibilityOf(
      this.TICKET_COLUMN_CHECKBOX_FOR_TEXT
    );
    await this.TICKET_COLUMN_CHECKBOX_FOR_TEXT.click();
  }

  async selectMultipleTicketColumn(startIndex, endIndex) {
    await FunctionUtil.elementVisibilityOf(this.SELECT_COLUMN_DATA_GRID);
    this.TICKET_COLUMNS.then(async (column) => {
      for (let i = startIndex; i < endIndex; i++) {
        await column[i].click();
      }
    });
  }

  async selectLabels(labelIndex) {
    await FunctionUtil.elementVisibilityOf(this.LABEL_SELECTOR);
    await this.LABEL_SELECTOR.click();
    await this.LABEL_SELECTOR_OPTIONS.get(labelIndex).click();
  }

  // labelIndex start from 1
  async selectQuestionLabels(labelIndex) {
    console.log("log-start to set question");
    await FunctionUtil.elementVisibilityOf(this.SELECT_QUESTION_SELECTOR);
    await this.SELECT_QUESTION_SELECTOR.click();
    await browser.sleep(1000);
    await this.SELECT_QUESTION_SELECTOR_OPTION.get(labelIndex).click();
    console.log("log-end to set question");
  }

  // async selectQuestionText(textIndex) {
  //   console.log("log-start to set text");
  //   // await FunctionUtil.elementVisibilityOf(this.QA_TEXT_SELECTOR);
  //   // await this.QA_TEXT_SELECTOR.click();
  //   // await this.QA_TEXT_SELECTOR_OPTIONS.get(textIndex).click();
  //   await FunctionUtil.elementVisibilityOf(this.QA_TEXT_RADIOs[0]);
  //   await this.QA_TEXT_RADIOs.then(async (radios) => {
  //     radios.forEach(async (value, index) => {
  //       if (index === textIndex) {
  //         await this.FILE_SELECT_OPTION.get(index).click();
  //       }
  //     });
  //   });
  //   console.log("log-end to set text");
  // }

  async selectQuestionType() {
    console.log("log-start to set question type");
    await FunctionUtil.elementVisibilityOf(this.QA_QUESTION_TYPE);
    await this.QA_QUESTION_TYPE.click();
    console.log("log-end to set question type");
  }

  async setLabelValidation(labelColumn) {
    console.log("log-start to setLabelValidation...");
    await FunctionUtil.elementVisibilityOf(this.WIZARD_SELECT_BTN);
    await browser.waitForAngularEnabled(false);
    await this.WIZARD_SELECT_BTN.click();
    await FunctionUtil.elementVisibilityOf(this.WIZARD_SELECT_OPTIONS.get(0));
    await this.WIZARD_SELECT_OPTIONS.then(async (options) => {
      options.forEach(async (value, index) => {
        await this.WIZARD_SELECT_OPTIONS.get(index)
          .getText()
          .then(async (e) => {
            if (e.trim() === labelColumn) {
              await this.WIZARD_SELECT_OPTIONS.get(index).click();
            }
          });
      });
    });
    console.log("log-succeed to setLabelValidation...");
  }

  async clickOkBtn() {
    await FunctionUtil.elementVisibilityOf(this.UPLOAD_CSV_OK_BTN);
    await this.UPLOAD_CSV_OK_BTN.click();
  }

  async clickCancelBtn() {
    await FunctionUtil.elementVisibilityOf(this.UPLOAD_CSV_CANCEL_BTN);
    await this.UPLOAD_CSV_CANCEL_BTN.click();
  }

  async cancelTaxonomyFile() {
    await FunctionUtil.elementVisibilityOf(this.TAXONOMY_FILE_CANCEL);
    await this.TAXONOMY_FILE_CANCEL.click();
  }

  setMaxAnnotation(maxAnnotation) {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.MAX_ANNOTATIONS),
        Constant.DEFAULT_TIME_OUT
      )
      .then(async () => {
        await this.MAX_ANNOTATIONS.clear();
        await this.MAX_ANNOTATIONS.sendKeys(maxAnnotation);
      });
  }

  setNewLabel(label: any) {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.ICON_PLUS.get(1)),
        Constant.DEFAULT_TIME_OUT
      )
      .then(async () => {
        // await this.ADD_NEW_LABEL.clear();
        label.forEach(async (element, index) => {
          await this.ICON_PLUS.get(1).click();
          await this.ADD_NEW_LABEL.get(index + 1).sendKeys(element);
          await browser.sleep(1000);
        });
      });
  }

  setMultiLabels(labels) {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.ICON_PLUS.get(1)),
        Constant.DEFAULT_TIME_OUT
      )
      .then(async () => {
        // await this.ADD_NEW_LABEL.clear();
        labels.forEach(async (element, index) => {
          await this.ADD_NEW_LABEL.get(index).sendKeys(element);
          await browser.sleep(1000);
        });
      });
  }

  setNerExistingLabelNewLabel(label: any) {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.ICON_PLUS.get(1)),
        Constant.DEFAULT_TIME_OUT
      )
      .then(async () => {
        label.forEach(async (element) => {
          await this.ADD_NEW_LABEL.last().sendKeys(element);
          await browser.sleep(1000);
        });
      });
  }

  async setDuplicateLabel(duplicateLabel) {
    await this.ICON_PLUS.get(1).click();
    await FunctionUtil.elementVisibilityOf(this.ADD_NEW_LABEL.last());
    await this.ADD_NEW_LABEL.last().sendKeys(duplicateLabel);
    await browser.sleep(1000);
    await this.LABEL_TRASH_ICONS.last().click();
  }

  async deleteLabel(deleteLabel) {
    await this.ICON_PLUS.get(1).click();
    await FunctionUtil.elementVisibilityOf(this.ADD_NEW_LABEL.last());
    // await this.ADD_NEW_LABEL.clear();
    await this.ADD_NEW_LABEL.last().sendKeys(deleteLabel);
    // await FunctionUtil.pressEnter();
    await browser.sleep(3000);
    await FunctionUtil.click(this.LABEL_TRASH_ICONS.last());
  }

  async setNumericLabel(min, max) {
    console.log("log-start to set numeric label.");
    await FunctionUtil.elementVisibilityOf(this.NUMERIC_OPTION);
    await this.NUMERIC_OPTION.click();
    await FunctionUtil.elementVisibilityOf(this.MIN_LABEL_INPUT);
    await this.MIN_LABEL_INPUT.sendKeys(min);
    await this.MAX_LABEL_INPUT.sendKeys(max);
    await browser.waitForAngularEnabled(false);
    console.log("log-end to set numeric label.");
  }

  async allowMultiple() {
    await FunctionUtil.elementVisibilityOf(this.ADD_POP_LABEL);
    await this.ADD_POP_LABEL.click();
    await browser.waitForAngularEnabled(false);
  }

  async shiftLabelType() {
    console.log("log-start to shift label type.");
    await FunctionUtil.elementVisibilityOf(this.NUMERIC_OPTION);
    await this.NUMERIC_OPTION.click();
    await FunctionUtil.elementVisibilityOf(this.MIN_LABEL_INPUT);
    await FunctionUtil.elementVisibilityOf(this.TEXT_LABEL_TYPE_OPTION);
    await this.TEXT_LABEL_TYPE_OPTION.click();
    await FunctionUtil.elementVisibilityOf(this.ADD_NEW_LABEL.get(1));
    console.log("log-end to shift label type.");
  }

  async selectActiveLearningModel(alModelIndex) {
    await FunctionUtil.elementVisibilityOf(this.SELECT_AL_CLASSIFIER);
    await this.SELECT_AL_CLASSIFIER.click();
    await element
      .all(by.css("select[formcontrolname=selectedClassifier] option"))
      .get(alModelIndex)
      .click();
  }

  async selectQueryStrategy(index) {
    await FunctionUtil.elementVisibilityOf(this.SELECT_AL_QUERY_STRATEGY);
    await this.SELECT_AL_QUERY_STRATEGY.click();
    await element
      .all(by.css("select[formcontrolname=selectedqueryStrategy] option"))
      .get(index)
      .click();
  }

  async selectActiveLearningEncoder(alEncoderIndex) {
    await FunctionUtil.elementVisibilityOf(this.SELECT_AL_ENCODER);
    await this.SELECT_AL_ENCODER.click();
    await element
      .all(by.css("select[formcontrolname=selectedEncoder] option"))
      .get(alEncoderIndex)
      .click();
  }

  setAssignee(annotator1, annotator2?) {
    console.log("log-start to setAssignee annotator");
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.ASSIGNEE.first()),
        Constant.DEFAULT_TIME_OUT
      )
      .then(async () => {
        console.log("log-succeed to visibility of annotator");
        // await this.ASSIGNEE.clear();
        await this.ASSIGNEE.first().sendKeys(annotator1);
        await FunctionUtil.elementVisibilityOf(this.TICKETS_INPUT);
        if (Number(this.TICKETS_INPUT.getText()) > 40) {
          await this.TICKETS_INPUT.clear();
          await this.TICKETS_INPUT.sendKeys(40);
        }
        await browser.sleep(1000);
        // await FunctionUtil.pressEnter();
        if (annotator2) {
          await this.ICON_PLUS.last().click();
          await this.ASSIGNEE.last().sendKeys(annotator2);
          // await FunctionUtil.pressEnter();
        }
      });
  }

  setAssigneeForQaChat(annotator1) {
    console.log("log-start to setAssignee annotator");
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.ASSIGNEE.first()),
        Constant.DEFAULT_TIME_OUT
      )
      .then(async () => {
        console.log("log-succeed to visibility of annotator");
        // await this.ASSIGNEE.clear();
        await this.ASSIGNEE.first().sendKeys(annotator1);
      });
  }

  async setDuplicateAnnotator(annotator) {
    await this.ICON_PLUS.last().click();
    // await this.ASSIGNEE.clear();
    await this.ASSIGNEE.last().sendKeys(annotator);
    // await FunctionUtil.pressEnter();
    await browser.sleep(1000);
    // await this.ASSIGNEE.last().clear();
    await this.EMAIL_TRASH_ICONS.last().click();
  }

  async setAssignedTicket(value) {
    console.log("log-start to setAssignedTicket...");
    await this.ASSIGN_TICKET_INPUT.first().click();
    await this.ASSIGN_TICKET_INPUT.first().sendKeys(protractor.Key.DOWN);
    await this.ASSIGN_TICKET_INPUT.first().sendKeys(protractor.Key.TAB);
    console.log("log-succeed to setAssignedTicket...");
  }

  clickCreateBtn() {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.CREATE_BTN),
        Constant.DEFAULT_TIME_OUT
      )
      .then(async () => {
        // if (process.env.IN) {
        //   await browser.sleep(5000);
        //   await FunctionUtil.elementVisibilityOf(this.CREATE_BTN);
        // }
        await this.CREATE_BTN.click();
      })
      .then(async () => {
        console.log("log-succeed to clickCreateBtn");
        // await this.waitForUploadloading();
      });
  }

  async selectExistingFile(dsName) {
    await FunctionUtil.elementVisibilityOf(this.FILE_SELECT);
    await browser.waitForAngularEnabled(false);
    await this.FILE_SELECT.click();
    await FunctionUtil.elementVisibilityOf(this.FILE_SELECT_OPTION.get(0));
    await this.FILE_SELECT_OPTION.then(async (options) => {
      options.forEach(async (value, index) => {
        await this.FILE_SELECT_OPTION.get(index)
          .getText()
          .then(async (e) => {
            if (e === dsName) {
              await this.FILE_SELECT_OPTION.get(index).click();
            }
          });
      });
    });
  }

  async isShowFilename() {
    await FunctionUtil.elementVisibilityOf(this.YES_RADIO);
    await this.YES_RADIO.click();
  }

  async imageLoaded() {
    return browser.wait(
      ExpectedConditions.invisibilityOf(this.IMAGE_LOADING),
      Constant.DEFAULT_TIME_OUT
    );
  }

  async deleteAnnotator() {
    console.log("log-start to deleteAnnotator...");
    await FunctionUtil.click(this.EMAIL_TRASH_ICONS.last());
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to deleteAnnotator...");
  }

  async addMultiNumericLabel(label, min, max) {
    await FunctionUtil.elementVisibilityOf(this.ADD_LABEL_BTN);
    for (let i = 0; i < 2; i++) {
      await this.ADD_LABEL_BTN.click();
    }
    await this.setMultiNumericLabel(label, min, max);
  }

  async delMultiNumericLabel() {
    console.log("log-start to delete MultiNumericLabel...");
    element
      .all(by.css("cds-icon[shape=trash]"))
      .each(async function (element, index: any) {
        if (index < 2) {
          await element?.click();
        }
      });
    console.log("log-succeed to delete MultiNumericLabel...");
  }

  async setMultiNumericLabel(label, min, max) {
    console.log("log-start to setMultiNumericLabel...");
    await FunctionUtil.elementVisibilityOf(this.MULTI_LABEL_INPUT);
    element
      .all(by.css("#clr-wizard-page-4 input[type=text]"))
      .each(async function (element, index) {
        await element?.sendKeys(label + index);
      });
    element
      .all(
        by.css("#clr-wizard-page-4 input[placeholder='Enter minimum value']")
      )
      .each(async function (element) {
        await element?.sendKeys(min);
      });
    element
      .all(
        by.css("#clr-wizard-page-4 input[placeholder='Enter maximum value']")
      )
      .each(async function (element) {
        await element?.sendKeys(max);
      });
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to setMultiNumericLabel...");
  }

  async setPopLabel() {
    await browser.sleep(5000);
    console.log("log-start to setPopLabel...");
    await this.SHOW_POP_LABEL_CHECK.click();
    await FunctionUtil.operationSuspensionElements(
      this.DELETE_POP_LABEL,
      this.DELETE_POP_LABEL
    );
    await browser.sleep(2000);
    await this.ICON_PLUS.get(2).click();
    await this.ADD_NEW_LABEL.last().clear();
    await this.ADD_NEW_LABEL.last().sendKeys("Neutral");
    console.log("log-end to setPopLabel...");
  }

  async clickWizardNext() {
    browser.sleep(2000);
    console.log("log-start to clickWizardNext");
    await FunctionUtil.elementVisibilityOf(this.WIZARD_NEXT_BTN);
    await this.WIZARD_NEXT_BTN.click();
    console.log("log-succeed to clickWizardNext");
  }

  async clickWizardCancel() {
    console.log("log-start to clickWizardCancel");
    let btn = $("clr-wizard-button[type='cancel']");
    await FunctionUtil.elementVisibilityOf(btn);
    await btn.click();
    console.log("log-succeed to clickWizardCancel");
  }

  async clickWizardBack() {
    browser.sleep(500);
    console.log("log-start to clickWizardBack");
    await FunctionUtil.elementVisibilityOf(this.WIZARD_CANCEL_BTN);
    await this.WIZARD_CANCEL_BTN.click();
    console.log("log-succeed to clickWizardBack");
  }

  async uploadTaxonomyFile(path: string) {
    await FunctionUtil.elementVisibilityOf(this.CHOOSE_FILE_LABEL);
    await this.setLocalCSVPath(path);
  }

  async changeYamlToJSON() {
    console.log("log-change back to json");
    await FunctionUtil.elementVisibilityOf(this.JSON_RADIO);
    await this.JSON_RADIO.click();
  }

  async changeJsonToYaml() {
    console.log("log-change format to yaml");
    await FunctionUtil.elementVisibilityOf(this.YAML_RADIO);
    await this.YAML_RADIO.click();
  }

  async toPreviewTreeLabel() {
    console.log("log-start toPreviewTreeLabel");
    await FunctionUtil.elementVisibilityOf(this.TREE_TOGGLE);
    await this.TREE_TOGGLE.click();
    console.log("log-succeed toPreviewTreeLabel");
  }

  async clickNextBtn() {
    await FunctionUtil.elementVisibilityOf(this.WIZARD_NEXT_BTN);
    await this.WIZARD_NEXT_BTN.click();
    console.log("log-go to next page");
  }

  async clickSureBtn() {
    await FunctionUtil.elementVisibilityOf(this.SURE_BTN);
    await this.SURE_BTN.click();
  }

  async hasExistingQA() {
    await FunctionUtil.elementVisibilityOf(this.QA_CHAT_EXISTINGQA_LABEL_INPUT);
    await this.QA_CHAT_EXISTINGQA_LABEL_INPUT.click();
  }
}
