/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { CommonPage } from '../general/commom-page';
import { browser, by, element, $, $$, ExpectedConditions } from 'protractor';
import { Constant } from '../general/constant';
import { FunctionUtil } from '../utils/function-util';



export class ProjecstPage extends CommonPage {
    ANNOTATOR_CELL = $('.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"] .ng-star-inserted >div');
    SHARE_DATASETS_BTN = $('button[title="Share Datasets"]');
    PROJECT_TABLE = $('.datagrid .datagrid-table');
    DATASETS_DESCRIPTION = $('#description')
    DATASETS_OK_BTN = $('.modal-content button[class="btn btn-primary ng-star-inserted"]')
    MY_PROJECTS_TAB = element(by.css('.header-nav a[href="/projects"]'));


    async navigateTo() {
        await FunctionUtil.elementVisibilityOf(this.MY_PROJECTS_TAB);
        await browser.waitForAngularEnabled(false);
        await this.MY_PROJECTS_TAB.click();
    }
}