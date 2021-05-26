/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Constant } from '../general/constant'
import { $} from 'protractor'
import { DownloadSharePage } from '../page-object/download-share-page'
import { CommonPage } from '../general/commom-page'
import { FunctionUtil } from '../utils/function-util'

describe('verify generate-download-share funtion', () => {

    const filename = 'Export_adult_test_'
    const dirPath = process.cwd() + '\\doc\\download';
    
    let commonPage: CommonPage = new CommonPage
    let downloadSharePage: DownloadSharePage  = new DownloadSharePage
    let project_name: string  = Constant.project_name

    describe('verify project tab' , ()=>{
        
        beforeEach((down) => {
            downloadSharePage.reMoveDir(dirPath);
            down();
        })

        it('generate-new-dataset', async (done) => {
            const PROJECT_TAB = $('.header-nav a[href="/projects"]')
            await FunctionUtil.click(PROJECT_TAB);
            await commonPage.waitForPageLoading();
            await commonPage.filterProjectName(project_name);
            await downloadSharePage.clickdownloadProject();
            await downloadSharePage.clickGenerateNewDataset();
            expect(await downloadSharePage.verifyDownloadFileExisted(filename, dirPath)).toBe(true);
            done();
        })
        
        it('download project', async (done) => {
            await downloadSharePage.clickdownloadProject();
            await downloadSharePage.downloadPrject();
            expect(await downloadSharePage.verifyDownloadFileExisted(filename, dirPath)).toBe(true);
            done();
        })

        it('share project', async (done) => {
            if (await downloadSharePage.verifySharedStatus() == 'folder') {
                await downloadSharePage.clickShareBtn();
                await downloadSharePage.inputShareInfo('e2e test share project');
                await downloadSharePage.shareProject();
                expect(downloadSharePage.verifySharedStatus()).toEqual('folder-open');
                done();
            }else{
                expect(downloadSharePage.verifySharedStatus()).toEqual('folder-open');
                done();
            }

        })
    })
    
    describe('verify community-dataset tab' , ()=>{
        
        beforeEach((down) => {
            downloadSharePage.reMoveDir(dirPath);
            down();
        })

        it('generate-new-dataset', async (done) => {
            const COMMUNITY_DATASETS_TAB = $('.header-nav a[href="/datasets"]')
            await FunctionUtil.click(COMMUNITY_DATASETS_TAB);
            await commonPage.waitForPageLoading();
            await commonPage.filterProjectName(project_name);
            await downloadSharePage.clickdownloadProject();
            await downloadSharePage.clickGenerateNewDataset();
            expect(await downloadSharePage.verifyDownloadFileExisted(filename, dirPath)).toBe(true);
            done();
        })

        it('download project', async (done) => {
            await downloadSharePage.clickdownloadProject();
            await downloadSharePage.downloadPrject();
            expect(await downloadSharePage.verifyDownloadFileExisted(filename, dirPath)).toBe(true);
            done();
        })

    })


    
})
