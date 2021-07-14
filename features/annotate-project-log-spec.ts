/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness"
import { Constant } from '../general/constant';
import { AnnotatePage } from '../page-object/annotate-page';
import { browser, $, ExpectedConditions } from 'protractor';
import { ProjecstPage } from '../page-object/projects-page';
const projectCreateData = require('../resources/project-create-page/test-data');


describe('annotate project ...', () => {
    let annotatePage: AnnotatePage;
    let projectsPage: ProjecstPage;
    let since = require('jasmine2-custom-message');
    let project_name: string;


    beforeAll(() => {
        project_name = Constant.project_name;
        LoginBussiness.verifyLogin();
        annotatePage = new AnnotatePage();
        projectsPage = new ProjecstPage();
        console.log('start to annotate project: ' + project_name)
    })

    it('Should annotate log project successfully.', async (done) => {
        await annotatePage.navigateTo();
        await annotatePage.waitForGridLoading();
        await annotatePage.filterProjectName(project_name);
        let Project_Count_After_Filter = await projectsPage.getTableLength();
        let Project_Name_Text = await projectsPage.getCellText(0);
        console.log('Project_Count_After_Filter:::', Project_Count_After_Filter);
        console.log('Project_Name_Text:::', Project_Name_Text)
        if (Project_Name_Text !== '' || Project_Count_After_Filter > 0) {
            await annotatePage.clickAnnotateStartBtn(project_name);
            await annotatePage.waitForPageLoading();
            await browser.sleep(2000);
            since('project info should show up and content correct').expect(await annotatePage.getProjectInfo()).toEqual({ name: project_name, owner: Constant.username, source: projectCreateData.LogProject.Source, instruction: projectCreateData.LogProject.Instruction })
            since('progress shoud show up and content correct').expect(await annotatePage.getProgress()).toEqual({ sessions: String(projectCreateData.LogProject.ticketSessions), annotations: '0' });

            let logLines = await annotatePage.getTotalLogLines();
            await annotatePage.logFilterByKeyword(projectCreateData.LogProject.keywordFilter);
            await browser.sleep(2000);
            since('filter info should show up and content correct').expect(await annotatePage.getFilterWords()).toEqual(projectCreateData.LogProject.keywordFilter);
            since('log lines should reduce').expect(await annotatePage.getTotalLogLines()).toBeLessThan(logLines);

            await annotatePage.deleteFilterWords();
            await browser.sleep(2000);
            since('log lines should be as original').expect(await annotatePage.getTotalLogLines()).toEqual(logLines);


            await annotatePage.annotateLog(projectCreateData.LogProject.Freetext);
            await annotatePage.waitForPageLoading();
            await browser.sleep(2000);
            await annotatePage.annotateLog(projectCreateData.LogProject.Freetext);
            await annotatePage.waitForPageLoading();
            await browser.sleep(2000);
            since('the progress annotations should increas').expect(await annotatePage.getProgress()).toEqual({ sessions: String(projectCreateData.LogProject.ticketSessions), annotations: '2' });
            since('the history list should increase').expect(await annotatePage.getHistoryLists()).toBe(2);


            console.log('start to skip this ticket....');
            await annotatePage.skipTicket();
            await annotatePage.waitForPageLoading();
            await browser.sleep(2000);
            since('the content should not be empty').expect(annotatePage.currentLogTicketContent()).not.toEqual('');
            since('the history list should increase 1').expect(await annotatePage.getHistoryLists()).toEqual(3);
            console.log('skip success....');

            console.log('start to flag this ticket....');
            await annotatePage.flagTicket();
            await annotatePage.waitForPageLoading();
            await browser.sleep(2000);
            since('the content should not be empty').expect(annotatePage.currentLogTicketContent()).not.toEqual('');
            console.log('flag success....');

            done();
        }
        else {
            done.fail('can not filter out the consitent project....')
        }
    });



    it('Should review log project successfully.', async (done) => {
        await annotatePage.navigateTo();
        await annotatePage.waitForGridLoading();
        await annotatePage.clickReviewTab();
        await annotatePage.waitForGridLoading();
        await annotatePage.filterProjectName(project_name);
        let Project_Count_After_Filter = await projectsPage.getTableLength();
        let Project_Name_Text = await projectsPage.getCellText(0);
        console.log('Project_Count_After_Filter:::', Project_Count_After_Filter);
        console.log('Project_Name_Text:::', Project_Name_Text)
        if (Project_Name_Text !== '' || Project_Count_After_Filter > 0) {
            await annotatePage.clickAnnotateStartBtn(project_name);
            await annotatePage.waitForPageLoading();
            await browser.sleep(2000);
            since('project info should show up and content correct').expect(await annotatePage.getProjectInfo()).toEqual({ name: project_name, owner: Constant.username, source: projectCreateData.LogProject.Source, instruction: projectCreateData.LogProject.Instruction })
            since('progress shoud show up and content correct').expect(await annotatePage.getProgress()).toEqual({ sessions: String(projectCreateData.LogProject.ticketSessions), annotations: '0' });

            await annotatePage.selectFilename();
            await annotatePage.waitForPageLoading();
            await browser.sleep(2000);

            await annotatePage.reviewLog(projectCreateData.LogProject.reviewFreetext);
            await annotatePage.waitForPageLoading();
            await browser.sleep(2000);
            since('the progress annotations should increas 1').expect(annotatePage.getProgress()).toEqual({ sessions: String(projectCreateData.LogProject.ticketSessions), annotations: '1' });
            since('the history list should increase 1').expect(await annotatePage.getHistoryLists()).toBe(1);


            await annotatePage.backToPrevious();
            await annotatePage.waitForPageLoading();
            await browser.sleep(2000);

            let annotations = await annotatePage.getProgress();
            let historyLists = await annotatePage.getHistoryLists();
            await annotatePage.passLog();
            await annotatePage.waitForPageLoading();
            await browser.sleep(2000);
            since('the content should not be empty').expect(annotatePage.currentLogTicketContent()).not.toEqual('');
            since("the progress annotations shouldn't be changed").expect(annotatePage.getProgress()).toEqual({ sessions: String(projectCreateData.LogProject.ticketSessions), annotations: annotations.annotations });
            since("the history list shouldn't be changed").expect(await annotatePage.getHistoryLists()).toEqual(historyLists);

            done();
        }
        else {
            done.fail('can not filter out the consitent project....')
        }
    });
})