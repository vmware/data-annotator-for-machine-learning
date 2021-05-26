/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { CommonPage } from '../general/commom-page';
import { browser, $, ExpectedConditions } from 'protractor';
import { Constant } from '../general/constant';

export class DatasetsPage extends CommonPage {

    navigateTo() {
        return browser.wait(ExpectedConditions.visibilityOf($('.header-nav a[ng-reflect-router-link="/datasets"]')), Constant.DEFAULT_TIME_OUT)
            .then(() => {
                $('.header-nav a[ng-reflect-router-link="/datasets"]').click();
            })
    }
}

