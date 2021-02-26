/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const projectDB = require('../db/project-db');
const ObjectId = require("mongodb").ObjectID;
const axios = require("axios");
const config = require("../config/config");
const { LABELTYPE, PROJECTTYPE } = require("../config/constant");
const _ = require("lodash");


async function triggerActiveLearning(pid, _ids, user, token){
  // pull current srid from queriedSr
  const update = {$pullAll:{ "al.queriedSr": _ids }};
  const project = await projectDB.findUpdateProject({_id: pid}, update, { new: true, multi: true });
 
  // regression project or acteave learning faild
  if (project.projectType == PROJECTTYPE.IMGAGE || project.labelType == LABELTYPE.NUMERIC || project.al.alFailed) return;
  
  const options = {headers: { 'Content-Type': 'application/json', Authorization: token }};

  // trigger active learing start to train a al model only trigger once
  if (!project.al.trained && _.uniq(project.al.newLBSr).length >= project.al.trigger && !project.al.training) {
    
    console.log(`[ ACTIVE-LEARNING ] TRAIN MODEL`);
    axios.post(`${config.loopALApiUrl}/al/model/train`, {"projectName": project.projectName, user: user}, options);
    
    //set a training flag to avoid repeate send rquest
    await projectDB.findUpdateProject({_id: pid}, {$set: {"al.training": true}});
  }
 
  if(project.al.trained){
    
    // trigger active learning to teach al model
    if(_.uniq(project.al.newLBSr).length >= project.al.frequency && !project.al.teaching) {
      
      console.log(`[ ACTIVE-LEARNING ] TEACH MODEL`);
      axios.post(`${config.loopALApiUrl}/al/model/teach`, {"projectName": project.projectName, user: user}, options);
      
      //set a teaching flag to avoid repeate send rquest
      await projectDB.findUpdateProject({_id: pid}, {$set: {"al.teaching": true}});
    }
    
    // trigger active learning to query uncertain instance, set less than 3 will remove the al query gaps
    if (project.al.queriedSr.length <= 3 && !project.al.querying) {
      
      console.log(`[ ACTIVE-LEARNING ] QUERY-INSTANCE`);
      axios.post(`${config.loopALApiUrl}/al/model/query`, {"projectName": project.projectName, user: user}, options);
      
      //set a querying flag to avoid repeate send rquest
      await projectDB.findUpdateProject({_id: pid}, {$set: {"al.querying": true}});
    }
  
  }
}

// find active learning accuracy
async function findModelAccuracy(req){
  console.log(`[ ACTIVE-LEARNING ] findModelAccuracy projectId: ${req.query.pid}`)
  const project = await projectDB.queryProjectById(ObjectId(req.query.pid));
  return { status: project.al.trained, accuracy: project.al.accuracy};
}

module.exports = {
  triggerActiveLearning,
  findModelAccuracy,
}