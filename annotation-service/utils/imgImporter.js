/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const { PAGINATELIMIT, PROJECTTYPE, FILEPATH, OPERATION } = require("../config/constant");
const { ImgModel, DataSetModel } = require("../db/db-connect");
const emailService = require('../services/email-service');
const mongoDb = require('../db/mongo.db');
const validator = require("./validator");
const { ObjectId } = require("mongodb");
const config = require("../config/config");
const localFileSysService = require('../services/localFileSys.service');
const {updateDatasetProjectInfo} = require('../services/dataSet-service');

async function execute(req, sendEmail, annotators) {

  if (req.body.projectType != PROJECTTYPE.IMGAGE) {
    return;
  }

  console.log(`[ IMAGE ] Utils imgImporter.execute start: `, Date.now());
  const options = { lean: true, ordered: false };
  let docs = [];

  const conditions = { dataSetName: req.body.selectedDataset }
  const ds = await validator.checkDataSet(conditions, true);

  console.log(`[ IMAGE ] Utils save image data to db`);
  for (const imgage of ds[0].images) {

    let sechema = {
      projectName: req.body.pname,
      userInputsLength: 0,
      originalData: imgage
    }
    docs.push(sechema)

    if (docs.length && docs.length % PAGINATELIMIT == 0) {
      await mongoDb.insertMany(ImgModel, docs, options);
      docs = [];
    }
  }

  await mongoDb.insertMany(ImgModel, docs, options);

  if (sendEmail && annotators.length > 0) {
    console.log(`[ IMAGE ] Utils import image sendEmailToAnnotator`);
    const param = {
      body: {
        annotator: annotators,
        pname: req.body.pname
      },
      auth: { email: req.auth.email }
    }
    emailService.sendEmailToAnnotator(param).catch(err => console.error(`[ IMAGE ][ ERROR ] send email:`, err));
  }
  await updateDatasetProjectInfo(req.body.selectedDataset, req.body.pname, OPERATION.ADD)
  console.log(`[ IMAGE ] Utils imgImporter.execute end: `, Date.now());

}


async function quickAppendImages(req, dsName) {
  console.log(`[ IMAGE ] Utils imgImporter.quickAppendImages`);
  const startTime = Date.now();
  const user = req.auth.email;

  //save to tickets db
  let docs = [];
  for (const imgage of req.body.images) {
    //support local file system
    if (config.useLocalFileSys) {
      for (const file of req.files) {
        if (file.originalname == imgage.fileName) {
          const filePath = `./${FILEPATH.UPLOAD}/${user}/${FILEPATH.UNZIPIMAGE}/${startTime}/`;
          imgage.location = filePath + imgage.fileName;
          imgage.fileSize = file.size;

          await localFileSysService.checkFileExistInLocalSys(filePath, true);
          await localFileSysService.saveFileToLocalSys(imgage.location, file.buffer);
        }
      }
    }

    let data = Object.assign({ _id: ObjectId() }, imgage);
    let sechema = {
      projectName: req.body.pname,
      userInputsLength: 0,
      originalData: data
    }
    docs.push(sechema)
  }
  await mongoDb.insertMany(ImgModel, docs);

  //save to dataset db
  const condtions = { dataSetName: dsName }
  const dataset = await mongoDb.findOneByConditions(DataSetModel, condtions);
  if (dataset) {
    const update = { $push: { images: { $each: req.body.images } } };
    await mongoDb.findOneAndUpdate(DataSetModel, condtions, update);
  }

}


module.exports = {
  execute,
  quickAppendImages,
}