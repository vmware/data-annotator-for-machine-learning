/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { $$, $, browser, by, element, ExpectedConditions, ElementFinder } from 'protractor';
import { Constant } from './constant';
import { async } from 'q';
var fs = require('fs');
import { FunctionUtil } from '../utils/function-util';

export class CommonPage {

    PROJECT_TABLE = $('.datagrid .datagrid-table')
    PROJECT_NAME_HEADER = $('clr-dg-column[ng-reflect-field="projectName"]');
    // PROJECT_NAME_FILTER_BTN = $('clr-dg-column[ng-reflect-field="projectName"] .datagrid-filter-toggle');
    PROJECT_NAME_FILTER_BTN = element(by.css('clr-dg-column:nth-child(1) clr-dg-filter:nth-child(1) button'));
    PROJECT_NAME_FILTER_INPUT = $('.datagrid-filter input[name="search"]');
    CLOSE_FILTER_BTN = $('.datagrid-filter.clr-popover-content clr-icon[shape="close"]');
    Table_LISTS = $$('.datagrid-host .datagrid-scrolling-cells');
    FIRST_ROW_CELLS = $$('.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"]');
    FIRST_PROJECT_NAME_CELL = $('.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"]:nth-of-type(1)');
    GENERATE_PROJECT_BTN = $('button[title="Generate Project"]')
    PROMPT = $('span[class="alert-text"]')
    ANNOTATOR_CELL = $('.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"] .ng-star-inserted >div');
    SHARE_DATASETS_BTN = $('button[title="Share Datasets"]');
    DATASETS_DESCRIPTION = $('#description')
    DATASETS_OK_BTN = $('.modal-content button[class="btn btn-primary ng-star-inserted"]')
    UPLOAD_DATASET_BTN = $('.btn-primary.add-doc');
    UPLOAD_CSV_BTN = $('.btn-primary.add-doc.float-right');
    CHOOSE_FILE_BTN = $('input[name="localFileFile"]');
    // UPLOAD_CSV_OK_BTN = $('.ng-trigger-fadeDown .modal-footer .btn.btn-primary');
    UPLOAD_CSV_OK_BTN = $('.modal-footer .btn.btn-primary');
    CSV_UPLOAD = $('#select-basic');
    CSV_UPLOAD_OPTIONS = $$('#select-basic option')
    CSV_NAME = $('.modal-content #datasetsName')
    DELETE_PROJECT_BTN = $('.datagrid-row.ng-star-inserted:last-of-type button[title="Delete Project"]');
    DELETE_PROJECT_OK_BTN = $('.modal-footer .btn.btn-primary')
    ACTIONS = $$('.datagrid-host .datagrid-row:nth-child(2) clr-dg-cell[role="gridcell"] .actionClass');

    getTableLength() {
        return this.Table_LISTS.count();
    }

    async filterProjectName(name: string) {

        await FunctionUtil.click(this.PROJECT_NAME_FILTER_BTN)
        await FunctionUtil.elementVisibilityOf(this.PROJECT_NAME_FILTER_INPUT);
        await FunctionUtil.sendText(this.PROJECT_NAME_FILTER_INPUT, name);
        await FunctionUtil.click(this.CLOSE_FILTER_BTN);

    }

    getCellText(index: number) {
        return browser.wait(ExpectedConditions.visibilityOf(this.FIRST_PROJECT_NAME_CELL), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                if (index === 0) {
                    return this.FIRST_PROJECT_NAME_CELL.getText();
                }
                if (index >= 1 && index <= 12) {
                    return this.FIRST_ROW_CELLS
                        .then((list) => {
                            return list[index].getText();
                        })
                }
            })
    }

    getActionsCount() {
        return this.ACTIONS.count();
    }

    waitForPageLoading() {
        return browser.wait(ExpectedConditions.invisibilityOf($('.main-container .spinner')), Constant.DEFAULT_TIME_OUT);
    }

    waitForGridLoading() {
        return browser.wait(ExpectedConditions.invisibilityOf($('clr-datagrid .datagrid-spinner')), Constant.DEFAULT_TIME_OUT);
    }

    generateProject() {
        browser.wait(ExpectedConditions.visibilityOf(this.GENERATE_PROJECT_BTN), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                this.scrollToFarRight(this.PROJECT_TABLE);
                this.GENERATE_PROJECT_BTN.click()
            })
    }

    getPromptText() {
        return this.PROMPT.getText();
        //return FunctionUtil.getElementText(this.PROMPT);
    }

    scrollToFarRight(element: ElementFinder) {
        return browser.wait(ExpectedConditions.visibilityOf(element), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                element.scrollLeft = element.scrollWidth;
            })
    }

    scrollToBottom(element: ElementFinder) {
        return browser.wait(ExpectedConditions.visibilityOf(element), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                element.scrollTop = element.scrollHeight;
            })
    }

    getAnnotatorCellText() {
        return browser.wait(ExpectedConditions.visibilityOf(this.ANNOTATOR_CELL), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                return this.ANNOTATOR_CELL.getText()
            })
            .then((text) => {
                return text.trim();
            })
    }

    shareDatasets() {
        return browser.wait(ExpectedConditions.visibilityOf(this.PROJECT_TABLE), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                this.PROJECT_TABLE.scrollTop = this.PROJECT_TABLE.scrollHeight
                return browser.wait(ExpectedConditions.visibilityOf(this.SHARE_DATASETS_BTN), Constant.DEFAULT_TIME_OUT)
            })
            .then(() => {
                this.SHARE_DATASETS_BTN.click()
                return browser.wait(ExpectedConditions.visibilityOf(this.DATASETS_DESCRIPTION), Constant.DEFAULT_TIME_OUT)
            })
            .then(() => {
                this.DATASETS_DESCRIPTION.clear();
                this.DATASETS_DESCRIPTION.sendKeys('e2e test to share datasets');
                this.DATASETS_OK_BTN.click()
            })
            .then(() => {
                this.waitForShareComplete()
            })
    }

    waitForShareComplete() {
        return browser.wait(ExpectedConditions.invisibilityOf($('.btn.uploadLoading')), Constant.DEFAULT_TIME_OUT);
    }

    setLocalCSVPath(localCsvPath: string) {
        let path = process.cwd().replace('\\', '/') + localCsvPath;
        this.CHOOSE_FILE_BTN.sendKeys(path);
    }

    clickUploadDatasetBtn() {
        return browser.wait(ExpectedConditions.visibilityOf(this.UPLOAD_DATASET_BTN), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                this.UPLOAD_DATASET_BTN.click();
            })
    }

    async uploadCSV(csvName: string, localCsvPath: string) {
        await FunctionUtil.elementVisibilityOf(this.UPLOAD_CSV_BTN);
        await this.UPLOAD_CSV_BTN.click();
        await this.CSV_NAME.clear();
        await this.CSV_NAME.sendKeys(csvName);
        await this.setLocalCSVPath(localCsvPath);
        await browser.sleep(1000);
        await FunctionUtil.elementVisibilityOf(this.UPLOAD_CSV_OK_BTN);
        await this.UPLOAD_CSV_OK_BTN.click();
        await this.waitForUploadloading();

    }

    waitForUploadloading() {
        return browser.wait(ExpectedConditions.invisibilityOf($('.btn.uploadLoading')), Constant.DEFAULT_TIME_OUT);
    }

}
