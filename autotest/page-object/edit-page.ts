/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Constant } from '../general/constant';
import { browser, $$, $, ExpectedConditions, by, element } from 'protractor';
import { FunctionUtil } from '../utils/function-util';

export class EditPage {
    PROJECT_TABLE = $('.datagrid-host .datagrid');
    ADMIN_TAB = element(by.css('.header-nav a[href="/admin"]'));
    EDIT_PROJECT_OK_BTN = $('.modal-footer .btn.btn-primary')
    NEW_LABEL_INPUT = element(by.css('input[name="addNewLabel"]'));
    PROJECT_NAME_INPUT = element(by.css('input[id=projectName]'));
    PROJECT_OWNER_INPUT = element(by.css('input[id=projectOwner]'));
    PROJECT_ANNOTATOR_INPUT = element(by.css('input[id=assignee]'));
    AL_THRESHOLD_INPUT = element(by.css('input[id=trigger]'));
    AL_FREQUENCY_INPUT = element(by.css('input[id=frequency]'));


    async navigateTo() {
        await FunctionUtil.elementVisibilityOf(this.ADMIN_TAB);
        await browser.waitForAngularEnabled(false);
        await this.ADMIN_TAB.click();
    }

    async clickEditButton() {
        this.PROJECT_TABLE.scrollLeft = this.PROJECT_TABLE.scrollWidth
        await FunctionUtil.elementVisibilityOf($('button[title="Edit Project"]'));
        await browser.waitForAngularEnabled(false);
        await $('button[title="Edit Project"]').click();
        await FunctionUtil.elementVisibilityOf(this.EDIT_PROJECT_OK_BTN);
    }


    async editProjectName(name) {
        await FunctionUtil.elementVisibilityOf(this.PROJECT_NAME_INPUT);
        console.log('editProjectName_name:::', name);
        Constant.project_name = name + 'edit';
        await this.PROJECT_NAME_INPUT.clear();
        await this.PROJECT_NAME_INPUT.sendKeys(Constant.project_name);
        await browser.waitForAngularEnabled(false);
    }


    async editProjectOwner(owner) {
        await FunctionUtil.elementVisibilityOf(this.PROJECT_OWNER_INPUT);
        await this.PROJECT_OWNER_INPUT.click();
        await this.PROJECT_OWNER_INPUT.sendKeys(owner);
        await browser.waitForAngularEnabled(false);
    }


    async editProjectAnnotator(annotator) {
        await FunctionUtil.elementVisibilityOf(this.PROJECT_ANNOTATOR_INPUT);
        await this.PROJECT_ANNOTATOR_INPUT.click();
        await this.PROJECT_ANNOTATOR_INPUT.sendKeys(annotator);
        await browser.waitForAngularEnabled(false);
    }


    async editALProjectThreshold(threshold) {
        await FunctionUtil.elementVisibilityOf(this.AL_THRESHOLD_INPUT);
        await this.AL_THRESHOLD_INPUT.clear();
        await this.AL_THRESHOLD_INPUT.sendKeys(threshold);
        await browser.waitForAngularEnabled(false);
    }


    async editALProjectFrequency(frequency) {
        await FunctionUtil.elementVisibilityOf(this.AL_FREQUENCY_INPUT);
        await this.AL_FREQUENCY_INPUT.clear();
        await this.AL_FREQUENCY_INPUT.sendKeys(frequency);
        await browser.waitForAngularEnabled(false);
    }


    async addLabel(label: any) {
        await FunctionUtil.elementVisibilityOf(this.NEW_LABEL_INPUT);
        await this.NEW_LABEL_INPUT.clear();
        label.forEach(async (element) => {
            console.log(element)
            await this.NEW_LABEL_INPUT.sendKeys(element);
            await FunctionUtil.pressEnter();
        });
    }

    async clickEditSubmitButton() {
        await browser.sleep(1000);
        await FunctionUtil.elementVisibilityOf(this.EDIT_PROJECT_OK_BTN);
        await browser.waitForAngularEnabled(false);
        await this.EDIT_PROJECT_OK_BTN.click();
        await browser.wait(ExpectedConditions.invisibilityOf($('.btn.uploadLoading')), Constant.DEFAULT_TIME_OUT);

    }





}