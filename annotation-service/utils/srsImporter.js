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
const { PAGINATELIMIT, PROJECTTYPE, ENCODE, AWSDOMAIN, CLOUDFRONT_ACCESS_TIME } = require("../config/constant");
const projectDB = require('../db/project-db');
const cloudFront = require('./cloudFront');
const emailService = require('../services/email-service');
const axios = require("axios");

module.exports = {
    execute: async function (req, annotators) {

        if (req.body.projectType == PROJECTTYPE.IMGAGE) {
            return;
        }

        console.log(`[ SRS ] Utils srsImporter.execute start: `, Date.now());
        
        let header = req.body.header;
        header = (typeof header === 'string'? JSON.parse(header):header);
        let selectedColumn = req.body.selectDescription;
        selectedColumn = (typeof selectedColumn === 'string'? JSON.parse(selectedColumn):selectedColumn);

        const data = {
            projectName: req.body.pname,
            header: header,
            isHasHeader: req.body.isHasHeader,
            selectedColumn: selectedColumn,
            projectType: req.body.projectType,
            encoder: req.body.encoder
        };
        let totalCase = 0;
        let docs = [];
        let headerRule = {
            noheader: false,
            fork: true,
            flatKeys: true,
            headers: data.header,
            checkType:true
        };
        if (data.isHasHeader == 'no') {
            headerRule.noheader = true;
        };
        if (data.projectType == PROJECTTYPE.TEXT) {
            headerRule.checkType = false;
        }
        
        console.log(`[ SRS ] Utils cloudFront.cloudfrontSignedUrl`);
        const accessUrl = config.cloudFrontUrl + req.body.location.split(AWSDOMAIN)[1];
        const signedUrl = await cloudFront.cloudfrontSignedUrl(accessUrl, Date.now() + CLOUDFRONT_ACCESS_TIME);
        
        console.log(`[ SRS ] Utils import data to db start: `, Date.now());
        // chunking line by line to read
        csv(headerRule).fromStream(request.get(signedUrl)).subscribe((oneData) => {
            //only save selected data
            const select = {};
            data.selectedColumn.forEach( item =>{
                select[item] = oneData[item];
            });
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
                        projectName: data.projectName,
                        userInputsLength: 0,
                        originalData: select
                    };
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

        }, async (error) => {
            console.log(`[ SRS ] [ERROR] Utils import data have ${error}: `, Date.now());
        }, async () => {
            try {
                console.log(`[ SRS ] Utils import last sr data to db: `);
                const options = { lean: true, ordered: false }; 
                srsDB.insertManySrsData(docs, options);
                docs = [];

                console.log(`[ SRS ] Utils import data to db end: `, Date.now());
                const condition = { projectName: data.projectName };
                const update = {
                    $set: {
                        totalCase: totalCase
                    }
                };
                console.log(`[ SRS ] Utils update totalCase:`, totalCase);
                await projectDB.findUpdateProject(condition, update);
                
                console.log(`[ SRS ] Utils sendEmailToAnnotator`);
                const param = {
                    body: {
                        annotator: annotators,
                        pname: data.projectName
                    },
                    auth:{ email: req.auth.email }
                }
                await emailService.sendEmailToAnnotator(param);
                
                //trigger tabular one-hot-encoding project generate the vector model
                if (data.encoder == ENCODE.ONEHOT) {
                    console.log(`[ SRS ] Utils trigger active learning vector sr data`);
                    const opts = {
                        headers: { 'Content-Type': 'application/json', Authorization: req.headers.authorization.split("Bearer ")[1] }
                    }
                    axios.post(`${config.loopALApiUrl}/al/sr/vector`, condition, opts);
                }
                
                console.log(`[ SRS ] Utils srsImporter.execute end: `, Date.now());

            } catch (error) {
                console.log(`[ SRS ] [ERROR] Utils importe srs done, but fail on update tatalcase or send email ${error}: `, Date.now());
            }
            
        });

    }
}