/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const { generateObj } = require("./utils/slack.utils");
const srsService = require("../../services/srs-service");
const projectService = require("../project.service");
const accessToken = require("./utils/accessToken.service")


async function openModal(bolt, client, body) {
    try {
        const user = await client.users.info({ user: body.user.id });
        const metadata = { pid: body.actions[0].value, email: user.user.profile.email };
        const result = await client.views.open({
            // Pass a valid trigger_id within 3 seconds of receiving it
            trigger_id: body.trigger_id,
            view: {
                "type": 'modal',
                "callback_id": 'annotate_modal',
                "private_metadata": JSON.stringify(metadata),
                "title": {
                    "type": 'plain_text',
                    "text": "Annotate Details"
                },
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "loading ..."
                        }
                    }
                ]
            }
        });
        if (result.ok) {
            const sr = await srsService.getOneSrs({ query: { pid: body.actions[0].value }, auth: { email: user.user.profile.email } });
            const projectInfo = await projectService.getProjectInfo({ query: { pid: body.actions[0].value } });
            await updateAnnotateModal(result, client, sr, projectInfo);
        }
    }
    catch (error) {
        console.log('[ SLACK_MODAL ] [ ERROR ]  openModal: ' + error);
    }
}

async function actionListening(bolt, action_id) {
    bolt.action({ action_id: action_id },
        async ({ body, client, ack, logger }) => {
            await ack();
            try {
                if (body.user && body.actions) {
                    const metadata = JSON.parse(body.view.private_metadata);
                    if (action_id === "annotate_label_radio") {
                        const token = await accessToken.getEspToken(metadata.email);
                        await srsService.updateSrsUserInput({ body: { pid: metadata.pid, userInput: [{ problemCategory: [body.actions[0].selected_option.value], tid: body.actions[0].block_id }] }, auth: { email: metadata.email }, headers: { authorization: "Bearer " + token } }, 'slack')
                        var sr = await srsService.getOneSrs({ query: { pid: metadata.pid }, auth: { email: metadata.email } });
                    } else if (action_id === "skip_btn") {
                        var sr = await srsService.skipOne({ body: { pid: metadata.pid, tid: body.actions[0].value }, auth: { email: metadata.email }, headers: { authorization: '' } })
                    } else if (action_id === "flag_btn") {
                        var sr = await srsService.flagSr({ body: { pid: metadata.pid, tid: body.actions[0].value }, auth: { email: metadata.email }, headers: { authorization: '' } })
                    }
                    const projectInfo = await projectService.getProjectInfo({ query: { pid: metadata.pid } });
                    await updateAnnotateModal(body, client, sr, projectInfo);
                }
            }
            catch (error) {
                console.log('[ SLACK_MODAL ] [ ERROR ]  actionListening: ' + error);
            }
        });
}



async function updateAnnotateModal(body, client, sr, projectInfo) {
    try {
        if (!(sr[0] && sr[0].originalData)) {
            await generateJobDoneView(body, client);
            return;
        }
        const blocks = await generateAnnotateModalBlocks(sr, projectInfo)
        // Call views.update with the built-in client
        // await new Promise(r => setTimeout(r, 1000));
        const result = await client.views.update({
            view_id: body.view.id,
            view: {
                "type": 'modal',
                "callback_id": 'annotate_modal',
                "private_metadata": body.view.private_metadata,
                "title": {
                    "type": 'plain_text',
                    "text": "Annotate Details"
                },
                "blocks": blocks
            }
        });
        if (result.ok) {
            return;
        }
    }
    catch (error) {
        console.log('[ SLACK_MODAL ] [ ERROR ]  updateAnnotateModal: ' + error);
    }
}

async function generateAnnotateModalBlocks(sr, projectInfo) {
    const blocks = [];
    blocks.push(await generateObj("header", await generateObj("plain_text", projectInfo.projectName)))
    blocks.push(await generateObj("section", await generateObj("mrkdwn", `*${projectInfo.ticketDescription}*`)))
    let text = ``;
    for (let key in sr[0].originalData) {
        text += `*${key}*:\n\n${sr[0].originalData[key]}\n\n`;
    }
    blocks.push({ "type": "context", "elements": [await generateObj("mrkdwn", `${text}`)] });


    let radioSection = await generateObj("section", await generateObj("mrkdwn", `*${projectInfo.annotationQuestion}*`), undefined, undefined, undefined, sr[0]._id)
    let acsy = await generateObj("radio_buttons")
    let options = [];
    for (let label of projectInfo.categoryList.split(',')) {
        options.push(await generateObj(undefined, await generateObj("plain_text", label), undefined, label))
    }
    acsy.options = options;
    acsy.action_id = "annotate_label_radio";
    radioSection.accessory = acsy;
    blocks.push(radioSection);

    // add flag and skip
    let elements = [];
    if (!sr[0].flag.silence) {
        let flagBtn = await generateObj("button", await generateObj("plain_text", 'Flag to Review'), 'danger', sr[0]._id, 'flag_btn')
        elements.push(flagBtn)
    }
    let skipBtn = await generateObj("button", await generateObj("plain_text", 'Skip'), 'primary', sr[0]._id, 'skip_btn');
    elements.push(skipBtn)
    blocks.push({ "type": "actions", "elements": elements });

    return blocks;
}


async function generateJobDoneView(body, client) {
    const finish = await client.views.update({
        view_id: body.view.id,
        view: {
            "type": 'modal',
            "callback_id": 'annotate_modal',
            "title": {
                "type": 'plain_text',
                "text": "Annotate Details"
            },
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": ":white_check_mark: *Well Done! Annotation finished!*"
                    }
                }
            ]
        }
    });
    return
}


async function clickActionBtnListening(bolt, action_id) {
    bolt.action({ action_id: action_id },
        async ({ body, client, ack, logger }) => {
            await ack();
            try {
                if (body.user && body.actions) {
                    const metadata = JSON.parse(body.view.private_metadata);
                    const sr = srsService.skipOne()


                    const projectInfo = await projectService.getProjectInfo({ query: { pid: metadata.pid } });
                    await updateAnnotateModal(body, client, sr, projectInfo);

                }
            }
            catch (error) {
                console.log('[ SLACK_MODAL ] [ ERROR ]  clickActionBtnListening: ' + error);
            }
        });
}

module.exports = {
    openModal,
    actionListening,
    clickActionBtnListening
}