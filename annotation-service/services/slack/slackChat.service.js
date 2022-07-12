/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const config = require('../../config/config');
const { WebClient } = require('@slack/web-api');
const web = new WebClient(config.slackBotUserOAuthToken);



async function publishMessage(data) {
    try {
        let blocks = await generateMessageBlocks(data);
        // Call the chat.postMessage method using the built-in WebClient
        for (let i = 0; i < data.channels.length; i++) {
            await web.chat.postMessage({
                channel: data.channels[i].slackName,
                text: `:loud_sound:${data.pname} is ready to annotate.`,
                blocks: blocks
            });
        }
    }
    catch (error) {
        console.error(error);
        return error;
    }
}


async function generateMessageBlocks(data) {
    return [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": `${data.pname} is ready to annotate`
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ` >*Project Name:* ${data.pname} \n>*Create Date:* ${data.createdDate}\n>*Creator:* ${data.creator}\n>*Total Tickets:* ${data.totalCase}\n`
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Start Annotate"
                    },
                    "style": "primary",
                    "value": `${data.pid}`,
                    "action_id": "click_btn_start_annotate"
                }
            ]
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": `:information_desk_person: For more detail, please visit <${config.WebClientUrl}|${config.teamTitle}>`
                }
            ]
        }
    ]

}
module.exports = {
    publishMessage,
}

