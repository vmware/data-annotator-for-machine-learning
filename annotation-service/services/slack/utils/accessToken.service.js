/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const axios = require('axios');
const config = require('../../../config/config');
const qs = require('qs');
const { generateBasicToken } = require("../../../middlewares/jwt.middleware")
const MESSAGE = require('../../../config/code_msg');

let token;
let expirationDate;


async function generateEspToken() {
    const url = config.espTokenAuthorizeUrl;
    const data = qs.stringify({ token: config.espToken });
    const configs = { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    try {
        const res = await axios.post(url, data, configs);
        if (res.status === 200) {
            console.log('[ ESP-TOKEN ] Utils generateEspToken success');
            return res.data;
        }
    }
    catch (error) {
        console.error('[ ESP-TOKEN ] [ ERROR ] Utils generateEspToken: ', error);
        MESSAGE.VALIDATION_UNAUTH_TOKEN.DATA = [error.data];
        MESSAGE.VALIDATION_UNAUTH_TOKEN.MSG = error.msg;
        throw MESSAGE.VALIDATION_UNAUTH_TOKEN;
    }
}



async function getEspToken(email) {
    console.log('[ ESP-TOKEN ] Utils getEspToken');
    if (token === undefined || expirationDate === undefined || expirationDate < new Date()) {
        if (config.ESP) {
            var dataObj = await generateEspToken();
        } else {
            var dataObj = await generateBasicToken(email);
        }
        token = dataObj.access_token;
        expirationDate = new Date(Date.now() + dataObj.expires_in * 1000 - 1000);
    }
    return token;
}

module.exports = { getEspToken }