/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const config = require('../../config/config');
const { WebClient } = require('@slack/web-api');
const web = new WebClient(config.slackBotUserOAuthToken);



async function findConversation(req) {
    try {
        let id = req.body.slackId
        const result = await web.conversations.info({ channel: id });
        if (result.ok) {
            return { id: result.channel.id, name: result.channel.name, is_member: result.channel.is_member }
        } else {
            return
        }
    }
    catch (error) {
        return
    }
}




module.exports = {
    findConversation
}

