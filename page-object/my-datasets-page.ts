/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { CommonPage } from '../general/commom-page';
import { browser, by, element, $, $$, ExpectedConditions } from 'protractor';
import { Constant } from '../general/constant';
import { FunctionUtil } from '../utils/function-util';


export class MyDatasetsPage extends CommonPage {
    DELETE_BTN = $('button[title="Delete Project"]');
    DELETE_DATASET_OK_BTN = $('.modal-footer .btn.btn-primary')
    DATASETS_NAME_FILTER_BTN = element(by.css('.datagrid-filter-toggle .is-solid'));
    DATASETS_NAME_FILTER_INPUT = $('.datagrid-filter input[name="search"]');
    CLOSE_FILTER_BTN = $('.datagrid-filter.clr-popover-content clr-icon[shape="close"]');
    MY_DATASETS_TAB = element(by.css('.header-nav a[href="/myDatasets"]'));



    async navigateTo() {
        await FunctionUtil.elementVisibilityOf(this.MY_DATASETS_TAB);
        await browser.waitForAngularEnabled(false);
        await this.MY_DATASETS_TAB.click();
    }

    filterDatasetstName(name: string) {
        return browser.wait(ExpectedConditions.visibilityOf(this.DATASETS_NAME_FILTER_BTN), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                this.DATASETS_NAME_FILTER_BTN.click();
                this.PROJECT_NAME_FILTER_INPUT.clear();
                this.PROJECT_NAME_FILTER_INPUT.sendKeys(name);
                this.CLOSE_FILTER_BTN.click();
            })
    }

    deleteDatasets() {
        return browser.wait(ExpectedConditions.visibilityOf(this.DELETE_BTN), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                this.DELETE_BTN.click();
            })
            .then(() => {
                return browser.wait(ExpectedConditions.visibilityOf(this.DELETE_DATASET_OK_BTN), Constant.DEFAULT_TIME_OUT)
            })
            .then(() => {
                this.DELETE_DATASET_OK_BTN.click();
            })
    }
}