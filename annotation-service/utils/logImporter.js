/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const { PAGINATETEXTLIMIT, PROJECTTYPE, S3OPERATIONS, FILETYPE, APPENDSR } = require("../config/constant");
const { LogModel, ProjectModel } = require("../db/db-connect");
const emailService = require('../services/email-service');
const mongoDb = require('../db/mongo.db');
const validator = require("./validator");
const S3Utils = require('./s3');
const compressing = require('compressing');
const streamifier = require('streamifier');
const readline = require('readline');
const _ = require('lodash');
const axios = require('axios');

async function execute(req, sendEmail, annotators, append) {
      
  if (req.body.projectType != PROJECTTYPE.LOG) {
    return;
  }
  const start = Date.now();
  console.log(`[ LOG ] Utils logImporter.execute start: `, start);
  
  const options = { lean: true, ordered: false };
  let docs = [], totalCase = 0;

  const urlsplit = req.body.location.split(".");
  const fileType = _.toLower(urlsplit[urlsplit.length-1]);
  if (fileType  == FILETYPE.ZIP) {
    uncompressStream = new compressing.zip.UncompressStream();
  }else if (fileType == FILETYPE.TGZ || fileType == FILETYPE.GZ) {
    uncompressStream = new compressing.tgz.UncompressStream();
  }

  console.log(`[ LOG ] Utils S3Utils.signedUrlByS3`);
  const signedUrl = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, req.body.location);

  axios.request(signedUrl, {responseType: "arraybuffer"}).then(result => {
    streamifier.createReadStream(result.data).pipe(uncompressStream)
    .on('entry', async (header, stream, next) => {
      stream.on('end', next);

      
      // header.type is 'Directory' or 'file'
      //__MACOSX or linux back file start with ._
      const name = header.name.split("/");
      if (header.type === 'file' && (header.size || header.yauzl.uncompressedSize) && !name[name.length-1].startsWith("._")) {

        let index = 0, textLines = {};
        const readInterface = readline.createInterface({ input: stream });
        
        readInterface.on('line', async (line) => {
          index += 1;
          
          if (line && line.trim() && validator.isASCII(line)) {
            textLines[index] = line.trim();
          }
        }).on('close', async () => {
          if (Object.keys(textLines).length) {

            const sechema = {
              projectName: req.body.pname,
              userInputsLength: 0,
              originalData: textLines,
              fileInfo:{
                fileSize: header.size? header.size: header.yauzl.uncompressedSize,
                fileName: header.name
              }
            };
            
            docs.push(sechema);
            totalCase += 1;
          }
        });
      }
      
      if(docs.length && docs.length % PAGINATETEXTLIMIT == 0){ 
        await mongoDb.insertMany(LogModel, docs, options);
        docs = [];
      }

      stream.resume();
    
    }).on('finish', async ()=>{
      
      console.log(`[ LOG ] Utils save log data to db`);
      if(docs.length){ 
        await mongoDb.insertMany(LogModel, docs, options);
        docs = [];
      }

      const condition = { projectName: req.body.pname };
      const update = { $inc: { totalCase: totalCase } };
      console.log(`[ SRS ] Utils update totalCase:`, totalCase);

      if (append) {
        update.$set={ appendSr: APPENDSR.DONE };
      }

      await mongoDb.findOneAndUpdate(ProjectModel, condition, update);

      if (sendEmail) {
        console.log(`[ LOG ] Utils import log sendEmailToAnnotator`);
        const param = {
          body: {
            annotator: annotators,
            pname: req.body.pname
          },
          auth:{ email: req.auth.email }
        }
        await emailService.sendEmailToAnnotator(param);
      }
      
      console.log(`[ LOG ] Utils imgImporter.execute end using ${ (Date.now()-start)/1000 } s: `); 
    
    });
  }).catch(err => {
    console.error("[ LOG ] [ ERROR ] Utils axios.request error ->", err);
  });
  
}


async function quickAppendLogs(req){

  let totalCase = 0; docs=[];
  
  for (const file of req.files) {
    
    let index = 0, textLines = {};
    for (const line of file.buffer.toString().split("\n")) {
      if (line && line.trim() && validator.isASCII(line)) {
        textLines[++index] = line.trim();
      }
    }

    if (Object.keys(textLines).length) {
      const sechema = {
        projectName: req.body.pname,
        userInputsLength: 0,
        originalData: textLines,
        fileInfo:{
          fileSize: file.size,
          fileName: file.originalname
        }
      };  
      docs.push(sechema);
      totalCase += 1;
    }

  }

  if(docs.length){

    console.log(`[ LOG ] Utils quick append logs data to db`);
    const options = { lean: true, ordered: false };
    await mongoDb.insertMany(LogModel, docs, options);

    const condition = { projectName: req.body.pname };
    const update = { $inc: { totalCase: totalCase }, $set:{ appendSr: APPENDSR.DONE } };
    console.log(`[ SRS ] Utils quick append update totalCase:`, totalCase);
    await mongoDb.findOneAndUpdate(ProjectModel, condition, update);
  
  }

}


module.exports = {
    execute,
    quickAppendLogs,
}