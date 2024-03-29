/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const { PROJECTTYPE } = require("../config/constant");
const { ImgModel, SrModel, LogModel } = require("../db/db-connect");
const validator = require("./validator");


async function getModelProject(conditions) {
  const project = await validator.checkProjectByconditions(conditions, true);
  let model = SrModel;
  if (project[0].projectType == PROJECTTYPE.IMGAGE) {
    model = ImgModel;
  }else if (project[0].projectType == PROJECTTYPE.LOG) {
    model = LogModel;
  }
  return {model: model, project: project[0]};
}


module.exports = {
  getModelProject,
}