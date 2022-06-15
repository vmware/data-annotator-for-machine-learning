/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const axios = require("axios");
const config = require('../config/config');
const { FILEPATH } = require('../config/constant');
const FileService = require('./file-service');
const S3Service = require('./s3.service');
const DataSetService = require('./dataSet-service');
const localFileSysService = require('./localFileSys.service');

async function superColliderQuery(req){
    
    console.log('[ SUPER-COLLIDER ] Service query start time: ', Date.now());
    const params = { 'sql': req.body.sql, 'ddlOutputType': 'table', 'version': 1 }
    const headers = { 'Content-Type': 'application/json', 'Authorization': config.superColliderToken } 
    const resp = await axios.get(config.superColliderHost, { headers: headers, params: params });
    console.log('[ SUPER-COLLIDER ] Service query success from SC time: ', Date.now());
    
    console.log('[ SUPER-COLLIDER ] Service writh data to temp csv');
    const user = req.auth.email;
    const fileName = Date.now()+".csv";
    const fileKey = `upload/${user}/${fileName}`;
    const file =  `./${FILEPATH.DOWNLOAD}/${user}/${fileName}`;
    
    await FileService.arrayWriteTempCSVFile(file, resp.data.columns, resp.data.result);

    console.log('[ SUPER-COLLIDER ] Service upload file to s3', fileKey);
    const upload = await S3Service.uploadFileToS3(file, fileKey);

    console.log('[ SUPER-COLLIDER ] Service get file size');
    const fileSizeInByte = await FileService.getFileSizeInBytes(file);

    console.log('[ SUPER-COLLIDER ] Service delete temp csv file fileSizeInByte: ', fileSizeInByte);
    await localFileSysService.deleteFileFromLocalSys(file);

    console.log('[ SUPER-COLLIDER ] Service save query data to dataSet DB');
    const header = resp.data.columns;
    const topRows = [];
    for (let i=0; i<resp.data.result.length; i++) {
        if (i > 3) break;   
        topRows.push(resp.data.result[i]);
    }
    const reviews = {'header': header, 'topRows': topRows };
    let body = {
        dataSetName: req.body.dsname,
        fileName: fileName,
        user: req.auth.email,
        description: req.body.description,
        topReview: reviews,
        location: upload.Key,
        hasHeader: 'yes',
        format: 'csv',
        fileSize: fileSizeInByte,
    };
    let saveInfo = { 'body': body };
    console.log('[ SUPER-COLLIDER ] Service DataSetService.saveDataSetInfo end time: ', Date.now());
    return DataSetService.saveDataSetInfo(saveInfo);
}

module.exports = {
    superColliderQuery,
}