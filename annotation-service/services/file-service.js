/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const srsImporter = require("../utils/srsImporter");
const projectDB = require('../db/project-db');
const srsDB = require('../db/srs-db');
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const CSVArrayWriter = require("csv-writer").createArrayCsvWriter;
const { GENERATESTATUS, PAGINATETEXTLIMIT, PAGINATELIMIT, FILEFORMAT, LABELTYPE, PROJECTTYPE, S3OPERATIONS } = require("../config/constant");
const fs = require('fs');
const ObjectId = require("mongodb").ObjectID;
const moment = require('moment');
const { findFrequentlyElementInObject, probabilisticInObject, findFrequentlyElementInArray } = require('../utils/common.utils');
const csv = require('csvtojson');
const request = require('request');
const dataSetService = require('../services/dataSet-service');
const S3 = require('../utils/s3');
const validator = require("../utils/validator");
const imgImporter = require("../utils/imgImporter");
const logImporter = require("../utils/logImporter");
const { getModelProject } = require("../utils/mongoModel.utils");
const mongoDb = require("../db/mongo.db");
const S3Utils = require('../utils/s3');
const { DataSetModel } = require("../db/db-connect");

async function createProject(req) {

    await validator.checkProjectByconditions({projectName: req.body.pname}, false);

    console.log(`[ FILE ] Service createProject init parameters`);
    let annotators = req.body.assignee;
    annotators = (typeof annotators === 'string'? JSON.parse(annotators):annotators);
    
    let userCompleteCase = [];
    annotators.forEach(item => {
        const inintUser = { user: item };
        userCompleteCase.push(inintUser);
    });
    
    console.log(`[ FILE ] Service ticktes to db`);
    await srsImporter.execute(req, annotators);
    await imgImporter.execute(req, true, annotators);
    await logImporter.execute(req, true, annotators);

    console.log(`[ FILE ] Service save project info to db`);
    return await saveProjectInfo(req, userCompleteCase, annotators);
}

async function saveProjectInfo(req, userCompleteCase, annotators){

    
    let selectedColumn = req.body.selectDescription;
    selectedColumn = (typeof selectedColumn === 'string'? JSON.parse(selectedColumn):selectedColumn);
    
    let labels = req.body.labels;
    labels = (typeof labels === 'object'? labels.toString: labels);

    let totalCase = 0, alFailed = req.body.isMultipleLabel === 'true'? true: false;
    if (req.body.projectType == PROJECTTYPE.IMGAGE) {
        totalCase = req.body.totalRows;
        alFailed = true;
    }


    const project = {
        creator: [req.auth.email],
        createdDate: Date.now(),
        updatedDate: Date.now(),
        projectName: req.body.pname,
        taskInstructions: req.body.taskInstruction,
        totalCase: totalCase,
        userCompleteCase: userCompleteCase,
        maxAnnotation: req.body.maxAnnotations,
        projectCompleteCase: 0,
        categoryList: labels,
        assignmentLogic: req.body.assignmentLogic,
        annotator: annotators,
        dataSource: req.body.fileName,
        selectedDataset: [req.body.selectedDataset],
        selectedColumn: selectedColumn,
        annotationQuestion: req.body.annotationQuestion,
        shareStatus: false,
        shareDescription: '',
        generateInfo: {
            status: GENERATESTATUS.DEFAULT,
        },
        fileSize: req.body.fileSize,
        labelType: req.body.labelType,
        min: (Number.isNaN(+req.body.min) ? 0 : +req.body.min),
        max: (Number.isNaN(+req.body.max) ? 0 : +req.body.max),
        al: {
            estimator: req.body.estimator,
            alFailed: alFailed,
        },
        projectType: req.body.projectType,
        encoder: req.body.encoder,
        isMultipleLabel: req.body.isMultipleLabel === 'true'? true: false
    };
    return await projectDB.saveProject(project);
}

async function generateFileFromDB(id, format, onlyLabelled) {

    const start = Date.now();
    console.log(`[ FILE ] Service generateFileFromDB start: ${start}`);
    // const project = await projectDB.queryProjectById(ObjectId(id));

    const mp = await getModelProject({_id: ObjectId(id)});

    const fileName = await prepareCsv(mp, format, onlyLabelled);
    console.log(`[ FILE ] Service generateFileFromDB end within:[ ${(Date.now() - start) / 1000}s]`);
    return { fileName: fileName };
}

async function prepareHeaders(project, format) {
    console.log(`[ FILE ] Service prepareHeaders`);

    let headerArray = [];
    //selected headers
    if (project.projectType == PROJECTTYPE.IMGAGE || project.projectType == PROJECTTYPE.LOG) {
        let param = { id: "fileName", title: "fileName" };
        headerArray.push(param);
    }else{
        await project.selectedColumn.forEach(item => {
            let param = { id: item, title: item };
            headerArray.push(param);
        });
    }
    
    // label info regression project doesn't need
    if (project.labelType != LABELTYPE.NUMERIC) {
        await project.categoryList.split(",").forEach(item => {
            let param = { id: item, title: item };
            headerArray.push(param);
        });
    }

    if (format == FILEFORMAT.TOPLABEL) {
        headerArray.push({ id: "top_label", title: "top_label" });
    } else if (format == FILEFORMAT.PROBABILISTIC) {
        headerArray.push({ id: "probabilistic", title: "probabilistic" });
    }

    //regression project
    if (project.labelType == LABELTYPE.NUMERIC) {
        for (let index = 0; index < project.maxAnnotation; index++) {
            headerArray.push({ id: `annotation_${index + 1}`, title: `annotation_${index + 1}` });
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
            
            await srs.userInputs.forEach(async item => {
                const pc = item.problemCategory.value;
                const annLable = pc.rectanglelabels? pc.rectanglelabels[0]: pc.polygonlabels[0];

                await project.categoryList.split(",").forEach((label) => {
                    if (annLable == label) {
                        newCase[label].push(item.problemCategory)
                    }
                });

            });
            // change annotations to a string array 
            await project.categoryList.split(",").forEach(item => {
                newCase[item] = newCase[item][0]? JSON.stringify(newCase[item]):[];
            });
            
        }else if (project.projectType == PROJECTTYPE.NER) {
            
            // init selected data
            await project.selectedColumn.forEach(item => {
                newCase[item] = (srs.originalData)[item];
            });

            await project.categoryList.split(",").forEach(item => {
                newCase[item] = [];
            });
            
            await srs.userInputs.forEach(async item => {
                await item.problemCategory.forEach(async lb =>{
                    await project.categoryList.split(",").forEach((label) => {
                        if (lb.label === label) {
                            newCase[label].push({[lb.text]: [lb.start, lb.end]})
                        }
                    });
                });
            });
            //change annotations to a string array 
            await project.categoryList.split(",").forEach(item => {
                newCase[item] = newCase[item][0]? JSON.stringify(newCase[item]):[];
            });
        }else if(project.projectType == PROJECTTYPE.LOG){
            // init log classification fileName
            newCase.fileName = srs.fileInfo.fileName;

            await project.categoryList.split(",").forEach(item => {
                newCase[item] = [];
            });
            
            await srs.userInputs.forEach(async item => {
                await item.problemCategory.forEach(async lb =>{
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
                newCase[item] = newCase[item][0]? JSON.stringify(newCase[item]):[];
            });
        }else{
            // init selected data
            await project.selectedColumn.forEach(item => {
                newCase[item] = (srs.originalData)[item];
            });

            if (project.labelType != LABELTYPE.NUMERIC) {
                // init label headers
                await project.categoryList.split(",").forEach(item => {
                    newCase[item] = 0;
                    labelCase[item] = 0;
                });
                // calculate labeld case number
                await srs.userInputs.forEach(async item => {
                    await project.categoryList.split(",").forEach((labels) => {
                        if (item.problemCategory === labels) {
                            newCase[labels] += 1;
                            labelCase[labels] += 1;
                        }
                    });
                });
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
            await project.categoryList.split(",").forEach(label => {
                probablistic.push(probab[label]);
            });
            newCase.probabilistic = `(${probablistic})`;
        }
        //4. regression project
        if (project.labelType == LABELTYPE.NUMERIC) {
            for (let index = 0; index < project.maxAnnotation; index++) {
                if (srs.userInputs[index]) {
                    newCase[`annotation_${index + 1}`] = srs.userInputs[index].problemCategory;
                } else {
                    newCase[`annotation_${index + 1}`] = "";
                }
            }
        }
        
        cvsData.push(newCase);
    }
    return cvsData;
}

async function prepareCsv(mp, format, onlyLabelled) {
    console.log(`[ FILE ] Service prepareCsv`);

    let headerArray = await prepareHeaders(mp.project, format);

    const now = moment().format('MMDDYYYYHHmmss');
    const fileName = `Export_${mp.project.dataSource.replace('.csv', "")}_${now}.csv`;
    let csvWriterOptions = {
        path: `./downloadProject/${fileName}`,
        header: headerArray,
        alwaysQuote: true
    };
    console.log(`[ FILE ] Service prepare csvWriterOptions info`, csvWriterOptions.path);


    let options = { page: 1, limit: mp.project.projectType==PROJECTTYPE.LOG? PAGINATETEXTLIMIT : PAGINATELIMIT };
    let query = { projectName: mp.project.projectName };
    onlyLabelled == 'Yes' ? query.userInputsLength = { $gt: 0 }: query;

    while (true) {
        
        // let result = await srsDB.paginateQuerySrsData(query, options);
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

async function deleteTempFile(fileName) {
    const file = `./downloadProject/${fileName}`;
    console.error(`[ FILE ] Service deleteTempFile ${file}`);
    fs.unlink(file, error => {
        if (error) {
            console.error(`[ FILE ] [ERROR] Service deleteTempFile ${file}`, error);
        }
    });
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
    return await projectDB.findUpdateProject(condition, update, optional);
}

async function queryFileForDownlad(req) {

    console.error(`[ FILE ] Service query file generate info`);
    const data = await projectDB.queryProjectById(ObjectId(req.query.pid));
    data._doc.generateInfo.labelType = data.labelType ? data.labelType : LABELTYPE.TEXT;

    const S3 = await S3Utils.s3Client();
    let response = data.generateInfo;
    originalDataSets = []

    if (data.generateInfo.file) {//data.generateInfo alway not null
        console.error(`[ FILE ] Service found file: ${data.generateInfo.file}`);
        const signedUrl = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, data.generateInfo.file, S3);
        response.file = Buffer.from(signedUrl).toString("base64");
    }
    for (const dataset of data.selectedDataset) {
        const ds = await mongoDb.findOneByConditions(DataSetModel, {dataSetName: dataset}, 'location');
        const signedUrl = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, ds.location, S3);
        originalDataSets.push(signedUrl)
    }
    data._doc.generateInfo.originalDataSets = originalDataSets;
    
    return response;

}

async function arrayWriteTempCSVFile(fileName, headerArray, csvData) {
    console.error(`[ FILE ] Service arrayWriteTempCSVFile ${fileName}`);
    let csvWriterOptions = {
        path: `./downloadProject/${fileName}`,
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

async function generateAllSr(projectName) {

    let csvWriterOptions = {
        path: `./downloadProject/${projectName}.csv`,
        header: ['id', 'text', 'label'],
        alwaysQuote: true
    };
    console.log(`[ FILE ] Service prepare generateAllSr`, csvWriterOptions.path);

    let options = { page: 1, limit: PAGINATELIMIT };
    while (true) {
        let result = await srsDB.paginateQuerySrsData({ projectName: projectName }, options);
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

    const ds = await dataSetService.checkDatasetsName(req.body.dsname);
    if (ds && ds.length > 0) {
        return { CODE: 3001, MSG: "there already have the same dataSet, please change the dataSet name" };
    }

    let fileKey = `upload/${req.auth.email}/${Date.now()}_${req.file.originalname}`;
    let file = await S3.uploadObject(fileKey, req.file.buffer);

    const signedUrl = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, file.Key);
    let filestream = request.get(signedUrl);

    const hasheader = req.body.hasHeader.toLowerCase();
    let headerRule = { noheader: true };
    hasheader == 'no' ? null: headerRule.noheader=false;
    
    let header=[], topRows=[];

    await csv(headerRule).fromStream(filestream).subscribe((row,i) => {
        if (i < 5) {
            if (i==0) header = Object.keys(row);
            topRows.push(Object.values(row));   
        }else{
            filestream = null;
        }
    });
    const datasetInfo = {
        body:{
            dsname: req.body.dsname,
            fileKey: fileKey,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            format: req.body.fileFormat,
            hasHeader: hasheader,
            location: file.Key,
            topReview: { header: header, topRows: topRows }
        },
        auth:{email: req.auth.email}
    }
    return await dataSetService.saveDataSetInfo(datasetInfo);
}

module.exports = {
    createProject,
    generateFileFromDB,
    deleteTempFile,
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
}



