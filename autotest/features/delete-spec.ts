/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginBussiness } from "../general/login-bussiness"
import { ProjecstPage } from '../page-object/projects-page';
import { MyDatasetsPage } from '../page-object/my-datasets-page';
import { CommonUtils } from '../general/common-utils';

describe('delete function', () => {
    let projectName: string;
    let myDatasetsName: string;

    let projectsPage: ProjecstPage
    let myDatasetsPage: MyDatasetsPage
    let since = require('jasmine2-custom-message')

    beforeAll(() => {
        projectName = 'e2e Test Project';
        myDatasetsName = 'e2e Test CSV';
        LoginBussiness.verifyLogin();
        projectsPage = new ProjecstPage();
        myDatasetsPage = new MyDatasetsPage();

    })

    it('delete the added projects', async (done) => {
        await projectsPage.navigateTo();
        await projectsPage.waitForPageLoading();
        await projectsPage.filterProjectName(projectName);
        let Projects_Count_After_Filter = await projectsPage.getTableLength();
        if (Projects_Count_After_Filter > 0) {
            console.log('----------start to delete projects----------');
            await CommonUtils.deleteProjectsLoop(projectName);
            await projectsPage.filterProjectName(projectName);
            let Projects_Count_After_Delete = await projectsPage.getTableLength();
            since('the count should be zero after delete').expect(Projects_Count_After_Delete).toBe(0);
        }
        else {
            console.log('can not filter out the consitent projects....')
        }
        done();
    })

    it('delete the added datasets', async (done) => {
        await myDatasetsPage.navigateTo();
        await myDatasetsPage.waitForPageLoading();
        await myDatasetsPage.filterDatasetstName(myDatasetsName);
        let Datasets_Count_After_Filter = await myDatasetsPage.getTableLength();
        if (Datasets_Count_After_Filter > 0) {
            console.log('----------start to delete datasets----------');
            await CommonUtils.deleteMyDatasetsLoop(myDatasetsName);
            await myDatasetsPage.filterDatasetstName(myDatasetsName);
            let Datasets_Count_After_Delete = await myDatasetsPage.getTableLength();
            since('the count should be zero after delete').expect(Datasets_Count_After_Delete).toBe(0);
        }
        else {
            console.log('can not filter out the consitent projects....')
        }
        done();
    })
})