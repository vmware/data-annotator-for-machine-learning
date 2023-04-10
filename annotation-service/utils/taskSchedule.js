/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const { MILLISECOND_DAY, REGULAR_NOTIFICATNO, CURRENT_TIME_ZONE, NOT_START_DAY, NOT_FINISH_DAY } = require("../config/constant");
const config = require("../config/config");
const { ProjectModel, UserModel, InstanceModel } = require("../db/db-connect");
const mongoDb = require("../db/mongo.db");
const emailService = require('../services/email-service');
const validator = require('./validator');
const MESSAGE = require('../config/code_msg')
var CronJob = require('cron').CronJob;


module.exports.regularNotification = async () => {

  if(!await validator.validateBool(config.regularNotificatnoEmail)){
    return;
  }

  if(!await emailService.isEnableEamil()){
    return;
  }

  var job = new CronJob(
      REGULAR_NOTIFICATNO, 
      async () => {
        if (await checkingRunningInstance()) {
            return;
        }
        findProjectAndSendRegularNotification();
      },
      null,
      true,
      CURRENT_TIME_ZONE
    );
  
}
async function checkingRunningInstance() {

  const NODE_INSTANCE = {data: new Date(Date.now()).toLocaleDateString("en-US", {timeZone: CURRENT_TIME_ZONE})};
  const instance = await mongoDb.findByConditions(InstanceModel, NODE_INSTANCE);
  console.log('[ REGULAR-NOTIFICATION ]', NODE_INSTANCE);
  if (instance.length) {
    return true;
  }

  try {
    await mongoDb.saveBySchema(InstanceModel, NODE_INSTANCE);
  } catch (error) {
    return true;
  }
  return false;
}


async function findProjectAndSendRegularNotification() {
  let options = { page: 1, limit: 10 };
  const today = Date.now();
  
  while(true){
    
    const project = await mongoDb.paginateQuery(ProjectModel, {}, options);
    
    for (const pro of project.docs) {
      
      const createTime = (today - pro.createdDate) / MILLISECOND_DAY;
      const done = pro.totalCase <= pro.projectCompleteCase;
      const overStart = createTime < NOT_START_DAY;
      //don't more than NOT_START_DAY
      if(overStart || done){
        continue;
      }
      await findUserSendNotification(pro, today);
    
    }
    
    if(project.hasNextPage){
      options.page = project.nextPage
    }else{
      break;
    }
  }
}

async function findUserSendNotification(pro, today){
  
  const projectOwner = pro.creator.toString().replace(/\,/g, "; ");

  for (const uc of pro.userCompleteCase) {
    
    const user = await mongoDb.findById(UserModel, uc.user, "regularNotification");
    const userAccepte = !user || user.regularNotification;
    //user don't accepte regular notification
    if(!userAccepte || !uc.regularNotification){
      continue;
    }
    
    //not start labeling
    uc.assignedDate = uc.assignedDate? uc.assignedDate: pro.createdDate;
    const assignedTime = (today - uc.assignedDate) / MILLISECOND_DAY;
    const overStartDay = assignedTime >= NOT_START_DAY;
    //send notification
    if(!uc.completeCase && overStartDay){
      const assignedDate = new Date(uc.assignedDate * 1).toLocaleDateString();
      // const overDays = Math.floor(assignedTime);
      emailService.sendNotStartLabelingNotificationEmail(uc.user, pro.projectName, projectOwner, assignedDate);
    }
    
    //not finish labeling
    uc.updateDate = uc.updateDate? uc.updateDate: uc.assignedDate;
    const updateTime = (today - uc.updateDate) / MILLISECOND_DAY;
    const overFinish = updateTime >= NOT_FINISH_DAY;
    const userNotFinish = uc.assignedCase > uc.completeCase;
    //send notification
    if(uc.completeCase && overFinish && userNotFinish){
      //send email
      const assignedDate = new Date(uc.assignedDate * 1).toLocaleDateString();
      // const lastUpdateDate = new Date(uc.updateDate * 1).toLocaleDateString();
      // const overDays = Math.floor(updateTime);
      emailService.sendNotFinishLabelingNotificationEmail(uc.user, pro.projectName, projectOwner, assignedDate);
    }
  
  }
}

module.exports.regularNotificationSubscription = async (req) => {
 
  const user = req.query.u;
  const projectName = req.query.p;
  const notification = req.query.n;
 
  if(!user){
    throw MESSAGE.VALIDATION_PERMITION;
  }
  
  if(projectName){
    //by projct leval
    const conditions = { 
      projectName: projectName, 
      "userCompleteCase.user": user 
    };
    await validator.checkProjectByconditions(conditions, true);
    
    const update = {
      $set: {
        "userCompleteCase.$.regularNotification": notification == '0'? false: true,
      }
    };
    await mongoDb.findOneAndUpdate(ProjectModel, conditions, update);
  
  }else{
    //by user leval
    const dbUser = await mongoDb.findById(UserModel, user);
    
    if(dbUser){
      
      const conditions = {_id: user};
      const update = {
        $set: {
          updateDate: Date.now(),
          regularNotification: notification == '0'? false: true,
        } 
      };
      await mongoDb.findOneAndUpdate(UserModel, conditions, update);
    
    }else{
      // user not login or register but assigned tickets
      let schema = {
        _id: user,
        email: user,
        fullName: user.split("@")[0],
        createdDate: Date.now(),
        updateDate: Date.now(),
        regularNotification: notification == '0'? false: true,
        manul: true,
      };
      const flag = config.adminDefault.indexOf(user);
      if (flag != -1) {
          schema.role = 'Admin';
      }
      return mongoDb.saveBySchema(UserModel, schema);

    }

  }
  
}
