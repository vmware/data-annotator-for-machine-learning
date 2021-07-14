/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Constant } from '../general/constant'
import { browser, $, $$, ExpectedConditions, element, by } from 'protractor'
import { CommonPage } from '../general/commom-page';
import { FunctionUtil } from '../utils/function-util';


describe('verify append funtion', () => {
  const project_name: string = Constant.project_name;
  const commonPage: CommonPage = new CommonPage;
  const dataSetName: string = "adult";

  const COMMUNITY_DATASETS_TAB = $('.header-nav a[href="/projects"]')
  const APPEND_BTN = $('button[title="Click to Append New Entries"]');
  const APP_NEW_LINE_BTN = element(by.partialButtonText('ADD'));
  const APPEND_PUBLISH_BTN = element(by.partialButtonText('Publish'));
  const APPEND_BY_FILE_TAB = element(by.partialButtonText('Upload CSV'));
  const TABLE_LIST = $$('clr-dg-row');
  const DROPDOWN_SELECT = $('#select-basic');


  it('Qick append verify add new line', async () => {

    await FunctionUtil.click(COMMUNITY_DATASETS_TAB);
    await commonPage.waitForPageLoading();
    await commonPage.filterProjectName(project_name);

    await FunctionUtil.click(APPEND_BTN);
    await browser.sleep(1000)
    await FunctionUtil.click(APP_NEW_LINE_BTN);
    await browser.sleep(1000)
    expect(await FunctionUtil.getElementsNum(TABLE_LIST)).toBe(3);

  })

  it('Qick append verify delete new line', async () => {
    await browser.sleep(1000)
    await FunctionUtil.click(TABLE_LIST.last().$('button[title="Delete"]'));

    expect(await FunctionUtil.getElementsNum(TABLE_LIST)).toBe(2);

  })

  it('Qick append verify publish', async () => {
    await browser.sleep(1000)
    await $$('clr-dg-row').last().$$('clr-dg-cell').each(async (ele, index) => {
      if (await (await ele.$('textarea').isPresent()).valueOf()) {
        await FunctionUtil.sendText(ele.$('textarea'), index.toString())
      }
    })
    await FunctionUtil.click(APPEND_PUBLISH_BTN);
    await browser.sleep(2000)
    expect(await FunctionUtil.getAttribute(APPEND_BTN, 'class')).toEqual('btn btn-icon actionClass btn-success greenBtn ng-star-inserted');

  })


  it('File append verify selete existing file', async () => {
    await FunctionUtil.click(COMMUNITY_DATASETS_TAB);
    await commonPage.waitForPageLoading();
    await commonPage.filterProjectName(project_name);

    await FunctionUtil.click(APPEND_BTN);
    await browser.sleep(1000)
    await FunctionUtil.click(APPEND_BY_FILE_TAB);
    await browser.sleep(2000)

    console.log((await DROPDOWN_SELECT.isPresent()).valueOf());
    console.log((await $$("option").isPresent()).valueOf());
    console.log((await $$("option").get(0).isPresent()).valueOf());

    await FunctionUtil.click(DROPDOWN_SELECT);
    // await browser.sleep(2000)

    console.log((await $$("option").isPresent()).valueOf());
    console.log((await $$("option").get(0).isPresent()).valueOf());
    console.log((await DROPDOWN_SELECT.$(`option[value="adult"]`).isPresent()).valueOf());


    // console.log($(`option[value=${dataSetName}]`).getText());
    // await FunctionUtil.click($(`option[value=${dataSetName}]`))
    // await browser.sleep(2000)
    // await FunctionUtil.click(APPEND_PUBLISH_BTN);    
    // expect(await FunctionUtil.getAttribute(APPEND_BTN, 'class')).toEqual('btn btn-icon actionClass btn-success greenBtn ng-star-inserted');

  })

})
