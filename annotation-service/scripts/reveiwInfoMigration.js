/***
 * 
 * Copyright 2019-2022 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const mongoDb = require("../db/mongo.db");
const ObjectId = require("mongodb").ObjectID;
const { getModelProject } = require("../utils/mongoModel.utils");
const { ProjectModel, UserModel, LogModel, SrModel, ImgModel } = require("../db/db-connect");
const { model } = require("mongoose");
const MESSAGE = require('../config/code_msg');

async function migrationAllTicketsReviewInfo(req) {
    
    const now = new Date(Date.now());
    console.log(`MIGRATION START`, now.toLocaleTimeString());
    
    const projects = await mongoDb.findByConditions(ProjectModel, {});
    for (const project of projects) {
        const mp = await getModelProject({ _id: ObjectId(project._id) })

        const conditions = {
            projectName: mp.project.projectName,
            userInputsLength: { $gte: mp.project.maxAnnotation },
            "reviewInfo.reviewed": true,
        };
        const tickets = await mongoDb.findByConditions(mp.model, conditions);

        for (const ticket of tickets) {
            const ticketCondition = { _id: ticket._id };
            let update = {};

            if (ticket.reviewInfo.modified) {
                let userInputs = ticket.userInputs;
                if(!userInputs.length){
                    continue;
                }
                
                for (const input of userInputs) {
                    input.user = ticket.reviewInfo.user;
                }
                //modified
                update.$set = {
                    "reviewInfo.passed": false,
                    "reviewInfo.userInputs": userInputs,
                    "userInputs": [],
                };
            }else{
                //passed
                update.$set = {
                    "reviewInfo.passed": true,
                    "reviewInfo.userInputs": [{
                        user: ticket.reviewInfo.user,
                        timestamp: ticket.reviewInfo.reviewedTime
                    }]
                };
            }
            await mongoDb.findOneAndUpdate(mp.model, ticketCondition, update);
        }
        console.log(`migration project: ${mp.project.projectName} data lenth: ${tickets.length}`);

    }
    console.log(`migration projects: ${projects.length}`);

    const end = new Date(Date.now());
    console.log(`MIGRATION DONE ${now.toLocaleTimeString()}, use time: ${(end-now)/1000} 's` );

    return MESSAGE.SUCCESS;
}


module.exports = {
    migrationAllTicketsReviewInfo,
}