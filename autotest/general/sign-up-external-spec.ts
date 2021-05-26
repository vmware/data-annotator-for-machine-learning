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
    let since = require('jasmine2-custom-message');


    beforeAll((done) => {
        loginPage = new LoginPage();
        loginBusiness = new LoginBussiness();
        browser.sleep(1000)
            .then(() => {
                loginPage.navigateTo()
            })
            .then(() => {
                browser.sleep(1000)
                done();
            })
    })

    it('sign up with normal user successfully', async (done) => {
        await loginBusiness.signUp(Constant.firstname, Constant.lastname, Constant.username, Constant.password);
        browser.sleep(5000);
        since('prompt should show up and content correct').expect(loginPage.getPromptText()).not.toEqual('');
        done();
    })
})