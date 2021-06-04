/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const csv = require('csvtojson');
const validator = require('./validator');
const srsDB = require('../db/srs-db');
const request = require('request');
const config = require("../config/config");
const { PAGINATELIMIT, PROJECTTYPE, ENCODE, S3OPERATIONS, FILEPATH } = require("../config/constant");
const projectDB = require('../db/project-db');
const emailService = require('../services/email-service');
const axios = require("axios");
const S3Utils = require('./s3');
const localFileSysService = require('../services/localFileSys.service');

module.exports = {
    execute: async function (req, annotators) {
        const projectType = req.body.projectType;
        if (projectType != PROJECTTYPE.TEXT && projectType != PROJECTTYPE.TABULAR && projectType != PROJECTTYPE.NER ) {
            return;
        }
        const start = Date.now();
        console.log(`[ SRS ] Utils srsImporter.execute start: `, start);
        
        let header = req.body.header;
        header = (typeof header === 'string'? JSON.parse(header):header);
        let selectedColumn = req.body.selectDescription;
        selectedColumn = (typeof selectedColumn === 'string'? JSON.parse(selectedColumn):selectedColumn);
        const user = req.auth.email;

        let totalCase = 0;
        let docs = [];
        let headerRule = {
            noheader: false,
            fork: true,
            flatKeys: true,
            headers: header,
            checkType:true
        };
        if (req.body.isHasHeader == 'no') {
            headerRule.noheader = true;
        };
        if (projectType == PROJECTTYPE.TEXT) {
            headerRule.checkType = false;
        }
        let fileStream;
        if (config.ESP || config.useAWS &&  config.bucketName && config.s3RoleArn) {
            console.log(`[ SRS ] Utils S3Utils.signedUrlByS3`);
            const signedUrl = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, req.body.location);
            fileStream = request.get(signedUrl);
        }else if (config.useLocalFileSys) {
            const filePath = `./${FILEPATH.UPLOAD}/${user}/${req.body.fileName}`;
            fileStream = await localFileSysService.readFileFromLocalSys(filePath);
        }else{
            throw {CODE:4007, MSG: "NO VALID FILE SYSTEM"};
        }
        
        console.log(`[ SRS ] Utils import data to db start: `, Date.now());
        // chunking line by line to read
        csv(headerRule).fromStream(fileStream).subscribe((oneData) => {
            saveData(oneData);
        }, async (error) => {
            console.log(`[ SRS ] [ERROR] Utils import data have ${error}: `, Date.now());
        }, async () => {
            await finishSaveData();
        });
        
        // handle and save data to db
        function saveData(oneData) {
            //only save selected data
            let select = {};
            for (const item of selectedColumn) {
                select[item] = oneData[item];
            }
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
                if (selectedData) {
                    let sechema = {
                        projectName: req.body.pname,
                        userInputsLength: 0,
                        originalData: select
                    };
                    //support ner regression
                    if ((req.body.regression == 'true' || req.body.regression == true)&& req.body.projectType == PROJECTTYPE.NER) {
                        let selectLabels = req.body.selectLabels;
                        selectLabels = (typeof selectLabels === 'string'? JSON.parse(selectLabels):selectLabels);
                        let problemCategory = [];
                        for (const lb of selectLabels) {
                            for (const dataLb of oneData[lb]) {
                                problemCategory.push({
                                    text : Object.keys(dataLb)[0],
                                    start: Object.values(dataLb)[0][0],
                                    end: Object.values(dataLb)[0][1],
                                    label: lb
                                });
                            }
                        }
                        sechema.userInputs=[ { problemCategory: problemCategory } ];
                    }
                    docs.push(sechema);
                    totalCase += 1;
                }
            }
            //batch write data to db 
            if(docs.length && docs.length % PAGINATELIMIT == 0){
                const options = { lean: true, ordered: false }; 
                srsDB.insertManySrsData(docs, options);
                docs = [];
            }
        }
        
        //handle data finish
        async function finishSaveData() {
            try {
                console.log(`[ SRS ] Utils import last sr data to db`);
                const options = { lean: true, ordered: false }; 
                srsDB.insertManySrsData(docs, options);
                docs = [];

                console.log(`[ SRS ] Utils import data to db end: `);
                const condition = { projectName: req.body.pname };
                const update = {
                    $set: {
                        totalCase: totalCase
                    }
                };
                console.log(`[ SRS ] Utils update totalCase:`, totalCase);
                await projectDB.findUpdateProject(condition, update);

                console.log(`[ SRS ] Utils srsImporter.execute end: within:[ ${(Date.now() - start) / 1000}s ] `);

                console.log(`[ SRS ] Utils sendEmailToAnnotator`);
                const param = {
                    body: {
                        annotator: annotators,
                        pname: req.body.pname
                    },
                    auth:{ email: user }
                }
                await emailService.sendEmailToAnnotator(param);
                
                //trigger tabular one-hot-encoding project generate the vector model
                if (req.body.encoder == ENCODE.ONEHOT) {
                    console.log(`[ SRS ] Utils trigger active learning vector sr data`);
                    const opts = {
                        headers: { 'Content-Type': 'application/json', Authorization: req.headers.authorization.split("Bearer ")[1] }
                    }
                    axios.post(`${config.loopALApiUrl}/al/sr/vector`, condition, opts);
                }
                
            } catch (error) {
                console.log(`[ SRS ] [ERROR] Utils importe srs done, but fail on update tatalcase or send email ${error}: `, Date.now());
            }
        }


    }
}
