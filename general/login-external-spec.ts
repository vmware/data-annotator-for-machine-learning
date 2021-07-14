/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { LoginPage } from "../page-object/login-page";
import { LoginBussiness } from "./login-bussiness";
import { browser } from "protractor";
import { Constant } from './constant';


describe('Service', () => {
    let loginPage: LoginPage
    let loginBusiness: LoginBussiness;

    beforeAll((done) => {
        loginPage = new LoginPage();
        loginBusiness = new LoginBussiness();
        browser.sleep(1000)
            .then(() => {
                loginPage.backToHomePage()
            })
            .then(() => {
                loginPage.navigateTo()
            })
            .then(() => {
                browser.sleep(1000)
                done();
            })
    })

    it('Should login with normal user successfully', async (done) => {
        await loginBusiness.login(Constant.username, Constant.password);
        done();
    })
})