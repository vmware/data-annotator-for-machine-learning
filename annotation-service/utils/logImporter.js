/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const { PAGINATETEXTLIMIT, PROJECTTYPE, FILETYPE, APPENDSR, DATASETTYPE, OPERATION } = require("../config/constant");
const { LogModel, ProjectModel } = require("../db/db-connect");
const emailService = require('../services/email-service');
const mongoDb = require('../db/mongo.db');
const validator = require("./validator");
const compressing = require('compressing');
const readline = require('readline');
const unzip = require('unzip-stream');
const fileSystemUtils = require('./fileSystem.utils');
const projectService = require('../services/project.service');
const {updateDatasetProjectInfo} = require('../services/dataSet-service');

async function execute(req, sendEmail, annotators, append) {

  if (req.body.projectType != PROJECTTYPE.LOG) {
    return;
  }
  const start = Date.now();
  console.log(`[ LOG ] Utils logImporter.execute start: `, start);

  let docs = [], totalCase = 0;
  const user = req.auth.email;
  const projectName = req.body.pname;
  const urlsplit = req.body.location.split(".");
  const fileType = urlsplit[urlsplit.length - 1].toLowerCase();
  const preLabels = req.body.preLabels;

  let fileStream = await fileSystemUtils.handleFileStream(req.body.location);

  if (fileType == FILETYPE.ZIP) {
    unzipstream = unzip.Parse();
    fileStream.pipe(unzipstream).on('entry', (entry) => {

      lineBylineToRead(entry.type, entry.size, entry.path, entry, projectName);
      entry.autodrain();

    }).on('finish', () => {
      setTimeout(() => {
        finishInsertLogsData(projectName, sendEmail, user, append, req.body.selectedDataset, annotators);
        console.log(`[ LOG ] Utils logImporter.execute zip file end using ${(Date.now() - start) / 1000} s: `);
      }, 1000 * 5);
    })
  } else if (fileType == FILETYPE.TGZ) {
    fileStream.pipe(new compressing.tgz.UncompressStream()).on('entry', (header, stream, next) => {
      stream.on('end', next);
      lineBylineToRead(header.type, header.size, header.name, stream, projectName);
      stream.resume();
    }).on('finish', () => {
      finishInsertLogsData(projectName, sendEmail, user, append, req.body.selectedDataset, annotators);
      console.log(`[ LOG ] Utils logImporter.execute tgz file end using ${(Date.now() - start) / 1000} s: `);
    })
  }

  function lineBylineToRead(type, size, filePath, stream, projectName) {

    const path1 = filePath.toLowerCase().split("/");
    const fileName = path1[path1.length - 1];
    const path2 = filePath.toLowerCase().split(".");
    const fileType = path2[path2.length - 1];

    if (type.toLowerCase() == 'file' && !fileName.startsWith("._") && fileType == DATASETTYPE.LOG) {

      let index = 0, textLines = {};
      const readInterface = readline.createInterface({ input: stream });

      readInterface.on('line', (line) => {
        index += 1;

        if (line && line.trim()) {
          textLines[index] = line.trim();
        }
      }).on('close', () => {
        if (Object.keys(textLines).length) {
          const sechema = {
            projectName: projectName,
            userInputsLength: 0,
            originalData: textLines,
            fileInfo: {
              fileSize: size,
              fileName: filePath
            }
          };
          //save pre-labels to userInputs
          if (preLabels && preLabels[filePath]) {
            const lebelsList = preLabels[filePath];
            let problemCategory = [];
            for (const line in lebelsList) {
              problemCategory.push({
                line: line,
                label: lebelsList[line]
              })
            }
            sechema.userInputs = [{ problemCategory: problemCategory }];
          }

          docs.push(sechema);
          totalCase += 1;
        }
      });
    }

    if (docs.length && docs.length % PAGINATETEXTLIMIT == 0) {
      console.log(`[ LOG ] lineBylineToRead Utils save log data to db ${docs.length}`);
      const options = { lean: true, ordered: false };
      mongoDb.insertMany(LogModel, docs, options);
      docs = [];
    }
  }

  async function finishInsertLogsData(projectName, sendEmail, email, append, selectedDataset, annotators) {

    if (docs.length) {
      console.log(`[ LOG ] finishInsertLogsData Utils save log data to db ${docs.length}`);
      const options = { lean: true, ordered: false };
      await mongoDb.insertMany(LogModel, docs, options);
      docs = [];
    }

    const condition = { projectName: projectName };
    const update = { $inc: { totalCase: totalCase }, updatedDate: Date.now() };
    console.log(`[ LOG ] Utils update totalCase:`, totalCase);

    if (append) {

      update.$set = { appendSr: APPENDSR.DONE };
      update.$addToSet = { selectedDataset: selectedDataset };

      await projectService.updateAssinedCase(condition, totalCase, true);
    }
    
    await updateDatasetProjectInfo(selectedDataset, projectName, OPERATION.ADD);
    
    await mongoDb.findOneAndUpdate(ProjectModel, condition, update);

    if (sendEmail && annotators.length > 0) {
      console.log(`[ LOG ] Utils import log sendEmailToAnnotator`);
      const param = {
        body: {
          annotator: annotators,
          pname: projectName
        },
        auth: { email: email }
      }
      emailService.sendEmailToAnnotator(param).catch(err => console.error(`[ LOG ][ ERROR ] send email:`, err));
    }
  }
}


async function quickAppendLogs(req) {

  let totalCase = 0; docs = [];

  for (const file of req.files) {
    const names = file.originalname.toLowerCase().split(".");
    if (names[names.length - 1] != DATASETTYPE.LOG) continue;

    let index = 0, textLines = {};
    for (const line of file.buffer.toString().split("\n")) {
      if (line && line.trim()) {
        textLines[++index] = line.trim();
      }
    }

    if (Object.keys(textLines).length) {
      const sechema = {
        projectName: req.body.pname,
        userInputsLength: 0,
        originalData: textLines,
        fileInfo: {
          fileSize: file.size,
          fileName: `append_${Date.now()}_${file.originalname}`
        }
      };
      docs.push(sechema);
      totalCase += 1;
    }
  }

  if (docs.length) {
    console.log(`[ LOG ] Utils quick append logs data to db`);
    const options = { lean: true, ordered: false };
    await mongoDb.insertMany(LogModel, docs, options);

    const condition = { projectName: req.body.pname };
    const update = { $inc: { totalCase: totalCase }, $set: { appendSr: APPENDSR.DONE } };
    console.log(`[ SRS ] Utils quick append update totalCase:`, totalCase);
    await mongoDb.findOneAndUpdate(ProjectModel, condition, update);

    await projectService.updateAssinedCase(condition, totalCase, true);
  }
}





module.exports = {
  execute,
  quickAppendLogs,
}