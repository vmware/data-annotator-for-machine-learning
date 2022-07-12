/***
 *
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 *
***/


const config = require('../../config/config');
const { App: Bolt, LogLevel } = require('@slack/bolt');
const slackBuildAppHome = require('./slackBuildAppHome.service');
const slackAnnotateModalService = require('./slackAnnotateModal.service')



async function newBolt() {
    return new Bolt({
        token: config.slackBotUserOAuthToken,
        signingSecret: config.slackSigningSecret,
        socketMode: true,
        appToken: config.slackAppToken,
        // logLevel: LogLevel.DEBUG
        logLevel: LogLevel.ERROR

    });
}


async function slackStart() {
    // start your app
    const bolt = await newBolt();
    await bolt.start();
    console.log(`⚡️⚡️⚡️ Bolt app is running on localhost:${config.serverPort}`)
    await slackBuildAppHome.buildAppHome(bolt);

    // to listening all the start-annotate-btn
    bolt.action({ action_id: "click_btn_start_annotate" },
        async ({ body, client, ack, logger }) => {
            await ack();
            try {
                if (body.user && body.actions) {
                    //open modal within 3 seconds
                    await slackAnnotateModalService.openModal(bolt, client, body)
                }
            }
            catch (error) {
                logger.error(error);
            }
        });

    // to listening all the radio
    await slackAnnotateModalService.actionListening(bolt, "annotate_label_radio")
    await slackAnnotateModalService.actionListening(bolt, "flag_btn")
    await slackAnnotateModalService.actionListening(bolt, "skip_btn")

}




module.exports = { slackStart }