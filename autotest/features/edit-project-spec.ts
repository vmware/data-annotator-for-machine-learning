/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { Constant } from '../general/constant';
import { browser, $, ExpectedConditions } from 'protractor';
import { ProjecstPage } from "../page-object/projects-page";
import { EditPage } from '../page-object/edit-page';
const projectEditData = require('../resources/project-edit-page/test-data');
const projectCreateData = require('../resources/project-create-page/test-data');


describe('edit project info on projects page..', () => {
    let since = require('jasmine2-custom-message');
    let projectsPage: ProjecstPage;
    let editPage: EditPage;
    let PROMPT = $('span[class="alert-text"]');
    let project_name: string;
    let New_Lable = projectEditData.TextProject.Labels.split(',');

    beforeAll(() => {
        project_name = Constant.project_name;
        projectsPage = new ProjecstPage();
        editPage = new EditPage();
    })

    it('should edit project successfully..', async (done) => {
        await editPage.navigateTo();
        await projectsPage.waitForGridLoading();
        await projectsPage.filterProjectName(project_name);
        let Project_Count_After_Filter = await projectsPage.getTableLength();
        let Project_Name_Text = await projectsPage.getCellText(0);
        console.log('Project_Count_After_Filter:::', Project_Count_After_Filter);
        console.log('Project_Name_Text:::', Project_Name_Text)
        if (Project_Name_Text !== '' || Project_Count_After_Filter > 0) {
            console.log('----------start to edit projects----------');
            await editPage.clickEditButton();
            await editPage.editProjectName(Project_Name_Text);
            console.log('projectEditData:::', projectEditData)
            await editPage.editProjectOwner(projectEditData.TextProject.Owner);
            await editPage.editProjectAnnotator(projectEditData.TextProject.Annotator);
            await editPage.addLabel(New_Lable);
            await editPage.editALProjectThreshold(projectEditData.TextProject.Threshold);
            await editPage.editALProjectFrequency(projectEditData.TextProject.Frequency);
            await editPage.clickEditSubmitButton();
            await browser.wait(ExpectedConditions.visibilityOf(PROMPT), Constant.DEFAULT_TIME_OUT);
            await projectsPage.waitForGridLoading();
            console.log('----------start to verify the edit----------');
            console.log('Constant.project_name:::', Constant.project_name)
            await projectsPage.filterProjectName(Constant.project_name);
            let New_Project_Count_After_Filter = await projectsPage.getTableLength();
            let New_Project_Name_Text = await projectsPage.getCellText(0);
            let New_Project_Owner;
            let New_Project_Annotator;
            let New_Project_Labels;
            console.log('New_Project_Count_After_Filter:::', New_Project_Count_After_Filter);
            console.log('New_Project_Name_Text:::', New_Project_Name_Text)
            if (New_Project_Name_Text !== '' || New_Project_Count_After_Filter > 0) {
                New_Project_Owner = await projectsPage.getCellText(1);
                console.log('New_Project_Owner:::', New_Project_Owner);
                New_Project_Annotator = await projectsPage.getCellText(5);
                console.log('New_Project_Annotator:::', New_Project_Annotator.split('\n'));
                New_Project_Labels = await projectsPage.getCellText(6);
                console.log('New_Project_Labels:::', New_Project_Labels);
            } else {
                console.log('can not filter out the projects....')
            }
            since('project name should be edited').expect(New_Project_Name_Text).toEqual(Constant.project_name);
            since('project owner should be 2 and content correct').expect(New_Project_Owner).toEqual(Constant.username + ',' + projectEditData.TextProject.Owner);
            since('project annotator should be 2 and content correct').expect(New_Project_Annotator.split('\n').length).toEqual(4);
            since('project labels should be 7 and content correct').expect(New_Project_Labels).toEqual(projectCreateData.TextProject.Labels + ',' + projectEditData.TextProject.Labels);

        } else {
            console.log('can not filter out the projects....')
        }
        done();

    })
})