/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const ObjectId = require("mongodb").ObjectID;
const config = require("../config/config");
const { LABELTYPE, PROJECTTYPE } = require("../config/constant");
const _ = require("lodash");
const axios = require('axios');
const mongoDb = require('../db/mongo.db');
const { ProjectModel } = require('../db/db-connect');


async function triggerActiveLearning(pid, _ids, user, token) {
  // pull current srid from queriedSr
  const update = { $pullAll: { "al.queriedSr": _ids } };
  const project = await mongoDb.findOneAndUpdate(ProjectModel, { _id: pid }, update, { new: true, multi: true });

  // regression project or acteave learning faild
  if (project.projectType == PROJECTTYPE.IMGAGE || project.labelType == LABELTYPE.NUMERIC || project.al.alFailed) return;

  // set axios default config
  axios.defaults.baseURL = config.loopALApiUrl;
  axios.defaults.proxy = false;
  axios.defaults.headers.common['Authorization'] = token;
  axios.defaults.headers.post['Content-Type'] = 'application/json';

  const data = { projectName: project.projectName, user: user };

  // trigger active learing start to train a al model only trigger once
  if (!project.al.trained && _.uniq(project.al.newLBSr).length >= project.al.trigger && !project.al.training) {
    console.log(`[ ACTIVE-LEARNING ] TRAIN-MODEL START`);
    const url = "/al/model/train";

    //set a training flag to avoid repeate send rquest
    await mongoDb.findOneAndUpdate(ProjectModel, { _id: pid }, { $set: { "al.training": true } });

    axios.post(url, data).then(res => {
      console.log(`[ ACTIVE-LEARNING ] [ SUCCESS ] TRAIN-MODEL`);
    }).catch(async err => {
      console.error("[ ACTIVE-LEARNING ] [ ERROR ] TRAIN-MODEL:", err);
      // support retry
      await mongoDb.findOneAndUpdate(ProjectModel, { _id: pid }, { $set: { "al.training": false } });
    });

  }

  if (project.al.trained) {

    // trigger active learning to teach al model
    if (_.uniq(project.al.newLBSr).length >= project.al.frequency && !project.al.teaching) {

      console.log(`[ ACTIVE-LEARNING ] TEACH-MODEL`);
      const url = "/al/model/teach";

      //set a teaching flag to avoid repeate send rquest
      await mongoDb.findOneAndUpdate(ProjectModel, { _id: pid }, { $set: { "al.teaching": true } });

      axios.post(url, data).then(res => {
        console.log(`[ ACTIVE-LEARNING ] [ SUCCESS ] TEACH-MODEL`);
      }).catch(async err => {
        console.error("[ ACTIVE-LEARNING ] [ ERROR ] TEACH-MODEL:", err);
        // support retry
        await mongoDb.findOneAndUpdate(ProjectModel, { _id: pid }, { $set: { "al.teaching": false } });
      });

    }

    // trigger active learning to query uncertain instance, set less than 3 will remove the al query gaps
    if (project.al.queriedSr.length <= 3 && !project.al.querying) {

      console.log(`[ ACTIVE-LEARNING ] QUERY-INSTANCE`);
      const url = "/al/model/query";

      //set a querying flag to avoid repeate send rquest
      await mongoDb.findOneAndUpdate(ProjectModel, { _id: pid }, { $set: { "al.querying": true } });

      axios.post(url, data).then(res => {
        console.log(`[ ACTIVE-LEARNING ] [ SUCCESS ] QUERY-INSTANCE`);
      }).catch(async err => {
        console.error("[ ACTIVE-LEARNING ] [ ERROR ] QUERY-INSTANCE:", err);
        // support retry
        await mongoDb.findOneAndUpdate(ProjectModel, { _id: pid }, { $set: { "al.querying": false } });
      });

    }
  }
}

// find active learning accuracy
async function findModelAccuracy(req) {
  console.log(`[ ACTIVE-LEARNING ] findModelAccuracy projectId: ${req.query.pid}`)
  const project = await mongoDb.findById(ProjectModel, ObjectId(req.query.pid));
  return { status: project.al.trained, accuracy: project.al.accuracy };
}

module.exports = {
  triggerActiveLearning,
  findModelAccuracy,
}