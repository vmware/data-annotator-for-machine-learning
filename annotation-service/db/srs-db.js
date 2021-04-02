/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const { SrModel } = require("./db-connect");

async function removeManySrs(conditions) {
    console.log('[ SRS ] DB begin removeManySrs');
    return await SrModel.deleteMany(conditions);
}

async function querySrsByConditions(conditions, columns, options) {
    console.log('[ SRS ] DB begin querySrsByConditions');
    return await SrModel.find(conditions, columns, options, function(error, result) {
        if (error) {
            console.error('[ SRS ] [ ERROR ] DB querySrsByConditions fail with: ', error);
            throw error;
        }
        console.log('[ SRS ] DB querySrsByConditions succefully');
        return result;
    });
}

async function querySrsCountByConditions(conditions, columns, options, flag) {
    console.log('[ SRS ] DB begin querySrsByConditions');
    return await SrModel.find(conditions, columns, options, function(error, result) {
        if (error) {
            console.error('[ SRS ] [ ERROR ] DB querySrsCountByConditions fail with: ', error);
            throw error;
        }
        console.log('[ SRS ] DB querySrsCountByConditions succefully');
        return result;
    }).count(flag);
}

async function queryOneSrsByConditions(conditions, columns, options) {
    console.log('[ SRS ] DB begin queryOneSrsByConditions');
    return await SrModel.findOne(conditions, columns, options, function(error, result) {
        if (error) {
            console.error('[ SRS ] [ ERROR ] DB queryOneSrsByConditions fail with: ', error);
            throw error;
        }
        console.log('[ SRS ] DB queryOneSrsByConditions succefully');
        return result;
    });
}

async function findUpdateSrs(conditions, update, options) {
    console.log('[ SRS ] DB begin findUpdateSrs');
    return await SrModel.findOneAndUpdate(conditions, update, options).then(function(result, error) {
        if (error) {
            console.error('[ SRS ] [ ERROR ] DB findUpdateSrs fail with: ', error);
            throw error;
        }
        console.log('[ SRS ] DB findUpdateSrs succefully');
        return result;
    });


}
async function querySrsById(conditions, columns) {
    console.log('[ SRS ] DB begin querySrsById');
    return await SrModel.findById(conditions, columns, function(error, result) {
        if (error) {
            console.error('[ SRS ] [ ERROR ] DB querySrsById fail with: ', error);
            throw error;
        }
        console.log('[ SRS ] DB querySrsById succefully');
        return result;
    });
}

async function updateSrsData(conditions, doc) {
    console.log('[ SRS ] DB begin updateSrsData');
    return await SrModel.update(conditions, doc, function(error, result) {
        if (error) {
            console.error('[ SRS ] [ ERROR ] DB updateSrsData fail with: ', error);
            throw error;
        }
        console.log('[ SRS ] DB updateSrsData succefully');
        return result;
    });
}

async function updateSrsManyData(conditions, doc, options) {
    console.log('[ SRS ] DB begin updateSrsManyData');
    return await SrModel.updateMany(conditions, doc, options, function(error, result) {
        if (error) {
            console.error('[ SRS ] [ ERROR ] DB updateSrsManyData fail with: ', error);
            throw error;
        }
        console.log('[ SRS ] DB updateSrsManyData succefully');
        return result;
    });
}

async function saveSrsData(schema) {
    let srs = await new SrModel(schema);
    srs.save();
}

async function insertManySrsData(docs, options) {
    return SrModel.insertMany(docs, options, function(error, result){
        if (error) {
            console.error('[ SRS ] [ ERROR ] DB insertManySrsData fail with: ', error);
            throw error;
        }
    });
}

async function aggregateSrsData(schema) {
    console.log('[ SRS ] DB begin aggregateSrsData');
    return await SrModel.aggregate(schema, function(error, result) {
        if (error) {
            console.error('[ SRS ] [ ERROR ] DB aggregateSrsData fail with: ', error);
            throw error;
        }
        console.log('[ SRS ] DB aggregateSrsData succefully');
        return result;
    });
}

async function paginateQuerySrsData(query, options) {
    return await SrModel.paginate(query, options).then(function(result, error) {
        if (error) {
            console.error('[ SRS ] [ ERROR ] DB paginateQuerySrsData fail with: ', error);
            throw error;
        }
        return result;
    });
}

module.exports = {
    removeManySrs,
    querySrsByConditions,
    queryOneSrsByConditions,
    querySrsCountByConditions,
    findUpdateSrs,
    querySrsById,
    updateSrsData,
    updateSrsManyData,
    saveSrsData,
    insertManySrsData,
    aggregateSrsData,
    paginateQuerySrsData,

}