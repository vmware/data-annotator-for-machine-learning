/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const projectService = require("../project.service");
const { formatDate } = require('../../utils/common.utils');
const { generateObj } = require('./slack.utils');
const config = require('../../config/config');




async function buildAppHome(bolt) {
    // Listen for users opening your App Home
    bolt.event('app_home_opened', async ({ event, client, logger }) => {
        try {
            // Call views.publish with the built-in client
            const result = await client.views.publish({
                user_id: event.user,
                view: {
                    "type": 'home',
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": `*:raised_hands: Welcome to start annotate, <@${event.user}>*\n\nWith DAML and Slack together ,you can annotate text classification and tabular data now. Please feel free to annotate any of the following project. For text annotation projects, where a label should be selected based on a text description and any additional attributes. For tabular, where a label should be selected based on a large set of attributes. And for more types (log/image/ner) of annotation please visit <${config.WebClientUrl}|${config.teamTitle}>.\n\n`
                            }
                        },

                        {
                            "type": "image",
                            "image_url": "https://icon-library.com/images/loading-icon-animated-gif/loading-icon-animated-gif-19.jpg",
                            "alt_text": "data is on the way..."
                        }
                    ]
                }
            });
            if (result.ok) {
                const blocks = await generateHomeBlocks(event, client);
                // Call views.publish with the built-in client
                const newResult = await client.views.publish({
                    user_id: event.user,
                    view: {
                        "type": "home",
                        "blocks": blocks
                    }
                });
                if (newResult.ok) {
                    console.log('build_home_ok_ok_ok_ok')
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    });
}




async function generateHomeBlocks(event, client) {
    // Call the users.info method using the WebClient
    const user = await client.users.info({ user: event.user });
    const projects = await projectService.getProjects({ query: { src: 'annotate' }, auth: { email: user.user.profile.email } })
    let blocks = [];
    blocks.push(await generateObj("section", await generateObj("mrkdwn", `*:raised_hands: Welcome to start annotate, <@${event.user}>*\n\nWith DAML and Slack together ,you can annotate text classification and tabular data now. Please feel free to annotate any of the following project. For text annotation projects, where a label should be selected based on a text description and any additional attributes. For tabular, where a label should be selected based on a large set of attributes. And for more types (log/image/ner) of annotation please visit <${config.WebClientUrl}|${config.teamTitle}>.\n\n`)));

    for (let project of projects) {
        if (!project.isMultipleLabel && project.labelType === 'textLabel' && (project.projectType === 'tabular' || project.projectType === 'text')) {
            const divider = await generateObj("divider");
            blocks.push(divider);

            const accessory = await generateObj("button", await generateObj("plain_text", `Start Annotate`), 'primary', `${project._id}`, 'click_btn_start_annotate');
            const acsy = await generateObj("section", await generateObj("mrkdwn", `*${project.projectName}*`));
            acsy.accessory = accessory;
            blocks.push(acsy);

            let arr = [];
            arr.push(await generateObj("mrkdwn", "`Creator:` " + project.creator));
            arr.push(await generateObj("mrkdwn", "`Created Date:` " + await formatDate(Number(project.createdDate))));
            arr.push(await generateObj("mrkdwn", "`Updated Date:` " + await formatDate(Number(project.updatedDate))));
            arr.push(await generateObj("mrkdwn", "`Progress:` " + project.projectCompleteCase + "/" + project.totalCase));
            arr.push(await generateObj("mrkdwn", "`Data Source:` " + project.dataSource));
            arr.push(await generateObj("mrkdwn", "`Labels:` " + project.categoryList));
            arr.push(await generateObj("mrkdwn", "`Instruction:` " + project.taskInstructions));
            let info = await generateObj("section");
            info.fields = arr;
            blocks.push(info);
        }
    }
    if (blocks.length == 1) {
        blocks.push(await generateObj("divider"));
        let alert = await generateObj("section", await generateObj("mrkdwn", `:smiling_face_with_tear: *oh,sorry*\n\nWe couldn't find any project for you. Please go to <${config.WebClientUrl}|${config.teamTitle}> to create one first.`));
        blocks.push(alert)
    }
    return blocks
}


module.exports = {
    buildAppHome
}