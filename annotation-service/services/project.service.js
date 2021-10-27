/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const projectDB = require('../db/project-db');
const userDB = require('../db/user-db');
const _ = require("lodash");
const ObjectId = require("mongodb").ObjectID;
const { PROJECTTYPE, SRCS, LABELTYPE, ROLES } = require("../config/constant");
const validator = require('../utils/validator');
const mongoDb = require('../db/mongo.db');
const { getModelProject } = require('../utils/mongoModel.utils');
const { ProjectModel, UserModel, LogModel } = require('../db/db-connect');

async function getProjects(req) {
    console.log(`[ PROJECT ] Service getProjects query user role`);
    const src = req.query.src;
    const email = req.auth.email;
    const user = await userDB.queryUserById({ _id: email });

    let condition, project=null;
    const options = { sort: { updatedDate: -1 } };

    if (src == SRCS.ANNOTATE) {
        console.log(`[ PROJECT ] Service query current annotator project list`);
        const annotateConditions = { annotator: { $regex: email } };
        const logReviewConditions = { creator: { $regex: email }, projectType: PROJECTTYPE.LOG };
        condition = { $or: [ annotateConditions, logReviewConditions ] };        
    } else if (src == SRCS.PROJECTS && user.role != "Annotator") {
        condition = { creator: { $regex: email } };
    } else if (src == SRCS.ADMIN && user.role == "Admin") {
        condition = {};
    } else if (src == SRCS.COMMUNITY) {
        console.log(`[ PROJECT ] Service query current user datasets list`);
        condition = { shareStatus: true };
        project = "projectName shareDescription creator updatedDate totalCase projectCompleteCase userCompleteCase categoryList generateInfo downloadCount labelType min max projectType isMultipleLabel";
    } else {
        console.log(`[ PROJECT ] [ERROR] Service errors in ${email} or ${src}`);
        throw { CODE: 1001, MSG: "ERROR ID or src" };
    }
    console.log(`[ PROJECT ] Service query user: ${email} src:  ${src} project list`);
    return projectDB.queryProjectByConditions(condition, project, options);
}

async function getProjectByAnnotator(req) {
    console.log(`[ PROJECT ] Service query project name by annotator: ${req.auth.email}`);
    const condition = { annotator: { $regex: req.auth.email } };
    const columns = "projectName";
    return projectDB.queryProjectByConditions(condition, columns);
}

async function getProjectName(req) {
    return checkProjectName(req.query.pname);
}

async function checkProjectName(pname) {
    console.log(`[ PROJECT ] Service query project name by projectName: ${pname}`);
    return projectDB.queryProjectByConditions({ projectName: pname });
}

async function getProjectInfo(req) {
    console.log(`[ PROJECT ] Service query Project info by pid: ${req.query.pid}`);
    return projectDB.queryProjectById(ObjectId(req.query.pid))
}

async function deleteProject(req) {

    await validator.checkAnnotator(req.auth.email);

    const mp = await getModelProject({_id: ObjectId(req.body.pid)});
    const conditions = {projectName: mp.project.projectName};
    
    console.log(`[ PROJECT ] Service delete project`, conditions);
    await mongoDb.deleteOneByConditions(ProjectModel, conditions);

    console.log(`[ PROJECT ] Service delete all srs data`, conditions);
    await mongoDb.deleteManyByConditions(mp.model, conditions);

}

async function updateProject(req) {
    console.log(`[ PROJECT ] Service updateProject`);
    await validator.checkAnnotator(req.auth.email);
    const mp = await getModelProject({_id: ObjectId(req.body.pid)});

    if (req.body.previousPname != req.body.pname) {
        await validator.checkProjectByconditions({projectName: req.body.pname}, false);

        console.log(`[ PROJECT ] Service update tickets projectName`);
        const srsCondition = { projectName: req.body.previousPname };
        const srsDoc = { projectName: req.body.pname };
        await mongoDb.updateManyByConditions(mp.model, srsCondition, srsDoc);
    }
    
    const projectInfo = mp.project;
    let annotators = [], completeCase = [];    
    
    //update userCompleteCase
    for (const user of req.body.assignee) {
        annotators.push(user.email);
        const ucase = await projectInfo.userCompleteCase.find(uc => uc.user == user.email);
        if (ucase) {
            ucase.assignedCase = user.assignedCase;
            completeCase.push(ucase);
        }else{
            completeCase.push({ 
                user: user.email,
                completeCase: 0,
                skip: 0,
                assignedCase: user.assignedCase
            });
        }
    }
    //add have annotation record user
    for (const uCase of projectInfo.userCompleteCase) {
        if (annotators.indexOf(uCase.user) == -1 && uCase.completeCase) {
            uCase.assignedCase = 0;
            completeCase.push(uCase);
        }
    }

    if (!req.body.projectOwner.length) {
        throw {CODE: 4001, MSG: "PROJECT OWNER CAN'T BE EMPTY"};
    }
    for (const owner of req.body.projectOwner) {
        // update annotator role to prjectOwner
        const condition = {_id: owner, role: ROLES.ANNOTATOR};
        const update = {
            $set: {
                role: ROLES.PROJECT_OWNER
            }
        }
        await mongoDb.findOneAndUpdate(UserModel, condition, update);
    }

    let update = {
        $set: {
            projectName: req.body.pname,
            creator: req.body.projectOwner,
            userCompleteCase: completeCase,
            annotator: annotators,
            assignmentLogic: req.body.assignmentLogic
        }
    };
    if (req.body.frequency) {
        update.$set['al.frequency'] = req.body.frequency;
    }
    if (req.body.trigger) {
        update.$set['al.trigger'] = req.body.trigger;
    }
    if (req.body.isShowFilename == true || req.body.isShowFilename == false) {
        update.$set['isShowFilename'] = req.body.isShowFilename;
    }

    //edit lables
    if (projectInfo.labelType == LABELTYPE.NUMERIC) {
        if(projectInfo.isMultipleLabel){
            let originalLabels = JSON.parse(projectInfo.categoryList);
            const editLabels = req.body.editLabels;
            const addLabels = req.body.addLabels;
            
            let editLBList = [];
            //validate edit label data
            for (const elabel of editLabels) {
                if (elabel.edit) {
                    const orgLB = Object.keys(elabel.originLB)[0];
                    const originLBDB = await originalLabels.find(ol => Object.keys(ol)[0] == orgLB);

                    if (!originLBDB) {
                        throw {CODE: 4006, MSG: "INPUT originLB ERROR"};
                    }
                    const dbMin = originLBDB[orgLB][0];
                    const dbMax = originLBDB[orgLB][1];

                    const orgMin = elabel.originLB[orgLB][0];
                    const orgMax = elabel.originLB[orgLB][1];

                    const editLB = Object.keys(elabel.editLB)[0];
                    const editMin = elabel.editLB[editLB][0];
                    const editMax = elabel.editLB[editLB][1];
                    
                    if (editLB == orgLB && editMin == dbMin && editMax == dbMax) {
                        continue;
                    }
                    //find if edit label already exist
                    const editLBDB = await originalLabels.find(ol => Object.keys(ol)[0] == editLB);
                    if (editLBDB) {
                        throw {CODE: 4006, MSG: "INPUT editLB already exist"};
                    }

                    if (dbMin != orgMin || dbMax != orgMax) {
                        throw {CODE: 4006, MSG: "INPUT originLB min/max ERROR"};
                    }
                    if (editMin >= editMax || editMin > dbMin || editMax < dbMax) {
                        throw {CODE: 4006, MSG: "INPUT editLB min/max ERROR"};
                    }
                    //add to edit list
                    editLBList.push([orgLB, editLB]);
                    originalLabels = await originalLabels.filter(ol => Object.keys(ol)[0] != orgLB);
                    originalLabels.push(elabel.editLB);
                }
            }
            //validate add label data
            let addLabel = false;
            for (const aLabel of addLabels) {
               const addLB = Object.keys(aLabel)[0];
               const originLBDB = await originalLabels.find(ol => Object.keys(ol)[0] == addLB);
               if (originLBDB) {
                   continue;
               }
               if (aLabel[addLB][0] > aLabel[addLB][1]){
                throw {CODE: 4006, MSG: "INPUT addLabels min/max ERROR"};
               }
               originalLabels.push(aLabel);
               addLabel = true;
            }
            //update label
            if (editLBList.length || addLabel) {
                update.$set['categoryList'] = JSON.stringify(originalLabels);
            }
            //edit existing labels
            for (const label of editLBList) {
                const query = { 
                    projectName: req.body.pname,  
                    [`userInputs.problemCategory.label`]: label[0]
                };
                const updateTickets = { $set: { "userInputs.$[elem].problemCategory.label" : label[1] } };
                const options = {arrayFilters: [ { "elem.problemCategory.label": label[0] } ]};
                await mongoDb.updateManyByConditions(mp.model, query, updateTickets, options);
                
            }


        }else{
            const min = req.body.min;
            const max = req.body.max;
            
            if (min >= max || typeof min != "number" || typeof max != "number" || min > projectInfo.min || max < projectInfo.max) {
                throw {CODE: 4006, MSG: "INPUT MIN/MAX ERROR"};
            }
            
            update.$set['min'] = min;
            update.$set['max'] = max;
        }
        
    }else{
        const originalLabels = projectInfo.categoryList.split(",");
        const editLabels = req.body.editLabels;
        const addLabels = req.body.addLabels;
        const inputLabels = _.uniq(Object.values(editLabels).concat(addLabels));
        
        if (originalLabels.length > inputLabels.length) {
            throw {CODE: 4006, MSG: "INPUT LABELS ERROR"}
        }
        
        let labelAdd = inputLabels.length > originalLabels.length ? true: false;
        let labelEdit = false, editLb={};
    
        for (const key in editLabels) {
            if (!originalLabels.includes(key)) {
                throw {CODE: 4006, MSG: "INPUT EDITlABELS ERROR"};
            }
            if(key != editLabels[key]){
                editLb[key]=editLabels[key];
                labelEdit = true;
            }
        }
        
        if (labelAdd || labelEdit) {
            update.$set['categoryList'] = inputLabels.toString();

            let labelID = projectInfo.al.labelID;
            if (labelID) {
                let newLabelID = {};
                //for edit
                for (const key in labelID) {
                    if(editLabels[key]){
                        newLabelID[editLabels[key]] = labelID[key];
                    }else{
                        newLabelID[key] = labelID[key];
                    }
                }
                //for add
                for (const index in addLabels) {
                    newLabelID[addLabels[index]] = (Number.parseInt(index) + Object.values(editLabels).length);
                }
                update.$set['al.labelID'] = newLabelID;
            }
        }
        
        if (labelEdit) {
            for(const key in editLb){
                let query,update,options;
                if (projectInfo.projectType == PROJECTTYPE.NER || projectInfo.projectType == PROJECTTYPE.LOG) {
                    query = { projectName: req.body.pname, "userInputs.problemCategory.label": key};
                    update = { $set: { "userInputs.0.problemCategory.$[elem].label" : editLb[key] } };
                    options = {arrayFilters: [ { "elem.label": key } ]}; 
                    await mongoDb.updateManyByConditions(mp.model, query, update, options);
                }else if (projectInfo.projectType == PROJECTTYPE.IMGAGE) {
                    query = { projectName: req.body.pname, "userInputs.problemCategory.value.polygonlabels.0": key};
                    update = { $set: { "userInputs.$[elem].problemCategory.value.polygonlabels.0" : editLb[key] } };
                    options = {arrayFilters: [ { "elem.problemCategory.value.polygonlabels.0": key } ]};
                    await mongoDb.updateManyByConditions(mp.model, query, update, options);
                    
                    query = { projectName: req.body.pname, "userInputs.problemCategory.value.rectanglelabels.0": key};
                    update = { $set: { "userInputs.$[elem].problemCategory.value.rectanglelabels.0" : editLb[key] } };
                    options = {arrayFilters: [ { "elem.problemCategory.value.rectanglelabels.0": key } ]};
                    await mongoDb.updateManyByConditions(mp.model, query, update, options);
                } else if (projectInfo.projectType == PROJECTTYPE.TEXT || projectInfo.projectType == PROJECTTYPE.TABULAR) {
                    query = { projectName: req.body.pname,  "userInputs.problemCategory": key};
                    update = { $set: { "userInputs.$[elem].problemCategory" : editLb[key] } };
                    options = {arrayFilters: [ { "elem.problemCategory": key } ]};
                    await mongoDb.updateManyByConditions(mp.model, query, update, options);
                }
            }
        }
    }
    
    console.log(`[ PROJECT ] Service update project info`,completeCase);
    const condition = {projectName: req.body.previousPname};
    const options = { new: true };
    return mongoDb.findOneAndUpdate(ProjectModel, condition, update, options);
}

async function updateProjectShare(req) {
    await validator.checkAnnotator(req.auth.email);
    const condition = { _id: ObjectId(req.body.pid) };
    const update = {
        $set: {
            shareStatus: req.body.share,
            shareDescription: req.body.shareDescription
        }
    };
    const optional = { new: true };
    console.log(`[ PROJECT ] Service updateProjectShare.findUpdateProject`);
    return projectDB.findUpdateProject(condition, update, optional);
}

async function projectLeaderBoard(req) {
    
    await validator.checkAnnotator(req.auth.email);

    let result = { userCase: [], labels: [] };

    console.log(`[ PROJECT ] Service projectLeaderBoard.queryProjectById`);
    const mp = await getModelProject({_id: ObjectId(req.query.pid)});
    const proInfo = mp.project;

    console.log(`[ PROJECT ] Service sort out user complete ticket`);
    const labelType = proInfo.labelType;
    const uc = proInfo.userCompleteCase;
    for (let i = 0; i < uc.length; i++) {
        //full name
        const us = await userDB.queryUserById(uc[i].user);
        result.userCase.push({
            user: uc[i].user,
            fullName: us ? us.fullName : uc[i].user.split("@")[0],
            completeCase: uc[i].completeCase
        });

    }
    //labels annotated
    console.log(`[ PROJECT ] Service query userInputs info`);
    const conditions = { projectName: proInfo.projectName, userInputsLength: { $gt: 0 } };
    const srsUI = await mongoDb.findByConditions(mp.model, conditions, 'userInputs');

    console.log(`[ PROJECT ] Service sort out labels info`);
    if (labelType == LABELTYPE.NUMERIC) {
        if (proInfo.isMultipleLabel) {
            JSON.parse(proInfo.categoryList).forEach(labels => {
                const label = Object.keys(labels)[0];
                let lb = { 'label': JSON.stringify(labels), annotated: 0 };
                let currentLabelVaules = [];
                srsUI.forEach(UIS => {
                    UIS.userInputs.forEach(ui => {
                        if (ui.problemCategory.label == label) {
                            let value = ui.problemCategory.value;
                            currentLabelVaules.push(value);
                            lb.annotated = _.floor(_.mean(currentLabelVaules),2);
                        }
                    });
                });
                result.labels.push(lb);
            });
        }else{
            let mid = _.floor((proInfo.max - proInfo.min) / 6);
            let start = _.floor(proInfo.min);
            for (let i = 0; i < 6; i++) {
                let lb = { 'label': start + '--' + _.floor(start + mid), annotated: 0 };
                srsUI.forEach(UIS => {
                    UIS.userInputs.forEach(ui => {
                        if (_.round(Number(ui.problemCategory)) >= start && _.round(Number(ui.problemCategory)) <= _.floor(start + mid)) {
                            lb.annotated += 1;
                        };
                    });
                });
                result.labels.push(lb);
                start = _.floor(start + mid + 1);
            }
        }
    } else {
        proInfo.categoryList.split(",").forEach(label => {
            let lb = { 'label': label, annotated: 0 };
            srsUI.forEach(UIS => {
                UIS.userInputs.forEach(ui => {
                    if (proInfo.projectType == PROJECTTYPE.NER || proInfo.projectType == PROJECTTYPE.LOG) {
                        ui.problemCategory.forEach(ann =>{
                            if (ann.label == label){
                                lb.annotated += 1;
                            }
                        })
                    }else if (proInfo.projectType == PROJECTTYPE.IMGAGE) {
                        const pc = ui.problemCategory.value;
                        const annLabel = pc.rectanglelabels? pc.rectanglelabels[0]: pc.polygonlabels[0];
                        if (annLabel == label){
                            lb.annotated += 1;
                        }
                    } else {
                        if (ui.problemCategory == label) {
                            lb.annotated += 1;
                        }
                    }
                    
                });
            });
            result.labels.push(lb);
        });
    }

    console.log(`[ PROJECT ] Service sort out labels and tickets info`);
    result.labelledCase = srsUI.length;
    result.totalCase = proInfo.totalCase;
    result.notLabeledYet = proInfo.totalCase - srsUI.length;

    return result;
}

async function removeSkippedCase(id, user, review) {
    
    console.log(`[ PROJECT ] Service removeSkippedCase.findUpdateProject`);

    if (review) {
        conditions = { _id: ObjectId(id), "reviewInfo.user": user };
        update = { $set: { "reviewInfo.$.skip": 0 } };
    }else{
        conditions = { _id: ObjectId(id), "userCompleteCase.user": user };
        update = { $set: { "userCompleteCase.$.skip": 0 } };
    }

    const options = { new: true };
    
    return projectDB.findUpdateProject(conditions, update, options);
}

async function getReviewList(req) {
    
    console.log(`[ PROJECT ] Service getReviewList.checkAnnotator`);
    const user = req.auth.email;
    await validator.checkAnnotator(user);
    
    const conditions = { creator: { $regex: user }, projectType: PROJECTTYPE.LOG };
    const options = { sort: { updatedDate: -1 } };
    return mongoDb.findByConditions(ProjectModel, conditions, null, options);
}

async function getLogProjectFileList(req) {
    
    console.log(`[ PROJECT ] Service getLogProjectFileList`);
    const condition = {_id: ObjectId(req.query.pid)}
    const pro = await validator.checkProjectByconditions(condition, true);
    const schema = [
        { $match: { projectName: pro[0].projectName, userInputsLength:1 } },
        { $project: {_id: 0, fileName: "$fileInfo.fileName"}},
    ]
    return mongoDb.aggregateBySchema(LogModel, schema);
}

async function fileterLogTicketsByFileName(req) {
    
    console.log(`[ PROJECT ] Service fileterLogTicketsByFileName`);    
    await validator.validateRequired(req.query.fname);

    const condition = {_id: ObjectId(req.query.pid)}
    const pro = await validator.checkProjectByconditions(condition, true);
    const schema = [
        { $match: { projectName: pro[0].projectName, "fileInfo.fileName": { $regex: req.query.fname } } },
    ]
    return mongoDb.aggregateBySchema(LogModel, schema);
}


/**
 * 
 * update assignedcase, support append and delete tickets
 * 
 * assignedcase calculate according to this method
 * annoatorsNumber: A
 * totalCase: T
 * maxAnnotation: M
 * 
 * assignedCase:
 *      M >= A
 *          assignedCase=T
 *      M < A
 *          assignedCase= M*T/A
 * 
 * 
 * 
 */
async function updateAssinedCase(QueryCondition, totalCase, append){
    
    console.log(`[ PROJECT ] Service updateAssinedCase START`, QueryCondition, totalCase); 
    
    const pro = await mongoDb.findOneByConditions(ProjectModel, QueryCondition)
    if (!pro) return;
    
    const annoatorsNumber = pro.annotator.length;
    const maxAnnotation = pro.maxAnnotation;
    
    const avgCase = Math.floor(totalCase * maxAnnotation / annoatorsNumber);
    const perCase = totalCase * maxAnnotation % annoatorsNumber;
    
    //pro.annotator save annotor list
    //pro.userCompleteCase.user has the users that he has annotation info but removed from annotor
    if (append) {//append tickets
        if (maxAnnotation >= annoatorsNumber) {
            await pro.userCompleteCase.forEach(uc => {
                if (pro.annotator.indexOf(uc.user) != -1) {
                    uc.assignedCase += totalCase;
                }
            });
        }else{
            await pro.userCompleteCase.forEach(uc => {
                if (pro.annotator.indexOf(uc.user) != -1) {
                    uc.assignedCase += avgCase;
                }
            });
            let index = 0;
            await pro.userCompleteCase.sort((a,b) => a.assignedCase - b.assignedCase).forEach(uc => {
                if (index < perCase && pro.annotator.indexOf(uc.user) != -1){
                    uc.assignedCase += 1;
                    index++;
                }
            });
        }

    }else{//delete tickets
        if (maxAnnotation >= annoatorsNumber) {
            await pro.userCompleteCase.forEach(uc => {
                if (pro.annotator.indexOf(uc.user) != -1) {
                    uc.assignedCase -= totalCase;
                }
            });
        }else{
            await pro.userCompleteCase.forEach(async uc => {
                if (pro.annotator.indexOf(uc.user) != -1) {
                    if (avgCase > uc.assignedCase) {
                        let remained = avgCase - uc.assignedCase;
                        uc.assignedCase = 0;
                        //seperate remained case to other annotators
                        while(true){
                            if (remained == 0) {
                                break;
                            }
                            await pro.userCompleteCase.sort((a,b) => -(a.assignedCase - b.assignedCase)).forEach(u => {
                                if (remained > 0 && pro.annotator.indexOf(u.user) != -1 && u.assignedCase > 0){
                                    u.assignedCase -= 1;
                                    remained--;
                                }
                            });
                        }
                    }else{
                        uc.assignedCase -= avgCase;
                    }
                }
            });
            let index = 0;
            while(true){
                if (perCase == 0 || index >= perCase) {
                    break;
                }
                await pro.userCompleteCase.sort((a,b) => -(a.assignedCase - b.assignedCase)).forEach(uc => {
                    if (index < perCase && pro.annotator.indexOf(uc.user) != -1 && uc.assignedCase > 0){
                        uc.assignedCase -= 1;
                        index++;
                    } 
                });
            }
        }
    }

    const update = { $set: { userCompleteCase: pro.userCompleteCase } };
    const options = { new: true };
    return mongoDb.findOneAndUpdate(ProjectModel, QueryCondition, update, options);
}

module.exports = {
    getProjects,
    getProjectByAnnotator,
    getProjectName,
    getProjectInfo,
    deleteProject,
    updateProject,
    updateProjectShare,
    projectLeaderBoard,
    removeSkippedCase,
    checkProjectName,
    getReviewList,
    getLogProjectFileList,
    fileterLogTicketsByFileName,
    updateAssinedCase,

}