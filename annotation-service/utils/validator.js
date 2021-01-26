
/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const projectDB = require('../db/project-db');
const userDB = require('../db/user-db');
const {ROLES} = require('../config/constant');
const dataSetDB = require('../db/dataSet-db');

function isASCII(str) {
    return /^[\x00-\xFF\u2013-\u2122]*$/.test(str);
}

function isNumeric(input){
    return /^-?[0-9]+.?[0-9]*/.test(input);
}

async function checkProjectByconditions(conditions, checkExsit){
    const pro = await projectDB.queryProjectByConditions(conditions);
    if (checkExsit) {
        if (!pro[0]) {
            throw {CODE: 4001, MSG: "NO PROJECT FOUND"};
        }
    }else{
        if (pro[0]) {
            throw {CODE: 4002, MSG: "PROJECT EXIST"};
        }
    }
    return pro;
    
}

async function checkAppendTicketsHeaders(appendHeaders, originalHeaders){
    
    const errRes = {CODE: 4005, MSG: "ERROR INPUT TICKET'S HEADERS"};
    if (appendHeaders.length != originalHeaders.length) {
        throw errRes;
    }
    appendHeaders.forEach(header =>{
        if (!originalHeaders.includes(header)) {
            throw errRes;
        }
    });
}

async function checkUserRole(uid, checkRole){

   const user = await userDB.queryUserById(uid);
   if (checkRole != user.role) {
       throw {CODE: 4001, MSG: "ACCESS DENIED"}
   }
}

async function checkAnnotator(uid){

    const user = await userDB.queryUserById(uid);
    if (ROLES.ANNOTATOR == user.role) {
        throw {CODE: 4001, MSG: "ACCESS DENIED"}
    }
}

 async function checkDataSet(conditions, checkExsit){
     const ds = await dataSetDB.queryDataSetByConditions(conditions);
     if (checkExsit) {
        if (!ds[0]) {
            throw {CODE: 4001, MSG: "NO DATASET FOUND"};
        }
    }else{
        if (ds[0]) {
            throw {CODE: 4002, MSG: "DATASET EXIST"};
        }
    }
    return ds;
 }

module.exports = {
    isASCII,
    isNumeric,
    checkProjectByconditions,
    checkAppendTicketsHeaders,
    checkUserRole,
    checkAnnotator,
    checkDataSet,
};