/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const ObjectId = require("mongodb").ObjectID;
const projectService = require('./project.service');
const validator = require('../utils/validator');
const { PAGINATELIMIT, APPENDSR, LABELTYPE, PROJECTTYPE, S3OPERATIONS, QUERYORDER, OPERATION } = require("../config/constant");
const csv = require('csvtojson');
const alService = require('./activelearning.service');
const _ = require("lodash");
const { ProjectModel, UserModel, LogModel, SrModel } = require("../db/db-connect");
const mongoDb = require("../db/mongo.db");
const { getModelProject } = require("../utils/mongoModel.utils");
const imgImporter = require("../utils/imgImporter");
const S3Utils = require('../utils/s3');
const logImporter = require('../utils/logImporter');
const fileSystemUtils = require('../utils/fileSystem.utils');
const config = require('../config/config');
const { reduceHierarchicalUnselectedLabel, initHierarchicalLabelsCase } = require('./project.service');
const MESSAGE = require('../config/code_msg');
const {updateDatasetProjectInfo} = require('./dataSet-service')

async function updateSrsUserInput(req, from) {

    console.log(`[ SRS ] Service updateSrsUserInput`);
    const projectId = ObjectId(req.body.pid);
    const user = req.auth.email;

    let _ids = [], usrSr = [];
    req.body.userInput.forEach(input => { _ids.push(input.tid) });

    console.log(`[ SRS ] Service query project info by proId`, projectId);
    const pro = await mongoDb.findById(ProjectModel, projectId);

    // to check whether this email is in the annotator list
    if (pro.annotator.indexOf(user) === -1) {
        await projectService.addAnnotatorFromSlack(pro, user);
    }

    const mp = await getModelProject({ _id: projectId });

    console.log(`[ SRS ] Service find if user already annotated tickets:`, usrSr.length);
    const query = { _id: { $in: _ids }, "userInputs.user": user };
    usrSr = await mongoDb.findByConditions(mp.model, query)

    //validate maxAnnotation and  regression project
    //user not annotate
    if (!usrSr[0]) {
        console.log(`[ SRS ] Service check maxAnnotation avoid concurrent operation`);
        const srs = await mongoDb.findByConditions(mp.model, { _id: { $in: _ids } });
        for (const ticket of srs) {
            if (pro.maxAnnotation <= ticket.userInputsLength) {
                console.log(`[ SRS ] Service concurrent operation ticket:${ticket._id} achieve maxAnnotation:${pro.maxAnnotation}`);
                return {CODE: MESSAGE.VALIDATION_TK_MAX_ANNOTATION.CODE, MSG: MESSAGE.VALIDATION_TK_MAX_ANNOTATION.MSG.replace("${_id}",ticket._id).replace("${maxAnnotation}",pro.maxAnnotation)}
            }
        }
    }
    //validate regression project
    if (pro.labelType == LABELTYPE.NUMERIC) {
        if (pro.isMultipleLabel) {
            const labels = JSON.parse(pro.categoryList);
            const lableInput = req.body.userInput[0].problemCategory;
            for (const lbI of lableInput) {
                const inputkey = Object.keys(lbI)[0];
                const inputValue = Object.values(lbI)[0];
                const label = await labels.find(a => Object.keys(a)[0] == inputkey);
                if (!label || !validator.isNumeric(inputValue) || inputValue < label[inputkey][0] || inputValue > label[inputkey][1]) {
                    console.log(lbI, label, labels);
                    throw MESSAGE.VALIDATION_TK_USER_INPUT_PC;
                }
            }
        } else {
            const lableInput = req.body.userInput[0].problemCategory[0];
            console.log(`[ SRS ] Service validate numeric lable problemCategory=${lableInput}`);
            if (!validator.isNumeric(lableInput) || lableInput < pro.min || lableInput > pro.max) {
                throw MESSAGE.VALIDATION_TK_USER_INPUT_PC;
            }
        }
    }

    //update user input to db
    //for re-edit
    let reEditSrIds = [];
    usrSr.forEach(async ticket => {
        reEditSrIds.push(ticket._id.toString());
        let userInputs = [];
        let questionForText = [];
        req.body.userInput.forEach(async ui => {
            if (ui.tid == ticket._id.toString()) {
                if (pro.projectType == PROJECTTYPE.NER || pro.projectType == PROJECTTYPE.QA) {
                    userInputs.push({
                        problemCategory: ui.problemCategory,
                        user: user,
                        timestamp: Date.now()
                    });
                    if (pro.projectType == PROJECTTYPE.QA) {
                        questionForText = ui.questionForText;
                    }
                } else if (pro.projectType == PROJECTTYPE.LOG) {
                    userInputs.push({
                        logFreeText: ui.logFreeText,
                        problemCategory: ui.problemCategory,
                        user: user,
                        timestamp: Date.now()
                    });
                } else if (pro.labelType == LABELTYPE.NUMERIC && pro.isMultipleLabel) {
                    ui.problemCategory.forEach(lb => {
                        userInputs.push({
                            problemCategory: {
                                label: Object.keys(lb)[0],
                                value: Object.values(lb)[0]
                            },
                            user: user,
                            timestamp: Date.now()
                        });
                    });
                } else if (pro.labelType == LABELTYPE.HIERARCHICAL) {
                    userInputs.push({
                        problemCategory: ui.problemCategory,
                        user: user,
                        timestamp: Date.now()
                    });
                } else {
                    ui.problemCategory.forEach(lb => {
                        userInputs.push({
                            problemCategory: lb,
                            user: user,
                            timestamp: Date.now()
                        });
                    });
                }
            }
        });
        console.log(`[ SRS ] Service re-edit ticket=${ticket._id.toString()}`);
        const conditions = { _id: ObjectId(ticket._id) };
        update = { $pull: { userInputs: { user: user } } }
        await mongoDb.findOneAndUpdate(mp.model, conditions, update);

        update1 = { $push: { userInputs: { $each: userInputs } } }
        //save user definde question
        if (pro.projectType == PROJECTTYPE.QA) {
            update1.$set = {questionForText: questionForText}
        }
        await mongoDb.findOneAndUpdate(mp.model, conditions, update1);
    });

    addSrIds = _ids.filter(id => !reEditSrIds.includes(id))
    console.log(`[ SRS ] Service check _ids=${_ids.length}, addSrIds=${addSrIds.length}, reEditSrIds=${reEditSrIds.length}`)

    // for add new
    addSrIds.forEach(async id => {
        console.log(`[ SRS ] Service add new annotation to ticket=${id.toString()}`);
        let userInputs = [];
        let questionForText = [];
        req.body.userInput.forEach(ui => {
            if (ui.tid == id) {
                if (pro.projectType == PROJECTTYPE.NER || pro.projectType == PROJECTTYPE.QA) {
                    userInputs.push({
                        problemCategory: ui.problemCategory,
                        user: user,
                        timestamp: Date.now()
                    });
                    if (pro.projectType == PROJECTTYPE.QA) {
                        questionForText = ui.questionForText;
                    }
                } else if (pro.projectType == PROJECTTYPE.LOG) {
                    userInputs.push({
                        logFreeText: ui.logFreeText,
                        problemCategory: ui.problemCategory,
                        user: user,
                        timestamp: Date.now()
                    });
                } else if (pro.labelType == LABELTYPE.NUMERIC && pro.isMultipleLabel) {
                    ui.problemCategory.forEach(lb => {
                        userInputs.push({
                            problemCategory: {
                                label: Object.keys(lb)[0],
                                value: Object.values(lb)[0]
                            },
                            user: user,
                            timestamp: Date.now()
                        });
                    });
                } else if (pro.labelType == LABELTYPE.HIERARCHICAL) {
                    userInputs.push({
                        problemCategory: ui.problemCategory,
                        user: user,
                        timestamp: Date.now()
                    });
                } else {
                    ui.problemCategory.forEach(lb => {
                        userInputs.push({
                            problemCategory: lb,
                            user: user,
                            timestamp: Date.now()
                        });
                    });
                }
            }
        });

        let conditions = { _id: ObjectId(id) };
        //regression project
        if (pro.regression && (pro.projectType == PROJECTTYPE.LOG || pro.projectType == PROJECTTYPE.NER)) {
            const updateSR = { $set: { userInputs: [] } };
            await mongoDb.findOneAndUpdate(mp.model, conditions, updateSR);
        }
        let update = { $push: { userInputs: { $each: userInputs } }, $inc: { userInputsLength: 1 } };
        //save user definde question
        if (pro.projectType == PROJECTTYPE.QA) {
            update.$set = {questionForText: questionForText}
        }
        const options = { new: true };
        const srsData = await mongoDb.findOneAndUpdate(mp.model, conditions, update, options);

        console.log(`[ SRS ] Service update project userCompleteCase`);
        conditions = { _id: projectId, "userCompleteCase.user": user };
        update = {
            $set: {
                updatedDate: Date.now(),
                "userCompleteCase.$.updateDate": Date.now(),
            },
            $inc: { "userCompleteCase.$.completeCase": 1 }
        };
        if (!pro.al.alFailed && pro.labelType != LABELTYPE.NUMERIC) {
            update['$push'] = { "al.newLBSr": ObjectId(id) }
        }
        //update projectCompleteCase
        if (srsData.userInputsLength == pro.maxAnnotation) {
            update.$inc.projectCompleteCase = 1;
        }
        await mongoDb.findOneAndUpdate(ProjectModel, conditions, update);

        console.log(`[ SRS ] Service  update user questionPoints`);
        conditions = { _id: user };
        update = { $inc: { points: 1 } };
        await mongoDb.findOneAndUpdate(UserModel, conditions, update);
    });

    //trigger active learning
    const token = req.headers.authorization.split("Bearer ")[1];
    await alService.triggerActiveLearning(projectId, _ids, (from === 'slack' && config.ESP) ? config.adminDefault[0] : user, token);


}

async function getCategoriesSrs(req) {
    console.log(`[ SRS ] Service  get srs categories list by projectId`, req.query.pid);
    const project = await mongoDb.findById(ProjectModel, ObjectId(req.query.pid));
    const response = {
        labelType: project.labelType ? project.labelType : LABELTYPE.TEXT,
        lables: project.categoryList.split(","),
        min: project.min == undefined ? null : project.min,
        max: project.max == undefined ? null : project.max
    };
    return response;
}

async function getOneSrs(req) {
    const user = req.auth.email;

    console.log(`[ SRS ] Service getOneSrs find project info by ID: `, req.query.pid);
    const project = await mongoDb.findById(ProjectModel, ObjectId(req.query.pid));

    let limitation = req.query.limit ? Number.parseInt(req.query.limit) : 1;

    const filterFileds = { _id: 1, originalData: 1, flag: 1, skip: 1, ticketDescription: 1};
    //aws documentdb don't support exa. ilterFileds.userInputs = null;
    if (project.projectType == PROJECTTYPE.NER || project.projectType == PROJECTTYPE.QA) {
        filterFileds.ticketQuestions = 1;
        filterFileds.questionForText = 1;
        if (project.regression) { filterFileds.userInputs = 1 }
    }
    if (project.projectType == PROJECTTYPE.LOG) {
        if (project.isShowFilename) { filterFileds.fileInfo = 1 }
        if (project.regression) { filterFileds.userInputs = 1 }
    }

    let srs, conditions, alQueriedSr;

    const mp = await getModelProject({ _id: ObjectId(req.query.pid) });

    // 1. find model queried tickets from queriedSr
    if (project.al.queriedSr.length > 0) {
        if (limitation <= project.al.queriedSr.length) {
            let ids = project.al.queriedSr.filter((id, i) => {
                if (i < limitation) {
                    return id
                }
            });
            conditions = { _id: { $in: ids } };
            return mongoDb.findByConditions(mp.model, conditions, filterFileds);
        } else {
            conditions = { _id: { $in: project.al.queriedSr } };
            alQueriedSr = await mongoDb.findByConditions(mp.model, conditions, filterFileds);
            limitation -= project.al.queriedSr.length;
        }
    }

    START = Date.now();

    //2. find tickets from db 
    conditions = {
        projectName: project.projectName,
        userInputsLength: { $lt: project.maxAnnotation },
        "userInputs.user": { $ne: user },
        "flag.users": { $ne: user },
        "skip.users": { $ne: user },
    };

    const options = { limit: limitation };

    if (project.assignmentLogic == 'sequential') {
        console.log(`[ SRS ] Service sequential query data skipped: `);
        srs = await mongoDb.findByConditions(mp.model, conditions, filterFileds, options);
    } else {
        console.log(`[ SRS ] Service random query data skipped: `);
        const schema = [
            { $match: conditions },
            { $project: filterFileds },
            { $limit: 10000 },
            { $sample: { size: limitation } }
        ];
        srs = await mongoDb.aggregateBySchema(mp.model, schema);
    }
    console.log(`[ SRS ] Service query tickets use time in sencods: ${(Date.now() - START) / 1000} (s)`);
    if (srs.length) {

        if (project.projectType == PROJECTTYPE.IMGAGE) {
            if (config.useAWS) {
                srs[0].originalData.location = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, srs[0].originalData.location);
            }
            return srs;
        }

        srs = alQueriedSr ? srs.concat(alQueriedSr) : srs;
        return srs;

    } else {
        const skiped = await findSkippedCase(mp, user);
        if (!skiped.length) {
            console.log(`[ SRS ] Service all case has annotated`);
            return MESSAGE.ANNOTATE_DONE;
        } else {
            //show skipped before
            await removeSkippedCase(mp, user);
            console.log(`[ SRS ] Service find out skipped before skipped case`);
            return getOneSrs(req);
        }
    }
}

async function findSkippedCase(mp, user) {
    console.log(`[ SRS ] Service findSkippedCase`, user);
    const condistion = {projectName: mp.project.projectName, "skip.users": user};
    return mongoDb.findByConditions(mp.model, condistion)
}

async function removeSkippedCase(mp, user) {

    console.log(`[ SRS ] Service removeSkippedCase`, user);
    const conditions = { projectName: mp.project.projectName, "skip.users": user };
    const update = { $pull: { "skip.users": user } };
    await mongoDb.updateManyByConditions(mp.model, conditions, update);
}

async function getALLSrs(req) {

    await validator.checkAnnotator(req.auth.email);

    console.log(`[ SRS ] Service getALLSrs query projects info name start: `, Date.now());
    const mp = await getModelProject({ _id: ObjectId(req.query.pid) });
    const projectName = mp.project.projectName;

    console.log(`[ SRS ] Service paginateQuerySrsData`);
    let query = { projectName: projectName };
    if (req.query.fname && mp.project.projectType == PROJECTTYPE.LOG) {
        query["fileInfo.fileName"] = { $regex: req.query.fname };
    }
    let options = { page: req.query.page, limit: req.query.limit, sort: { userInputsLength: -1 } };
    const data = await mongoDb.paginateQuery(mp.model, query, options);

    const pageInfo = {
        totalRowss: data.totalDocs,
        totalPages: data.totalPages,
        currentPage: data.page,
        hasPrevPage: data.hasPrevPage,
        hasNextPage: data.hasNextPage,
        prevPage: data.prevPage,
        nextPage: data.nextPage
    };
    if (config.useAWS && mp.project.projectType == PROJECTTYPE.IMGAGE) {
        const S3 = await S3Utils.s3Client();
        for (const ticket of data.docs) {
            ticket.originalData.location = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, ticket.originalData.location, S3);
        }
    }
    if (mp.project.labelType == LABELTYPE.HIERARCHICAL) {
        await reduceHierarchicalUnselectedLabel(data.docs);
    }
    console.log(`[ SRS ] Service getALLSrs query projects info name end: `, Date.now());
    return { pageInfo: pageInfo, data: data.docs };
}

async function getSelectedSrsById(req) {

    console.log(`[ SRS ] Service getSelectedSrsById.querySrsById `);
    const mp = await getModelProject({ _id: ObjectId(req.query.pid) });

    let srs = await mongoDb.findById(mp.model, ObjectId(req.query.tid));
    if (config.useAWS && mp.project.projectType == PROJECTTYPE.IMGAGE) {
        srs.originalData.location = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, srs.originalData.location);
    }
    return srs;
}

async function getProgress(req) {
    console.log(`[ SRS ] Service getProgress query user completed case `);
    const projectInfo = await mongoDb.findById(ProjectModel, ObjectId(req.query.pid));
    const user = req.auth.email;
    if (await validator.checkRequired(req.query.review)) {
        await validator.checkAnnotator(user);
        const userReview = projectInfo.reviewInfo.find(ri => ri.user == user);

        let userIds = [user], userComReviewed = [], userFullName = "";
        projectInfo.userCompleteCase.forEach(uc => { userIds.push(uc.user) });
        const conditions = { _id: { $in: userIds } };
        const users = await mongoDb.findByConditions(UserModel, conditions, "fullName");
        for (const u of users) {
            for (const uc of projectInfo.userCompleteCase) {
                if (uc.user == u._id) {
                    userComReviewed.push({
                        assignedCase: uc.assignedCase,
                        completeCase: uc.completeCase,
                        reviewed: uc.reviewed,
                        user: uc.user,
                        fullName: u.fullName,
                    });
                }
            }
            if (u._id == user) {
                userFullName = u.fullName;
            }
        }

        return {
            totalCase: projectInfo.totalCase,
            projectCompleteCase: projectInfo.projectCompleteCase,
            completeCase: userReview ? userReview.reviewedCase : 0,
            user: user,
            fullName: userFullName,
            userCompleteCase: userComReviewed
        };
    } else {
        console.log(`[ SRS ] Service sort out user completed case `);
        const userComp = projectInfo.userCompleteCase.find(time => time.user == user);
        return {
            totalCase: projectInfo.totalCase,
            projectCompleteCase: projectInfo.projectCompleteCase,
            assignedCase: userComp.assignedCase,
            completeCase: userComp.completeCase,
            user: user
        };
    }

}

async function skipOne(req) {
    const pid = req.body.pid;
    const tid = req.body.tid;
    const user = req.auth.email;
    const token = req.headers.authorization;
    const review = req.body.review;
    const request = { 'query': { 'pid': pid }, 'auth': { "email": user }, headers: { authorization: token } };

    const mp = await getModelProject({ _id: ObjectId(pid) });

    const conditions = { _id: ObjectId(tid) };
    const update = { $push: { "skip.users": user } };
    await mongoDb.findOneAndUpdate(mp.model, conditions, update);

    if (await validator.checkRequired(review)) {
        console.log(`[ SRS ] Service user skipOne.queryTicketsForReview`);
        request.query.user = req.body.user;
        request.query.order = req.body.order;
        return queryTicketsForReview(request);

    } else {
        if (mp.project.al.trained && !mp.project.alFailed) {
            const conditionsP = { _id: ObjectId(pid)};
            const updateP = { $pull: { "al.queriedSr": ObjectId(tid) } };
            await mongoDb.findOneAndUpdate(ProjectModel, conditionsP, updateP);
        }
        
        console.log(`[ SRS ] Service user skipOne.getOneSrs`);
        return getOneSrs(request);
    }

}

async function appendSrsDataByForms(req, originalHeaders, projectType) {

    console.log(`[ SRS ] Service appendSrsDataByForms start prepare data `);

    const appendHeaders = Object.keys(req.body.srdata[0]);
    await validator.checkAppendTicketsHeaders(appendHeaders, originalHeaders)

    let caseNum = 0;
    let docs = [];
    req.body.srdata.forEach(srJson => {
        //check all input sr data if is empty
        let selectedData = Object.values(srJson).toString().replace(new RegExp(',', 'g'), '').trim();
        if (selectedData) {
            let sechema = {
                projectName: req.body.pname,
                userInputsLength: 0,
                originalData: srJson
            };
            if (projectType == PROJECTTYPE.QA) {
                let questionForText = [];
                for (const q of srJson['questions'].split("?")) {
                    if (q.trim()) {
                        questionForText.push(q.trim() + "?");
                    }
                }
                sechema['questionForText'] = questionForText;
            }
            docs.push(sechema);
            caseNum++;
        }
    });
    console.log(`[ SRS ] Service appendSrsDataByForms.insertManySrsData caseNum:`, caseNum);
    const options = { lean: true, ordered: false };
    await mongoDb.insertMany(SrModel, docs, options);

    console.log(`[ SRS ] Service appendSrsDataByForms update appen sr status to done`);
    const conditions = { projectName: req.body.pname };
    const update = { $set: { "appendSr": APPENDSR.DONE, updatedDate: Date.now() }, $inc: { "totalCase": caseNum } };
    await mongoDb.findOneAndUpdate(ProjectModel, conditions, update);

    await projectService.updateAssinedCase(conditions, caseNum, true);

}

async function appendSrsDataByCSVFile(req, originalHeaders, project) {

    console.log(`[ SRS ] Service appendSrsDataByCSVFile update appen sr status to adding: `, Date.now());
    //update append status
    const conditions = { projectName: req.body.pname };
    const update = { $set: { "appendSr": APPENDSR.ADDING, updatedDate: Date.now() } };
    await mongoDb.findOneAndUpdate(ProjectModel, conditions, update);

    let fileStream = await fileSystemUtils.handleFileStream(req.body.location);

    const headerRule = {
        noheader: false,
        fork: true,
        flatKeys: true,
        checkType: true
    };
    let caseNum = 0;
    let docs = [];
    csv(headerRule).fromStream(fileStream).subscribe(async (oneData, index) => {
        if (index == 0) {
            await validator.checkAppendTicketsHeaders(Object.keys(oneData), originalHeaders)
        }
        //only save selected data
        const select = {};
        originalHeaders.forEach(item => {
            select[item] = oneData[item];
        });
        //check all selected data if is empty
        let selectedData = Object.values(select).toString().replace(new RegExp(',', 'g'), '').trim();
        if (selectedData) {
            let sechema = {
                projectName: req.body.pname,
                userInputsLength: 0,
                originalData: select
            };

            //support ner helpful text and existing lable append
            if (project.projectType == PROJECTTYPE.NER) {
                //helpful text
                const ticketQuestions = req.body.ticketQuestions;
                if (ticketQuestions && ticketQuestions.length) {
                    let questions = {};
                    for (const qst of ticketQuestions) {
                        questionData = oneData[qst]
                        if (typeof oneData[qst] === 'object') {
                            questionData = JSON.stringify(questionData);
                        }
                        questions[qst] = questionData;
                    }
                    sechema.ticketQuestions = questions;
                }
                //existing lables
                const selectLabels = req.body.selectLabels;
                if (selectLabels && selectLabels.length) {
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
            }else if(project.projectType == PROJECTTYPE.QA){
                let questions = [];
                let questionForText = req.body.questions;
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

            docs.push(sechema);
            caseNum++;
        }
        //batch write data to db 
        if (docs.length && docs.length % PAGINATELIMIT == 0) {
            const options = { lean: true, ordered: false };
            mongoDb.insertMany(SrModel, docs, options);
            docs = [];
        }
    }, async (error) => {
        console.log(`[ SRS ] [ERROR] Service inserte sr have ${error}: `, Date.now());
    }, async () => {
        try {
            console.log(`[ SRS ] Service inserte last sr to db: `, Date.now());
            const options = { lean: true, ordered: false };
            await mongoDb.insertMany(SrModel, docs, options);

            console.log(`[ SRS ] Service appendSrsDataByCSVFile update appen sr status to done`);
            const conditions = { projectName: req.body.pname };
            const update = {
                $set: { appendSr: APPENDSR.DONE, updatedDate: Date.now() },
                $inc: { totalCase: caseNum },
                $addToSet: { selectedDataset: req.body.selectedDataset }
            };
            await mongoDb.findOneAndUpdate(ProjectModel, conditions, update);
            await updateDatasetProjectInfo(req.body.selectedDataset, req.body.pname, OPERATION.ADD);
            await projectService.updateAssinedCase(conditions, caseNum, true);
            console.log(`[ SRS ] Service insert sr end: `, Date.now());
        } catch (error) {
            console.log(`[ SRS ] [ERROR] insert sr done, but fail on update tatalcase or send email ${error}: `, Date.now());
        }
    });
}

async function appendSrsData(req) {
    //validate user and project
    // await validator.checkAnnotator(req.auth.email);
    const queryProjectCondition = req.body.pname ? { projectName: req.body.pname } : { _id: req.body.pid };

    const mp = await getModelProject(queryProjectCondition);

    const dataset = req.body.selectedDataset;
    const project = mp.project;
    const projectType = mp.project.projectType;
    req.body.projectType = projectType;
    req.body.pname = req.body.pname ? req.body.pname : mp.project.projectName;

    if (dataset) {
        const conditions = { dataSetName: dataset }
        datasets = await validator.checkDataSet(conditions, true);
        req.body.location = datasets[0].location;
    }

    if (projectType == PROJECTTYPE.IMGAGE) {
        const update = { $set: { appendSr: APPENDSR.DONE, updatedDate: Date.now() } };
        if (req.body.isFile == true || req.body.isFile == 'true') {
            //file append
            await imgImporter.execute(req, false);
            update.$addToSet = { selectedDataset: dataset };
            update.$inc = { totalCase: datasets[0].images.length };

        } else {
            //quick append
            if (typeof req.body.images == "string") {
                req.body.images = JSON.parse(req.body.images)
            }
            await imgImporter.quickAppendImages(req, mp.project.selectedDataset[0]);
            update.$inc = { totalCase: req.body.images.length };
        }

        await mongoDb.findOneAndUpdate(ProjectModel, queryProjectCondition, update);

        const totalCase = update.$inc.totalCase;
        await projectService.updateAssinedCase(queryProjectCondition, totalCase, true);

    } else if (projectType == PROJECTTYPE.TEXT || projectType == PROJECTTYPE.TABULAR || projectType == PROJECTTYPE.NER || projectType == PROJECTTYPE.QA) {
        //validate pname and headers
        const originalHeaders = mp.project.selectedColumn;
        if (req.body.isFile) {
            //file append
            await appendSrsDataByCSVFile(req, originalHeaders, project);
            console.log(`[ SRS ] Service append tickets by CSV file done`);
        } else {
            await appendSrsDataByForms(req, originalHeaders, projectType);
            console.log(`[ SRS ] Service append tickets data forms  done`);
        }

    } else if (projectType == PROJECTTYPE.LOG) {
        //form data changed the field  type to string
        req.body.isFile = typeof req.body.isFile === 'string' ? (req.body.isFile == 'true' ? true : false) : req.body.isFile;
        if (req.body.isFile) {
            //file append
            await logImporter.execute(req, false, null, true);
            console.log(`[ SRS ] Service append logs tickets by file done`);
        } else {
            //quick append
            await logImporter.quickAppendLogs(req);
            console.log(`[ SRS ] Service append logs tickets by forms done`);
        }

    }
}

async function sampleSr(req) {
    console.log(`[ SRS ] Service sampleSr.getModelProject`);
    const mp = await getModelProject({ _id: ObjectId(req.query.pid) });

    console.log(`[ SRS ] Service sampleSr.aggregateSrsData`);
    const schema = [
        { $match: { projectName: mp.project.projectName } },
        { $limit: 10 },
        { $sample: { size: 1 } }
    ];
    const sr = await mongoDb.aggregateBySchema(mp.model, schema);
    //old data save all csv filed to originalData in db
    console.log(`[ SRS ] Service prepare response sample sr data`);
    const data = { appendSr: mp.project.appendSr, sampleSr: {} };

    if (mp.project.projectType == PROJECTTYPE.LOG) {
        data.sampleSr = sr[0];
    } else {
        data.sampleSr = sr[0].originalData;
        if(mp.project.projectType == PROJECTTYPE.QA){
            data.sampleSr['questions'] = sr[0].questionForText;
        }
    }

    return data;
}

async function flagSr(req) {
    const tid = req.body.tid;
    const pid = req.body.pid;
    const user = req.auth.email;
    const token = req.headers.authorization;
    const review = req.body.review;

    const request = { 'query': { 'pid': pid }, 'auth': { "email": user }, headers: { authorization: token } };

    const queryPro = { _id: ObjectId(pid) };
    const mp = await getModelProject(queryPro);

    console.log(`[ SRS ] Service flagSr`, tid);
    const conditions = { _id: ObjectId(tid) };
    const update = { $push: { 'flag.users': user } };
    await mongoDb.findOneAndUpdate(mp.model, conditions, update);

    if (await validator.checkRequired(review)) {
        await validator.checkAnnotator(user);

        request.query.user = req.body.user;
        request.query.order = req.body.order;

        return queryTicketsForReview(request);
    } else {
        console.log(`[ SRS ] Service pull the sr from queried sr list`);
        const updatePro = { $pull: { "al.queriedSr": ObjectId(tid) } };
        await mongoDb.findOneAndUpdate(ProjectModel, queryPro, updatePro);

        return getOneSrs(request);
    }
}

async function unflagSr(req) {
    console.log(`[ SRS ] Service unflagSr`, req.body.tid);
    const mp = await getModelProject({ _id: ObjectId(req.body.pid) });

    const conditions = { _id: ObjectId(req.body.tid) };
    const update = { $pull: { 'flag.users': req.auth.email } };
    await mongoDb.findOneAndUpdate(mp.model, conditions, update);;
}

async function queryUserFlagTicket(req) {
    const projectName = req.query.pname;
    console.log(`[ SRS ] Service queryUserFlagTicket ${projectName}`, req.auth.email);
    const mp = await getModelProject({ projectName: projectName });
    const query = { projectName: projectName, "flag.users": req.auth.email };
    const options = { page: req.query.page, limit: req.query.limit, select: "originalData" };
    return mongoDb.paginateQuery(mp.model, query, options);
}

async function queryAllFlagSrs(req) {

    await validator.checkAnnotator(req.auth.email);
    const mp = await getModelProject({ projectName: req.query.pname });

    console.log(`[ SRS ] Service queryAllFlagSrs`);
    const query = { projectName: req.query.pname, "flag.users": { $exists: true, $ne: [] } };
    const options = { page: req.query.page, limit: req.query.limit };
    return mongoDb.paginateQuery(mp.model, query, options);
}

async function slienceFlagSrs(req) {

    await validator.checkAnnotator(req.auth.email);

    const mp = await getModelProject({ _id: ObjectId(req.body.pid) });

    console.log(`[ SRS ] Service slienceFlagSrs`, req.body.tids);
    let srIds = [];
    req.body.tids.forEach(id => {
        srIds.push(ObjectId(id));
    });
    const conditions = { _id: { $in: srIds } };
    const doc = { $set: { 'flag.users': [], 'flag.silence': true } };
    await mongoDb.updateManyByConditions(mp.model, conditions, doc);

}

async function deleteSrs(req) {

    await validator.checkAnnotator(req.auth.email);

    const conditionsP = { projectName: req.body.pname };
    const mp = await getModelProject(conditionsP);

    console.log(`[ SRS ] Service deleteSrs`, req.body.tids);
    let srIds = [], pro = mp.project, pcc = 0, ucc = {};

    //calculate userCompleteCase and projectCompleteCase
    for (const id of req.body.tids) {
        srIds.push(ObjectId(id));
        const ticket = await mongoDb.findById(mp.model, ObjectId(id));
        if (ticket && ticket.userInputsLength) {
            if (ticket.userInputsLength == pro.maxAnnotation) {
                pcc += 1;
            }
            let users = [];
            for (const input of ticket.userInputs) {
                users.push(input.user);
            }
            users = _.uniq(users);
            for (const user of users) {
                ucc[user] = ucc[user] ? ucc[user] + 1 : 1;
            }
        }
    }

    let conditions = { _id: { $in: srIds } };
    const srD = await mongoDb.deleteManyByConditions(mp.model, conditions);
    console.log(`[ SRS ] Service deleteSrs update project total case subtract:`, srD.deletedCount);

    //calculate userCompleteCase
    for (const uc of pro.userCompleteCase) {
        console.log('deleteSrs.userCompleteCase:', uc);
        //update completeCase
        if (Object.keys(ucc).indexOf(uc.user) != -1) {
            console.log(uc.user, ucc[uc.user]);
            uc.completeCase -= ucc[uc.user];
        }
    }

    const update = {
        $set: {
            "updatedDate": Date.now(),
            "userCompleteCase": pro.userCompleteCase
        },
        $inc: {
            "totalCase": -(srD.deletedCount),
            "projectCompleteCase": -(pcc)
        }
    };
    const options = { new: true };
    await mongoDb.findOneAndUpdate(ProjectModel, conditionsP, update, options);

    return projectService.updateAssinedCase(conditionsP, srD.deletedCount);
}


async function deleteLabel(req) {
    console.log(`[ SRS ] Service deleteLabel`);
    const label = req.body.label;// "", string DERECTLY DELETE
    const projectName = req.body.pname;
    const _id = req.body.pid;

    const operation = req.body.operation;//2 query

    return projectService.deleteProjectLables(label, _id, projectName, operation);

}

async function reviewTicket(req) {
    //annotator have no right to access
    const user = req.auth.email;
    await validator.checkAnnotator(user);

    const tid = ObjectId(req.body.tid);
    const pid = req.body.pid;
    const problemCategory = req.body.problemCategory;
    const logFreeText = req.body.logFreeText;
    const questionForText = req.body.questionForText;
    const review = req.body.review;
    const modify = req.body.modify;

    const mp = await getModelProject({ _id: ObjectId(pid) });

    if (await validator.checkRequired(review)) {
        await flagToReview(mp, tid);
    } else if (await validator.checkRequired(modify)) {
        await calculateReviewdCase(mp, [tid], user);
        await modifyReview(mp, tid, user, problemCategory, logFreeText, questionForText);
    } else if (!await validator.checkRequired(modify)) {
        await calculateReviewdCase(mp, [tid], user);
        await passReview(mp, tid, user);
    }
}

async function flagToReview(mp, tid) {
    const conditions = { _id: tid };
    const update = { $set: { "reviewInfo.review": true } };
    await mongoDb.findOneAndUpdate(mp.model, conditions, update);
}
async function passReview(mp, tid, user) {
    const conditions = { _id: tid };
    //record current user
    const reviewTime = Date.now();
    const update = {
        $set: {
            "reviewInfo.review": false,
            "reviewInfo.reviewed": true,
            "reviewInfo.passed": true,
            "reviewInfo.modified": false,
            "reviewInfo.user": user,
            "reviewInfo.reviewedTime": reviewTime
        },
        $pull: {
            "reviewInfo.userInputs": { user: user }
        }
    };
    await mongoDb.findOneAndUpdate(mp.model, conditions, update);
    //record passed user
    const modify = {
        $push: {
            "reviewInfo.userInputs": {
                user: user,
                timestamp: reviewTime
            }
        }
    }
    await mongoDb.findOneAndUpdate(mp.model, conditions, modify);


}
async function modifyReview(mp, tid, user, problemCategory, logFreeText, questionForText) {
    const projectType = mp.project.projectType;
    const isMultipleLabel = mp.project.isMultipleLabel;
    const labelType = mp.project.labelType;
    const model = mp.model;

    const conditions = { _id: tid };
    const reviewTime = Date.now();
    const update = {
        $set: {
            "reviewInfo.review": false,
            "reviewInfo.passed": false,
            "reviewInfo.reviewed": true,
            "reviewInfo.modified": true,
            "reviewInfo.user": user,
            "reviewInfo.reviewedTime": reviewTime
        },
        $pull: {
            "reviewInfo.userInputs": {user: user}
        }
    }
    await mongoDb.findOneAndUpdate(model, conditions, update);
    
    //update user reviewed details
    let modify = {};
    //max-annotation=1
    if (projectType == PROJECTTYPE.NER || projectType == PROJECTTYPE.QA || projectType == PROJECTTYPE.LOG) {
        reviewInfoInputs = {
            problemCategory: problemCategory,
            user: user,
            timestamp: reviewTime
        };
        if (projectType == PROJECTTYPE.LOG) {
            reviewInfoInputs.logFreeText = logFreeText;
        }
        if (projectType == PROJECTTYPE.QA) {
            reviewInfoInputs.questionForText = questionForText;
        }
        modify.$push = {"reviewInfo.userInputs": reviewInfoInputs}

    } else {
        let userInputs = [];
        if (labelType == LABELTYPE.NUMERIC && isMultipleLabel) {
            problemCategory.forEach(lb => {
                userInputs.push({
                    problemCategory: {
                        label: Object.keys(lb)[0],
                        value: Object.values(lb)[0]
                    },
                    user: user,
                    timestamp: reviewTime
                });
            });
        } else if (labelType == LABELTYPE.HIERARCHICAL) {
            userInputs.push({
                problemCategory: problemCategory,
                user: user,
                timestamp: reviewTime
            });
        } else {
            problemCategory.forEach(lb => {
                userInputs.push({
                    problemCategory: lb,
                    user: user,
                    timestamp: reviewTime
                });
            });
        }
        modify.$push = {"reviewInfo.userInputs": {$each: userInputs} };
    }
    await mongoDb.findOneAndUpdate(model, conditions, modify);
}

async function calculateReviewdCase(mp, tids, user) {

    let ticketsLegth = tids.length;
    const _id = mp.project._id;
    const project = mp.project;
    const model = mp.model;

    const conditions = { _id: { $in: tids } };
    const columns = { userInputs: 1, reviewInfo: 1 };
    const tickets = await mongoDb.findByConditions(model, conditions, columns);

    // update annotator was reviewed case
    for (const ticket of tickets) {
        if (ticket.reviewInfo.user == user) {
            ticketsLegth -= 1;
        }
        if (ticket.reviewInfo.reviewed) {
            continue;
        }
        const ticketUsers = _.uniq(ticket.userInputs.map(obj => obj.user));
        for (const ticketUser of ticketUsers) {
            for (const uc of project.userCompleteCase) {
                if (ticketUser == uc.user) {
                    uc.reviewed += 1;
                }
            }
        }
    }
    // update project owner reviewed case
    const findUser = await project.reviewInfo.find(info => {
        if (info.user == user) {
            info.reviewedCase += ticketsLegth;
            return true;
        }
    });

    if (!findUser) {
        project.reviewInfo.push({
            user: user,
            reviewedCase: ticketsLegth
        });
    }

    const conditionsP = { _id: ObjectId(_id) }
    const update = {
        $set: {
            reviewInfo: project.reviewInfo,
            userCompleteCase: project.userCompleteCase,
            updatedDate: Date.now()
        }
    };
    await mongoDb.findOneAndUpdate(ProjectModel, conditionsP, update)
}

async function queryTicketsForReview(req) {
    const user = req.auth.email;
    await validator.checkAnnotator(user);

    const pid = req.query.pid;
    const byUser = req.query.user;
    const order = req.query.order;

    const mp = await getModelProject({ _id: ObjectId(pid) })
    
    //1. query need reReview tickets
    let ticket = await reReviewQueryForReview(mp, user);
    if (!ticket[0]) {
        if(order == QUERYORDER.MOST_UNCERTAIN && mp.project.maxAnnotation > 1){
            ticket = await mostUnscertainQueryForReview(mp, user)
        }else{
            //2.user defined the query rules
            ticket = await specailQueryForReview(mp, byUser, order, user);
        }
    }

    if (!ticket[0]) {
        const skiped = await findSkippedCase(mp, user);
        if (!skiped.length) {
            return MESSAGE.ANNOTATE_DONE;
        } else {
            console.log(`[ SRS ] Service remove marked skipped case`);
            await removeSkippedCase(mp, user);

            return queryTicketsForReview(req);
        }
    }
    if (mp.project.projectType == PROJECTTYPE.IMGAGE) {
        if (config.useAWS) {
            ticket[0].originalData.location = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, ticket[0].originalData.location);
        }
    }
    if (mp.project.labelType == LABELTYPE.HIERARCHICAL) {
        await reduceHierarchicalUnselectedLabel(ticket);
    }
    return ticket;
}

async function mostUnscertainQueryForReview(mp, user){
    const conditions = {
        projectName: mp.project.projectName,
        userInputsLength: { $gte: mp.project.maxAnnotation },
        "reviewInfo.reviewed": { $ne: true },
        "flag.users": { $ne: user },
        "skip.users": { $ne: user },
    };
    const options = { limit: 500 };
    let tickets = await mongoDb.findByConditions(mp.model, conditions, null, options);

    
    let labelCase = {};
    if (mp.project.labelType == LABELTYPE.HIERARCHICAL) {
        let labels = JSON.parse(mp.project.categoryList);
        let labelsArray = [];
        let pathsArray = [];
        await initHierarchicalLabelsCase(labels, "", "", labelsArray, pathsArray);
        // calculate labeld case number
        for await(const srs of tickets) {
            // init label headers
            await labelsArray.forEach(item => {
                labelCase[item] = 0;
            });
            for await (const input of srs.userInputs) {
                const userInputLabel = input.problemCategory;
                for (const i in pathsArray) {
                    const currentLable = _.get(userInputLabel, pathsArray[i]);
                    if (currentLable.name == labelsArray[i].split(".").pop() && currentLable.enable == 1) {
                        labelCase[labelsArray[i]] += 1;
                    }
                }
            }
            srs['probab'] = Object.values(labelCase).sort((x,y)=> y-x);
        }
    }else{
        // calculate labeld case number
        for await(const srs of tickets) {
            // init label headers
            await mp.project.categoryList.split(",").forEach(item => {
                labelCase[item] = 0;
            });
            for await(const item of srs.userInputs) {
                for await(const labels of mp.project.categoryList.split(",")) {
                    if (item.problemCategory === labels) {
                        labelCase[labels] += 1;
                    }
                }
            }
            srs['probab'] = Object.values(labelCase).sort((x,y)=> y-x);
        }
    }
    //sort the max-uncertain Ascending
    tickets = await _.sortBy(tickets, 'probab');
    let ticketsGrop = await _.groupBy(tickets, 'probab[0]');
    const annotationNum = Object.keys(ticketsGrop)[0];

    let temp = [];
    if(annotationNum >= mp.project.maxAnnotation){
        for await(const ticket of ticketsGrop[annotationNum]) {
            for await(const probab of ticket.probab){
                if (probab > 0 && probab < mp.project.maxAnnotation) {
                    temp.push(ticket);
                    break;
                }
            }
        }
    }
    tickets = temp.length? temp: tickets;
    return [tickets[0]];
}

async function specailQueryForReview(mp, byUser, order, user) {

    const conditions = {
        projectName: mp.project.projectName,
        userInputsLength: { $gte: mp.project.maxAnnotation },
        "reviewInfo.reviewed": { $ne: true },
        "flag.users": { $ne: user },
        "skip.users": { $ne: user },
    };
    if (await validator.checkRequired(byUser)){
        conditions["userInputs.user"] = byUser
    }

    if (order == QUERYORDER.SEQUENTIAL) {
        const options = { limit: 1 };
        return mongoDb.findByConditions(mp.model, conditions, null, options);
    } else {
        const schema = [
            { $match: conditions },
            { $sample: { size: 1 } }
        ]
        return mongoDb.aggregateBySchema(mp.model, schema);
    }

}
async function reReviewQueryForReview(mp, user) {
    const conditions = {
        projectName: mp.project.projectName,
        userInputsLength: { $gte: mp.project.maxAnnotation },
        "reviewInfo.review": true,
        "flag.users": { $ne: user },
        "skip.users": { $ne: user },
    };
    const options = { limit: 1 };
    return mongoDb.findByConditions(mp.model, conditions, null, options);
}



module.exports = {
    updateSrsUserInput,
    getCategoriesSrs,
    getOneSrs,
    getALLSrs,
    getSelectedSrsById,
    getProgress,
    skipOne,
    appendSrsDataByForms,
    appendSrsDataByCSVFile,
    appendSrsData,
    sampleSr,
    flagSr,
    unflagSr,
    queryUserFlagTicket,
    queryAllFlagSrs,
    slienceFlagSrs,
    deleteSrs,
    deleteLabel,
    reviewTicket,
    flagToReview,
    passReview,
    modifyReview,
    calculateReviewdCase,
    reReviewQueryForReview,
    specailQueryForReview,
    queryTicketsForReview,
    mostUnscertainQueryForReview,
    removeSkippedCase,
    findSkippedCase,

}