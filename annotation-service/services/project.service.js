/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const _ = require("lodash");
const ObjectId = require("mongodb").ObjectID;
const { PROJECTTYPE, SRCS, LABELTYPE, ROLES, SOURCE, OPERATION } = require("../config/constant");
const config = require('../config/config');
const validator = require('../utils/validator');
const mongoDb = require('../db/mongo.db');
const { getModelProject } = require('../utils/mongoModel.utils');
const { ProjectModel, UserModel, LogModel } = require('../db/db-connect');
const { formatDate } = require('../utils/common.utils');
const slackChat = require("./slack/slackChat.service");
const { default: axios } = require("axios");
const MESSAGE = require('../config/code_msg');

async function getProjects(req) {
    console.log(`[ PROJECT ] Service getProjects query user role`);
    const src = req.query.src;
    const email = req.auth.email;
    const user = await mongoDb.findById(UserModel, email);

    let condition, project = null;
    const options = { sort: { updatedDate: -1 } };

    if (src == SRCS.ANNOTATE) {
        console.log(`[ PROJECT ] Service query current annotator project list`);
        const annotateConditions = { annotator: { $regex: email } };
        const logReviewConditions = { creator: { $regex: email }, annotator: { $not: { $size: 0 } } };
        condition = { $or: [annotateConditions, logReviewConditions] };
    } else if (src == SRCS.PROJECTS && user.role != "Annotator") {
        condition = { creator: { $regex: email } };
    } else if (src == SRCS.ADMIN && user.role == "Admin") {
        condition = {};
    } else if (src == SRCS.COMMUNITY) {
        console.log(`[ PROJECT ] Service query current user datasets list`);
        condition = { shareStatus: true };
        project = "projectName shareDescription creator updatedDate totalCase projectCompleteCase userCompleteCase categoryList generateInfo downloadCount labelType min max projectType isMultipleLabel popUpLabels integration";
    } else {
        console.log(`[ PROJECT ] [ERROR] Service errors in ${email} or ${src}`);
        throw MESSAGE.VALIDATATION_PJ_ID_ROUTER;
    }
    if (req.query.projectType) {
        condition['projectType'] = req.query.projectType;
        project = "creator annotator selectedColumn integration projectName categoryList labelType projectType";
    }

    console.log(`[ PROJECT ] Service query user: ${email} src:  ${src} project list`);
    return mongoDb.findByConditions(ProjectModel, condition, project, options);
}

async function getProjectByAnnotator(req) {
    console.log(`[ PROJECT ] Service query project name by annotator: ${req.auth.email}`);
    const condition = { annotator: { $regex: req.auth.email } };
    const columns = "projectName";
    return mongoDb.findByConditions(ProjectModel, condition, columns);
}

async function getProjectName(req) {
    return checkProjectName(req.query.pname);
}

async function checkProjectName(pname) {
    console.log(`[ PROJECT ] Service query project name by projectName: ${pname}`);
    return mongoDb.findByConditions(ProjectModel, { projectName: pname });
}

async function getProjectInfo(req) {
    console.log(`[ PROJECT ] Service query Project info by pid: ${req.query.pid}`);
    let project = await mongoDb.findById(ProjectModel, ObjectId(req.query.pid));
    if (project && project.labelType == LABELTYPE.HIERARCHICAL) {
        let labels = JSON.parse(project.categoryList);
        await prepareSelectedHierarchicalLabels(labels, true, false);
        project.categoryList = JSON.stringify(labels);
    }
    return project;
}

async function prepareSelectedHierarchicalLabels(nodes, unEnable, removeUnselected) {
    for (let i in nodes) {
        if (removeUnselected) {
            while (true) {
                if (nodes[i] && nodes[i].enable == 0) {
                    nodes.splice(i, 1);
                } else {
                    break;
                }
            }
        }

        if (nodes[i] && nodes[i].enable != 0) {
            if (unEnable) {
                nodes[i].enable = 0;
            }
            if (nodes[i].children) {
                await prepareSelectedHierarchicalLabels(nodes[i].children, unEnable, removeUnselected)
            }
        }
    }
}


async function deleteProject(req) {

    await validator.checkAnnotator(req.auth.email);

    const mp = await getModelProject({ _id: ObjectId(req.query.pid) });
    const conditions = { projectName: mp.project.projectName };

    console.log(`[ PROJECT ] Service delete all srs data`, conditions);
    await mongoDb.deleteManyByConditions(mp.model, conditions);
    if (config.ESP && mp.project.integration.source == SOURCE.MODEL_FEEDBACK && mp.project.integration.externalId.length) {
        const url = config.modelFeedbackAPI + "/loop";
        const reqConfig = {
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
                Authorization: req.headers.authorization
            },
            data: {
                modelId: mp.project.integration.externalId,
                pId: mp.project._id
            }
        };
        await axios.delete(url, reqConfig);
    }
    
    for (const dsName of mp.project.selectedDataset) {
        //to solve the circle dependence
        await require('./dataSet-service').updateDatasetProjectInfo(dsName, mp.project.projectName, OPERATION.DELETE);
    }
    console.log(`[ PROJECT ] Service delete project`, conditions);
    return mongoDb.deleteOneByConditions(ProjectModel, conditions);

}
async function updateProject(req) {
    console.log(`[ PROJECT ] Service updateProject`);
    await validator.checkAnnotator(req.auth.email);
    const _id = req.body.pid;
    const mp = await getModelProject({ _id: ObjectId(_id) });

    if (req.body.previousPname != req.body.pname && req.body.pname) {
        await validator.checkProjectByconditions({ projectName: req.body.pname }, false);

        console.log(`[ PROJECT ] Service update tickets projectName`);
        const srsCondition = { projectName: req.body.previousPname };
        const srsDoc = { projectName: req.body.pname };
        await mongoDb.updateManyByConditions(mp.model, srsCondition, srsDoc);
        //update dataset maped projectName
        for (const dsName of _.union(mp.project.selectedDataset)) {
            await require('./dataSet-service').updateDatasetProjectInfo(dsName, req.body.previousPname, OPERATION.UPDATE, req.body.pname);
        }
        
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
        } else {
            completeCase.push({
                user: user.email,
                completeCase: 0,
                assignedCase: user.assignedCase,
                assignedDate: Date.now(),
                updateDate: Date.now(),
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
        throw MESSAGE.VALIDATATION_PJ_OWNER;
    }
    for (const owner of req.body.projectOwner) {
        // update annotator role to prjectOwner
        const condition = { _id: owner, role: ROLES.ANNOTATOR };
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
            assignmentLogic: req.body.assignmentLogic,
            assignSlackChannels: req.body.assignSlackChannels,

        }
    };
    if (projectInfo.taskInstructions != req.body.taskInstructions) {
        update.$set['taskInstructions'] = req.body.taskInstructions;
    }
    if (req.body.frequency) {
        update.$set['al.frequency'] = req.body.frequency;
    }
    if (req.body.trigger) {
        update.$set['al.trigger'] = req.body.trigger;
    }
    if (req.body.isShowFilename == true || req.body.isShowFilename == false) {
        update.$set['isShowFilename'] = req.body.isShowFilename;
    }
    if (config.buildSlackApp && req.body.assignSlackChannels.length > 0) {
        let newChannels = _.differenceBy(req.body.assignSlackChannels, projectInfo.assignSlackChannels, 'slackId')
        if (newChannels.length > 0) {
            let params = {
                channels: newChannels,
                pname: req.body.pname,
                creator: projectInfo.creator,
                totalCase: projectInfo.totalCase,
                createdDate: await formatDate(Number(projectInfo.createdDate)),
                pid: projectInfo._id
            };
            await slackChat.publishMessage(params);
        }
    }

    //edit lables
    const editLabels = req.body.editLabels;
    const addLabels = req.body.addLabels;
    const min = req.body.min;
    const max = req.body.max;
    await editProjectLabels(_id, editLabels, addLabels, min, max);

    console.log(`[ PROJECT ] Service update project info`, completeCase);
    const condition = { projectName: req.body.previousPname };
    const options = { new: true };
    return mongoDb.findOneAndUpdate(ProjectModel, condition, update, options);
}

async function addAnnotatorFromSlack(pro, slackUser) {
    console.log(`[ PROJECT ] Service addAnnotatorFromSlack`);
    let annotators = [], completeCase = [], assigneeList = [];
    annotators = _.cloneDeep(pro.annotator);
    annotators.push(slackUser)

    //to new the assigned case according to the new annotators list
    assigneeList = await evenlyDistributeTicket(annotators, pro.totalCase, pro.maxAnnotation);

    for (const user of assigneeList) {
        const ucase = await pro.userCompleteCase.find(uc => uc.user == user.email);
        if (ucase) {
            ucase.assignedCase = user.assignedCase;
            completeCase.push(ucase);
        } else {
            completeCase.push({
                user: user.email,
                completeCase: 0,
                assignedCase: user.assignedCase,
                assignedDate: Date.now(),
                updateDate: Date.now(),
            });
        }
    }
    let update = {
        $set: {
            userCompleteCase: completeCase,
            annotator: annotators,
        }
    };
    console.log(`[ PROJECT ] Service update project info`, completeCase);
    const condition = { projectName: pro.projectName };
    const options = { new: true };
    return mongoDb.findOneAndUpdate(ProjectModel, condition, update, options);
}

async function evenlyDistributeTicket(annotators, totalRow, maxAnnotations) {
    let assigneeList = [];
    for (const email of annotators) { assigneeList.push({ email, assignedCase: 0 }) };

    if (maxAnnotations >= assigneeList.length) {
        assigneeList.forEach((value) => {
            value.assignedCase = totalRow;
        });
    } else {
        let totalNum = totalRow * maxAnnotations;
        let personNum = assigneeList.length;
        let a = Math.floor(totalNum / personNum);
        let b = totalNum % personNum;
        assigneeList.forEach((value) => {
            value.assignedCase = a;
        });
        for (let i = 0; i <= b - 1; i++) { assigneeList[i].assignedCase = a + 1; }
    }
    return assigneeList
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
    return mongoDb.findOneAndUpdate(ProjectModel, condition, update, optional);
}

async function matchUserInputsWithHierarchicalLabels(labels, tickets) {

    for (const i in labels) {
        if (labels[i].children) {
            await matchUserInputsWithHierarchicalLabels(labels[i].children, tickets)
        } else {
            for (const ticket of tickets) {
                const userInputDatas = await prepareUserInputs(ticket);
                for (const input of userInputDatas) {
                    const inputLabels = input.problemCategory;
                    const currentLable = _.get(inputLabels, labels[i].path);
                    if (currentLable.name == labels[i].name && currentLable.enable == 1) {
                        labels[i].annotated += 1;
                    }
                }
            }
        }
    }
}
async function initHierarchicalLabelsCase(labels, namePath, path, labelsArray, labelsPathArray) {
    for (const i in labels) {

        if (!labels[i].children) {
            if (i != 0 && labels[i - 1].children) {
                let namePathArray = namePath.split(".");
                namePathArray.pop();
                namePathArray.pop();
                if (namePathArray.length) {
                    namePath = namePathArray.join(".") + ".";
                } else {
                    namePath = namePathArray.join(".");
                }


                let pathArray = path.split(".");
                pathArray.pop();
                pathArray.pop();
                if (pathArray.length) {
                    path = pathArray.join(".") + "." + "children";
                } else {
                    path = pathArray.join(".");
                }
            }

            labels[i].namePath = namePath + labels[i].name;
            labels[i].annotated = 0;
            labels[i].path = path + "[" + i + "]";

            if (labelsArray) {
                labelsArray.push(namePath + labels[i].name);
            }
            if (labelsPathArray) {
                labelsPathArray.push(path + "[" + i + "]");
            }
        }
        if (labels[i].children) {

            if (i != 0 && labels[i - 1].children) {
                let namePathArray = namePath.split(".");
                namePathArray.pop();
                namePathArray.pop();
                if (namePathArray.length) {
                    namePath = namePathArray.join(".") + ".";
                } else {
                    namePath = namePathArray.join(".");
                }


                let pathArray = path.split(".");
                pathArray.pop();
                pathArray.pop();
                if (pathArray.length) {
                    path = pathArray.join(".") + "." + "children";
                } else {
                    path = pathArray.join(".");
                }
            }
            path += "[" + i + "]" + "." + "children";
            namePath += labels[i].name + ".";
            await initHierarchicalLabelsCase(labels[i].children, namePath, path, labelsArray, labelsPathArray);

        }
    }
}

async function reduceHierarchicalUnselectedLabel(tickets) {
    for await (const ticket of tickets) {
        for await (const input of ticket.userInputs) {
            let jsonInput = JSON.stringify(input.problemCategory);
            let reducedCategory = JSON.parse(jsonInput);
            await prepareSelectedHierarchicalLabels(reducedCategory, false, true);
            let labelsArray = [];
            await initHierarchicalLabelsCase(reducedCategory, "", "", labelsArray);
            input.reducedCategory = labelsArray;
        }
        //support reviewInfo
        if (ticket.reviewInfo.userInputs.length) {
            const revewInputs = ticket.reviewInfo.userInputs;
            for await(const input of revewInputs) {
                if (input.problemCategory) {
                    let jsonInput = JSON.stringify(input.problemCategory);
                    let reducedCategory = JSON.parse(jsonInput);
                    await prepareSelectedHierarchicalLabels(reducedCategory, false, true);
                    let labelsArray = [];
                    await initHierarchicalLabelsCase(reducedCategory, "", "", labelsArray);
                    input.reducedCategory = labelsArray;
                }
            }
        }
    }
}

async function projectLeaderBoard(req) {

    await validator.checkAnnotator(req.auth.email);

    let result = { userCase: [], labels: [] };

    console.log(`[ PROJECT ] Service projectLeaderBoard.queryProjectById`);
    const mp = await getModelProject({ _id: ObjectId(req.query.pid) });
    const proInfo = mp.project;

    console.log(`[ PROJECT ] Service sort out user complete ticket`);
    const labelType = proInfo.labelType;
    const uc = proInfo.userCompleteCase;
    for (let i = 0; i < uc.length; i++) {
        //full name
        const us = await mongoDb.findById(UserModel, uc[i].user);
        result.userCase.push({
            user: uc[i].user,
            fullName: us ? us.fullName : uc[i].user.split("@")[0],
            completeCase: uc[i].completeCase
        });

    }
    //labels annotated
    console.log(`[ PROJECT ] Service query userInputs info`);
    const conditions = { projectName: proInfo.projectName, userInputsLength: { $gt: 0 } };
    const srsUI = await mongoDb.findByConditions(mp.model, conditions, 'userInputs reviewInfo');
    console.log(`[ PROJECT ] Service sort out labels info`);
    if (labelType == LABELTYPE.HIERARCHICAL) {
        let lables = JSON.parse(proInfo.categoryList);
        await initHierarchicalLabelsCase(lables, "", "");
        await matchUserInputsWithHierarchicalLabels(lables, srsUI);
        result.labels = lables;
    }
    else if (labelType == LABELTYPE.NUMERIC) {
        if (proInfo.isMultipleLabel) {
            await JSON.parse(proInfo.categoryList).forEach(async labels => {
                const label = Object.keys(labels)[0];
                let lb = { 'label': JSON.stringify(labels), annotated: 0 };
                let currentLabelVaules = [];
                await srsUI.forEach(async UIS => {
                    const userInputDatas = await prepareUserInputs(UIS);
                    await userInputDatas.forEach(ui => {
                        if (ui.problemCategory.label == label) {
                            let value = ui.problemCategory.value;
                            currentLabelVaules.push(value);
                            lb.annotated = _.floor(_.mean(currentLabelVaules), 2);
                        }
                    });
                });
                result.labels.push(lb);
            });
        } else {
            let mid = _.floor((proInfo.max - proInfo.min) / 6);
            let start = _.floor(proInfo.min);
            for (let i = 0; i < 6; i++) {
                let lb = { 'label': start + '--' + _.floor(start + mid), annotated: 0 };
                await srsUI.forEach(async UIS => {
                    const userInputDatas = await prepareUserInputs(UIS);
                    await userInputDatas.forEach(ui => {
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
        await proInfo.categoryList.split(",").forEach(async label => {
            let lb = { 'label': label, annotated: 0 };
            await srsUI.forEach(async UIS => {
                const userInputDatas = await prepareUserInputs(UIS);
                await userInputDatas.forEach(ui => {
                    if (proInfo.projectType == PROJECTTYPE.NER || proInfo.projectType == PROJECTTYPE.QA || proInfo.projectType == PROJECTTYPE.LOG) {
                        ui.problemCategory.forEach(ann => {
                            if (ann.label == label) {
                                lb.annotated += 1;
                            }
                        })
                    } else if (proInfo.projectType == PROJECTTYPE.IMGAGE) {
                        const pc = ui.problemCategory.value;
                        const annLabel = pc.rectanglelabels ? pc.rectanglelabels[0] : pc.polygonlabels[0];
                        if (annLabel == label) {
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

//take userInputs if project owner has been modified
async function prepareUserInputs(ticket) {
    let userInputDatas = ticket.userInputs;
    if (ticket.reviewInfo.modified) {
        userInputDatas = await ticket.reviewInfo.userInputs.filter(input => {
            if(input.user == ticket.reviewInfo.user){
                return input;
            }
        })
    }
    return userInputDatas;
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
    const condition = { _id: ObjectId(req.query.pid) }
    const pro = await validator.checkProjectByconditions(condition, true);
    const schema = [
        { $match: { projectName: pro[0].projectName, userInputsLength: 1 } },
        { $project: { _id: 0, fileName: "$fileInfo.fileName" } },
    ]
    return mongoDb.aggregateBySchema(LogModel, schema);
}

async function fileterLogTicketsByFileName(req) {

    console.log(`[ PROJECT ] Service fileterLogTicketsByFileName`);
    await validator.validateRequired(req.query.fname);

    const condition = { _id: ObjectId(req.query.pid) }
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
async function updateAssinedCase(QueryCondition, totalCase, append) {

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
        } else {
            await pro.userCompleteCase.forEach(uc => {
                if (pro.annotator.indexOf(uc.user) != -1) {
                    uc.assignedCase += avgCase;
                }
            });
            let index = 0;
            await pro.userCompleteCase.sort((a, b) => a.assignedCase - b.assignedCase).forEach(uc => {
                if (index < perCase && pro.annotator.indexOf(uc.user) != -1) {
                    uc.assignedCase += 1;
                    index++;
                }
            });
        }

    } else {//delete tickets
        if (maxAnnotation >= annoatorsNumber) {
            await pro.userCompleteCase.forEach(uc => {
                if (pro.annotator.indexOf(uc.user) != -1) {
                    uc.assignedCase -= totalCase;
                }
            });
        } else {
            await pro.userCompleteCase.forEach(async uc => {
                if (pro.annotator.indexOf(uc.user) != -1) {
                    if (avgCase > uc.assignedCase) {
                        let remained = avgCase - uc.assignedCase;
                        uc.assignedCase = 0;
                        //seperate remained case to other annotators
                        while (true) {
                            if (remained == 0) {
                                break;
                            }
                            await pro.userCompleteCase.sort((a, b) => -(a.assignedCase - b.assignedCase)).forEach(u => {
                                if (remained > 0 && pro.annotator.indexOf(u.user) != -1 && u.assignedCase > 0) {
                                    u.assignedCase -= 1;
                                    remained--;
                                }
                            });
                        }
                    } else {
                        uc.assignedCase -= avgCase;
                    }
                }
            });
            let index = 0;
            while (true) {
                if (perCase == 0 || index >= perCase) {
                    break;
                }
                await pro.userCompleteCase.sort((a, b) => -(a.assignedCase - b.assignedCase)).forEach(uc => {
                    if (index < perCase && pro.annotator.indexOf(uc.user) != -1 && uc.assignedCase > 0) {
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


async function updateProjectLabels(req) {
    const _id = req.body.pid;
    const addLabels = req.body.addLabels;
    const editLabels = req.body.editLabels;
    const deleteLabels = req.body.deleteLabels;
    const min = req.body.min;
    const max = req.body.max;
    
    if (deleteLabels) {
        for await (const label of deleteLabels) {
            await deleteProjectLables(label, _id);
        }
    }

    return editProjectLabels(_id, editLabels, addLabels, min, max);
}


async function projectIntegrationEdit(req) {
    const _id = req.body.pid;
    const externalId = req.body.externalId;
    const operation = req.body.operation;
    const source = req.body.source;

    const condition = { _id: ObjectId(_id) }
    await validator.checkProjectByconditions(condition, true);

    let update = {};
    if (operation == OPERATION.ADD) {
        update = { $push: { "integration.externalId": externalId } };
    } else if (operation == OPERATION.DELETE) {
        update = { $pull: { "integration.externalId": externalId } };
    }
    if (source) {
        update["$set"] = { "integration.source": source };
    }
    const options = { new: true };
    return mongoDb.findOneAndUpdate(ProjectModel, condition, update, options);
}

/***
 * 
 * if textLabel = numericLabel
 *  min = 1,
 *  max = 5
 *  
 *  if textLabel = isMultipleLabel numeric 
 *      editLabels = [{edit: true, editLB: {aaa, [1, 2], originLB: {bbb, [2, 5]} }}]
 *      addLabels = [{ccc: [0,2]}]
 * 
 * if textLabel = textLabel
 *      editLabels = {aaa: "aa", bbb: "bb"}
 *      addLabels = ['cc', 'dd']
 * 
 */
async function editProjectLabels(pid, editLabels, addLabels, min, max) {
    const condition = { _id: ObjectId(pid) };
    const mp = await getModelProject(condition);
    const model = mp.model;
    const project = mp.project;

    let updateProject = { $set: { categoryList: project.categoryList } };

    if (project.labelType == LABELTYPE.NUMERIC) {
        if (project.isMultipleLabel) {
            let originalLabels = JSON.parse(project.categoryList);
            let editLBList = [];
            //validate edit label data
            if (editLabels) {
                for (const elabel of editLabels) {
                    if (elabel.edit) {
                        const orgLB = Object.keys(elabel.originLB)[0];
                        const originLBDB = await originalLabels.find(ol => Object.keys(ol)[0] == orgLB);
    
                        if (!originLBDB) {
                            throw MESSAGE.VALIDATATION_PJ_ORIGIN_LB;
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
                        if (editLBDB && editLB != orgLB) {
                            throw MESSAGE.VALIDATATION_PJ_EDIT_LB_EXIST;
                        }
    
                        if (dbMin != orgMin || dbMax != orgMax) {
                            throw MESSAGE.VALIDATATION_PJ_ORIGIN_LB_MAX_MIN;
                        }
                        if (editMin >= editMax || editMin > dbMin || editMax < dbMax) {
                            throw MESSAGE.VALIDATATION_PJ_EDIT_LB_MAX_MIN;
                        }
                        //add to edit list
                        editLBList.push([orgLB, editLB]);
                        originalLabels = await originalLabels.filter(ol => Object.keys(ol)[0] != orgLB);
                        originalLabels.push(elabel.editLB);
                    }
                }
            }
            //validate add label data
            if (addLabels) {
                for (const aLabel of addLabels) {
                    const addLB = Object.keys(aLabel)[0];
                    const originLBDB = await originalLabels.find(ol => Object.keys(ol)[0] == addLB);
                    if (originLBDB) {
                        continue;
                    }
                    if (aLabel[addLB][0] > aLabel[addLB][1]) {
                        throw MESSAGE.VALIDATATION_PJ_ADD_LB_MAX_MIN;
                    }
                    originalLabels.push(aLabel);
                }
            }
            //update label
            updateProject.$set['categoryList'] = JSON.stringify(originalLabels);
            //edit existing labels
            for (const label of editLBList) {
                const query = {
                    projectName: project.projectName,
                    [`userInputs.problemCategory.label`]: label[0]
                };
                const updateTickets = { $set: { "userInputs.$[elem].problemCategory.label": label[1] } };
                const options = { arrayFilters: [{ "elem.problemCategory.label": label[0] }] };
                await mongoDb.updateManyByConditions(model, query, updateTickets, options);

            }
        } else {
            if ((min != null || min != undefined || min != "") && (max != null || max != undefined || max != "")) {
                if (min >= max || typeof min != "number" || typeof max != "number" || min > project.min || max < project.max) {
                    throw MESSAGE.VALIDATATION_PJ_MAX_MIN;
                }
                updateProject.$set['min'] = min;
                updateProject.$set['max'] = max;
            }
        }
    } else {
        let originalLabels = project.categoryList.split(",");
        //edit labels
        let editLb = {};
        if (editLabels) {
            for (const key in editLabels) {
                const index = originalLabels.indexOf(key);
                if (index == -1) {
                    throw MESSAGE.VALIDATATION_PJ_EDIT_LB;
                }

                if (key != editLabels[key]) {
                    editLb[key] = editLabels[key];
                    originalLabels[index] = editLabels[key];
                }
            }
        }
        //add labels
        let addLb = [];
        if (addLabels) {
            for (const label of addLabels) {
                if (label && originalLabels.indexOf(label) == -1) {
                    originalLabels.push(label);
                    addLb.push(label);
                }
            }
        }

        updateProject.$set["categoryList"] = originalLabels.toString();
        //update active-learning lable id
        const labelID = project.al.labelID;
        if (labelID) {
            let newLabelID = {};
            //for edit
            for (const key in labelID) {
                if (editLb[key]) {
                    newLabelID[editLb[key]] = labelID[key];
                } else {
                    newLabelID[key] = labelID[key];
                }
            }
            //for add
            for (const index in addLb) {
                newLabelID[addLb[index]] = (Number.parseInt(index) + Object.values(editLabels).length);
            }
            updateProject.$set['al.labelID'] = newLabelID;
        }

        //update labeled tickets
        for (const key in editLb) {
            if (project.projectType == PROJECTTYPE.NER || project.projectType == PROJECTTYPE.QA || project.projectType == PROJECTTYPE.LOG) {
                query = { 
                    projectName: project.projectName, 
                    userInputsLength: {$gte: 1},  
                    "userInputs.problemCategory.label": key
                }
                update = { $set: { "userInputs.0.problemCategory.$[elem].label": editLb[key] } };
                options = { arrayFilters: [{ "elem.label": key }] };
                await mongoDb.updateManyByConditions(model, query, update, options);
                
                //update reviewInfo
                query = { 
                    projectName: project.projectName, 
                    userInputsLength: {$gte: 1},  
                    "reviewInfo.userInputs.problemCategory.label": key
                }
                update = { $set: { "reviewInfo.userInputs.$[].problemCategory.$[elem].label": editLb[key] } };
                options = { arrayFilters: [{ "elem.label": key }] };
                await mongoDb.updateManyByConditions(model, query, update, options);
            } else if (project.projectType == PROJECTTYPE.IMGAGE) {
                //update image polygon
                query = { 
                    projectName: project.projectName, 
                    userInputsLength: {$gte: 1},  
                    "userInputs.problemCategory.value.polygonlabels": {$exists: true}
                }
                update = { $set: { "userInputs.$[elem].problemCategory.value.polygonlabels.0": editLb[key] } };
                options = { arrayFilters: [{ "elem.problemCategory.value.polygonlabels.0": key }] };
                await mongoDb.updateManyByConditions(model, query, update, options);

                //update image rectangle
                query = { 
                    projectName: project.projectName, 
                    userInputsLength: {$gte: 1},  
                    "userInputs.problemCategory.value.rectanglelabels": {$exists: true}
                }
                update = { $set: { "userInputs.$[elem].problemCategory.value.rectanglelabels.0": editLb[key] } };
                options = { arrayFilters: [{ "elem.problemCategory.value.rectanglelabels.0": key }] };
                await mongoDb.updateManyByConditions(model, query, update, options);
                
                //update reviewInfo
                query = { 
                    projectName: project.projectName, 
                    userInputsLength: {$gte: 1},  
                    "reviewInfo.userInputs.problemCategory.value.polygonlabels": {$exists: true}
                }
                update = { $set: {"reviewInfo.userInputs.$[elem].problemCategory.value.polygonlabels.0": editLb[key]}};
                options = { arrayFilters: [{ "elem.problemCategory.value.polygonlabels.0": key }] };
                await mongoDb.updateManyByConditions(model, query, update, options);

                query = { 
                    projectName: project.projectName, 
                    userInputsLength: {$gte: 1},  
                    "reviewInfo.userInputs.problemCategory.value.rectanglelabels": {$exists: true}
                }
                update = { $set: { "reviewInfo.userInputs.$[elem].problemCategory.value.rectanglelabels.0": editLb[key]}};
                options = { arrayFilters: [{ "elem.problemCategory.value.rectanglelabels.0": key }] };
                await mongoDb.updateManyByConditions(model, query, update, options);

            } else if (project.projectType == PROJECTTYPE.TEXT || project.projectType == PROJECTTYPE.TABULAR) {
                query = { 
                    projectName: project.projectName, 
                    userInputsLength: {$gte: 1},  
                    "userInputs.problemCategory": key
                }
                update = { $set: { "userInputs.$[elem].problemCategory": editLb[key] } };
                options = { arrayFilters: [{ "elem.problemCategory": key }] };
                await mongoDb.updateManyByConditions(model, query, update, options);
                
                //update reviewInfo
                query = { 
                    projectName: project.projectName, 
                    userInputsLength: {$gte: 1},  
                    "reviewInfo.userInputs.problemCategory": key
                }
                update = { $set: { "reviewInfo.userInputs.$[elem].problemCategory": editLb[key] } };
                options = { arrayFilters: [{ "elem.problemCategory": key }] };
                await mongoDb.updateManyByConditions(model, query, update, options);
            }
        }
    }

    const optionsProject = { new: true };
    return mongoDb.findOneAndUpdate(ProjectModel, condition, updateProject, optionsProject);
}

async function deleteProjectLables(label, _id, projectName, operation) {
    let queryProject = _id ? { _id: _id } : { projectName: projectName };
    const mp = await getModelProject(queryProject);


    let labelArray = mp.project.categoryList.split(",");
    const multiTextNumberica = mp.project.isMultipleLabel && mp.project.labelType == LABELTYPE.NUMERIC;
    if (multiTextNumberica) {
        const categoryList = JSON.parse(mp.project.categoryList);
        labelArray = categoryList.map(a => Object.keys(a)[0]);
    }
    if (!labelArray.includes(label)) {
        throw MESSAGE.VALIDATATION_PJ_LB;
    }

    let conditions = { projectName: mp.project.projectName }
    if (mp.project.projectType == PROJECTTYPE.NER || mp.project.projectType == PROJECTTYPE.QA || mp.project.projectType == PROJECTTYPE.LOG) {
        conditions["userInputs.problemCategory.label"] = label;
    } else if (mp.project.projectType == PROJECTTYPE.IMGAGE) {
        conditions = {
            projectName: mp.project.projectName,
            $or: [
                { "userInputs.problemCategory.value.polygonlabels.0": label },
                { "userInputs.problemCategory.value.rectanglelabels.0": label }
            ]
        };

    } else if (mp.project.isMultipleLabel && mp.project.labelType == LABELTYPE.NUMERIC) {
        conditions["userInputs.problemCategory.label"] = label;
    } else {
        conditions["userInputs.problemCategory"] = label;
    }
    const tickets = await mongoDb.findByConditions(mp.model, conditions);

    if (operation == OPERATION.QUERY) {
        if (tickets[0]) {
            MESSAGE.VALIDATATION_PJ_LB_ANNOTATED.DATA = [label];
            return MESSAGE.VALIDATATION_PJ_LB_ANNOTATED;
        }
        MESSAGE.VALIDATATION_PJ_LB_DEL.DATA = [label];
        return MESSAGE.VALIDATATION_PJ_LB_DEL;
    } else {
        if (tickets[0]) {
            throw MESSAGE.VALIDATATION_PJ_LB_ANNOTATED;
        }

        const query = { projectName: mp.project.projectName }
        const options = { new: true };
        _.pull(labelArray, label);
        labelArray = labelArray.toString();
        if (multiTextNumberica) {
            const categoryList = JSON.parse(mp.project.categoryList);
            labelArray = categoryList.filter(a => Object.keys(a)[0] != label);
            labelArray = JSON.stringify(labelArray);
        }

        const update = { $set: { "categoryList": labelArray } };
        await mongoDb.findOneAndUpdate(ProjectModel, query, update, options);
        MESSAGE.SUCCESS.LABELS = labelArray
        return MESSAGE.SUCCESS;
    }
}


async function getProjectsTextTabular(email) {
    console.log(`[ PROJECT ] Service getProjects by type text and tabular`);
    let project = null;
    const options = { sort: { updatedDate: -1 } };
    let condition = { labelType: "textLabel", isMultipleLabel: false };
    condition.$or = [
        { projectType: PROJECTTYPE.TEXT },
        { projectType: PROJECTTYPE.TABULAR }
    ];
    condition.$or = [
        { annotator: { $regex: email } },
        { assignSlackChannels: { $exists: true } }
    ];
    return mongoDb.findByConditions(ProjectModel, condition, project, options);
}

async function updateProjectDatasetInfo(projectName, datasetName, operation) {
    const condition = {projectName: projectName};
    const options = { new: true, upsert: true };
    let update = {};

    if (OPERATION.ADD == operation) {
        update = { $addToSet: { selectedDataset: datasetName } };
    }else if (OPERATION.DELETE == operation) {
        update = { $pull: { selectedDataset: datasetName } };
    }else{
        throw  MESSAGE.VALIDATATION_OPERATION;
    }
    
    console.log(`[ DATASET ] Service updateProjectDatasetInfo`, update);
    return mongoDb.findOneAndUpdate(ProjectModel, condition, update, options);
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
    checkProjectName,
    getReviewList,
    getLogProjectFileList,
    fileterLogTicketsByFileName,
    updateAssinedCase,
    updateProjectLabels,
    projectIntegrationEdit,
    editProjectLabels,
    deleteProjectLables,
    getProjectsTextTabular,
    addAnnotatorFromSlack,
    prepareSelectedHierarchicalLabels,
    matchUserInputsWithHierarchicalLabels,
    initHierarchicalLabelsCase,
    reduceHierarchicalUnselectedLabel,
    prepareUserInputs,
    updateProjectDatasetInfo,
}