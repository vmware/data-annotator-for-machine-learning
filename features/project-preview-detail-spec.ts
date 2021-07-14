/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness"
import { Constant } from '../general/constant';
import { ProjecstPage } from '../page-object/projects-page';
import { browser, by, element, ExpectedConditions, $, $$ } from 'protractor';
const projectCreateData = require('../resources/project-create-page/test-data');


describe('Enter projects tab...', () => {
    let projectsPage: ProjecstPage;
    let since = require('jasmine2-custom-message');
    let project_name: string;
    let USER_CHART_FIRST_RECT = $$('.userChartBar g.bars rect');
    let USER_CHART_FIRST_TICK = $('.userChartBar svg g.x-axis g.tick text');
    let CATEGORY_CHART_FIRST_RECT = element.all(by.css('.categoryChartBar g.bars rect'));
    let CATEGORY_CHART_FIRST_TICK = element(by.css('.categoryChartBar g.x-axis g.tick text'));


    beforeAll(() => {
        project_name = Constant.project_name;
        LoginBussiness.verifyLogin();
        projectsPage = new ProjecstPage();
        console.log('start to preview project details: ' + project_name);
    })

    it('User and category charts should display normally.', async (done) => {
        await projectsPage.navigateTo();
        await projectsPage.waitForGridLoading();
        await projectsPage.filterProjectName(project_name);
        let Project_Count_After_Filter = await projectsPage.getTableLength();
        let Project_Name_Text = await projectsPage.getCellText(0);
        console.log('Project_Count_After_Filter:::', Project_Count_After_Filter);
        console.log('Project_Name_Text:::', Project_Name_Text)
        if (Project_Name_Text !== '' || Project_Count_After_Filter > 0) {
            await projectsPage.clickGridFirstCell();
            await projectsPage.waitForUserChartLoading();
            await projectsPage.waitForCategoryChartLoading();
            await browser.sleep(1000);
            console.log('finish chart loading and sleeping');
            since('user chart rect should show up and have height').expect(projectsPage.getChartRectHeight(USER_CHART_FIRST_RECT)).toBeGreaterThan(0);
            since('user chart tick should show up and have fullname correct').expect(projectsPage.getChartTickText(USER_CHART_FIRST_TICK)).toContain(Constant.fullname);
            since('category chart rect should show up and have height').expect(projectsPage.getChartRectHeight(CATEGORY_CHART_FIRST_RECT)).toBeGreaterThan(0);
            since('category chart tick should show up and have label correct').expect(projectCreateData.TextProject.Labels.split(',')).toContain(projectsPage.getChartTickText(CATEGORY_CHART_FIRST_TICK));
            done();
        }
        else {
            done.fail('can not filter out the consitent project....')
        }
    });


    it('Delete and silence single flagged ticket successfully.', async (done) => {
        await projectsPage.navigateToFlagTab();
        await projectsPage.waitForGridLoading();
        let tableLength = await projectsPage.getTableLength();
        const originalTableTotalItem = Number((await projectsPage.getTableTotalItems()).trim().split(' ')[4]);
        console.log('tableLength:::', tableLength);
        console.log('originalTableTotalItem:::', originalTableTotalItem);
        if (tableLength > 1) {
            console.log('start to delete flagged ticket');
            await projectsPage.clickDeleteTicketBtn();
            await projectsPage.waitForGridLoading();
            await browser.sleep(1000);
            since('table total items should reduce 1').expect(Number((await projectsPage.getTableTotalItems()).trim().split(' ')[4])).toEqual(originalTableTotalItem - 1);
            console.log('delete flagged ticket successfully');

            console.log('start to silence flagged ticket');
            await projectsPage.clickSilenceTicketBtn();
            await projectsPage.waitForGridLoading();
            await browser.sleep(1000);
            since('table total items should reduce 1').expect(Number((await projectsPage.getTableTotalItems()).trim().split(' ')[4])).toEqual(originalTableTotalItem - 2);
            console.log('silence flagged ticket successfully');

            done();
        }
        else {
            done.fail('the flagged tickets here no more than 2....');
        }
    });
})