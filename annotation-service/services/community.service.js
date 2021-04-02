/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const { DOWNLOADSRC } = require('../config/constant');
const projectDB = require('../db/project-db');
const ObjectId = require("mongodb").ObjectID;


async function countCommunityDownload(req){
  
  const src = req.body.src? req.body.src: req.query.src;
  
  if(src == DOWNLOADSRC.COMMUNITY){
    
    const pid = req.body.pid? req.body.pid: req.query.pid;
    
    console.log(`[ COMMUNITY ] service countCommunityDownload proId: ${pid} user: ${req.auth.email}`);
    
    const conditions = { _id: ObjectId(pid) };
    const update = { $inc: {"downloadCount.community": 1 } };
    await projectDB.findUpdateProject(conditions, update);
  
  }

}

module.exports = {
  countCommunityDownload,
}