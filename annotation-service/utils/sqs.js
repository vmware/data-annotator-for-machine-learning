/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const AWS = require('aws-sdk');
const { Consumer } = require('sqs-consumer');
const { GENERATESTATUS, ACCESS_TIME_60, TOKEN_EXPIRED_MESSAGE, FILEPATH, AWSRESOURCE } = require('../config/constant');
const config = require('../config/config');
const STS = require('./sts');
const FileService = require('../services/file-service');
const S3Service = require('../services/s3.service');
const EmailService = require('../services/email-service');
const localFileSysService = require('../services/localFileSys.service');

async function sqsClient(){

    const data = await STS.prepareCredentials(AWSRESOURCE.SQS, ACCESS_TIME_60);
    
    console.log('[ SQS ] Utils sqsClient.prepareCredentials done');
    return new AWS.SQS({
        region: config.region,
        apiVersion: '2012-11-05',
        accessKeyId: data.Credentials.AccessKeyId,
        secretAccessKey: data.Credentials.SecretAccessKey,
        sessionToken: data.Credentials.SessionToken
    });
}
async function sendSQSMessage(sqsQueueUrl,sqsMessageBody){
    console.log('[ SQS ] Utils sendSQSMessage.sqsClient');
    const SQSClinet = await sqsClient();
    var params = {
        QueueUrl: sqsQueueUrl,
        MessageBody: sqsMessageBody
    };
    console.log('[ SQS ] Utils SQSClinet.sendMessage');
    return SQSClinet.sendMessage(params).promise();
}
async function consumeSQSMessage(){
    const setSQS = config.useAWS && config.sqsRoleArn && config.sqsUrl;
    if (!setSQS) {
        return;
    }

    console.log('[ SQS ] Utils consumeSQSMessage');
    let clientHandle = {
        queueUrl: config.sqsUrl,
        sqs: await sqsClient(),
        visibilityTimeout: ACCESS_TIME_60,
        handleMessage: async (message) => {
            
            console.log(`[ SQS ] Utils handleMessage：${message.Body}  start: `, Date.now());
            const data = JSON.parse(message.Body);
            
            console.log("[ SQS ] Utils change generate status");
            await FileService.updateGenerateStatus(data.id, GENERATESTATUS.GENERATING);
            
            console.log("[ SQS ] Utils generate scv file from db");  
            const file = await FileService.generateFileFromDB(data.id, data.format, data.onlyLabelled, data.user);
            console.log('[ SQS ] Utils handleMessage.generateFileFromDB-Done', file);

            console.log("[ SQS ] Utils upload file to s3");
            const fileLocation = `./${FILEPATH.DOWNLOAD}/${data.user}/${file}`;
            const key = `download/${data.id}/${file}`;
            const upload = await S3Service.uploadFileToS3(fileLocation, key);

            console.log("[ SQS ] Utils delete temp file");

            await localFileSysService.deleteFileFromLocalSys(fileLocation);

            console.log("[ SQS ] Utils save file position and generate status to db");    
            await FileService.updateGenerateStatus(data.id, GENERATESTATUS.DONE, upload.Key, null, data.format, data.onlyLabelled);
            
            console.log("[ SQS ] Utils send generation email to owner");    
            await EmailService.sendGenerationEmailToOwner(data.user, file);
            
            console.log(`[ SQS ] Utils handleMessage：${message.Body}  end: `, Date.now());
        }
    };
    let app = Consumer.create(clientHandle);
     
    app.on('error', (err) => {
        
        if(err.message == TOKEN_EXPIRED_MESSAGE){
            console.log("[ SQS ] [ STOP ] Utils sts token expired need re-start");
            app.stop();
            
            //important recursive call to fix sts token expired issue
            console.log("[ SQS ] [ RE-START ]");
            consumeSQSMessage();
        }else{
            console.log("[ SQS ] [ERROR] Utils ", err.message);
        }
    });
    app.on('processing_error', (err) => {
      console.error("[ SQS ] [ PROCESSING_ERROR ] Utils ", err.message);
    });
     
    app.on('timeout_error', (err) => {
     console.error("[ SQS ] [ TIMEOUT_ERROR ]  Utils ", err.message);
    });
    
    console.log('[ SQS ] Utils consumeSQSMessage.app.start')
    app.start();
}


module.exports={
    sqsClient,
    sendSQSMessage,
    consumeSQSMessage,
}