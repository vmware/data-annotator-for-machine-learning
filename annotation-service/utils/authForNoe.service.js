/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const axios = require('axios');
const config = require('../config/config');
const MESSAGE = require('../config/code_msg');

let token;
let expirationDate;

const generateEsp2NoeToken = async() => {
    
    const response = await axios
        .create({
            validateStatus: () => {
                return true;
            },
        })
        .post(`${config.authServiceUrl}/api/auth/v1/tokens`, {
            grant_type: 'client_credentials',
            client_id: `${config.esp2NoeClientId}`,
            client_secret: `${config.esp2NoeClientSecret}`,
        });

    if (response.status === 200) {
        console.log('[ ESP-TOKEN ] Utils generateEsp2NoeToken success');
        return response.data;
    }

    console.error('[ ESP-TOKEN ] [ ERROR ] Utils generateEsp2NoeToken: ', response.data);
    MESSAGE.VALIDATION_UNAUTH_TOKEN.DATA = [{ statusText: response.statusText, data: response.data }]
    throw MESSAGE.VALIDATION_UNAUTH_TOKEN;
};

module.exports.getEsp2NoeToken = async() => {
    console.log('[ ESP-TOKEN ] Utils getEsp2NoeToken');
    if (token === undefined || expirationDate === undefined || expirationDate < new Date()) {
        const data = await generateEsp2NoeToken();
        token = data.access_token;
        expirationDate = new Date(Date.now() + data.expires_in * 1000 - 1000);
    }
    return token;
};