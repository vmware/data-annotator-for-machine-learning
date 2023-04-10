/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const SQS = require('../utils/sqs');
const config = require('../config/config');
const { GENERATESTATUS, FILESIZE, PROJECTTYPE, FILEFORMAT, S3OPERATIONS, FILEPATH } = require('../config/constant');
const FileService = require('./file-service');
const ObjectId = require("mongodb").ObjectID;
const S3Service = require('./s3.service');
const communityService = require('./community.service');
const S3Utils = require('../utils/s3');
const localFileSysService = require('./localFileSys.service');
const mongoDb = require('../db/mongo.db');
const { ProjectModel } = require('../db/db-connect');
const validator = require('../utils/validator');
const MESSAGE = require('../config/code_msg');

async function generateFile(req){
    
    let data = {
        id: req.query.pid,
        user:req.auth.email,
        format: req.query.format,
        src: req.query.src,
        onlyLabelled: req.query.onlyLabelled
    };
    let response = {};
    
    console.log(`[ SQS ] Service generateFile query file size and generate info`);
    let project_check = await validator.checkProjectByconditions({ _id: data.id }, true);
    const pro = project_check[0];
    const gen = pro.generateInfo;

    if ((pro.projectType == PROJECTTYPE.NER || pro.projectType == PROJECTTYPE.QA || pro.projectType == PROJECTTYPE.IMGAGE) && data.format != FILEFORMAT.STANDARD){
        return MESSAGE.VALIDATATION_PJ_FORMAT;
    }
    
    if (config.useLocalFileSys) {
        
        if(gen.updateTime > pro.updatedDate && gen.format == data.format && gen.onlyLabelled == data.onlyLabelled){
            response.Body = gen;
        }else{
            response.Body = await localSysGenerateFile(data);
        }

        console.log(`[ SQS ] Service communityService.countCommunityDownload`);
        await communityService.countCommunityDownload(req);
        
        response.Info = GENERATESTATUS.DONE;
        
    }else{
        if((gen.status == GENERATESTATUS.PREPARE) || (gen.status == GENERATESTATUS.GENERATING)){
            response.Info = GENERATESTATUS.GENERATING;
            response.Body = { MSG: "file is generating please wait!" };
            console.log(`[ SQS ] Service file status: `, gen.status);
        }else if(gen.updateTime > pro.updatedDate && gen.format == data.format && gen.onlyLabelled == data.onlyLabelled && gen.status == GENERATESTATUS.DONE){
            response.Info = GENERATESTATUS.DONE;
            response.Body = await avoidRegeneration(pro, req);
        }else if(pro.fileSize !=0 && pro.fileSize < FILESIZE){
            console.log(`[ SQS ] Service file is less than ${FILESIZE} derectly download`);
            response.Info = GENERATESTATUS.DONE;
            response.Body = await directlyDownload(data, req);
        }else{
            console.log(`[ SQS ] Service file is more than ${FILESIZE} need generate send message to sqs`);
            response.Info = GENERATESTATUS.PREPARE;
            response.Body = await sendMessageToSQS(data, req);
        }
    }

    return response;

}

async function avoidRegeneration(project, req) {

    console.log(`[ SQS ] Service communityService.countCommunityDownload`);
    await communityService.countCommunityDownload(req);

    console.log(`[ SQS ] Service avoidRegeneration`);
    const location = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, project.generateInfo.file);
    
    let resBody = project.generateInfo;
    resBody.file = Buffer.from(location).toString("base64");
    resBody.labelType = project.labelType;

    return resBody;
}

async function sendMessageToSQS(message, req){
    console.log(`[ SQS ] Service sendMessageToSQS.sendSQSMessage`);
    const data = await SQS.sendSQSMessage(config.sqsUrl, JSON.stringify(message));

    console.log(`[ SQS ] Service sendMessageToSQS.updateGenerateStatus`);
    await FileService.updateGenerateStatus(message.id, GENERATESTATUS.PREPARE, null, data.MessageId, null, message.onlyLabelled);

    console.log(`[ SQS ] Service communityService.countCommunityDownload`);
    await communityService.countCommunityDownload(req);
    
    return data;
}

async function directlyDownload(data, req){
    console.log(`[ SQS ] Service directlyDownload.generateFileFromDB`);
    const file = await FileService.generateFileFromDB(data.id, data.format, data.onlyLabelled, data.user);
    console.log(`[ SQS ] Service directlyDownload.generateFileFromDB-done`, file);
    
    const key = `download/${data.id}/${file}`;
    const fileLocation = `./${FILEPATH.DOWNLOAD}/${data.user}/${file}`;
    const upload = await S3Service.uploadFileToS3(fileLocation, key);
    console.log(`[ SQS ] Service directlyDownload.uploadFileToS3-done: `, upload.Location);

    console.log(`[ SQS ] Service directlyDownload.deleteFileFromLocalSys`, file);
    await localFileSysService.deleteFileFromLocalSys(fileLocation);

    console.log(`[ SQS ] Service directlyDownload save file position and generate status to db`);
    await FileService.updateGenerateStatus(data.id, GENERATESTATUS.DONE, upload.Key, null, data.format, data.onlyLabelled);

    console.log(`[ SQS ] Service directlyDownload.queryFileForDownlad`);
    const request = {query: {pid: data.id}};
    const response = await FileService.queryFileForDownlad(request);

    console.log(`[ SQS ] Service communityService.countCommunityDownload`);
    await communityService.countCommunityDownload(req);

    return response;
}

async function localSysGenerateFile(data){
    console.log(`[ SQS ] Service directlyDownload.generateFileFromDB`);
    const file = await FileService.generateFileFromDB(data.id, data.format, data.onlyLabelled, data.user);
    
    console.log(`[ SQS ] Service directlyDownload save file position and generate status to db`);
    const fileLocation = `./${FILEPATH.DOWNLOAD}/${data.user}/${file}`;
    await FileService.updateGenerateStatus(data.id, GENERATESTATUS.DONE, fileLocation, null, data.format, data.onlyLabelled);

    console.log(`[ SQS ] Service directlyDownload.queryFileForDownlad`);
    const request = {query: {pid: data.id}};
    const response = await FileService.queryFileForDownlad(request);

    return response;
}

module.exports = {
    generateFile,
    sendMessageToSQS,
    directlyDownload,
    avoidRegeneration,
    localSysGenerateFile,
}