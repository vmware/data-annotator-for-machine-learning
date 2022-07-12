/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const express = require("express");
const router = express.Router();
const APIs = require('../resources/APIs');
const slackConversations = require("../services/slack/slackConversations.service")

router.post(APIs.CONVERSATION_LIST, (req, res) => {
    console.log(`[ SLACK ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    slackConversations.findConversation(req).then(response => {
        console.log(`[ SLACK ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.error(`[ SLACK ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});



module.exports = router;