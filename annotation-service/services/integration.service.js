
/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const projectDB = require('../db/project-db');
const srsDB = require('../db/srs-db');
const ObjectId = require("mongodb").ObjectID;
const CSVArrayWriter = require("csv-writer").createArrayCsvWriter;
const { findFrequentlyElementInArray } = require('../utils/common.utils');
const FileService = require('./file-service');
const { PAGINATELIMIT, FILEPATH } = require("../config/constant");
const { internalMLApiUrl } = require("../config/config");
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const localFileSysService = require('./localFileSys.service');

async function generateLabelledCaseAsCSV(pid, user){
    
    console.log(`[ INTEGRATION ] Service generateLabelledCaseAsCSV.queryProjectById`);
    const proInfo = await projectDB.queryProjectById(ObjectId(pid));

    const csvHeaders = ['text','label'];
    let csvWriterOptions = {
        path: `./${FILEPATH.DOWNLOAD}/${user}/${proInfo.dataSource}`,
        header: csvHeaders,
        alwaysQuote: true
    }
    let hasData = true;
    let options = { select: 'originalData userInputs', page: 1, limit: PAGINATELIMIT };
    
    console.log(`[ INTEGRATION ] Service generate temp csv file`);
    while (hasData){
        const query = { projectName: proInfo.projectName,  userInputsLength: { $gt: 0 } }; 
        let result = await srsDB.paginateQuerySrsData(query, options);

        let cvsData = [];
        for (let i = 0; i < result.docs.length; i++) {
            const content = [];
            //text
            const text = [];
            proInfo.selectedColumn.forEach( header =>{
                text.push(result.docs[i].originalData[header]);
            });
            content.push(text);
            //labels
            const label = [];
            result.docs[i].userInputs.forEach(input =>{
                label.push(input.problemCategory);
            }); 
            content.push(await findFrequentlyElementInArray(label));
            
            cvsData.push(content);
        }
        const csvWriter = await CSVArrayWriter(csvWriterOptions);
        await csvWriter.writeRecords(cvsData);

        if(result.hasNextPage){
            csvWriterOptions.append = true;
            options.page = result.nextPage;
        }else{
            console.log(`[ INTEGRATION ] Service paginate query srs data done totalResult: ${result.totalResult} totalResult: ${result.pageCount}`);
            hasData = false;
        }
    }
    return proInfo.dataSource;
}


async function SyncLabelledCaseToInstaML(req){
    const user = req.auth.email;
    console.log(`[ INTEGRATION ] Service generate temp labelled csv`);
    const fileName = await generateLabelledCaseAsCSV(req.body.pid, user);
    const fileLocation = `./${FILEPATH.DOWNLOAD}/${user}/${fileName}`;

    console.log(`[ INTEGRATION ] Service query project Info`);
    const proInfo = await projectDB.queryProjectById(ObjectId(req.body.pid));
    
    console.log(`[ INTEGRATION ] Service sort out FormData`);
    let form = new FormData();
    form.append('user', user);
    form.append('name', proInfo.projectName);
    form.append('description', proInfo.taskInstructions);
    form.append('source', '');
    form.append('hasHeader', 'Yes');
    form.append('format', 'csv');
    form.append('docfile', fs.createReadStream(fileLocation));
    
    let config = {
        headers: form.getHeaders(),
    }
    config.headers.Authorization = req.headers.authorization;
    
    console.log(`[ INTEGRATION ] Service send data to INTERNAL_ML`);
    await axios.post(`${internalMLApiUrl}/datasets`, form, config);
    
    console.log(`[ INTEGRATION ] Service delete tep csv file`);
    await localFileSysService.deleteFileFromLocalSys(fileLocation);

    return { CODE: 0000, MSG: "SUCCESS" };

}



module.exports = {
    generateLabelledCaseAsCSV,
    SyncLabelledCaseToInstaML,
}