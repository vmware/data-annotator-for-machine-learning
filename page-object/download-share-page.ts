/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { CommonPage } from '../general/commom-page';
import { Constant } from '../general/constant';
import { browser, $, ExpectedConditions, element, by } from 'protractor';
import { FunctionUtil } from '../utils/function-util';



export class DownloadSharePage extends CommonPage {
    DOWNLOAD_BTN = $('button[title="Download Project"]');
    DOWNLOAD_CONFIRM_BTN = $('.modal-content .btn.btn-primary');
    GENERATE_BTN = element(by.partialButtonText('GENERATE NEW DATASET'));
    DOWNLOAD_PROJECT_BTN = element(by.buttonText('DOWNLOAD'));
    LOADING_BTN = element(by.css('div.modal-footer button.uploadLoading'));

    fs = require('fs');

    async clickdownloadProject() {
        await FunctionUtil.click(this.DOWNLOAD_BTN);
    }

    async clickGenerateNewDataset() {
        await FunctionUtil.elementVisibilityOf(this.GENERATE_BTN)
        await FunctionUtil.click(this.GENERATE_BTN);
        await browser.wait(ExpectedConditions.invisibilityOf(this.LOADING_BTN), Constant.DEFAULT_TIME_OUT);
        await browser.sleep(3000);
    }

    async downloadPrject() {
        await FunctionUtil.elementVisibilityOf(this.DOWNLOAD_PROJECT_BTN)
        await FunctionUtil.click(this.DOWNLOAD_PROJECT_BTN);
        await browser.wait(ExpectedConditions.invisibilityOf(this.LOADING_BTN), Constant.DEFAULT_TIME_OUT);
        await browser.sleep(3000);
    }

    clickConfirmDownloadBtn() {
        return browser.wait(ExpectedConditions.visibilityOf(this.DOWNLOAD_CONFIRM_BTN), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                this.DOWNLOAD_CONFIRM_BTN.click()
            })
    }

    async verifyDownloadFileExisted(filename: string, path: string) {
        const dir = this.fs.readdirSync(path)
        console.log('filename:::', filename)
        console.log('path:::', path)
        console.log('dir:::', dir)
        for await (const dirent of dir) {
            if (!dirent.indexOf(filename)) {
                return true
            }
        }
    }

    SHARE_BTN = $('button[title="Share Datasets"]');
    async clickShareBtn() {
        return await FunctionUtil.click(this.SHARE_BTN);
    }

    SHARE_INFO = element(by.id('description'))
    async inputShareInfo(info: string) {
        return await FunctionUtil.sendText(this.SHARE_INFO, info);
    }

    SHARE_OK = element(by.buttonText("OK"));
    async shareProject() {
        return await await FunctionUtil.click(this.SHARE_OK);
    }

    async verifySharedStatus() {
        return await FunctionUtil.getAttribute(this.SHARE_BTN.$('clr-icon:nth-child(1)'), 'shape');
    }

    getDownloadFileName(filename: string) {
        return this.fs.readFileSync(filename, { encoding: 'utf8' })
    }

    reMoveDir(dirPath) {
        try {
            var files = this.fs.readdirSync(dirPath);
        }
        catch (e) {
            return;
        }
        if (files.length > 0)
            for (var i = 0; i < files.length; i++) {
                var filePath = dirPath + '/' + files[i];
                if (this.fs.statSync(filePath).isFile())
                    this.fs.unlinkSync(filePath);
                else
                    this.reMoveDir(filePath);
            }
        this.fs.rmdirSync(dirPath);
    }
}