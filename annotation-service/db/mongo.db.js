/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/
const MESSAGE = require('../config/code_msg');

async function findByConditions(MODEL, conditions, columns, options) {
    console.log(`[ DB ] begin findByConditions`);
    return MODEL.find(conditions, columns, options, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB findByConditions fail with: `, error);
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
        console.log(`[ DB ] findByConditions succefully`);
        return result;
    });
}

async function findAndCountByConditions(MODEL, conditions, columns, options, flag) {
    console.log(`[ DB ] begin findAndCountByConditions`);
    return MODEL.find(conditions, columns, options, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB findAndCountByConditions fail with: `, error);
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
        console.log(`[ DB ] findAndCountByConditions succefully`);
        return result;
    }).count(flag);
}
async function findSortAndLimitByConditions(MODEL, conditions, columns, options, sort, limit) {
    console.log(`[ DB ] begin findSortAndLimitByConditions`);
    return MODEL.find(conditions, columns, options).sort(sort).limit(limit).exec().then(function(result, error) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB findSortAndLimitByConditions fail with: `, error);
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
        console.log(`[ DB ] findSortAndLimitByConditions succefully`);
        return result;
    });
}

async function findOneByConditions(MODEL, conditions, columns, options) {
    console.log(`[ DB ] begin findOneByConditions`);
    return MODEL.findOne(conditions, columns, options, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB findOneByConditions fail with: `, error);
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
        console.log(`[ DB ] findOneByConditions succefully`);
        return result;
    });
}

async function findOneAndUpdate(MODEL, conditions, update, options) {
    console.log(`[ DB ] begin findOneAndUpdate`);
    return MODEL.findOneAndUpdate(conditions, update, options).then(function(result, error) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB findOneAndUpdate fail with: `, error);
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
        console.log(`[ DB ] findOneAndUpdate succefully`);
        return result;
    });


}
async function findById(MODEL, conditions, columns) {
    console.log(`[ DB ] begin findById`);
    return MODEL.findById(conditions, columns, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB findById fail with: `, error);
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
        console.log(`[ DB ] findById succefully`);
        return result;
    });
}

async function updateManyByConditions(MODEL, conditions, doc, options) {
    console.log(`[ DB ] begin updateManyByConditions`);
    return MODEL.updateMany(conditions, doc, options, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB updateManyByConditions fail with: `, error);
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
        console.log(`[ DB ] updateManyByConditions succefully`);
        return result;
    });
}

async function saveBySchema(MODEL, schema) {
    console.log('[ DB ] saveBySchema begin');
    let model = await new MODEL(schema);
    return model.save().then(function(result,error){
        if(error){
            console.error('[ DB ] [ ERROR ] DB saveBySchema fail with: ', error );
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
        console.log('[ DB ] saveBySchema succefully');
        return result;
    });
}

async function insertMany(MODEL, docs, options) {
    return MODEL.insertMany(docs, options, function(error, result){
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB insertMany fail with: `, error);
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
    });
}

async function aggregateBySchema(MODEL, schema) {
    console.log(`[ DB ] begin aggregateBySchema`);
    return MODEL.aggregate(schema, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB aggregateBySchema fail with: `, error);
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
        console.log(`[ DB ] aggregateBySchema succefully`);
        return result;
    });
}

async function paginateQuery(MODEL, query, options) {
    return MODEL.paginate(query, options).then(function(result, error) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB paginateQuery fail with: `, error);
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
        return result;
    });
}

async function deleteManyByConditions(MODEL, conditions) {
    console.log(`[ DB ] begin deleteManyByConditions`);
    return MODEL.deleteMany(conditions);
}

async function deleteOneByConditions(MODEL, conditions) {
    console.log('[ DB ] begin deleteItem ');
    return MODEL.deleteOne(conditions, function(error, result) {
        if (error) {
            console.error('[ DB ] [ ERROR ] DB deleteItem fail with: ', error);
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
        console.log('[ DB ] deleteItem succefully');
        return result;
    });
}

async function removeByConditions(MODEL, conditions) {
    console.log('[ DB ] begin removeByConditions');
    return MODEL.remove(conditions, function(error, result) {
        if (error) {
            console.error('[ DB ] [ ERROR ] DB removeByConditions fail with: ', error);
            MESSAGE.ERROR_DATABASE.DATA = [error]
            throw MESSAGE.ERROR_DATABASE;
        }
        console.log('[ DB ] removeByConditions succefully');
        return result;
    });
}

module.exports = {
    findByConditions,
    findAndCountByConditions,
    findSortAndLimitByConditions,
    findOneByConditions,
    findOneAndUpdate,
    findById,
    updateManyByConditions,
    saveBySchema,
    insertMany,
    aggregateBySchema,
    paginateQuery,
    deleteManyByConditions,
    deleteOneByConditions,
    removeByConditions,
}