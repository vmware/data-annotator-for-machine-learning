/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const { ProjectModel } = require("./db-connect");


async function queryProjectByConditions(conditions, projection, options) {
    console.log('[ PROJECT ] DB begin queryProjectByConditions');
    return await ProjectModel.find(conditions, projection, options, function(error, result) {
        if (error) {
            console.error('[ PROJECT ] [ ERROR ] DB queryProjectByConditions fail with: ', error);
            throw error;
        }
        console.log('[ PROJECT ] DB queryProjectByConditions succefully');
        return result;
    });
}

async function queryProjectById(id, projection, options) {
    console.log('[ PROJECT ] DB begin queryProjectById');
    return await ProjectModel.findById(id, projection, options, function(error, result) {
        if (error) {
            console.error('[ PROJECT ] [ ERROR ] DB queryProjectById fail with: ', error);
            throw error;
        }
        console.log('[ PROJECT ] DB queryProjectById succefully');
        return result;
    });
}

async function aggregateProjectData(schema) {
    console.log('[ PROJECT ] DB begin aggregateProjectData');
    return await ProjectModel.aggregate(schema).then(function(result, error) {
        if (error || !result.length) {
            console.error('[ PROJECT ] [ ERROR ] DB aggregateProjectData fail with: ', error);
            throw error;
        }
        console.log('[ PROJECT ] DB aggregateProjectData succefully');
        return result;
    });
}

async function removeProject(conditions) {
    console.log('[ PROJECT ] DB begin removeProject ');
    return await ProjectModel.remove(conditions, function(error, result) {
        if (error) {
            console.error('[ PROJECT ] [ ERROR ] DB removeProject fail with: ', error);
            throw error;
        }
        console.log('[ PROJECT ] DB removeProject succefully');
        return result;
    });
}

async function saveProject(schema) {
    console.log('[ PROJECT ] DB begin saveProject');
    let project = new ProjectModel(schema);
    await project.save(function(error) {
        if (error) {
            console.error('[ PROJECT ] [ ERROR ] DB saveProject fail with: ', error);
            throw error;
        }
        console.log('[ PROJECT ] DB saveProject succefully');
    });
}

async function updateProject(conditions, doc) {
    console.log('[ PROJECT ] DB begin updateProject');
    return await ProjectModel.update(conditions, doc, function(error, result) {
        if (error) {
            console.error('[ PROJECT ] [ ERROR ] DB updateProject fail with: ', error);
            throw error;
        }
        console.log('[ PROJECT ] DB updateProject succefully');
        return result;
    });
}

async function findUpdateProject(conditions, update, options) {
    console.log('[ PROJECT ] DB begin findUpdateProject');
    return await ProjectModel.findOneAndUpdate(conditions, update, options).then(function(result, error) {
        if (error) {
            console.error('[ PROJECT ] [ ERROR ] DB findUpdateProject fail with: ', error);
            throw error;
        }
        console.log('[ PROJECT ] DB findUpdateProject succefully');
        return result;
    });
}
module.exports = {
    queryProjectByConditions,
    queryProjectById,
    aggregateProjectData,
    removeProject,
    saveProject,
    updateProject,
    findUpdateProject,

}