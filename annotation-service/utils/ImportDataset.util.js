/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const csv = require('csvtojson');
const request = require('request');
const { PAGINATELIMIT, PROJECTTYPE, S3OPERATIONS } = require("../config/constant");
const emailService = require('../services/email-service');
const fileService = require('../services/file-service');
const S3Utils = require('./s3');
const mongoDb = require('../db/mongo.db');
const { ProjectModel, SrModel } = require('../db/db-connect');
const MESSAGE = require('../config/code_msg');

async function importDataset(req) {
  console.log('[ IMPORT-DATASET ] Utils Start Import dataset ');
  const lables = req.body.labels;
  const selectedColumn = req.body.selectDescription;
  await importLabelledDataset(req, lables, selectedColumn)

  console.log(`[ IMPORT-DATASET ] Utils fileService.saveProjectInfo`);

  if (req.body.projectType == PROJECTTYPE.TEXT && req.body.isMultipleLabel == "false") {
    req.body.labels = Object.values(req.body.lableMap).toString();
  }

  await fileService.saveProjectInfo(req, [], req.body.annotator);

  return MESSAGE.SUCCESS;
}


async function importLabelledDataset(req, lables, selectedColumn) {
  const startTime = Date.now();
  console.log(`[ IMPORT-DATASET ] Utils start import labelled data into loop DB ${startTime}`)
  let docs = []; totalCase = 0;
  let headerRule = {
    fork: true,
    flatKeys: true,
    noheader: req.body.noHeader,
    checkType: true
  };

  console.log(`[ IMPORT-DATASET ] Utils S3Utils.signedUrlByS3`)
  const signedUrl = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, req.body.location);

  const options = { lean: true, ordered: false };
  // chunking line by line to read
  csv(headerRule).fromStream(request.get(signedUrl)).subscribe((oneData) => {
    //only save selected data
    let select = {}, userInputs = [];

    if (req.body.projectType == PROJECTTYPE.TEXT) {
      headerRule.checkType = false;

      if (req.body.isMultipleLabel == "false") {
        const labelValue = oneData[lables[0]]
        if (labelValue != null && labelValue.toString().trim() != "") {
          const input = {
            problemCategory: req.body.lableMap[labelValue],
            user: req.body.user,
            timestamp: Date.now()
          }
          userInputs.push(input);
          selectedColumn.forEach(item => {
            select[item] = oneData[item];
          });

        }
      } else {
        for (const lable of lables) {
          let num = oneData[lable]
          for (let i = 0; i < num; i++) {
            let input = {
              problemCategory: lable,
              user: req.body.user,
              timestamp: Date.now()
            }
            userInputs.push(input);
          }
        }
        if (userInputs.length != 0) {
          selectedColumn.forEach(item => {
            select[item] = oneData[item];
          });
        }
      }
    }

    //check all selected data if is empty
    let selectedData = Object.values(select).toString().replace(new RegExp(',', 'g'), '').trim();
    if (selectedData) {
      let sechema = {
        projectName: req.body.pname,
        userInputsLength: req.body.maxAnnotations,
        originalData: select,
        userInputs: userInputs
      };
      docs.push(sechema);
      totalCase += 1;
    }
    //batch write data to db 
    if (docs.length && docs.length % PAGINATELIMIT == 0) {
      console.log(`import tickets lenth ${docs.length}`);
      mongoDb.insertMany(SrModel, docs, options);
      docs = [];
    }

  }, async (error) => {
    console.log(`[ IMPORT-DATASET ] [ERROR] Utils import data have ${error}: `, Date.now() - startTime);
  }, async () => {
    try {
      console.log(`[ IMPORT-DATASET ] Utils import last sr data to db: ${docs.length}`);
      await mongoDb.insertMany(SrModel, docs, options);

      console.log(`[ IMPORT-DATASET ] Utils update totalcase and compelte: ${totalCase}`);
      const condition = { projectName: req.body.pname };
      const update = {
        $set: {
          totalCase: totalCase,
          projectCompleteCase: totalCase,
          userCompleteCase: [{
            user: req.body.user,
            completeCase: totalCase
          }]
        }
      };
      await mongoDb.findOneAndUpdate(ProjectModel, condition, update);
      if (req.body.annotator.length > 0) {
        console.log(`[ IMPORT-DATASET ] Utils sendEmailToAnnotator`);
        let param = {
          body: {
            annotator: req.body.annotator,
            projectName: req.body.pname
          }
        }
        await emailService.sendEmailToAnnotator(param);
      }
      console.log(`[ IMPORT-DATASET ] Utils import-dataset end: `, Date.now() - startTime);

    } catch (error) {
      console.log(`[ IMPORT-DATASET ] [ERROR] Utils import-dataset done, but fail to send email ${error}: `, Date.now() - startTime);
    }

  });
}





module.exports = {
  importLabelledDataset,
  importDataset,
}