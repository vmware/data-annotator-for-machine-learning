/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const projectService = require("../project.service");
const { formatDate } = require('../../utils/common.utils');
const { generateObj, returnAllPageFunc } = require('./utils/slack.utils');
const config = require('../../config/config');
const { findUserInChannels } = require('./slackUsers.service')
const _ = require("lodash");




async function buildAppHome(bolt) {
    // Listen for users opening your App Home
    bolt.event('app_home_opened', async ({ event, client, logger }) => {
        try {
            if (event.tab === "home") {
                const user = await client.users.info({ user: event.user });
                const projects = await getProjectsForSlack(event, user.user.profile.email);
                const blocks = await generateHomeBlocks(event, projects, 1);
                await updateHomeView(event, client, blocks);
                await listenPagination(event, bolt, "previus_page_btn", projects);
                await listenPagination(event, bolt, "next_page_btn", projects);
            }

        }
        catch (error) {
            console.log('[ SLACK_BUILD_HOME ] [ ERROR ]  buildAppHome: ' + error);
        }
    });
}


async function updateHomeView(event, client, blocks) {
    const newResult = await client.views.publish({
        user_id: event.user,
        view: {
            "type": "home",
            "blocks": blocks
        }
    });
    if (newResult.ok) {
        console.log('[ SLACK_BUILD_HOME ] [ OK_⚡️ ]');
    }
}



async function generateHomeBlocks(event, projects, page) {

    let blocks = [];
    blocks.push(await generateObj("section", await generateObj("mrkdwn", `*:raised_hands: Welcome to start annotate, <@${event.user}>*\n\nWith ${config.slackAppName} and Slack together ,you can annotate text classification and tabular data now. Please feel free to annotate any of the following project. For text annotation projects, where a label should be selected based on a text description and any additional attributes. For tabular, where a label should be selected based on a large set of attributes. And for more types (log/image/ner) of annotation please visit <${config.WebClientUrl}|${config.teamTitle}>.\n\n`)));

    if (projects.length > 0) {
        for (let project of projects[page - 1].data) {

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
        //to generate pagination block
        if (projects[page - 1].total > 10) {
            const divider = await generateObj("divider");
            blocks.push(divider);
            blocks.push(await generateObj("section", await generateObj("mrkdwn", `Viewing records ${(projects[page - 1].pageNum) * (projects[page - 1].pageSize) - (projects[page - 1].pageSize - 1)} - ${(page - 1) * (projects[page - 1].pageSize) + projects[page - 1].data.length} of ${projects[page - 1].total}`)));
            const previousBtn = await generateObj("button", await generateObj("plain_text", `Previus`), undefined, String(page), 'previus_page_btn');
            const nextBtn = await generateObj("button", await generateObj("plain_text", `Next`), undefined, String(page), 'next_page_btn');
            blocks.push({ "type": "actions", "elements": [previousBtn, nextBtn] });
        }
    } else {
        blocks.push(await generateObj("divider"));
        let alert = await generateObj("section", await generateObj("mrkdwn", `:smiling_face_with_tear: *oh,sorry*\n\nWe couldn't find any project for you. Please go to <${config.WebClientUrl}|${config.teamTitle}> to create one first.`));
        blocks.push(alert)
    }
    return blocks
}


async function getProjectsForSlack(event, email) {
    const projects = await projectService.getProjectsTextTabular(email);
    let arr = [];
    for (let i = 0; i < projects.length; i++) {
        if (projects[i].annotator.indexOf(email) > -1) {
            arr.push(projects[i])
        } else {
            let find = await findUserInChannels(event, _.map(projects[i].assignSlackChannels, "slackId"));
            if (find === 1) {
                arr.push(projects[i])
            }
        }
    }
    // to do pagination
    const pageObj = await returnAllPageFunc(10, arr);
    return pageObj
}


async function listenPagination(event, bolt, action_id, projects) {
    //to listening all the start-annotate-btn
    bolt.action({ action_id },
        async ({ body, client, ack, logger }) => {
            await ack();
            try {
                if (body.user && body.actions) {
                    if (action_id === 'previus_page_btn') {
                        if (Number(body.actions[0].value) - 1 > 0) {
                            var blocks = await generateHomeBlocks(event, projects, Number(body.actions[0].value) - 1)
                        } else {
                            return
                        }
                    } else if (action_id === 'next_page_btn') {
                        if (Number(body.actions[0].value) + 1 > projects.length) {
                            return
                        } else {
                            var blocks = await generateHomeBlocks(event, projects, Number(body.actions[0].value) + 1)
                        }
                    }
                    await updateHomeView(event, client, blocks)
                }
            }
            catch (error) {
                logger.error(error);
            }
        });
}


module.exports = {
    buildAppHome
}