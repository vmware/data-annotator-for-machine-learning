/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Constant } from "../general/constant";
import { browser, $$, $, ExpectedConditions, by, element } from "protractor";
import { CommonPage } from "../general/common-page";
import { FunctionUtil } from "../utils/function-util";
import { protractor } from "protractor/built/ptor";
const projectCreateData = require("../resources/project-create-page/test-data");

export class AnnotatePage extends CommonPage {
  LABELS_TOOLTIP = $(".clr-form-group.category .label-tooltip");
  PROJECTS_NAME = $('select[ng-reflect-name="selectProject"]');
  PROJECT_INFOS = $$(".left-project-info div");
  PROGRESS_POLITE = $('.left-project-info span[aria-live="polite"]');
  HISTORY_LISTS = $$(".historyBox .historyPosition");
  LABELS_SELECT = $('select[formcontrolname="category"]');
  ANNOTATE_SUBMIT_BTN = $("button.btn.submit");
  PROJECT_TABLE = $(".datagrid-host .datagrid");
  ANNOTATE_COMPLETE_MSG = $(".modal-content .alert-icon-wrapper");
  // ANNOTATE_OK_BTN = $(".modal-footer .btn.btn-primary");
  NAV_TASK_LIST = element(by.css('a[href="/loop/project/list"]'));
  START_ANNOTATE = $('button[title="Start Annotate"]');
  ANNOTATE_GREEN_BTN = element(by.css("button.btn.labels.label0.green"));
  FLAG = element(by.css("cds-icon[shape=flag]"));
  TEXT_TICKET_AREA = element(by.css(".textBox p.question-paragraph"));
  MULTIPLE_LABELS = element.all(by.css(".labelCheckbox label"));
  NUMERIC_LABEL_INPUT = element(by.css("input[id=example]"));
  SKIP_BTN = element(by.css("button.btn cds-icon[shape=ban]"));
  PASS_BTN = element(by.css("button.btn cds-icon[shape=checkbox-list]"));
  NER_SELECTED_LABEL = element(by.css("button.btn.entitySelected"));
  NER_SECOND_LABEL = element(by.css(".questionContainer .label:nth-child(2)"));
  MAIN_TEXT = element(by.css("div.nerPassage span[id=mainText]"));
  NER_SELECTED_MARK_TEXT = element(
    by.css("div.selectedSection div.spanSelected:first-child .selectText")
  );
  NER_SELECTED_MARK_CLEAR = element(
    by.css("div.selectedSection div.spanSelected:first-child span.clear")
  );
  NER_MARK = element.all(by.css("div.spanSelected"));
  BACK_BTN = element.all(by.css("button.btn cds-icon[shape=angle]"));
  NER_TICKET_AREA = element(by.css(".questionContainer .nerBox"));
  LOG_FILTER_SELECT = element(by.css("select.filterSelect"));
  LOG_FILTER_SELECT_OPTIONS = element.all(by.css("select.filterSelect option"));
  LOG_FILTER_INPUT = element(by.css("input.filterText"));
  LOG_TICKET_AREA = element(by.css(".questionContainer .txtBox"));
  ROW_LOG_FREETEXT_INPUT = element(by.css("input.singleFreetext"));
  LOG_FREETEXT = element(by.css('textarea[formcontrolname="logFreeText"]'));
  LOG_FILTER_WORD = element(by.css("div.filterBox span.filterLabel"));
  LOG_LINES_INDEX_ICON = element.all(
    by.css(
      ".questionContainer .txtBox .rowIndex cds-icon[shape=ellipsis-vertical]"
    )
  );
  LOG_LINES_P = element.all(by.css(".questionContainer .txtBox .txtRow"));
  REVIEW_BUTTON = $('button[title="Start Review"]');
  LOG_FILENAME_INPUT = element(
    by.css('ng-select[notfoundtext="No file found"] div.ng-input input')
  );
  LOG_CURRENT_FILENAME = element(
    by.css('ng-select[notfoundtext="No file found"] span.ng-value-label')
  );
  LOG_FILENAME_DROPDOWN = element.all(
    by.css("ng-dropdown-panel div.ng-option span.ng-option-label")
  );
  LOG_LINES_INDEX_FIRSTICON = element(
    by.css(
      ".questionContainer .txtBox .txtRow0 cds-icon[shape=ellipsis-vertical]"
    )
  );
  CANVAS = element(by.css("canvas"));
  IMAGE_LABEL = element.all(by.css("span.ant-tag")).get(0);
  IMAGE_LABEL2 = element.all(by.css("span.ant-tag")).get(2);
  IMAGE_FIVE_BTN = element.all(by.css("div.panel button")).get(1);
  IMAGE_TRASH_BTN = element.all(by.css("div.panel button")).get(2);
  IMAGE_EEFRESH_BTN = element.all(by.css("div.panel button")).get(3);
  WRAP_BTN = element(by.css('div.editBar button[title="Wrap Text"]'));
  DISPLAY_SELECT = element(by.css("select[formcontrolname='renderFormat']"));
  DISPLAY_SELECT_OPTIONS = element.all(
    by.css("select[formcontrolname='renderFormat'] option")
  );
  PROJECT_SELECT = element(by.css("select[formcontrolname='selectProject']"));
  PROJECT_SELECT_OPTIONS = element.all(
    by.css("select[formcontrolname='selectProject'] option")
  );
  EXIT_BTN = element(by.css("button.btn.btn-primary.btn-danger"));
  ASSIGNMENT_LOGIC_RADIO = element(
    by.css("clr-radio-wrapper label[for='sequential']")
  );
  LOG_SECOND_LABEL = element(by.buttonText("test2"));
  MULTIPLE_SLIDERS = element.all(by.css(".labelCheckbox ngx-slider"));
  SCORE_INPUT = element.all(by.css("input[id='scoreInput']"));
  ALERT_TEXT = element(by.css("div.alert-text"));
  INPUT_ERROR = element(by.css(".clr-error"));
  NER_CLICK_SPAN1 = $("span[id=mainText] .spanMarked[data-label=test1]");
  NER_CLICK_SPAN2 = $("span[id=mainText] .spanMarked[data-label=label1]");
  POSITIVE_BTN = $("button[title=Positive]");
  NEGATIVE_BTN = $("button[title=Negative]");
  CLEAR_POPUP_WIN = $("div .clearPop");
  DRAWER_BTN = $("div .drawer");
  EXPAND_TREE_TOGGLE = element(by.css("clr-toggle-wrapper label"));
  HIERARCHICAL_LABEL_FIRST = element(
    by.css("clr-tree-node .clr-treenode-checkbox label")
  );
  MODAL_OK_BTN = element(by.css(".modal-dialog .modal-content-wrapper button"));
  FIRST_PROJECT_NAME_CELL = $(
    '.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"]:nth-of-type(1)'
  );
  ACTION_ICONS = element.all(
    by.css("button cds-icon[shape=ellipsis-vertical]")
  );
  ACTION_BUTTONS = element.all(by.css(".datagrid-action-overflow button"));
  REVIEWER_SELECT = element(
    by.css(".left-project-info .clr-select-wrapper select")
  );
  REVIEWER_SELECT_OPTION = element.all(
    by.css(".left-project-info .clr-select-wrapper select option")
  );
  BACK_LIST_BTN = element(by.css("app-project-analyze cds-icon[shape=arrow]"));

  async navigateTo() {
    await FunctionUtil.elementVisibilityOf(this.NAV_TASK_LIST);
    await browser.waitForAngularEnabled(false);
    await this.NAV_TASK_LIST.click();
  }

  async clickTaskName() {
    // this.PROJECT_TABLE.scrollLeft = this.PROJECT_TABLE.scrollWidth;
    await FunctionUtil.elementVisibilityOf(this.FIRST_PROJECT_NAME_CELL);
    await browser.waitForAngularEnabled(false);
    await this.FIRST_PROJECT_NAME_CELL.click();
  }

  async getProjectInfo() {
    let infos = { name: "", owner: "", source: "", instruction: "" };
    return this.PROJECT_INFOS.then(async (list) => {
      infos.name = await list[3].getText();
      infos.owner = await list[4].getText();
      infos.source = await list[5].getText();
      infos.instruction = await list[9].getText();
      console.log("log-getProjectInfo:", infos);
      return infos;
    });
  }

  async getReviewProjectInfo() {
    let infos = { name: "", owner: "", source: "", instruction: "" };
    return this.PROJECT_INFOS.then(async (list) => {
      infos.name = await list[6].getText();
      infos.owner = await list[7].getText();
      infos.source = await list[8].getText();
      infos.instruction = await list[12].getText();
      console.log("log-getProjectInfo:", infos);
      return infos;
    });
  }

  async getReviewProgress() {
    let result = { sessions: "", reviews: "" };
    return this.PROJECT_INFOS.then(async (list) => {
      result.sessions = await list[1].getText();
      result.reviews = await list[0].getText();
      console.log("log-getProgress info:", result);
      return result;
    });
  }

  async getProgress() {
    let result = { sessions: "", annotations: "" };
    return this.PROJECT_INFOS.then(async (list) => {
      result.sessions = await list[2].getText();
      result.annotations = await list[0].getText();
      console.log("log-getProgress info:", result);
      return result;
    });
  }

  getHistoryLists() {
    return this.HISTORY_LISTS.count();
  }

  async selectDisplay(index) {
    await FunctionUtil.elementVisibilityOf(this.DISPLAY_SELECT);
    await browser.waitForAngularEnabled(false);
    await this.DISPLAY_SELECT.click();
    await this.DISPLAY_SELECT_OPTIONS.get(index).click();
  }

  async selectProjects(pname) {
    await FunctionUtil.click(this.PROJECT_SELECT);
    await (
      await this.PROJECT_SELECT.$$("option")
    ).forEach(async (value, index) => {
      if ((await FunctionUtil.getValue(value)) == pname) {
        await FunctionUtil.click(value);
      }
    });
  }

  async selectAnnotateLabel() {
    await FunctionUtil.elementVisibilityOf(this.ANNOTATE_GREEN_BTN);
    await browser.waitForAngularEnabled(false);
    await this.ANNOTATE_GREEN_BTN.click();
  }

  async selectAnnotateLabelInDropdown() {
    return browser
      .wait(
        ExpectedConditions.visibilityOf(this.LABELS_SELECT),
        Constant.DEFAULT_TIME_OUT
      )
      .then(() => {
        this.LABELS_SELECT.element(
          by.cssContainingText("option", "test1")
        ).click();
      });
  }

  async selectMultipleLabel() {
    this.MULTIPLE_LABELS.then(async (labels) => {
      labels.forEach(async (element) => {
        await element.click();
      });
    });
    await browser.waitForAngularEnabled(false);
    await browser.sleep(1000);
    await this.ANNOTATE_SUBMIT_BTN.click();
  }

  async selectMultipleLabelNotSubmit() {
    this.MULTIPLE_LABELS.then(async (labels) => {
      labels.forEach(async (element, index) => {
        if (index === 0) await element.click();
      });
    });
    await browser.waitForAngularEnabled(false);
    await browser.sleep(1000);
  }

  async inputNumericLabel() {
    await FunctionUtil.elementVisibilityOf(this.NUMERIC_LABEL_INPUT);
    await browser.waitForAngularEnabled(false);
    await this.NUMERIC_LABEL_INPUT.sendKeys(5);
    await FunctionUtil.pressEnter();
  }

  async inputNumericLabelNotSubmit(number) {
    await FunctionUtil.elementVisibilityOf(this.NUMERIC_LABEL_INPUT);
    await browser.waitForAngularEnabled(false);
    await this.NUMERIC_LABEL_INPUT.sendKeys(number);
  }

  annotateNer = async () => {
    await FunctionUtil.elementVisibilityOf(this.NER_SELECTED_LABEL);
    await this.NER_MARK.then(async (marks) => {
      // to check whether there already has existing labels
      console.log("log-marks:::", marks.length);
      if (marks.length > 0) {
        await this.skipTicket();
        await this.waitForPageLoading();
        await browser.sleep(2000);
        await this.annotateNer();
      } else {
        await FunctionUtil.elementVisibilityOf(this.MAIN_TEXT);
        FunctionUtil.mouseDragMove(
          this.MAIN_TEXT,
          { x: 0, y: 0 },
          { x: 100, y: 0 }
        );
        await browser.sleep(1000);
        await browser.waitForAngularEnabled(false);
        await browser.sleep(2000);
        await FunctionUtil.elementVisibilityOf(this.NER_SECOND_LABEL);
        await this.NER_SECOND_LABEL.click();
        await browser.sleep(1000);
        FunctionUtil.mouseDragMove(
          this.MAIN_TEXT,
          { x: 50, y: 0 },
          { x: 150, y: 0 }
        );
        await browser.waitForAngularEnabled(false);
        await browser.sleep(5000);
        await this.setPopupLabel();
        await this.clearPopupLabel();
        await browser.sleep(5000);
        console.log("log-start to click submit");
        await FunctionUtil.elementVisibilityOf(this.ANNOTATE_SUBMIT_BTN);
        await this.ANNOTATE_SUBMIT_BTN.click();
        console.log("log-finish ner annotate");
      }
    });
  };

  setPopupLabel = async () => {
    console.log("log-start to set popup label");
    await FunctionUtil.elementVisibilityOf(this.NER_CLICK_SPAN1);
    await this.NER_CLICK_SPAN1.click();
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.POSITIVE_BTN);
    await this.POSITIVE_BTN.click();
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.NER_CLICK_SPAN2);
    await this.NER_CLICK_SPAN2.click();
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.NEGATIVE_BTN);
    await this.NEGATIVE_BTN.click();
    console.log("log-end to set popup label");
  };

  setReviewPopupLabel = async () => {
    console.log("log-start review to set popup label");
    await FunctionUtil.elementVisibilityOf(this.NER_CLICK_SPAN1);
    await this.NER_CLICK_SPAN1.click();
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.POSITIVE_BTN);
    await this.POSITIVE_BTN.click();
    console.log("log-end review to set popup label");
  };

  clearPopupLabel = async () => {
    console.log("log-start to set clear popupLabel");
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.NER_CLICK_SPAN2);
    await this.NER_CLICK_SPAN2.click();
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.CLEAR_POPUP_WIN);
    await this.CLEAR_POPUP_WIN.click();
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.NER_CLICK_SPAN2);
    await this.NER_CLICK_SPAN2.click();
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.DRAWER_BTN);
    await this.DRAWER_BTN.click();
    await browser.sleep(1000);
    await FunctionUtil.elementVisibilityOf(this.DRAWER_BTN);
    await this.DRAWER_BTN.click();
    console.log("log-end to set clear popupLabel");
  };

  async logFilterByKeyword(filter) {
    console.log("log-start to logFilterByKeyword....");
    await FunctionUtil.elementVisibilityOf(this.LOG_FILTER_SELECT);
    await FunctionUtil.elementVisibilityOf(this.LOG_FILTER_INPUT);
    await browser.waitForAngularEnabled(false);
    await this.LOG_FILTER_INPUT.sendKeys(filter);
    await FunctionUtil.pressEnter();
    console.log("log-succeed to logFilterByKeyword");
  }

  async logFilterByRegex(filter1, filter2) {
    console.log("log-start to logFilterByRegex....");
    await FunctionUtil.elementVisibilityOf(this.LOG_FILTER_SELECT);
    await FunctionUtil.elementVisibilityOf(this.LOG_FILTER_INPUT);
    await browser.waitForAngularEnabled(false);
    await this.LOG_FILTER_SELECT.click();
    await this.LOG_FILTER_SELECT_OPTIONS.get(1).click();
    await this.LOG_FILTER_INPUT.sendKeys(filter1);
    await FunctionUtil.pressEnter();
    await this.LOG_FILTER_INPUT.clear();
    await this.LOG_FILTER_INPUT.sendKeys(filter2);
    await this.LOG_FILTER_INPUT.sendKeys(protractor.Key.TAB);
    await browser.waitForAngularEnabled(false);
    console.log("log-succeed to logFilterByRegex");
  }

  async getFilterWords() {
    await FunctionUtil.elementVisibilityOf(this.LOG_FILTER_WORD);
    return await this.LOG_FILTER_WORD.getText();
  }

  async deleteFilterWords() {
    console.log("log-start to deleteFilterWords....");
    await FunctionUtil.elementVisibilityOf(this.LOG_FILTER_WORD);
    await this.LOG_FILTER_WORD.click();
    await browser.wait(
      ExpectedConditions.invisibilityOf(this.LOG_FILTER_WORD),
      Constant.DEFAULT_TIME_OUT
    );
    console.log("log-succeed to deleteFilterWords");
  }

  async getTotalLogLines() {
    return await this.LOG_LINES_INDEX_ICON.count();
  }

  async submitLogAnnotate() {
    await FunctionUtil.elementVisibilityOf(this.ANNOTATE_SUBMIT_BTN);
    await this.ANNOTATE_SUBMIT_BTN.click();
  }

  async annotateLog() {
    return await this.LOG_LINES_P.then(async (p) => {
      await p[0].click();
      await p[1].click();
      await FunctionUtil.elementVisibilityOf(this.ANNOTATE_SUBMIT_BTN);
      console.log("log-succeed to annotate log");
    });
  }

  async annotateLogAndNotSubmit() {
    return await this.LOG_LINES_P.then(async (p) => {
      await p[0].click();
      await p[1].click();
    });
  }

  async deleteLog() {
    return await this.LOG_LINES_P.then(async (p) => {
      await p[1].click();
      // await FunctionUtil.elementVisibilityOf(this.ANNOTATE_SUBMIT_BTN);
      console.log("log-succeed to deleteLog");
    });
  }

  async addRowFreeText(rowFreeText) {
    return await this.LOG_LINES_INDEX_ICON.then(async (icon) => {
      await icon[0].click();
      await FunctionUtil.elementVisibilityOf(this.ROW_LOG_FREETEXT_INPUT);
      await this.ROW_LOG_FREETEXT_INPUT.sendKeys(rowFreeText);
      console.log("log-succeed to addRowFreeText");
    });
  }

  async addLogFreeText(logFreeText) {
    await FunctionUtil.elementVisibilityOf(this.LOG_FREETEXT);
    await this.LOG_FREETEXT.sendKeys(logFreeText);
    console.log("succeed to addLogFreeText");
  }

  async reviewRowFreeText(freetext) {
    console.log("log-start to review rowFreeText");
    await FunctionUtil.elementVisibilityOf(this.LOG_LINES_INDEX_FIRSTICON);
    await this.LOG_LINES_INDEX_FIRSTICON.click();
    await this.ROW_LOG_FREETEXT_INPUT.clear();
    await this.ROW_LOG_FREETEXT_INPUT.sendKeys(freetext);
    console.log("log-succeed to review rowFreeText");
  }

  async reviewLogFreeText(freetext) {
    console.log("log-start to review logFreeText");
    await FunctionUtil.elementVisibilityOf(this.LOG_FREETEXT);
    await this.LOG_FREETEXT.clear();
    await this.LOG_FREETEXT.sendKeys(freetext);
    console.log("log-succeed to review logFreeText");
  }

  async passLog() {
    console.log("log-start to pass....");
    await FunctionUtil.elementVisibilityOf(this.PASS_BTN);
    await browser.waitForAngularEnabled(false);
    await this.PASS_BTN.click();
  }

  async backToPrevious() {
    console.log("log-start to back to previous....");
    await FunctionUtil.elementVisibilityOf(this.BACK_BTN.first());
    await browser.waitForAngularEnabled(false);
    await this.BACK_BTN.first().click();
    console.log("log-finish to click previous btn....");
  }

  async removeAnnotatedNer() {
    await FunctionUtil.elementVisibilityOf(this.NER_SELECTED_MARK_TEXT);
    await this.NER_SELECTED_MARK_TEXT.click();
    await browser.sleep(2000);
    await browser.actions().mouseMove(this.NER_SELECTED_MARK_TEXT).perform();
    await FunctionUtil.elementVisibilityOf(this.NER_SELECTED_MARK_CLEAR);
    await this.NER_SELECTED_MARK_CLEAR.click();
    await browser.waitForAngularEnabled(false);
    await this.backToPrevious();
    await FunctionUtil.elementVisibilityOf(this.ALERT_TEXT);
    await browser.sleep(2000);
    await browser.waitForAngularEnabled(false);
    await FunctionUtil.elementVisibilityOf(this.ANNOTATE_SUBMIT_BTN);
    await this.ANNOTATE_SUBMIT_BTN.click();
  }

  async flagTicket() {
    await FunctionUtil.elementVisibilityOf(this.FLAG);
    await browser.waitForAngularEnabled(false);
    await this.FLAG.click();
  }

  async skipTicket() {
    await FunctionUtil.elementVisibilityOf(this.SKIP_BTN);
    await browser.waitForAngularEnabled(false);
    await this.SKIP_BTN.click();
  }

  async passTicket() {
    await FunctionUtil.elementVisibilityOf(this.PASS_BTN);
    await browser.waitForAngularEnabled(false);
    await this.PASS_BTN.click();
  }

  async currentTicketContent() {
    await FunctionUtil.elementVisibilityOf(this.TEXT_TICKET_AREA);
    await browser.waitForAngularEnabled(false);
    return this.TEXT_TICKET_AREA.getText() as Promise<string>;
  }

  async currentNerTicketContent() {
    await FunctionUtil.elementVisibilityOf(this.NER_TICKET_AREA);
    await browser.waitForAngularEnabled(false);
    return this.NER_TICKET_AREA.getText() as Promise<string>;
  }

  async currentLogTicketContent() {
    await FunctionUtil.elementVisibilityOf(this.LOG_TICKET_AREA);
    await browser.waitForAngularEnabled(false);
    return this.LOG_TICKET_AREA.getText() as Promise<string>;
  }

  async clickReviewBtn() {
    // this.PROJECT_TABLE.scrollLeft = this.PROJECT_TABLE.scrollWidth;
    await FunctionUtil.elementVisibilityOf(this.ACTION_ICONS.first());
    await browser.waitForAngularEnabled(false);
    await this.ACTION_ICONS.first().click();
    await browser.sleep(1000);
    await this.ACTION_BUTTONS.first().click();
  }

  async selectFilename() {
    console.log("log-start to select a different txt file");
    await FunctionUtil.elementVisibilityOf(this.LOG_CURRENT_FILENAME);
    let currentFilename = await this.LOG_CURRENT_FILENAME.getText();
    await browser.waitForAngularEnabled(false);
    await this.LOG_FILENAME_INPUT.click();
    await this.LOG_FILENAME_DROPDOWN.then(async (options) => {
      for (let i = 0; i < options.length; i++) {
        if (options[i].getText() !== currentFilename) {
          await options[i].click();
          break;
        }
      }
    });
    console.log("log-succeed to select a different txt file");
  }

  async annotateImage() {
    console.log("log-start to annotate image");
    await FunctionUtil.elementVisibilityOf(this.IMAGE_LABEL);
    await this.IMAGE_LABEL.click();
    await FunctionUtil.elementVisibilityOf(this.CANVAS);
    await FunctionUtil.mouseDragMove(
      this.CANVAS,
      projectCreateData.ImageProject.firstStart,
      projectCreateData.ImageProject.firstEnd
    );
    await FunctionUtil.mouseDragMove(
      this.CANVAS,
      projectCreateData.ImageProject.secondStart,
      projectCreateData.ImageProject.secondEnd
    );
    await this.deleteImageRectLabelDom();
    await FunctionUtil.elementVisibilityOf(this.ANNOTATE_SUBMIT_BTN);
    await this.ANNOTATE_SUBMIT_BTN.click();
    console.log("log-finish to annotate image");
  }

  async annotateImgByPoly() {
    await FunctionUtil.elementVisibilityOf(this.IMAGE_FIVE_BTN);
    await this.IMAGE_FIVE_BTN.click();
    await FunctionUtil.elementVisibilityOf(this.IMAGE_LABEL2);
    await this.IMAGE_LABEL2.click();
    await browser.sleep(2000);
    await FunctionUtil.elementVisibilityOf(this.CANVAS);
    await FunctionUtil.mouseDownToClick(this.CANVAS, { x: 30, y: 30 });
    await FunctionUtil.mouseDownToClick(this.CANVAS, { x: 40, y: 40 });
    await FunctionUtil.mouseDownToClick(this.CANVAS, { x: 20, y: 40 });
    await FunctionUtil.mouseDownToClick(this.CANVAS, { x: 30, y: 30 });
    await browser.sleep(2000);
    await FunctionUtil.elementVisibilityOf(this.ANNOTATE_SUBMIT_BTN);
    await this.ANNOTATE_SUBMIT_BTN.click();
  }

  async annotateImgByPolyNotSubmit() {
    await FunctionUtil.elementVisibilityOf(this.IMAGE_FIVE_BTN);
    await this.IMAGE_FIVE_BTN.click();
    await FunctionUtil.elementVisibilityOf(this.IMAGE_LABEL2);
    await this.IMAGE_LABEL2.click();
    await browser.sleep(2000);
    await FunctionUtil.elementVisibilityOf(this.CANVAS);
    await FunctionUtil.mouseDownToClick(this.CANVAS, { x: 20, y: 20 });
    await FunctionUtil.mouseDownToClick(this.CANVAS, { x: 50, y: 50 });
    await FunctionUtil.mouseDownToClick(this.CANVAS, { x: 10, y: 50 });
    await FunctionUtil.mouseDownToClick(this.CANVAS, { x: 20, y: 20 });
    await browser.sleep(2000);
  }

  async annotateImgByRectNotSubmit() {
    await FunctionUtil.elementVisibilityOf(this.IMAGE_LABEL);
    await this.IMAGE_LABEL.click();
    await FunctionUtil.elementVisibilityOf(this.CANVAS);
    await FunctionUtil.mouseDragMove(
      this.CANVAS,
      projectCreateData.ImageProject.firstStart,
      projectCreateData.ImageProject.firstEnd
    );
    await FunctionUtil.mouseDragMove(
      this.CANVAS,
      projectCreateData.ImageProject.secondStart,
      projectCreateData.ImageProject.secondEnd
    );
    await browser.sleep(2000);
  }

  async deleteImageRectLabelDom() {
    console.log("log-start to deleteImageRectLabelDom");
    await FunctionUtil.mouseMoveToClick(
      this.CANVAS,
      projectCreateData.ImageProject.deletePosition
    );
    await FunctionUtil.elementVisibilityOf(this.IMAGE_TRASH_BTN);
    await browser.waitForAngularEnabled(false);
    await this.IMAGE_TRASH_BTN.click();
    await browser.sleep(1000);
    console.log("log-finish to deleteImageRectLabelDom");
  }

  async wrapLogRow() {
    await FunctionUtil.elementVisibilityOf(this.WRAP_BTN);
    await this.WRAP_BTN.click();
  }

  async exitAnnotatePage() {
    await FunctionUtil.elementVisibilityOf(this.EXIT_BTN);
    await browser.waitForAngularEnabled(false);
    await this.EXIT_BTN.click();
  }

  async shiftReviewAssignmentLogic() {
    await FunctionUtil.elementVisibilityOf(this.ASSIGNMENT_LOGIC_RADIO);
    await browser.waitForAngularEnabled(false);
    await this.ASSIGNMENT_LOGIC_RADIO.click();
  }

  async findLogLine(index: number) {
    return element(by.css(`span.logLine-${index}`));
  }

  async dragAnnotateLog(el1, el2) {
    await FunctionUtil.mouseDragAnnotate(el1, el2);
  }

  async changeLogLabel() {
    await FunctionUtil.elementVisibilityOf(this.LOG_SECOND_LABEL);
    await this.LOG_SECOND_LABEL.click();
    await browser.waitForAngularEnabled(false);
  }

  async clickHistoryBack() {
    await FunctionUtil.elementVisibilityOf(this.HISTORY_LISTS.first());
    await this.HISTORY_LISTS.first().click();
    await browser.waitForAngularEnabled(false);
  }

  async selectMultipleNumericLabel(sliderValue) {
    this.MULTIPLE_LABELS.then(async (labels) => {
      labels.forEach(async (element) => {
        await element.click();
      });
    });
    this.MULTIPLE_SLIDERS.then(async (sliders) => {
      sliders.forEach(async (slider) => {
        await browser
          .actions()
          .dragAndDrop(slider, { x: sliderValue, y: 0 })
          .perform();
      });
    });
    await browser.waitForAngularEnabled(false);
    await browser.sleep(1000);
    if (process.env.IN) {
      await FunctionUtil.elementVisibilityOf(this.ANNOTATE_SUBMIT_BTN);
      await browser.actions().mouseMove(this.ANNOTATE_SUBMIT_BTN).perform();
    }
    await this.ANNOTATE_SUBMIT_BTN.click();
  }

  async selectMultipleNumericLabelNotSubmit(sliderValue) {
    this.MULTIPLE_SLIDERS.then(async (sliders) => {
      sliders.forEach(async (slider) => {
        await browser
          .actions()
          .dragAndDrop(slider, { x: sliderValue, y: 0 })
          .perform();
      });
    });
    await browser.waitForAngularEnabled(false);
    await browser.sleep(1000);
  }

  async setMultipleNumericByInput(inputValue) {
    this.MULTIPLE_LABELS.then(async (labels) => {
      labels.forEach(async (element) => {
        await element.click();
      });
    });
    this.SCORE_INPUT.then(async (inputs) => {
      inputs.forEach(async (input) => {
        await input.sendKeys(inputValue);
      });
    });
    await browser.waitForAngularEnabled(false);
    if (process.env.IN) {
      await FunctionUtil.elementVisibilityOf(this.ANNOTATE_SUBMIT_BTN);
      await browser.actions().mouseMove(this.ANNOTATE_SUBMIT_BTN).perform();
    }
    await this.ANNOTATE_SUBMIT_BTN.click();
    await FunctionUtil.elementVisibilityOf(this.INPUT_ERROR);
    await browser.sleep(2000);
    this.SCORE_INPUT.then(async (inputs) => {
      inputs.forEach(async (input) => {
        await input.clear();
        await input.sendKeys(inputValue);
      });
    });
    if (process.env.IN) {
      await FunctionUtil.elementVisibilityOf(this.ANNOTATE_SUBMIT_BTN);
      await browser.actions().mouseMove(this.ANNOTATE_SUBMIT_BTN).perform();
    }
    await this.ANNOTATE_SUBMIT_BTN.click();
  }

  async toExpandTree() {
    await FunctionUtil.elementVisibilityOf(this.EXPAND_TREE_TOGGLE);
    await this.EXPAND_TREE_TOGGLE.click();
    console.log("log-succeed to expand tree");
    await browser.sleep(1000);
    await this.EXPAND_TREE_TOGGLE.click();
    console.log("log-succeed to collapse tree");
  }

  // async toResizeTextArea(height) {
  //   console.log("log-start toResizeTextArea");
  //   browser.executeScript('$(".textBox").height(500)').then(function () {
  //     $(".textBox")
  //       .getSize()
  //       .then(function (eleSize) {
  //         console.log("log-textBox element size: " + eleSize);
  //         expect(eleSize.height).toEqual(height);
  //       });
  //   });
  // }

  async selectHierarchicalLabel() {
    await FunctionUtil.elementVisibilityOf(this.HIERARCHICAL_LABEL_FIRST);
    await this.HIERARCHICAL_LABEL_FIRST.click();
    await browser.waitForAngularEnabled(false);
    await browser.sleep(1000);
    await this.ANNOTATE_SUBMIT_BTN.click();
  }

  async selectHierarchicalLabelNotSubmit() {
    await FunctionUtil.elementVisibilityOf(this.HIERARCHICAL_LABEL_FIRST);
    await this.HIERARCHICAL_LABEL_FIRST.click();
    await browser.waitForAngularEnabled(false);
    await browser.sleep(1000);
  }

  async clickModalOkBtn() {
    await FunctionUtil.elementVisibilityOf(this.MODAL_OK_BTN);
    console.log("log-the target btn is there");
    await this.MODAL_OK_BTN.click();
    console.log("log-succeed to click modal ok btn");
    await browser.waitForAngularEnabled(false);
    await browser.sleep(1000);
  }

  async changeReviewer() {
    console.log("log-start to change reviewer");
    await FunctionUtil.elementVisibilityOf(this.REVIEWER_SELECT);
    await browser.waitForAngularEnabled(false);
    await this.REVIEWER_SELECT.click();
    await FunctionUtil.elementVisibilityOf(this.REVIEWER_SELECT_OPTION.get(0));
    await this.REVIEWER_SELECT_OPTION.then(async (options) => {
      options.forEach(async (value, index) => {
        await this.REVIEWER_SELECT_OPTION.get(1)
          .getText()
          .then(async (e) => {
            await this.REVIEWER_SELECT_OPTION.get(index).click();
          });
      });
    });
    console.log("log-end to change reviewer");
  }
}
