/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const srsImporter = require("../utils/srsImporter");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const CSVArrayWriter = require("csv-writer").createArrayCsvWriter;
const { GENERATESTATUS, PAGINATETEXTLIMIT, PAGINATELIMIT, FILEFORMAT, LABELTYPE, PROJECTTYPE, S3OPERATIONS, FILETYPE, DATASETTYPE, FILEPATH, QUERYORDER, ANNOTATION_QUESTION, TICKET_DESCRIPTION, SOURCE, QUERY_STRATEGY, ESTIMATOR, OPERATION } = require("../config/constant");
const fs = require('fs');
const ObjectId = require("mongodb").ObjectID;
const moment = require('moment');
const { findFrequentlyElementInObject, probabilisticInObject, findFrequentlyElementInArray } = require('../utils/common.utils');
const csv = require('csvtojson');
const dataSetService = require('../services/dataSet-service');
const S3 = require('../utils/s3');
const validator = require("../utils/validator");
const imgImporter = require("../utils/imgImporter");
const logImporter = require("../utils/logImporter");
const { getModelProject } = require("../utils/mongoModel.utils");
const mongoDb = require("../db/mongo.db");
const S3Utils = require('../utils/s3');
const { DataSetModel, ProjectModel, SrModel } = require("../db/db-connect");
const compressing = require('compressing');
const streamifier = require('streamifier');
const readline = require('readline');
const localFileSysService = require('./localFileSys.service');
const _ = require("lodash");
const config = require('../config/config');
const { initHierarchicalLabelsCase,prepareUserInputs } = require('./project.service');
const MESSAGE = require("../config/code_msg");

async function createProject(req) {
    const findProjectName = { projectName: req.body.pname };
    await validator.checkProjectByconditions(findProjectName, false);

    console.log(`[ FILE ] Service createProject init parameters`);
    if (typeof req.body.assignee === 'string') {
        req.body.assignee = JSON.parse(req.body.assignee);
    }
    if (typeof req.body.ticketQuestions === 'string') {
        req.body.ticketQuestions = JSON.parse(req.body.ticketQuestions);
    }
    if (typeof req.body.slack === 'string') {
        req.body.slack = JSON.parse(req.body.slack);
    }
    let userCompleteCase = [], annotators = [];

    await req.body.assignee.forEach(item => {
        const inintUser = {
            user: item.email,
            assignedCase: item.assignedCase,
            assignedDate: Date.now(),
            updateDate: Date.now(),
        };
        annotators.push(item.email);
        userCompleteCase.push(inintUser);
    })


    console.log(`[ FILE ] Service ticktes to db`);
    srsImporter.execute(req, annotators);
    imgImporter.execute(req, true, annotators);
    logImporter.execute(req, true, annotators);

    console.log(`[ FILE ] Service save project info to db`);
    return saveProjectInfo(req, userCompleteCase, annotators);
}

async function saveProjectInfo(req, userCompleteCase, annotators) {

    const projectType = req.body.projectType;
    let selectedColumn = req.body.selectDescription;
    selectedColumn = (typeof selectedColumn === 'string' ? JSON.parse(selectedColumn) : selectedColumn);

    let labels = req.body.labels;
    let isMultipleLabel = req.body.isMultipleLabel;
    let alFailed = false;
    let totalCase = 0;
    if (isMultipleLabel === 'true' || isMultipleLabel === true) {
        alFailed = true;
        isMultipleLabel = true;
        if ((req.body.labelType == LABELTYPE.NUMERIC || req.body.labelType == LABELTYPE.HIERARCHICAL) && typeof labels === 'object') {
            labels = JSON.stringify(labels);
        }
    } else {
        isMultipleLabel = false;
    }
    labels = (typeof labels === 'object' ? labels.toString() : labels);

    if (projectType == PROJECTTYPE.IMGAGE) {
        totalCase = req.body.totalRows;
        alFailed = true;
    }

    let regression = (req.body.regression === 'true' || req.body.regression === true) ? true : false;
    const preLabels = req.body.preLabels;
    if (projectType == PROJECTTYPE.LOG && preLabels && Object.keys(preLabels).length) {
        regression = true;
    }
    let popUpLabels = [];
    if (projectType == PROJECTTYPE.NER || projectType == PROJECTTYPE.QA) {
        const plb = req.body.popUpLabels;
        popUpLabels = plb ? (typeof plb === 'string' ? JSON.parse(plb) : plb) : [];
    };

    let estimator = req.body.estimator ? req.body.estimator : "";
    let queryStrategy = req.body.queryStrategy ? req.body.queryStrategy : "";
    if (!alFailed && req.body.source == SOURCE.MODEL_FEEDBACK) {
        estimator = ESTIMATOR.RFC;
        queryStrategy = QUERY_STRATEGY.PB_UNS
    }

    const project = {
        creator: [req.auth.email],
        createdDate: Date.now(),
        updatedDate: Date.now(),
        projectName: req.body.pname,
        taskInstructions: req.body.taskInstruction ? req.body.taskInstruction : "",
        totalCase: totalCase,
        userCompleteCase: userCompleteCase,
        maxAnnotation: req.body.maxAnnotations ? req.body.maxAnnotations : 1,
        categoryList: labels,
        assignmentLogic: req.body.assignmentLogic ? req.body.assignmentLogic : QUERYORDER.RANDOM,
        annotator: annotators,
        dataSource: req.body.fileName ? req.body.fileName : "",
        selectedDataset: req.body.selectedDataset ? [req.body.selectedDataset] : [],
        selectedColumn: selectedColumn,
        annotationQuestion: req.body.annotationQuestion ? req.body.annotationQuestion : ANNOTATION_QUESTION,
        fileSize: req.body.fileSize ? req.body.fileSize : 1,
        labelType: req.body.labelType,
        min: (Number.isNaN(+req.body.min) ? 0 : +req.body.min),
        max: (Number.isNaN(+req.body.max) ? 0 : +req.body.max),
        al: {
            estimator: estimator,
            alFailed: alFailed,
            queryStrategy: queryStrategy,
        },
        projectType: projectType,
        encoder: req.body.encoder,
        isMultipleLabel: isMultipleLabel,
        regression: regression,
        isShowFilename: (req.body.isShowFilename === 'true' || req.body.isShowFilename === true) ? true : false,
        ticketDescription: req.body.ticketDescription ? req.body.ticketDescription : TICKET_DESCRIPTION,
        popUpLabels: popUpLabels,
        integration: {
            source: req.body.source ? req.body.source : "",
            externalId: req.body.externalId ? [req.body.externalId] : [],
        },
        assignSlackChannels: req.body.slack
    };

    const conditions = { projectName: req.body.pname };
    const update = { $set: project };
    const options = { new: true, upsert: true };

    return mongoDb.findOneAndUpdate(ProjectModel, conditions, update, options)
}

async function generateFileFromDB(id, format, onlyLabelled, user) {

    const start = Date.now();
    console.log(`[ FILE ] Service generateFileFromDB start: ${start}`);
    const mp = await getModelProject({ _id: ObjectId(id) });

    const fileName = await prepareCsv(mp, format, onlyLabelled, user);
    console.log(`[ FILE ] Service generateFileFromDB end within:[ ${(Date.now() - start) / 1000}s]`);
    return fileName;
}

async function prepareHeaders(project, format) {
    console.log(`[ FILE ] Service prepareHeaders`);

    let headerArray = [];
    //selected headers
    if (project.projectType == PROJECTTYPE.IMGAGE) {
        headerArray.push({ id: "fileName", title: "fileName" });
    } else if (project.projectType == PROJECTTYPE.LOG) {
        headerArray.push({ id: "fileName", title: "fileName" });
        headerArray.push({ id: "freeText", title: "freeText" });
    } else if(project.projectType == PROJECTTYPE.QA){
        headerArray.push({ id: 'context', title: 'context' });
        headerArray.push({ id: 'question', title: 'question' });
        headerArray.push({ id: 'answers', title: 'answers' });
    }else {
        await project.selectedColumn.forEach(item => {
            headerArray.push({ id: item, title: item });
        });
    }

    // label info regression project doesn't need
    if (project.labelType != LABELTYPE.NUMERIC) {
        if (project.labelType == LABELTYPE.HIERARCHICAL) {
            let labels = JSON.parse(project.categoryList);
            let labelsArray = [];
            await initHierarchicalLabelsCase(labels, "", "", labelsArray);
            await labelsArray.forEach(item => {
                headerArray.push({ id: item, title: item });
            });
        } else if(project.projectType != PROJECTTYPE.QA){
            await project.categoryList.split(",").forEach(item => {
                headerArray.push({ id: item, title: item });
            });
        }
        if (project.projectType == PROJECTTYPE.NER || project.projectType == PROJECTTYPE.QA) {
            //init pop-up label headers
            await project.popUpLabels.forEach(item => {
                headerArray.push({ id: item, title: item });
            });
        }
    }

    if (format == FILEFORMAT.TOPLABEL) {
        headerArray.push({ id: "top_label", title: "top_label" });
    } else if (format == FILEFORMAT.PROBABILISTIC) {
        headerArray.push({ id: "probabilistic", title: "probabilistic" });
    }

    //regression project
    if (project.labelType == LABELTYPE.NUMERIC) {

        if (project.isMultipleLabel) {
            const labels = JSON.parse(project.categoryList);
            for (const label of labels) {
                const lb = Object.keys(label)[0];
                headerArray.push({ id: lb, title: lb });
            }
        } else {
            for (let index = 0; index < project.maxAnnotation; index++) {
                headerArray.push({ id: `annotation_${index + 1}`, title: `annotation_${index + 1}` });
            }
        }
    }

    console.log(`[ FILE ] Service prepareHeaders-end`);
    return headerArray;
}

async function prepareContents(srData, project, format) {

    let cvsData = [];
    for (const srs of srData) {
        //1. standard csv 
        let newCase = {};
        // init lable annotation regression project doesn't need
        let labelCase = {};

        if (project.projectType == PROJECTTYPE.IMGAGE) {
            //imageName
            newCase.fileName = srs.originalData.fileName;

            await project.categoryList.split(",").forEach(item => {
                newCase[item] = [];
            });

            const userInputDatas = await prepareUserInputs(srs);
            await userInputDatas.forEach(async item => {
                const pc = item.problemCategory.value;
                const annLable = pc.rectanglelabels ? pc.rectanglelabels[0] : pc.polygonlabels[0];

                await project.categoryList.split(",").forEach((label) => {
                    if (annLable == label) {
                        newCase[label].push(item.problemCategory)
                    }
                });

            });
            // change annotations to a string array 
            await project.categoryList.split(",").forEach(item => {
                newCase[item] = newCase[item][0] ? JSON.stringify(newCase[item]) : [];
            });

        } else if (project.projectType == PROJECTTYPE.NER) {

            // init selected data
            await project.selectedColumn.forEach(item => {
                newCase[item] = (srs.originalData)[item];
            });
            // init lables
            await project.categoryList.split(",").forEach(item => {
                newCase[item] = [];
            });
            // init pop-up lables
            await project.popUpLabels.forEach(item => {
                newCase[item] = [];
            });

            const userInputDatas = await prepareUserInputs(srs);
            await userInputDatas.forEach(async item => {

                await item.problemCategory.forEach(async lb => {
                    //normal labels
                    await project.categoryList.split(",").forEach((label) => {
                        if (lb.label === label) {
                            newCase[label].push({ [lb.text]: [lb.start, lb.end] })
                        }
                    });
                    //popup lablels
                    await project.popUpLabels.forEach(label => {
                        if (lb.popUpLabel === label) {
                            newCase[label].push({ [lb.text]: [lb.start, lb.end] })
                        }
                    });
                });
            });
            //change annotations to a string array 
            await project.categoryList.split(",").forEach(item => {
                newCase[item] = newCase[item][0] ? JSON.stringify(newCase[item]) : [];
            });
            //change annotations pop-up labels to a string array
            await project.popUpLabels.forEach(item => {
                newCase[item] = newCase[item][0] ? JSON.stringify(newCase[item]) : [];
            });
        } else if(project.projectType == PROJECTTYPE.QA){
            // take user input or reviewed info
            const userInputDatas = await prepareUserInputs(srs);
            // init questions cloumn
            let questionForText = srs.questionForText;
            if (srs.reviewInfo.modified) {
                questionForText = userInputDatas[0].questionForText;
            }
            // init answer cloumn
            for await(const item of userInputDatas) {
                for await(const question of questionForText) {
                    let answers = {text: [], answer_start: []};
                    for await(const lb of item.problemCategory) {
                        if (lb.label === question) {            
                            answers['text'].push(lb.text);
                            answers['answer_start'].push(lb.start);
                        }
                    }
                    // current question has answer
                    if (answers.text.length) {
                        cvsData.push({
                            context: Object.values(srs.originalData)[0],
                            question: question,
                            answers: JSON.stringify(answers)
                        });
                    }
                }
            }
            
        }else if (project.projectType == PROJECTTYPE.LOG) {
            // init log classification fileName
            newCase.fileName = srs.fileInfo.fileName;

            await project.categoryList.split(",").forEach(item => {
                newCase[item] = [];
            });
            const userInputDatas = await prepareUserInputs(srs);
            // log project max annotation is 1
            await userInputDatas.forEach(async item => {

                newCase.freeText = item.logFreeText;

                await item.problemCategory.sort((a, b) => { return a.line - b.line }).forEach(async lb => {
                    await project.categoryList.split(",").forEach((label) => {
                        if (lb.label === label) {
                            const line = lb.line;
                            let data = { [line]: srs.originalData[line] };
                            if (lb.freeText) {
                                data["freeText"] = lb.freeText;
                            }
                            newCase[label].push(data)
                        }
                    });
                });
            });
            //change annotations to a string array 
            await project.categoryList.split(",").forEach(item => {
                newCase[item] = newCase[item][0] ? JSON.stringify(newCase[item]) : [];
            });
        } else {
            // init selected data
            await project.selectedColumn.forEach(item => {
                newCase[item] = (srs.originalData)[item];
            });

            if (project.labelType != LABELTYPE.NUMERIC) {
                if (project.labelType == LABELTYPE.HIERARCHICAL) {
                    // init label headers
                    let labels = JSON.parse(project.categoryList);
                    let labelsArray = [];
                    let pathsArray = [];
                    await initHierarchicalLabelsCase(labels, "", "", labelsArray, pathsArray);
                    project.labelsArray = labelsArray;
                    project.pathsArray = pathsArray;

                    await labelsArray.forEach(item => {
                        newCase[item] = 0;
                        labelCase[item] = 0;
                    });
                    // calculate labeld case number
                    const userInputDatas = await prepareUserInputs(srs);
                    for await (const input of userInputDatas) {
                        const userInputLabel = input.problemCategory;
                        for (const i in pathsArray) {
                            const currentLable = _.get(userInputLabel, pathsArray[i]);
                            if (currentLable.name == labelsArray[i].split(".").pop() && currentLable.enable == 1) {
                                newCase[labelsArray[i]] += 1;
                                labelCase[labelsArray[i]] += 1;
                            }
                        }
                    }
                } else {
                    // init label headers
                    await project.categoryList.split(",").forEach(item => {
                        newCase[item] = 0;
                        labelCase[item] = 0;
                    });
                    // calculate labeld case number
                    const userInputDatas = await prepareUserInputs(srs);
                    await userInputDatas.forEach(async item => {
                        await project.categoryList.split(",").forEach((labels) => {
                            if (item.problemCategory === labels) {
                                newCase[labels] += 1;
                                labelCase[labels] += 1;
                            }
                        });
                    });
                }
            } else {
                //multi-numberica lables
                if (project.isMultipleLabel) {
                    // init label headers
                    const labelsList = JSON.parse(project.categoryList);
                    await labelsList.forEach(async labels => {
                        const label = Object.keys(labels)[0];
                        newCase[label] = [];
                        // put labeld case 
                        const userInputDatas = await prepareUserInputs(srs);
                        await userInputDatas.forEach(async item => {
                            if (item.problemCategory.label == label) {
                                const value = item.problemCategory.value;
                                newCase[label].push(value);
                            }
                        });
                        newCase[label] = newCase[label][0] ? JSON.stringify(newCase[label]) : [];
                    });
                }
            }
        }

        //2. top lable csv
        if (format == FILEFORMAT.TOPLABEL) {
            const lbnum = await findFrequentlyElementInObject(labelCase);
            newCase.top_label = lbnum ? Object.keys(lbnum)[0] : "N/A";
            //3. probabilistic csv
        } else if (format == FILEFORMAT.PROBABILISTIC) {
            const probab = await probabilisticInObject(labelCase);
            let probablistic = [];
            //to keep lables order
            if (project.labelType == LABELTYPE.HIERARCHICAL) {
                await project.labelsArray.forEach(label => {
                    probablistic.push(probab[label]);
                });
            } else {
                await project.categoryList.split(",").forEach(label => {
                    probablistic.push(probab[label]);
                });
            }
            newCase.probabilistic = `(${probablistic})`;
        }
        //4. regression project
        if (project.labelType == LABELTYPE.NUMERIC && !project.isMultipleLabel) {
            for (let index = 0; index < project.maxAnnotation; index++) {
                const userInputDatas = await prepareUserInputs(srs);
                if (userInputDatas[index]) {
                    newCase[`annotation_${index + 1}`] = userInputDatas[index].problemCategory;
                } else {
                    newCase[`annotation_${index + 1}`] = "";
                }
            }
        }
        if (project.projectType != PROJECTTYPE.QA) {
            cvsData.push(newCase);
        }
    }
    return cvsData;
}

async function prepareCsv(mp, format, onlyLabelled, user) {
    console.log(`[ FILE ] Service prepareCsv`);

    let headerArray = await prepareHeaders(mp.project, format);

    const now = moment().format('MMDDYYYYHHmmss');
    const fileName = `Export_${mp.project.dataSource.replace('.csv', "").replace('.zip', "").replace('.tgz', "")}_${now}.csv`;

    const filePath = `./${FILEPATH.DOWNLOAD}/${user}`;
    const filePosition = `${filePath}/${fileName}`
    await localFileSysService.checkFileExistInLocalSys(filePath, true);

    let csvWriterOptions = {
        path: filePosition,
        header: headerArray,
        alwaysQuote: true
    };
    console.log(`[ FILE ] Service prepare csvWriterOptions info`, csvWriterOptions.path);


    let options = { page: 1, limit: mp.project.projectType == PROJECTTYPE.LOG ? PAGINATETEXTLIMIT : PAGINATELIMIT };
    let query = { projectName: mp.project.projectName };
    if (onlyLabelled == 'Yes') {
        query.userInputsLength = { $gt: 0 }
    }

    while (true) {

        let result = await mongoDb.paginateQuery(mp.model, query, options);
        let cvsData = await prepareContents(result.docs, mp.project, format);

        let csvWriter = await createCsvWriter(csvWriterOptions);
        await csvWriter.writeRecords(cvsData);

        if (result.hasNextPage) {
            csvWriterOptions.append = true;
            options.page = result.nextPage;
        } else {
            console.log(`[ FILE ] Service [Generate-End-] totalCase= ${result.totalDocs} lastPage= ${result.totalPages}`);
            break;
        }
    }
    return fileName
}

async function updateGenerateStatus(id, status, file, messageId, format, onlyLabelled) {

    const condition = { _id: id };
    let update = {
        $set: {
            "generateInfo.status": status,
            "generateInfo.updateTime": Date.now()
        }
    };
    if (messageId) {
        update.$set["generateInfo.messageId"] = messageId;
        update.$set["generateInfo.startTime"] = Date.now();
    }
    if (file) {
        update.$set["generateInfo.file"] = file;
    }
    if (format) {
        update.$set["generateInfo.format"] = format;
    }
    if (onlyLabelled) {
        update.$set["generateInfo.onlyLabelled"] = onlyLabelled;
    }
    const optional = { new: true };
    console.error(`[ FILE ] Service update file generate status`);
    return mongoDb.findOneAndUpdate(ProjectModel, condition, update, optional);
}

async function queryFileForDownlad(req) {

    console.log(`[ FILE ] Service query file generate info`);
    const data = await mongoDb.findById(ProjectModel, ObjectId(req.query.pid));
    data._doc.generateInfo.labelType = data.labelType ? data.labelType : LABELTYPE.TEXT;
    let response = data.generateInfo;
    let originalDataSets = [];
    const generatedFile = data.generateInfo.file;

    if (config.useLocalFileSys) {

        if (data.projectType == PROJECTTYPE.LOG) {
            for (const dataset of data.selectedDataset) {
                const ds = await mongoDb.findOneByConditions(DataSetModel, { dataSetName: dataset }, 'location');
                originalDataSets.push(ds.location);
            }
        }

    } else {
        const S3 = await S3Utils.s3Client();

        if (generatedFile) {//data.generateInfo alway not null
            console.log(`[ FILE ] Service found file: ${generatedFile}`);
            const signedUrl = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, generatedFile, S3);
            response.file = Buffer.from(signedUrl).toString("base64");
        }
        if (data.projectType == PROJECTTYPE.LOG) {
            for (const dataset of data.selectedDataset) {
                const ds = await mongoDb.findOneByConditions(DataSetModel, { dataSetName: dataset }, 'location');
                if (ds && ds.location) {
                    const signedUrl = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, ds.location, S3);
                    originalDataSets.push(signedUrl)
                }
            }
        }
    }

    data._doc.generateInfo.originalDataSets = originalDataSets;

    return response;
}

async function arrayWriteTempCSVFile(filePosition, headerArray, csvData) {
    console.error(`[ FILE ] Service arrayWriteTempCSVFile ${filePosition}`);
    let csvWriterOptions = {
        path: filePosition,
        header: headerArray,
        alwaysQuote: true
    };
    const csvWriter = await CSVArrayWriter(csvWriterOptions);
    await csvWriter.writeRecords(csvData);
}

async function getFileSizeInBytes(file) {
    const stats = fs.statSync(file)
    const fileSizeInBytes = stats["size"]
    console.error(`[ FILE ] Service getFileSizeInBytes file:${file} fileSizeInBytes:${fileSizeInBytes}`);
    return fileSizeInBytes
}

async function generateAllSr(projectName, filePosition) {

    let csvWriterOptions = {
        path: filePosition,
        header: ['id', 'text', 'label'],
        alwaysQuote: true
    };
    console.log(`[ FILE ] Service prepare generateAllSr`, csvWriterOptions.path);

    let options = { page: 1, limit: PAGINATELIMIT };
    while (true) {

        let result = await mongoDb.paginateQuery(SrModel, { projectName: projectName }, options);
        let cvsData = await csvContentsSrs(result);

        const csvWriter = await CSVArrayWriter(csvWriterOptions);
        await csvWriter.writeRecords(cvsData);
        if (result.hasNextPage) {
            csvWriterOptions.append = true;
            options.page = result.nextPage;
        } else {
            console.log(`[ FILE ] Service [Generate-End-] totalCase= ${result.totalDocs} lastPage= ${result.totalPages}`);
            break;
        }
    }
    return projectName;
}

async function csvContentsSrs(result) {
    let cvsData = [];
    for (let i = 0; i < result.docs.length; i++) {
        //csv content
        const content = [];

        content.push(result.docs[i]._id);//id
        content.push(Object.values(result.docs[i].originalData))//text

        const labels = [];
        result.docs[i].userInputs.forEach(input => {
            labels.push(input.problemCategory);
        });
        const label = await findFrequentlyElementInArray(labels)
        content.push(label);//labels

        cvsData.push(content);
    }
    return cvsData;
}

async function uploadFile(req) {

    await validator.checkDataSet({ dataSetName: req.body.dsname }, false);

    const fileSplit = req.file.originalname.toLowerCase().split(".");
    const fileType = fileSplit[fileSplit.length - 1];

    if (![FILETYPE.CSV, FILETYPE.ZIP, FILETYPE.TGZ].includes(fileType)) {
        return MESSAGE.VALIDATION_DS_FILE_FORMAT;
    }

    const fileKey = `upload/${req.auth.email}/${Date.now()}_${req.file.originalname}`;
    const file = await S3.uploadObject(fileKey, req.file.buffer);

    const datasetInfo = {
        body: {
            dsname: req.body.dsname,
            fileKey: fileKey,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            location: file.Key
        },
        auth: { email: req.auth.email }
    }

    let filestream = req.file.buffer, totalRows = 0, topReview;

    if (FILETYPE.CSV == fileType) {
        let header = [], topRows = [];
        let headerRule = { noheader: true };
        if (req.body.hasHeader == 'no') {
            headerRule.noheader = false;
        }

        await csv(headerRule).fromString(filestream.toString()).subscribe((row, i) => {
            if (i < 5) {
                if (i == 0) header = Object.keys(row);
                topRows.push(Object.values(row));
            } else {
                filestream = null;
            }
        });
        topReview = { header: header, topRows: topRows };

        datasetInfo.body.format = FILETYPE.CSV;
        datasetInfo.body.hasHeader = req.body.hasHeader;
        datasetInfo.body.topReview = topReview;

        console.error("[ FILE ] [ FINISH ] Service swagger upload csv done ->");
        await dataSetService.saveDataSetInfo(datasetInfo);

    } else if ([FILETYPE.ZIP, FILETYPE.TGZ].includes(fileType)) {
        topReview = [];

        if (fileType == FILETYPE.ZIP) {
            uncompressStream = new compressing.zip.UncompressStream();
        } else if (fileType == FILETYPE.TGZ) {
            uncompressStream = new compressing.tgz.UncompressStream();
        }

        streamifier.createReadStream(filestream).pipe(uncompressStream).on('entry', (header, stream, next) => {
            stream.on('end', next);

            const nameSplit = header.name.toLowerCase().split("/");
            const name = nameSplit[nameSplit.length - 1]
            const fileSplit = header.name.toLowerCase().split(".");
            const fileType = fileSplit[fileSplit.length - 1];

            if (header.type === 'file' && (header.size || header.yauzl.uncompressedSize) && !name.startsWith("._") && fileType == DATASETTYPE.LOG) {
                if (totalRows <= 2) {
                    let index = 0, textLines = "";
                    let readInterface = readline.createInterface({ input: stream });
                    readInterface.on('line', (line) => {
                        if (index >= 5) {
                            readInterface.emit('close');
                        } else {
                            if (line && line.trim()) {
                                index++;
                                textLines += line.trim() + "\n";
                            }
                        }
                    }).on('close', () => {
                        if (Object.keys(textLines).length) {
                            topReview.push({
                                fileSize: header.size ? header.size : header.yauzl.uncompressedSize,
                                fileName: header.name,
                                fileContent: textLines
                            });
                        }
                        readInterface.removeAllListeners();
                    });
                }
                totalRows++;
            }
            stream.resume();
        }).on('error', err => {
            console.error("[ FILE ] [ ERROR ] Service swagger upload datasets error ->", err);
            throw MESSAGE.ERROR_DS_SAVE;
        }).on('finish', async () => {
            datasetInfo.body.format = DATASETTYPE.LOG;
            datasetInfo.body.topReview = topReview;
            datasetInfo.body.totalRows = totalRows;

            console.error("[ FILE ] [ FINISH ] Service swagger upload uncompressStream done ->");
            await dataSetService.saveDataSetInfo(datasetInfo);
        });
    }
    return MESSAGE.SUCCESS;

}

async function setData(req) {

    const label = req.body.label;
    const columns = req.body.columns;
    const location = req.body.location;
    const noheader = req.body.hasHeader == "yes" ? false : true;

    let numberLabel = true;
    let lableType = "string";
    let labels = [];
    let totalCase = 0;
    let perLbExLmt = false;
    let totLbExLmt = false;
    let removedCase = 0;

    if (columns.includes(label)) {
        throw MESSAGE.VALIDATATION_PJ_LABEL;
    }

    const headerRule = {
        fork: true,
        flatKeys: true,
        checkType: true,
        noheader: noheader
    }
    let readStream = await localFileSysService.readFileFromLocalSys(location);
    await csv(headerRule).fromStream(readStream).subscribe(async (oneData, index) => {
        let lable = oneData[label];
        if (lable) {
            if (typeof lable != 'number') {
                numberLabel = false;
            }
            if (!numberLabel && lable.length > 50) {
                perLbExLmt = true;
                lable = oneData[label].toString().substr(0, 50);
            }
            labels.push(lable);
        }


        let select = "";
        await columns.forEach(item => { select += oneData[item] });
        let selectedData = select.replace(new RegExp(',', 'g'), '').trim();
        if (selectedData) {
            totalCase += 1;
        } else {
            removedCase += 1;
        }
        if (!numberLabel && index > 50 && _.uniq(labels).length > 50) {
            readStream.emit('end');
            totLbExLmt = true;
        }

    }, (err) => {
        console.error("[ FILE ] [ ERROR ] Service handle set-data", err);
        throw MESSAGE.ERROR_TK_SETDATA;
    }, () => {
        if (totLbExLmt) {
            labels = [];
            totalCase = 0;
            removedCase = 0;
        }
    });

    labels = _.uniq(labels);

    if (labels.length && numberLabel) {
        lableType = "number";
        const max = _.max(labels);
        const min = _.min(labels);
        labels = [];
        labels.push(min);
        labels.push(max);
    }

    return {
        perLbExLmt: perLbExLmt,
        totLbExLmt: totLbExLmt,
        totalCase: totalCase,
        removedCase: removedCase,
        lableType: lableType,
        labels: labels
    };
}

module.exports = {
    createProject,
    generateFileFromDB,
    arrayWriteTempCSVFile,
    updateGenerateStatus,
    queryFileForDownlad,
    getFileSizeInBytes,
    prepareHeaders,
    prepareCsv,
    generateAllSr,
    csvContentsSrs,
    saveProjectInfo,
    uploadFile,
    setData,
}



