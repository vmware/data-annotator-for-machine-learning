/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const csv = require('csvtojson');
const config = require("../config/config");
const { PAGINATELIMIT, PROJECTTYPE, ENCODE, SOURCE, OPERATION } = require("../config/constant");
const emailService = require('../services/email-service');
const axios = require("axios");
const fileSystemUtils = require('./fileSystem.utils');
const mongoDb = require('../db/mongo.db');
const { ProjectModel, SrModel } = require('../db/db-connect');
const slackChat = require("../services/slack/slackChat.service");
const { formatDate } = require('./common.utils');
const {updateDatasetProjectInfo} = require('../services/dataSet-service');


module.exports = {
    execute: async function (req, annotators) {
        const projectType = req.body.projectType;
        const source = req.body.source;
        if ((projectType != PROJECTTYPE.TEXT && projectType != PROJECTTYPE.TABULAR && projectType != PROJECTTYPE.NER && projectType != PROJECTTYPE.QA) || source == SOURCE.MODEL_FEEDBACK) {
            return;
        }
        const start = Date.now();
        console.log(`[ SRS ] Utils srsImporter.execute start: `, start);

        let header = req.body.header;
        header = (typeof header === 'string' ? JSON.parse(header) : header);
        let selectedColumn = req.body.selectDescription;
        selectedColumn = (typeof selectedColumn === 'string' ? JSON.parse(selectedColumn) : selectedColumn);
        const user = req.auth.email;
        let questionForText = req.body.questionForText? req.body.questionForText: [];
        questionForText = (typeof questionForText === 'string' ? JSON.parse(questionForText): questionForText);


        let totalCase = 0;
        let docs = [];
        let headerRule = {
            noheader: false,
            fork: true,
            flatKeys: true,
            headers: header,
            checkType: true
        };
        if (req.body.isHasHeader == 'no') {
            headerRule.noheader = true;
        };
        if (projectType == PROJECTTYPE.TEXT) {
            headerRule.checkType = false;
        }
        let fileStream = await fileSystemUtils.handleFileStream(req.body.location);

        // chunking line by line to read
        console.log(`[ SRS ] Utils import data to db start: `, Date.now());
        csv(headerRule).fromStream(fileStream).subscribe((oneData) => {
            saveData(oneData);
        }, async (error) => {
            console.log(`[ SRS ] [ERROR] Utils import data have ${error}: `, Date.now());
        }, async () => {
            setTimeout(async () => {
                await finishSaveData();
            }, 1000 * 5);
        });

        // handle and save data to db
        function saveData(oneData) {
            //only save selected data
            let select = {};
            for (const item of selectedColumn) {
                select[item] = oneData[item];
            }

            //check all selected data if is empty
            let selectedData = Object.values(select).toString().replace(new RegExp(',', 'g'), '').trim();
            if (selectedData) {
                let sechema = {
                    projectName: req.body.pname,
                    userInputsLength: 0,
                    originalData: select,
                };
                if (projectType == PROJECTTYPE.QA) {
                    let questions = [];
                    for (const q of questionForText) {
                        if (!q || !q.trim() || !oneData[q]) {
                            continue;
                        }
                        for (const question of oneData[q].split("?")) {
                            if (question.trim()) {
                                questions.push(question.trim()+"?");
                            }
                        }
                    }
                    sechema.questionForText = questions;
                }
                //support ner quesion anwser column display
                if (projectType == PROJECTTYPE.NER && req.body.ticketQuestions.length) {
                    let ticketQuestions = {};
                    for (const qst of req.body.ticketQuestions) {
                        questionData = oneData[qst]
                        if (typeof oneData[qst] === 'object') {
                            questionData = JSON.stringify(questionData);
                        }
                        ticketQuestions[qst] = questionData;
                    }
                    sechema.ticketQuestions = ticketQuestions;
                }

                //support ner regression
                if ((req.body.regression == 'true' || req.body.regression == true) && projectType == PROJECTTYPE.NER) {
                    let selectLabels = req.body.selectLabels;
                    selectLabels = (typeof selectLabels === 'string' ? JSON.parse(selectLabels) : selectLabels);
                    let problemCategory = [];
                    for (const lb of selectLabels) {
                        for (const dataLb of oneData[lb]) {
                            if (typeof dataLb === 'object') {
                                problemCategory.push({
                                    text: Object.keys(dataLb)[0],
                                    start: Object.values(dataLb)[0][0],
                                    end: Object.values(dataLb)[0][1],
                                    label: lb
                                });
                            }
                        }
                    }
                    sechema.userInputs = [{ problemCategory: problemCategory }];
                }
                docs.push(sechema);
                totalCase += 1;
            }
            //batch write data to db 
            if (docs.length && docs.length % PAGINATELIMIT == 0) {
                const options = { lean: true, ordered: false };
                mongoDb.insertMany(SrModel, docs, options);
                docs = [];
            }
        }

        //handle data finish
        async function finishSaveData() {
            try {
                console.log(`[ SRS ] Utils import last sr data to db`);
                const options = { lean: true, ordered: false };
                mongoDb.insertMany(SrModel, docs, options);
                docs = [];

                console.log(`[ SRS ] Utils import data to db end: `);
                const condition = { projectName: req.body.pname };
                const update = {
                    $set: {
                        totalCase: totalCase
                    }
                };
                console.log(`[ SRS ] Utils update totalCase:`, totalCase);
                await mongoDb.findOneAndUpdate(ProjectModel, condition, update);

                await updateDatasetProjectInfo(req.body.selectedDataset, req.body.pname, OPERATION.ADD);

                console.log(`[ SRS ] Utils srsImporter.execute end: within:[ ${(Date.now() - start) / 1000}s ] `);

                if (config.buildSlackApp) {
                    console.log(`[ SRS ] Utils sendNotificationToSlack`);
                    const projectInfo = await mongoDb.findOneByConditions(ProjectModel, { projectName: req.body.pname })
                    let params = {
                        channels: req.body.slack,
                        pname: req.body.pname,
                        creator: req.auth.email,
                        totalCase: totalCase,
                        createdDate: await formatDate(Number(projectInfo.createdDate)),
                        pid: projectInfo._id

                    };
                    await slackChat.publishMessage(params)
                }

                if (annotators.length > 0) {
                    console.log(`[ SRS ] Utils sendEmailToAnnotator`);
                    const param = {
                        body: {
                            annotator: annotators,
                            pname: req.body.pname
                        },
                        auth: { email: user }
                    }
                    emailService.sendEmailToAnnotator(param).catch(err => console.error(`[ SRS ][ ERROR ] send email:`, err));
                }


                //trigger tabular one-hot-encoding project generate the vector model
                if (req.body.encoder == ENCODE.ONEHOT) {
                    console.log(`[ SRS ] Utils trigger active learning vector sr data`);
                    const opts = {
                        headers: { 'Content-Type': 'application/json', Authorization: req.headers.authorization.split("Bearer ")[1] }
                    }
                    axios.post(`${config.loopALApiUrl}/al/sr/vector`, condition, opts);
                }

            } catch (error) {
                console.log(`[ SRS ] [ERROR] Utils importe srs done, but fail on update tatalcase or send email ${error}: `, Date.now());
            }
        }
    }

}
