/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/


import { browser, $, $$, ExpectedConditions, element, by } from 'protractor'
import { CommonPage } from '../general/commom-page';
import { FunctionUtil } from '../utils/function-util';

export class CommonAppend {

  commonPage: CommonPage = new CommonPage;

  COMMUNITY_DATASETS_TAB = $('.header-nav a[href="/projects"]')
  
  APPEND_BTN = $('button[title="Click to Append New Entries"]');
  APP_NEW_LINE_BTN = element(by.partialButtonText('ADD'));
  APPEND_PUBLISH_BTN = element(by.partialButtonText('Publish'));
  APPEND_BY_FILE_TAB = element(by.partialButtonText('Upload'));
  
  TABLE_LIST = $$('clr-dg-row');
  DROPDOWN_SELECT = $('#select-basic');
  APPEND_DONE_CLASS = 'btn btn-icon actionClass btn-success greenBtn ng-star-inserted';

  UPLOAD_INPUT_ELEMENT = $('#upfiles');
  DATASET_NAME_ELEMENT = $('#datasetsName');

  SET_DATA_TAB = $('ul[role="tablist"] .nav-item:last-child');
  TICKET_COLUMN_CHECKBOX_FOR_TEXT = element(
    by.css("clr-dg-row:nth-child(4) .clr-checkbox-wrapper label")
  );
  TICKET_COLUMNS = element.all(by.css("clr-dg-row label"));

  async appenNewLine(project_name, isNer){
    await this.locateProjectAppend(project_name);
    await FunctionUtil.click(this.APP_NEW_LINE_BTN);
    await browser.sleep(1000);
    if (await FunctionUtil.getElementsNum(this.TABLE_LIST) === (isNer ? 2 : 3)) {
      return true;
    }
    return false;
  }

  async deleteNewLine(deleteBTN){
    await browser.sleep(1000);
    await FunctionUtil.click(deleteBTN);
    if (await FunctionUtil.getElementsNum(this.TABLE_LIST) == 2) {
      return true;
    }
    return false;
  }

  async quickAppendCsv(){
    await browser.sleep(1000);
    await $$('clr-dg-row').last().$$('clr-dg-cell').each(async (ele, index) => {
      if (await (await ele.$('textarea').isPresent()).valueOf()) {
        await FunctionUtil.sendText(ele.$('textarea'), index.toString())
      }
    })
    await FunctionUtil.click(this.APPEND_PUBLISH_BTN);
    
    await browser.sleep(2000);
    if (await FunctionUtil.getAttribute(this.APPEND_BTN, 'class') == this.APPEND_DONE_CLASS) {
      return true;
    }
    return false;
  }

  async quickAppendSingleFileUpload(UPLOAD_FILE_PATH, UPLOAD_INPUT_ELEMENT){
    await browser.sleep(1000);
    let path = process.cwd().replace("\\", "/") + UPLOAD_FILE_PATH;
    await UPLOAD_INPUT_ELEMENT.sendKeys(path);
    await browser.sleep(1000);
    await FunctionUtil.click(this.APPEND_PUBLISH_BTN);
    
    await browser.sleep(2000);
    if (await FunctionUtil.getAttribute(this.APPEND_BTN, 'class') == this.APPEND_DONE_CLASS) {
      return true;
    }
    return false;
  }

  async fileAppendSelectExistingFile(project_name, dataset_name, isNer){
    console.log('start to fileAppendSelectExistingFile');
    await this.locateProjectAppend(project_name);
    await FunctionUtil.click(this.APPEND_BY_FILE_TAB);
    await browser.sleep(2000);
    await FunctionUtil.click(this.DROPDOWN_SELECT);
    await browser.sleep(2000);
    $$("option").each(async function(element) {
      if (await element.getText() == dataset_name) {
        await FunctionUtil.click(element);
      }
    });
    await browser.sleep(2000);
    if (isNer) {
      await this.clickExistingLabel(2, 4);
    }
    await browser.sleep(2000);
    await FunctionUtil.click(this.APPEND_PUBLISH_BTN);
    if (await FunctionUtil.getAttribute(this.APPEND_BTN, 'class') == this.APPEND_DONE_CLASS) {
      return true;
    }
    console.log('succeed to fileAppendSelectExistingFile');
    return false;
  }

  async clickExistingLabel(startIndex, endIndex) {
    await FunctionUtil.elementVisibilityOf(this.SET_DATA_TAB);
    await this.SET_DATA_TAB.click();
    await FunctionUtil.elementVisibilityOf(
      this.TICKET_COLUMN_CHECKBOX_FOR_TEXT
    );
    this.TICKET_COLUMNS.then(async (column) => {
      for (let i = startIndex; i <= endIndex; i++) {
        await column[i].click();
      }
    });
    await browser.sleep(2000);
    this.TICKET_COLUMNS.then(async (column) => {
      for (let i = endIndex; i < (endIndex + 1); i++) {
        await column[i].click();
      }
    });
  }

  async locateProjectAppend(project_name){
    await FunctionUtil.click(this.COMMUNITY_DATASETS_TAB);
    await this.commonPage.waitForGridLoading();
    await this.commonPage.filterProjectName(project_name);

    await FunctionUtil.click(this.APPEND_BTN);
    await browser.sleep(1000);
  }
  


  async localFileChangeAndUpload(project_name, dataset_name, UPLOAD_FILE_1, UPLOAD_FILE_2){

    await this.locateProjectAppend(project_name);
    await FunctionUtil.click(this.APPEND_BY_FILE_TAB);
    await browser.sleep(2000);
    let file1 = process.cwd().replace("\\", "/") + UPLOAD_FILE_1;
    await this.UPLOAD_INPUT_ELEMENT.sendKeys(file1);
    await browser.sleep(2000);
    
    let file2 = process.cwd().replace("\\", "/") + UPLOAD_FILE_2;
    await this.UPLOAD_INPUT_ELEMENT.sendKeys(file2);
    await browser.sleep(2000);

    await this.DATASET_NAME_ELEMENT.sendKeys(dataset_name);
    await FunctionUtil.click(this.APPEND_PUBLISH_BTN);
    
    await browser.sleep(2000);
    if (await FunctionUtil.getAttribute(this.APPEND_BTN, 'class') == this.APPEND_DONE_CLASS) {
      return true;
    }

    return false;
  }

}