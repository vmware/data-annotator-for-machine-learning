/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const ObjectId = require("mongodb").ObjectID;
const srsDB = require('../db/srs-db');
const projectDB = require('../db/project-db');
const projectService = require('./project.service');
const validator = require('../utils/validator');
const { PAGINATELIMIT, APPENDSR, LABELTYPE, PROJECTTYPE, S3OPERATIONS } = require("../config/constant");
const request = require('request');
const csv = require('csvtojson');
const alService = require('./activelearning.service');
const ENRService = require('./ner.service');
const _ = require("lodash");
const { ProjectModel, UserModel, ImgModel, SrModel, LogModel } = require("../db/db-connect");
const mongoDb = require("../db/mongo.db");
const { getModelProject } = require("../utils/mongoModel.utils");
const imgImporter = require("../utils/imgImporter");
const S3Utils = require('../utils/s3');
const logImporter = require('../utils/logImporter');

async function updateSrsUserInput(req) {
    
    console.log(`[ SRS ] Service updateSrsUserInput`);
    const projectId = ObjectId(req.body.pid);
    const user = req.auth.email;
    
    let _ids = [], usrSr = [];
    req.body.userInput.forEach(input => { _ids.push(input.tid) });

    console.log(`[ SRS ] Service query project info by proId`, projectId);
    const pro = await mongoDb.findById(ProjectModel, projectId);
    
    const mp = await getModelProject({ _id: projectId });

    console.log(`[ SRS ] Service find if user already annotated tickets:`,usrSr.length);
    const query = {_id: {$in: _ids}, "userInputs.user": user };
    usrSr = await mongoDb.findByConditions(mp.model, query)

    //validate maxAnnotation and  regression project
    //user not annotate
    if(!usrSr[0]){
        console.log(`[ SRS ] Service check maxAnnotation avoid concurrent operation`);
        const srs = await mongoDb.findByConditions(mp.model, {_id: {$in: _ids}});
        for (const ticket of srs) {
            if (pro.maxAnnotation <= ticket.userInputsLength) {
                console.log(`[ SRS ] Service concurrent operation ticket:${ticket._id} achieve maxAnnotation:${pro.maxAnnotation}`);
                return { CODE: 3001, MSG: `ticket:${ticket._id} maxAnnotation is ${pro.maxAnnotation} already achieved`};
            }
        }
    }
    //validate regression project
    if(pro.labelType == LABELTYPE.NUMERIC){
        lableInput = req.body.userInput[0].problemCategory[0];
        console.log(`[ SRS ] Service validate numeric lable problemCategory=${lableInput}`);
        if(!validator.isNumeric(lableInput) || lableInput < pro.min || lableInput > pro.max ){
            throw { CODE: 3001, MSG: `[ ERROR ] userInput[0].problemCategory[0]:${lableInput}` };
        }
    }
    
    //update user input to db
    //for re-edit
    let reEditSrIds=[];
    usrSr.forEach(async ticket =>{
        reEditSrIds.push(ticket._id.toString());
        let userInputs = []
        req.body.userInput.forEach(ui => {
            if (ui.tid == ticket._id.toString()) {
                if (pro.projectType == PROJECTTYPE.NER || pro.projectType == PROJECTTYPE.LOG) {
                    userInputs.push({
                        problemCategory: ui.problemCategory,
                        user: user,
                        timestamp: Date.now()
                    });
                }else{
                    ui.problemCategory.forEach(lb =>{
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
        const conditions = { _id: ObjectId(ticket._id)};
        update = {$pull: {userInputs:{user: user }}}
        await mongoDb.findOneAndUpdate(mp.model, conditions, update);
        
        update1 = {$push: { userInputs : { $each: userInputs} }}
        await mongoDb.findOneAndUpdate(mp.model, conditions, update1);
    });

    addSrIds = _ids.filter(id => !reEditSrIds.includes(id))
    console.log(`[ SRS ] Service check _ids=${_ids.length}, addSrIds=${addSrIds.length}, reEditSrIds=${reEditSrIds.length}`)

    // for add new
    addSrIds.forEach(async id =>{
        console.log(`[ SRS ] Service add new annotation to ticket=${id.toString()}`);
        let userInputs = []
        req.body.userInput.forEach(ui => {
            if (ui.tid == id) {
                if (pro.projectType == PROJECTTYPE.NER || pro.projectType == PROJECTTYPE.LOG) {
                    userInputs.push({
                        problemCategory: ui.problemCategory,
                        user: user,
                        timestamp: Date.now()
                    });
                } else {
                    ui.problemCategory.forEach(lb =>{
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
        if (pro.regression && pro.projectType == PROJECTTYPE.NER) {
            const updateSR = { $set: { userInputs: [] } };
            await mongoDb.findOneAndUpdate(mp.model, conditions, updateSR)
        }
        let update = { $push: { userInputs: {$each: userInputs} }, $inc: { userInputsLength: 1 } };
        const options = { new: true };
        const srsData = await mongoDb.findOneAndUpdate(mp.model, conditions, update, options);
    
        console.log(`[ SRS ] Service update project userCompleteCase`);
        conditions = { _id: projectId, "userCompleteCase.user": user };
        update = { 
            $set: { updatedDate: Date.now() }, 
            $inc: { "userCompleteCase.$.completeCase": 1 }
        };
        if (!pro.al.alFailed && pro.labelType != LABELTYPE.NUMERIC) {
            update['$push'] = {"al.newLBSr": ObjectId(id)}
        }
        //update projectCompleteCase
        if(srsData.userInputsLength == pro.maxAnnotation){
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
    await alService.triggerActiveLearning(projectId, _ids, user, token);
    

}

async function getCategoriesSrs(req) {
    console.log(`[ SRS ] Service  get srs categories list by projectId`, req.query.pid);
    const project = await projectDB.queryProjectById(ObjectId(req.query.pid));
    const response = { 
        labelType: project.labelType ? project.labelType : LABELTYPE.TEXT, 
        lables: project.categoryList.split(","), 
        min: project.min == undefined ? null: project.min, 
        max: project.max == undefined ? null: project.max
    };
    return response;
}

async function getOneSrs(req) {
    console.log(`[ SRS ] Service getOneSrs find project info by ID: `, req.query.pid);
    const project = await mongoDb.findById(ProjectModel, ObjectId(req.query.pid));
    
    let limitation = req.query.limit? Number.parseInt(req.query.limit): 1;
    const filterFileds = { _id:1, originalData:1, flag: 1 };
    if (project.regression && project.projectType == PROJECTTYPE.NER) { filterFileds.userInputs = 1 };
    
    let srs, conditions, alQueriedSr;
    
    const mp = await getModelProject({ _id: ObjectId(req.query.pid)});

    // 1. find model queried tickets from queriedSr
    if (project.al.queriedSr.length > 0) { 
        if (limitation <= project.al.queriedSr.length) {
             let ids = project.al.queriedSr.filter((id, i) =>{
                if (i < limitation) {
                    return id
                }
            });
            conditions = {_id: {$in: ids} };
            return await mongoDb.findByConditions(mp.model, conditions, filterFileds);
        }else{
            conditions = {_id: { $in: project.al.queriedSr } };
            alQueriedSr = await mongoDb.findByConditions(mp.model, conditions, filterFileds);
            limitation -= project.al.queriedSr.length;
        }
    }
    
    START = Date.now();
    
    //2. find tickets from db 
    conditions = {
        projectName: project.projectName, 
        userInputsLength: { $lt: project.maxAnnotation },
        "userInputs.user": { $ne: req.auth.email },
        "flag.users": { $ne: req.auth.email },
    };
    const usc = project.userCompleteCase.find(ucase =>{
       return ucase.user == req.auth.email;
    });
 
    const options = { skip: usc.skip, limit: limitation };

    if(project.assignmentLogic == 'sequential'){
        console.log(`[ SRS ] Service sequential query data skipped: `, usc.skip);
       srs = await mongoDb.findByConditions(mp.model, conditions, filterFileds, options);
    }else{
        console.log(`[ SRS ] Service random query data skipped: `, usc.skip);
        const schema = [
            { $match: conditions},
            { $project: filterFileds }, 
            { $skip: usc.skip},
            {$limit: limitation}
        ];
        srs = await mongoDb.aggregateBySchema(mp.model, schema);
    }
    console.log(`[ SRS ] Service query tickets use time in sencods: ${(Date.now()-START)/1000} (s)`);
    if (srs.length) {
        
        if (project.projectType == PROJECTTYPE.IMGAGE) {
            srs[0].originalData.location = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, srs[0].originalData.location);
            return srs;
        }

        srs = alQueriedSr? srs.concat(alQueriedSr):srs;
        const token = req.headers.authorization.split("Bearer ")[1];
        return await ENRService.gainNERtokens(srs, project.projectType, token);

    } else {
        if(usc.skip == 0){
            console.log(`[ SRS ] Service all case has annotated`);
            return { CODE: 5001, "MSG": "No Data Found" };
        }else{
            //show skipped before
            console.log(`[ SRS ] Service remove marked skipped case`);
            await projectService.removeSkippedCase(req.query.pid, req.auth.email);
            
            console.log(`[ SRS ] Service find out skipped before skipped case`);
            return await getOneSrs(req);
        }
    }
}

async function getALLSrs(req) {
    
    await validator.checkAnnotator(req.auth.email);

    console.log(`[ SRS ] Service getALLSrs query projects info name start: `, Date.now());
    const mp = await getModelProject({_id: ObjectId(req.query.pid)});
    const projectName = mp.project.projectName;

    console.log(`[ SRS ] Service paginateQuerySrsData`);
    const query = { projectName: projectName }; 
    let options = { page: req.query.page, limit: req.query.limit, sort:{userInputsLength: -1} };
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
    if (mp.project.projectType == PROJECTTYPE.IMGAGE) {
        const S3 = await S3Utils.s3Client();
        for (const ticket of data.docs) {
            ticket.originalData.location = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, ticket.originalData.location, S3);
        }
    }
    console.log(`[ SRS ] Service getALLSrs query projects info name end: `, Date.now());
    return {pageInfo: pageInfo, data: data.docs};
}

async function getSelectedSrsById(req) {
    
    console.log(`[ SRS ] Service getSelectedSrsById.querySrsById `);
    const mp = await getModelProject({ _id: ObjectId(req.query.pid)});
    
    let srs = await mongoDb.findById(mp.model, ObjectId(req.query.tid));
    if (mp.project.projectType == PROJECTTYPE.IMGAGE) {
        srs.originalData.location = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, srs.originalData.location);
    }
    const token = req.headers.authorization.split("Bearer ")[1];
    srs = await ENRService.gainNERtokens([srs], mp.project.projectType, token);
    return srs[0];
}

async function getProgress(req) {
    console.log(`[ SRS ] Service getProgress query user completed case `);
    const projectInfo = await projectDB.queryProjectById(ObjectId(req.query.pid));
    
    console.log(`[ SRS ] Service sort out user completed case `);
    const userComp = projectInfo.userCompleteCase.find(time => time.user == req.auth.email);
    let info = {
        totalCase: projectInfo.totalCase,
        projectCompleteCase: projectInfo.projectCompleteCase,
        completeCase: userComp.completeCase,
        user: req.auth.email
    };
    return info;
}

async function skipOne(req){
    console.log(`[ SRS ] Service skipOne save info to DB`);
    const conditions = { _id: ObjectId(req.body.pid), "userCompleteCase.user": req.auth.email };
    const update = { $inc: { "userCompleteCase.$.skip": 1 }, $pull: {"al.queriedSr": ObjectId(req.body.tid)} };
    await projectDB.findUpdateProject(conditions, update);

    console.log(`[ SRS ] Service skipOne.getOneSrs`);
    const request = { 'query': { 'pid': req.body.pid}, 'auth': {"email": req.auth.email}, headers:{authorization: req.headers.authorization} }
    return await getOneSrs(request);
}

async function appendSrsDataByForms(req, originalHeaders){
    
    console.log(`[ SRS ] Service appendSrsDataByForms start prepare data `);

    const appendHeaders = Object.keys(req.body.srdata[0]);        
    await validator.checkAppendTicketsHeaders(appendHeaders, originalHeaders)
    
    let caseNum = 0;
    let docs = [];
    req.body.srdata.forEach(srJson =>{
        //check all input sr data if is empty
        let selectedData = Object.values(srJson).toString().replace(new RegExp(',', 'g'),'').trim();
        if(selectedData){
            Object.values(srJson).forEach(sr =>{
                if(!validator.isASCII(sr)){
                    srJson = null;
                }
            });
            if(srJson){
                let sechema = {
                    projectName: req.body.pname,
                    userInputsLength: 0,
                    originalData: srJson
                };
                docs.push(sechema);
                caseNum++;
            }
        }        
    });
    console.log(`[ SRS ] Service appendSrsDataByForms.insertManySrsData caseNum:`, caseNum);
    const options = { lean: true, ordered: false }; 
    await srsDB.insertManySrsData(docs, options);

    console.log(`[ SRS ] Service appendSrsDataByForms update appen sr status to done`);
    const conditions = { projectName: req.body.pname };
    const update = { $set: { "appendSr": APPENDSR.DONE, updatedDate: Date.now() }, $inc: { "totalCase": caseNum } };
    await projectDB.findUpdateProject(conditions,update);

}

async function appendSrsDataByCSVFile(req, originalHeaders){

    console.log(`[ SRS ] Service appendSrsDataByCSVFile update appen sr status to adding: `, Date.now());
    //update append status
    const conditions = { projectName: req.body.pname };
    const update = { $set: { "appendSr": APPENDSR.ADDING, updatedDate: Date.now() }};
    await projectDB.findUpdateProject( conditions, update );

    console.log(`[ SRS ] Service S3Utils.signedUrlByS3`);
    const signedUrl = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, req.body.location);
    
    const headerRule = {
        noheader: false,
        fork: true,
        flatKeys: true
    };
    let caseNum = 0;
    let docs = [];
    csv(headerRule).fromStream(request.get(signedUrl)).subscribe( async (oneData, index) => {
        if (index==0) {
            await validator.checkAppendTicketsHeaders(Object.keys(oneData), originalHeaders)
        }
        //only save selected data
        const select = {};
        originalHeaders.forEach( item =>{
            select[item] = oneData[item];
        });
        //check all selected data if is empty
        let selectedData = Object.values(select).toString().replace(new RegExp(',', 'g'),'').trim();
        if(selectedData){
            selectedData = Object.values(select);
            for (let i = 0; i < selectedData.length; i++) {
                if (!validator.isASCII(selectedData[i])){
                    selectedData = null;
                    break;
                }
            }
            if(selectedData){
                let sechema = {
                    projectName: req.body.pname,
                    userInputsLength: 0,
                    originalData: select
                };
                docs.push(sechema);
                caseNum++;
            };
        }
        //batch write data to db 
        if(docs.length && docs.length % PAGINATELIMIT == 0){
            const options = { lean: true, ordered: false }; 
            srsDB.insertManySrsData(docs, options);
            docs = [];
        }
    }, async (error) => {
        console.log(`[ SRS ] [ERROR] Service inserte sr have ${error}: `, Date.now());
    }, async () => {
        try {
            console.log(`[ SRS ] Service inserte last sr to db: `, Date.now());
            const options = { lean: true, ordered: false }; 
            await srsDB.insertManySrsData(docs, options);

            console.log(`[ SRS ] Service appendSrsDataByCSVFile update appen sr status to done`);
            const conditions = { projectName: req.body.pname };
            const update = { 
                $set: { appendSr: APPENDSR.DONE, updatedDate: Date.now() }, 
                $inc: { totalCase: caseNum },
                $push: { selectedDataset: req.body.selectedDataset }
            };
            await projectDB.findUpdateProject(conditions,update);
            console.log(`[ SRS ] Service insert sr end: `, Date.now());
        } catch (error) {
            console.log(`[ SRS ] [ERROR] insert sr done, but fail on update tatalcase or send email ${error}: `, Date.now());
        }
    });
}

async function appendSrsData(req){
    //validate user and project
    await validator.checkAnnotator(req.auth.email);
    const mp = await getModelProject({projectName: req.body.pname});
    
    const dataset = req.body.selectedDataset;
    const projectType = mp.project.projectType;
    req.body.projectType = projectType;

    if (dataset) {
        const conditions = { dataSetName: dataset }
        datasets = await validator.checkDataSet(conditions, true);
        req.body.location = datasets[0].location;
    }

    if (projectType == PROJECTTYPE.IMGAGE) {
        const update = { $set: { appendSr: APPENDSR.DONE, updatedDate: Date.now() } };
        if (req.body.isFile) {
            //file append
            await imgImporter.execute(req,false);
            update.$push = { selectedDataset: dataset };
            update.$inc = { totalCase: datasets[0].images.length };

        }else{
            //quick append
            await imgImporter.quickAppendImages(req, mp.project.selectedDataset[0]);
            update.$inc = { totalCase: req.body.images.length };
        }
        await mongoDb.findOneAndUpdate(ProjectModel, {projectName: req.body.pname}, update);

    } else if(projectType == PROJECTTYPE.TEXT || projectType == PROJECTTYPE.TABULAR || projectType == PROJECTTYPE.NER){  
        //validate pname and headers
        const originalHeaders = mp.project.selectedColumn;
        if(req.body.isFile){
            //file append            
            await appendSrsDataByCSVFile(req, originalHeaders);
            console.log(`[ SRS ] Service append tickets by CSV file done`);
        }else{
            await appendSrsDataByForms(req, originalHeaders);
            console.log(`[ SRS ] Service append tickets data forms  done`);
        }
    
    }else if (projectType == PROJECTTYPE.LOG) {
        //form data changed the field  type to string
        req.body.isFile = typeof req.body.isFile === 'string'? (req.body.isFile == 'true'?true:false):req.body.isFile;
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


async function sampleSr(req){
    console.log(`[ SRS ] Service sampleSr.getModelProject`);
    const mp = await getModelProject({_id: ObjectId(req.query.pid)});

    console.log(`[ SRS ] Service sampleSr.aggregateSrsData`);
    const schema = [
        { $match: { projectName: mp.project.projectName}}, 
        { $sample: { size: 1 }}
    ];
    const sr = await mongoDb.aggregateBySchema(mp.model, schema);
    //old data save all csv filed to originalData in db
    console.log(`[ SRS ] Service prepare response sample sr data`);
    const data = { appendSr: mp.project.appendSr, sampleSr:{} };
    
    if (mp.project.projectType == PROJECTTYPE.LOG) {
        data.sampleSr = sr[0];
    }else{
        data.sampleSr = sr[0].originalData;
    }
    
    return data;
}

async function flagSr(req){
    console.log(`[ SRS ] Service flagSr`, req.body.tid);
    const queryPro = { _id: ObjectId(req.body.pid)};
    const mp = await getModelProject(queryPro);

    const conditions = {_id: ObjectId(req.body.tid)};
    const update = { $push: { 'flag.users': req.auth.email } };
    await mongoDb.findOneAndUpdate(mp.model, conditions, update);
    
    console.log(`[ SRS ] Service pull the sr from queried sr list`);
    const updatePro = { $pull: {"al.queriedSr": ObjectId(req.body.tid)} };
    await mongoDb.findOneAndUpdate(ProjectModel, queryPro, updatePro);

    const request = { 'query': { 'pid': req.body.pid}, 'auth': {"email": req.auth.email}, headers:{authorization: req.headers.authorization} };
    return await getOneSrs(request);
}

async function unflagSr(req){
    console.log(`[ SRS ] Service unflagSr`, req.body.tid);
    const mp = await getModelProject({ _id: ObjectId(req.body.pid)});

    const conditions = {_id: ObjectId(req.body.tid)};
    const update = { $pull: { 'flag.users': req.auth.email } };
    await mongoDb.findOneAndUpdate(mp.model, conditions, update);;
}

async function queryUserFlagTicket(req){
    const projectName = req.query.pname;
    console.log(`[ SRS ] Service queryUserFlagTicket ${ projectName }`,req.auth.email);
    const mp = await getModelProject({projectName: projectName});
    const query = { projectName: projectName, "flag.users":req.auth.email }; 
    const options = { page: req.query.page, limit: req.query.limit, select : "originalData"};
    return await mongoDb.paginateQuery(mp.model, query, options);
}

async function queryAllFlagSrs(req){

    await validator.checkAnnotator(req.auth.email);
    const mp = await getModelProject({projectName: req.query.pname});
    
    console.log(`[ SRS ] Service queryAllFlagSrs`);
    const query = { projectName: req.query.pname, "flag.users": { $exists: true, $ne: [] }}; 
    const options = { page: req.query.page, limit: req.query.limit };
    return await mongoDb.paginateQuery(mp.model, query, options);
}

async function slienceFlagSrs(req){

    await validator.checkAnnotator(req.auth.email);
    
    const mp = await getModelProject({ _id: ObjectId(req.body.pid)});

    console.log(`[ SRS ] Service slienceFlagSrs`, req.body.tids);
    let srIds = [];
    req.body.tids.forEach( id =>{
        srIds.push(ObjectId(id));
    });
    const conditions = {_id:{ $in: srIds } };
    const doc = { $set: { 'flag.users': [], 'flag.silence': true } };
    await mongoDb.updateManyByConditions(mp.model, conditions, doc);

}

async function deleteSrs(req){

    await validator.checkAnnotator(req.auth.email);
    
    const conditionsP = { projectName: req.body.pname };
    const mp = await getModelProject(conditionsP);

    console.log(`[ SRS ] Service deleteSrs`, req.body.tids);
    let srIds = [], pro = mp.project, pcc=0, ucc={}

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
                ucc[user] = ucc[user] ? ucc[user]+1:1;
            }
        }
    }

    for (const uc of pro.userCompleteCase) {
        console.log(uc);
        if (Object.keys(ucc).indexOf(uc.user) != -1) {
            console.log(uc.user, ucc[uc.user]);
            uc.completeCase -= ucc[uc.user];
        }
    }

    let conditions = {_id:{ $in: srIds } };
    const srD = await mongoDb.deleteManyByConditions(mp.model, conditions);

    
    console.log(`[ SRS ] Service deleteSrs update project total case subtract:`, srD.deletedCount);
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
    return await mongoDb.findOneAndUpdate(ProjectModel, conditionsP, update, options);
}


async function deleteLabel(req){
    const label = req.body.label;
    let conditions = {projectName: req.body.pname};

    const mp = await getModelProject(conditions);

    let labelArray = mp.project.categoryList.split(",");
    if (!labelArray.includes(label)) {
        throw {CODE: 4004, MSG: "LABEL NOT EXIST"};
    }
    
    if (mp.project.projectType == PROJECTTYPE.NER || mp.project.projectType == PROJECTTYPE.LOG) {
        conditions["userInputs.problemCategory.label"] = label;
    }else if (mp.project.projectType == PROJECTTYPE.IMGAGE) {
        conditions = {
            projectName: req.body.pname, 
            $or:[
                {"userInputs.problemCategory.value.polygonlabels.0": label},
                {"userInputs.problemCategory.value.rectanglelabels.0": label}
            ]  
        };

    }else{
        conditions["userInputs.problemCategory"] = label;
    }
    
    const tickets = await mongoDb.findByConditions(mp.model, conditions);
    if (tickets[0]) {
        throw {CODE: 4005, MSG: "LABEL HAS BEEN ANNOTATED"};
    }
    
    _.pull(labelArray, label);
    const query = {projectName: req.body.pname}
    const update = {$set: {"categoryList": labelArray.toString()}};
    const options = { new: true };
    await projectDB.findUpdateProject(query, update, options);
    
    return {CODE: 200, MSG: "OK", LABELS: labelArray};
    
}

async function reviewTicket(req) {
    const conditions = {_id: Object(req.body.tid)};
    if (req.body.reReview) {
        update = {$set: {"reveiwInfo.reReview": true}}
    } 
    await mongoDb.updateByConditions(LogModel, conditions, update);
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
}