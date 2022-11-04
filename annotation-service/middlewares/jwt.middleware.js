/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const jwt = require('express-jwt');
const config = require('../config/config');
const JWTS = require('jsonwebtoken');
const { API_VERSION, API_BASE_PATH, TOKEN_EXPIRE_TIME, TOKEN_ALGORITHM, TOKEN_SECRET_OR_PRIVATE_KEY} = require('../config/constant');
const APIs = require('../resources/APIs');

jwtTokenAuthrization = (data) => {
    if (config.ESP) {
        return jwt({
            secret: data.key.replace(/RSA /g, ''),
            algorithms: [data.alg],
            issuer: config.tokenIssuer,
            getToken: fromHeaderOrQuerystring,
            requestProperty: 'auth',
        }).unless({
            path: [
                `${API_BASE_PATH}/api/${API_VERSION}${APIs.EMAIL_REGULAR_NOTIFICATION}`,
            ],
        });
    } else {
        return jwt({
            secret: TOKEN_SECRET_OR_PRIVATE_KEY,
            algorithms: [TOKEN_ALGORITHM],
            getToken: fromHeaderOrQuerystring,
            requestProperty: 'auth',
        }).unless({
            path: [
                `${API_BASE_PATH}/api/${API_VERSION}${APIs.REGISTER}`,
                `${API_BASE_PATH}/api/${API_VERSION}${APIs.LOGIN}`,
                `${API_BASE_PATH}/api/${API_VERSION}${APIs.EMAIL_REGULAR_NOTIFICATION}`,
            ],
        });
    }

};

function fromHeaderOrQuerystring(req) {

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        req.headers.authorization = "Bearer " + req.query.token;
        return req.query.token;
    }
    return null;
}

async function generateBasicToken(user) {

    const expires_time = Math.floor(Date.now() / 1000) + TOKEN_EXPIRE_TIME;
    const access_token = await JWTS.sign({
        exp: expires_time,
        email: user
    },
        TOKEN_SECRET_OR_PRIVATE_KEY,
        {
            algorithm: TOKEN_ALGORITHM
        }
    );
    return {
        access_token: access_token,
        access_type: "Bearer",
        expires_in: TOKEN_EXPIRE_TIME,
        expires_time: expires_time
    }
}

module.exports = {
    jwtTokenAuthrization,
    generateBasicToken,
}