/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const { DOWNLOADSRC } = require('../config/constant');
const ObjectId = require("mongodb").ObjectID;
const mongoDb = require('../db/mongo.db');
const { ProjectModel } = require('../db/db-connect');

async function countCommunityDownload(req){
  
  const src = req.body.src? req.body.src: req.query.src;
  
  if(src == DOWNLOADSRC.COMMUNITY){
    
    const pid = req.body.pid? req.body.pid: req.query.pid;
    
    console.log(`[ COMMUNITY ] service countCommunityDownload proId: ${pid} user: ${req.auth.email}`);
    
    const conditions = { _id: ObjectId(pid) };
    const update = { $inc: {"downloadCount.community": 1 } };
    await mongoDb.findOneAndUpdate(ProjectModel, conditions, update);
  
  }

}

module.exports = {
  countCommunityDownload,
}