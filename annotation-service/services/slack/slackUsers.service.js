/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const config = require('../../config/config');
const _ = require("lodash");
const { WebClient } = require('@slack/web-api');
const web = new WebClient(config.slackBotUserOAuthToken);



async function findUserInChannels(event, slackIds) {
    try {
        let params = {
            limit: 1000,
            user: event.user,
            team_id: event.view.team_id,
            types: "public_channel,private_channel",
            cursor: ''
        }
        let found = 0;
        while (found === 0) {
            const result = await web.users.conversations(params);
            params.cursor = result.response_metadata.next_cursor;
            let arr = _.intersection(slackIds, _.map(result.channels, "id"));
            if (arr.length > 0) {
                found = 1;
                return found;
            }
            if (result.response_metadata.next_cursor === "") {
                found = 2;
                return found;
            }
        }
    }
    catch (error) {
        return error
    }
}


module.exports = {
    findUserInChannels
}

