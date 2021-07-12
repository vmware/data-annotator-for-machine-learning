/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const SQS = require('../utils/sqs');
const config = require('../config/config');
const { GENERATESTATUS, FILESIZE, PROJECTTYPE, FILEFORMAT, S3OPERATIONS } = require('../config/constant');
const FileService = require('./file-service');
const ProjectDB = require('../db/project-db');
const ObjectId = require("mongodb").ObjectID;
const S3Service = require('./s3.service');
const communityService = require('./community.service');
const S3Utils = require('../utils/s3');

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
    const pro = await ProjectDB.queryProjectById(ObjectId(data.id));
    const gen = pro.generateInfo;

    if ((pro.projectType == PROJECTTYPE.NER || pro.projectType == PROJECTTYPE.IMGAGE) && data.format != FILEFORMAT.STANDARD) return {CODE: 4001, MSG: "ERROR FORMAT"};

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
    const file = await FileService.generateFileFromDB(data.id, data.format, data.onlyLabelled);
    console.log(`[ SQS ] Service directlyDownload.generateFileFromDB-done`, file);
    
    const key = `download/${data.id}/${file.fileName}`;
    const upload = await S3Service.uploadFileToS3(file.fileName, key);
    console.log(`[ SQS ] Service directlyDownload.uploadFileToS3-done: `, upload.Location);

    console.log(`[ SQS ] Service directlyDownload.deleteTempFile`, file.fileName);
     await FileService.deleteTempFile(file.fileName);

    console.log(`[ SQS ] Service directlyDownload save file position and generate status to db`);
    await FileService.updateGenerateStatus(data.id, GENERATESTATUS.DONE, upload.Key, null, data.format, data.onlyLabelled);

    console.log(`[ SQS ] Service directlyDownload.queryFileForDownlad`);
    const request = {query: {pid: data.id}};
    const response = await FileService.queryFileForDownlad(request);

    console.log(`[ SQS ] Service communityService.countCommunityDownload`);
    await communityService.countCommunityDownload(req);

    return response;
}

module.exports = {
    generateFile,
    sendMessageToSQS,
    directlyDownload,
    avoidRegeneration,
}