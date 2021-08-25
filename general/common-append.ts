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

  async appenNewLine(project_name){
    await FunctionUtil.click(this.COMMUNITY_DATASETS_TAB);
    await this.commonPage.waitForPageLoading();
    await this.commonPage.filterProjectName(project_name);

    await FunctionUtil.click(this.APPEND_BTN);
    await browser.sleep(1000);
    await FunctionUtil.click(this.APP_NEW_LINE_BTN);
    await browser.sleep(1000);
    if (await FunctionUtil.getElementsNum(this.TABLE_LIST) === 3) {
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

  async fileAppendSelectExistingFile(projectName){
    await FunctionUtil.click(this.COMMUNITY_DATASETS_TAB);
    await this.commonPage.waitForPageLoading();
    await this.commonPage.filterProjectName(projectName);

    await FunctionUtil.click(this.APPEND_BTN);
    await browser.sleep(1000);
    await FunctionUtil.click(this.APPEND_BY_FILE_TAB);
    await browser.sleep(2000);
    await FunctionUtil.click(this.DROPDOWN_SELECT);
    await browser.sleep(2000);
    await FunctionUtil.click($$("option").get(0))
    await browser.sleep(2000);
    await FunctionUtil.click(this.APPEND_PUBLISH_BTN);
    if (await FunctionUtil.getAttribute(this.APPEND_BTN, 'class') == this.APPEND_DONE_CLASS) {
      return true;
    }
    return false;
  }

}