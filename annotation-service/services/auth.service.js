/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const axios = require('axios');
const config = require('../config/config');
const { generateBasicToken } = require('../middlewares/jwt.middleware');
const userService = require('./user-service');
const https = require('https');
const MESSAGE = require('../config/code_msg')

let publicKey;

const obtainPublicKey = async () => {
    const response = await axios.create({ validateStatus: () => { return true } }).get(`${config.authServiceUrl}/api/auth/v1/tokens/public-key`);

    if (response.status === 200) {
        console.log(`[ AUTH ] Service successfully obtainPublicKey`);
        return response.data;
    }

    const error = {
        msg: 'Unable to get public key using Auth service',
        data: { statusText: response.statusText, data: response.data },
    };
    console.error(`[ AUTH ] [ERROR] Service obtainPublicKey ${error.data}`);
    throw new Error(error.msg, error.data);
};

async function getPublicKey() {
    console.log(`[ AUTH ] Service get public key`);
    if (publicKey === undefined) {
        publicKey = await obtainPublicKey();
    }
    return publicKey;
};

async function authentication() {
    if (config.ESP) {
        return getPublicKey()
    }
    return "open source";
}


async function login(req) {
    if (!req.body.email || !req.body.password) {
        throw MESSAGE.VALIDATION_UNAUTH;
    }
    let user;
    if (req.body.ldap) {
        user = await authenticateWithLDAP(req);
    } else {
        user = await basicLogin(req);
    }

    const token = await generateBasicToken(user.email);
    return {
        token: token,
        email: user.email,
        fullName: user.fullName,
        role: user.role
    };
}

async function refreshToken(req) {
    return generateBasicToken(req.auth.email);
}

async function basicLogin(req) {
    const user = await userService.queryUserById(req.body.email);
    if (!user) {
        throw MESSAGE.VALIDATION_UNAUTH;
    }
    if (user.password != Buffer.from(req.body.password).toString("base64")) {
        throw MESSAGE.VALIDATION_UNAUTH;
    }
    return user;
}

async function authenticateWithLDAP(req) {
    if (!config.loginWithLDAP) {
        throw MESSAGE.VALIDATION_LDAP;
    }
    const userBtoa = Buffer.from(`${req.body.email}:${req.body.password}`).toString('base64');
    const requestOptions = {
        method: 'post',
        url: config.loginWithLDAP,
        headers: { "Authorization": "Basic " + userBtoa },
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
    };
    try {
        resp = await axios.request(requestOptions);
        if (resp.status != 200) {
            throw MESSAGE.VALIDATION_UNAUTH;
        }
        const email = resp.data.emailAddress ? resp.data.emailAddress : resp.data.email;
        const userName = resp.data.userName ? resp.data.userName : resp.data.fullName;
        return userService.queryAndUpdateUser(email, userName);

    } catch (error) {
        MESSAGE.ERROR.DATA = [{ CODE: error.code, MSG: error.message }]
        throw MESSAGE.ERROR;
    }
}

module.exports = {
    authentication,
    login,
    refreshToken,
}