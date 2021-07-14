/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { browser, by, element, ExpectedConditions, $, $$ } from 'protractor';
import { Constant } from '../general/constant';
import { CommonPage } from '../general/commom-page';
import { FunctionUtil } from '../utils/function-util';


export class NewProjectPage extends CommonPage {
    CREATE_PROJECT_BTN = $('.createBtn .add-doc');
    PROJECT_NAME = $('#projectName');
    TASK_INSTRUCTION = $('#taskInstruction');
    UPLOAD_CSV_BTN = $('.clr-input-wrapper .btn.btn-sm.add-doc');
    CHOOSE_FILE_BTN = $('input[name="localFileFile"]');
    UPLOAD_CSV_OK_BTN = $('.modal-footer .btn.btn-primary');
    SET_DATA_TAB = $('ul[role="tablist"] .nav-item:last-child');
    LABELS_BTN = element(by.css('select[formcontrolname=selectLabels]'));
    LABELS_LIST = element.all(by.css('select[formcontrolname=selectLabels] option'));
    TEXT_BTN = element(by.css('select[formcontrolname=selectedText]'));
    TEXT_LIST = element.all(by.css('select[formcontrolname=selectedText] option'));
    TICKET_COLUMN_CHECKBOX_FOR_TEXT = element(by.css('clr-dg-row:nth-child(4) .clr-checkbox-wrapper label'));
    SET_DATA_BTN = $('.setData .btn-primary.sureSet');
    MAX_ANNOTATIONS = $('#maxAnnotations');
    ADD_NEW_LABLE = $('.labelsList .clr-input');
    ASSIGNEE = $('#assignee');
    CREATE_BTN = $('.content-area button[type="submit"]');
    SET_DATA_SECTION = $('#clr-tab-content-0 .setData');
    CSV_NAME = $('.modal-content #datasetsName');
    MY_PROJECTS_TAB = element(by.css('.header-nav a[href="/projects"]'));
    PROJECT_TABULAR_CLASSIFICATION = element(by.css('clr-dropdown-menu a[href="/projects/create/tabular"]'));
    PROJECT_NER_CLASSIFICATION = element(by.css('clr-dropdown-menu a[href="/projects/create/ner"]'));
    PROJECT_IMAGE_CLASSIFICATION = element(by.css('clr-dropdown-menu a[href="/projects/create/image"]'));
    PROJECT_LOG_CLASSIFICATION = element(by.css('clr-dropdown-menu a[href="/projects/create/log"]'));
    SELECT_AL_CLASSIFIER = element(by.css('select[formcontrolname=selectedClassifier]'));
    FILE_SELECT = element(by.css('select[formcontrolname=selectedDataset]'));
    FILE_SELECT_OPTION = element.all(by.css('select[formcontrolname=selectedDataset] option'));
    ALLOW_MULTIPLE = element(by.css('.labelsList label[for=multipleLabel]'));
    TICKET_COLUMNS = element.all(by.css('clr-dg-row label'));
    NUMERIC_OPTION = element(by.css('clr-radio-wrapper label[for=numericLabel]'));
    MIN_LABEL_INPUT = element(by.css('input[formcontrolname=min]'));
    MAX_LABEL_INPUT = element(by.css('input[formcontrolname=max]'));
    SHOW_FILENAME_CHECKBOX = element(by.css('label[for=isShowFilename]'));
    IMAGE_LOADING = element(by.css('span .loadingSpan'));

    async navigateTo() {
        await FunctionUtil.elementVisibilityOf(this.MY_PROJECTS_TAB);
        await browser.waitForAngularEnabled(false);
        await this.MY_PROJECTS_TAB.click();
    }


    async clickNewProjectBtn(projectType) {
        await FunctionUtil.elementVisibilityOf(this.CREATE_PROJECT_BTN);
        await browser.waitForAngularEnabled(false);
        await this.CREATE_PROJECT_BTN.click();
        await FunctionUtil.elementVisibilityOf(projectType);
        await projectType.click();
    }



    async setProjectName(name: string) {
        await FunctionUtil.elementVisibilityOf(this.PROJECT_NAME);
        await this.PROJECT_NAME.clear();
        await this.PROJECT_NAME.sendKeys(name);

    }


    async setTaskInstruction(instruction: string) {
        await FunctionUtil.elementVisibilityOf(this.TASK_INSTRUCTION);
        await this.TASK_INSTRUCTION.clear();
        await this.TASK_INSTRUCTION.sendKeys(instruction);
    }



    clickUploadCSVBtn() {
        return browser.wait(ExpectedConditions.visibilityOf(this.UPLOAD_CSV_BTN), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                this.UPLOAD_CSV_BTN.click();
            })
    }

    setLocalCSVPath(localCsvPath: string) {
        let path = process.cwd().replace('\\', '/') + localCsvPath;
        this.CHOOSE_FILE_BTN.sendKeys(path);
    }


    async setData(type, startIndex?, endIndex?) {
        await FunctionUtil.elementVisibilityOf(this.SET_DATA_TAB);
        await this.SET_DATA_TAB.click();
        if (type === 'text') {
            await this.selectTextTicketColumn();
        } else if (type === 'tabular' || type === 'ner') {
            await this.selectMultipleTicketColumn(startIndex, endIndex);
        }
        await browser.waitForAngularEnabled(false);
        await this.setDataLable(type);
        await this.waitForUploadloading();
    }


    async selectTextTicketColumn() {
        await FunctionUtil.elementVisibilityOf(this.TICKET_COLUMN_CHECKBOX_FOR_TEXT);
        await this.TICKET_COLUMN_CHECKBOX_FOR_TEXT.click();
    }


    async selectMultipleTicketColumn(startIndex, endIndex) {
        await FunctionUtil.elementVisibilityOf(this.TICKET_COLUMN_CHECKBOX_FOR_TEXT);
        this.TICKET_COLUMNS
            .then(async (column) => {
                for (let i = startIndex; i < endIndex; i++) {
                    await column[i].click();
                }
            });
    }


    setDataLable(type?) {
        return browser.wait(ExpectedConditions.visibilityOf(type !== 'ner' ? this.LABELS_BTN : this.TEXT_BTN), Constant.DEFAULT_TIME_OUT)
            .then(async () => {
                if (type === 'ner') {
                    await this.TEXT_BTN.click();
                    return this.TEXT_LIST;

                } else {
                    await this.LABELS_BTN.click();
                    return this.LABELS_LIST;
                }
            })
            .then(async (list) => {
                await FunctionUtil.elementVisibilityOf(list[1]);
                await list[1].click();
            })
            .then(async () => {
                await this.SET_DATA_BTN.click();
            })
    }

    setMaxAnnotation() {
        return browser.wait(ExpectedConditions.visibilityOf(this.MAX_ANNOTATIONS), Constant.DEFAULT_TIME_OUT)
            .then(async () => {
                await this.MAX_ANNOTATIONS.clear();
                await this.MAX_ANNOTATIONS.sendKeys(3);
            })
    }

    setNewLable(lable: any) {
        return browser.wait(ExpectedConditions.visibilityOf(this.ADD_NEW_LABLE), Constant.DEFAULT_TIME_OUT)
            .then(async () => {
                await this.ADD_NEW_LABLE.clear();
                lable.forEach(async (element) => {
                    await this.ADD_NEW_LABLE.sendKeys(element);
                    await FunctionUtil.pressEnter();
                });
            })
    }



    async setNumericLabel(min, max) {
        await this.NUMERIC_OPTION.click();
        await FunctionUtil.elementVisibilityOf(this.MIN_LABEL_INPUT);
        await this.MIN_LABEL_INPUT.sendKeys(min);
        await this.MAX_LABEL_INPUT.sendKeys(max);
        await browser.waitForAngularEnabled(false);

    }


    async allowMultiple() {
        await FunctionUtil.elementVisibilityOf(this.ALLOW_MULTIPLE);
        await this.ALLOW_MULTIPLE.click();
        await browser.waitForAngularEnabled(false);

    }


    async selectActiveLearningModel(alModelIndex) {
        await FunctionUtil.elementVisibilityOf(this.SELECT_AL_CLASSIFIER);
        await this.SELECT_AL_CLASSIFIER.click();
        await element.all(by.css('select[formcontrolname=selectedClassifier] option'))
            .get(alModelIndex)
            .click();

    }


    setAssignee(lable: string) {
        return browser.wait(ExpectedConditions.visibilityOf(this.ASSIGNEE), Constant.DEFAULT_TIME_OUT)
            .then(async () => {
                await this.ASSIGNEE.clear();
                await this.ASSIGNEE.sendKeys(Constant.username);
                await FunctionUtil.pressEnter();
            })
    }

    clickCreateBtn() {
        return browser.wait(ExpectedConditions.visibilityOf(this.CREATE_BTN), Constant.DEFAULT_TIME_OUT)
            .then(async () => {
                await this.CREATE_BTN.click();
            })
            .then(async () => {
                await this.waitForUploadloading();
            })
    }


    async selectExistingFile(dsname) {
        await FunctionUtil.elementVisibilityOf(this.FILE_SELECT);
        await browser.waitForAngularEnabled(false);
        await this.FILE_SELECT.click();
        await FunctionUtil.elementVisibilityOf(this.FILE_SELECT_OPTION.get(0));
        await this.FILE_SELECT_OPTION.then(async(options)=>{
            options.forEach(async (value,index)=>{
                await this.FILE_SELECT_OPTION.get(index).getText().then(async e=>{
                    if(e===dsname){
                        await this.FILE_SELECT_OPTION.get(index).click();
                    }
                })
            })
        })
    }

    async isShowFilename() {
        await FunctionUtil.elementVisibilityOf(this.SHOW_FILENAME_CHECKBOX);
        await this.SHOW_FILENAME_CHECKBOX.click();
    }


    async imageLoaded() {
        return browser.wait(ExpectedConditions.invisibilityOf(this.IMAGE_LOADING), Constant.DEFAULT_TIME_OUT);
    }

}