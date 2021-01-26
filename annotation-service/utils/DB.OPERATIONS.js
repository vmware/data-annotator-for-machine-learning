/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const { ProjectModel, UserModel, DataSetModel, ImgModel, SrModel } = require("../db/db-connect");
const mongoDb = require("../db/mongo.db");


async function updateDBColumnType(req) {
  const MODEL = await getProjectModel(req.body.collection);
  const column = req.body.column;
  const datas = await mongoDb.findByConditions(MODEL, {}, "_id " + column);
  console.log(`[ DB.OPERATIONS ] Utils total case ${datas.length}`);
  let updateIndex = 0, start = Date.now();
  for (const data of datas) {
    let update = null;
    if (req.body.str2array) {
      update = {
        $set: {
          [column]: data[column]
        }
      }
    }
    updateIndex += 1;
    await mongoDb.findOneAndUpdate(MODEL, {_id: data._id}, update);
  }
  console.log(`[ DB.OPERATIONS ] Utils update total case ${updateIndex} time: ${ (Date.now() - start)/1000 }`);
  return {TCASE: datas.length, UPCASE: updateIndex};

}

async function  getProjectModel(collection) {
  switch (collection) {
    case "projects":
      return ProjectModel;
    case "srs":
      return SrModel;
    case "images":
        return ImgModel;
    case "users":
      return UserModel;
    case "datasets":
      return DataSetModel;
    default:
      return;
  }
}

module.exports = {
  updateDBColumnType,
  getProjectModel,
}