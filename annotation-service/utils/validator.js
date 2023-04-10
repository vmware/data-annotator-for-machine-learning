
/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const { ROLES, SPECAILCHARTOSTRING } = require('../config/constant');
const mongoDb = require('../db/mongo.db');
const { ProjectModel, DataSetModel, UserModel } = require('../db/db-connect');
const MESSAGE = require('../config/code_msg');

function isASCII(str) {
    return /^[\x00-\xFF\u2013-\u2122]*$/.test(str);
}

function isNumeric(input) {
    return /^-?[0-9]+.?[0-9]*/.test(input);
}

async function checkProjectByconditions(conditions, checkExsit) {
    const pro = await mongoDb.findByConditions(ProjectModel, conditions);
    if (checkExsit) {
        if (!pro[0]) {
            throw MESSAGE.VALIDATATION_PJ_EMPTY;
        }
    } else {
        if (pro[0]) {
            throw MESSAGE.VALIDATATION_PJ_EXIST;
        }
    }
    return pro;

}

async function checkAppendTicketsHeaders(appendHeaders, originalHeaders) {

    if (appendHeaders.length < originalHeaders.length) {
        throw MESSAGE.VALIDATION_TK_HEADEARS;
    }
    originalHeaders.forEach(header => {
        if (!appendHeaders.includes(header)) {
            throw MESSAGE.VALIDATION_TK_HEADEARS;
        }
    });
}

async function checkUser(uid, checkExsit) {

    const user = await mongoDb.findById(UserModel, uid);
    if (checkExsit && !user) {
        throw MESSAGE.VALIDATION_ACCESS;
    }
    return user;
}

async function checkUserRole(uid, checkRole) {

    const user = await mongoDb.findById(UserModel, uid);
    if (checkRole != user.role) {
        throw MESSAGE.VALIDATION_ACCESS;
    }
}

async function checkAnnotator(uid) {

    const user = await mongoDb.findById(UserModel, uid);
    if (ROLES.ANNOTATOR == user.role) {
        throw MESSAGE.VALIDATION_ACCESS;
    }
}

async function checkAdmin(uid) {

    const user = await mongoDb.findById(UserModel, uid);
    if (ROLES.ADMIN != user.role) {
        throw MESSAGE.VALIDATION_PERMITION;
    }
}

async function checkDataSet(conditions, checkExsit) {
    const ds = await mongoDb.findByConditions(DataSetModel, conditions);
    if (checkExsit) {
        if (!ds[0]) {
            throw MESSAGE.VALIDATION_DS_EMPTY;
        }
    } else {
        if (ds[0]) {
            throw MESSAGE.VALIDATION_DS_EXIST;
        }
    }
    return ds;
}


async function checkRequired(parameters) {

    const paramType = typeof parameters;
    if (!parameters) {
        return false;
    }
    if (paramType == SPECAILCHARTOSTRING.BOOLEAN || paramType == SPECAILCHARTOSTRING.NUMBER) {
        if (parameters) {
            return true;
        }
    } else if (paramType == SPECAILCHARTOSTRING.OBJECT) {
        if (Object.keys(parameters).length) {
            return true;
        }
    } else if (paramType == SPECAILCHARTOSTRING.STRING) {
        const p = parameters.trim();
        if (p && p != SPECAILCHARTOSTRING.ZERO && p != SPECAILCHARTOSTRING.FALSE && p != SPECAILCHARTOSTRING.UNDEFINED && p != SPECAILCHARTOSTRING.NULL && p != SPECAILCHARTOSTRING.NAN) {
            return true;
        }
    }
    return false;
}

async function validateRequired(parameters) {
    if (!await checkRequired(parameters)) {
        throw MESSAGE.VALIDATATION_INPUT;
    }
}

async function checkDataSetInUse(dataSetName, throwError) {
    const conditions = { selectedDataset: dataSetName };
    const pro = await mongoDb.findByConditions(ProjectModel, conditions, "projectName");
    console.log(pro)
    if (pro[0] && throwError) {
        const pnames = await pro.reduce((pnameString, curr) => pnameString ? `${pnameString},${curr.projectName}` : curr.projectName, "");
        throw { CODE: MESSAGE.VALIDATION_DS_USING.CODE, MSG: MESSAGE.VALIDATION_DS_USING.MSG.replace('${pnames}', pnames) };
    }
    return pro;
}

async function checkJsonFormat(data) {
    if (!data) {
        return false;
    }
    if (typeof data === 'string') {
        try {
            JSON.parse(data);
            return true;
        } catch (error) {
            return false;
        }
    }
}


async function validateBool(data) {
    if (data == true || data == 'true') {
        return true;
    }
    return false;
}


module.exports = {
    isASCII,
    isNumeric,
    checkProjectByconditions,
    checkAppendTicketsHeaders,
    checkUser,
    checkUserRole,
    checkAnnotator,
    checkDataSet,
    checkRequired,
    validateRequired,
    checkDataSetInUse,
    checkJsonFormat,
    validateBool,
    checkAdmin,
    
};