/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Constant } from '../general/constant';
import { browser, $$, $, ExpectedConditions, by, element } from 'protractor';
import { CommonPage } from '../general/commom-page';
import { FunctionUtil } from '../utils/function-util';

export class AnnotatePage extends CommonPage {
    LABELS_TOOLTIP = $('.clr-form-group.category .label-tooltip')
    PROJECTS_NAME = $('select[ng-reflect-name="selectProject"]')
    PROJECT_INFOS = $$('.leftBoard .left-project-info div');
    PROGRESS_POLITE = $('.left-project-info span[aria-live="polite"]')
    HISTORY_LISTS = $$('.historyBox .historyPosition')
    LABELS_SELECT = $('select[formcontrolname="category"]');
    ANNOTATE_SUBMIT_BTN = $('button[type="submit"]');
    PROJECT_TABLE = $('.datagrid-host .datagrid')
    ANNOTATE_COMPLETE_MSG = $('.modal-content .alert-icon-wrapper')
    ANNOTATE_OK_BTN = $('.modal-footer .btn.btn-primary')
    GAME_TAB = element(by.css('.header-nav a[href="/game"]'));
    START_ANNOTATE = $('button[title="Start Annotate"]');
    ANNOTATE_GREEN_BTN = element(by.css('button.btn.labels.label0.green'));
    FLAG = element(by.css('clr-icon[shape=flag]'));
    TEXT_TICKET_AREA = element(by.css('.textBox p.question-paragraph'));

    async navigateTo() {
        await browser.sleep(2000);
        await FunctionUtil.elementVisibilityOf(this.GAME_TAB);
        await browser.waitForAngularEnabled(false);
        await this.GAME_TAB.click();
    }

    async clickAnnotateStartBtn(name: string) {
        this.PROJECT_TABLE.scrollLeft = this.PROJECT_TABLE.scrollWidth
        await FunctionUtil.elementVisibilityOf(this.START_ANNOTATE);
        await browser.waitForAngularEnabled(false);
        await this.START_ANNOTATE.click();
    }

    getProjectInfo() {
        let infos = { name: '', owner: '', source: '', instruction: '' }
        return this.PROJECT_INFOS
            .then(async (list) => {
                infos.name = await list[0].getText()
                infos.owner = await list[1].getText()
                infos.source = await list[2].getText()
                infos.instruction = await list[3].getText()
                return infos
            })
    }

    getProgress() {
        let result = { sessions: '', annotations: '' }
        return this.PROJECT_INFOS
            .then(async (list) => {
                result.sessions = await list[5].getText()
                result.annotations = await list[6].getText()
                return result
            })
    }

    getHistoryLists() {
        return this.HISTORY_LISTS.count();
    }

    async selectAnnoteLable() {
        await FunctionUtil.elementVisibilityOf(this.ANNOTATE_GREEN_BTN);
        await browser.waitForAngularEnabled(false);
        await this.ANNOTATE_GREEN_BTN.click();
    }


    async selectAnnoteLableInDropdown() {
        return browser.wait(ExpectedConditions.visibilityOf(this.LABELS_SELECT), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                this.LABELS_SELECT.element(by.cssContainingText('option', 'test1')).click();
            })
    }

    async flagTicket() {
        await FunctionUtil.elementVisibilityOf(this.FLAG);
        await browser.waitForAngularEnabled(false);
        await this.FLAG.click();
    }

    async currentTicketContent() {
        await FunctionUtil.elementVisibilityOf(this.TEXT_TICKET_AREA);
        await browser.waitForAngularEnabled(false);
        // console.log('currentTicketContent:::', this.TEXT_TICKET_AREA.getText() as Promise<string>)
        return this.TEXT_TICKET_AREA.getText() as Promise<string>;
    }

    // clickAnotateOkBtn() {
    //     return browser.wait(ExpectedConditions.visibilityOf(this.ANNOTATE_COMPLETE_MSG), Constant.DEFAULT_TIME_OUT)
    //         .then(() => {
    //             this.ANNOTATE_OK_BTN.click();
    //         })
    // }

}