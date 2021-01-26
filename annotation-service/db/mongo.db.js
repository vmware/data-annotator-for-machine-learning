/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


async function findByConditions(MODEL, conditions, columns, options) {
    console.log(`[ DB ] begin findByConditions`);
    return await MODEL.find(conditions, columns, options, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB findByConditions fail with: `, error);
            throw error;
        }
        console.log(`[ DB ] findByConditions succefully`);
        return result;
    });
}

async function findAndCountByConditions(MODEL, conditions, columns, options, flag) {
    console.log(`[ DB ] begin findAndCountByConditions`);
    return await MODEL.find(conditions, columns, options, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB findAndCountByConditions fail with: `, error);
            throw error;
        }
        console.log(`[ DB ] findAndCountByConditions succefully`);
        return result;
    }).count(flag);
}

async function findOneByConditions(MODEL, conditions, columns, options) {
    console.log(`[ DB ] begin findOneByConditions`);
    return await MODEL.findOne(conditions, columns, options, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB findOneByConditions fail with: `, error);
            throw error;
        }
        console.log(`[ DB ] findOneByConditions succefully`);
        return result;
    });
}

async function findOneAndUpdate(MODEL, conditions, update, options) {
    console.log(`[ DB ] begin findOneAndUpdate`);
    return await MODEL.findOneAndUpdate(conditions, update, options).then(function(result, error) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB findOneAndUpdate fail with: `, error);
            throw error;
        }
        console.log(`[ DB ] findOneAndUpdate succefully`);
        return result;
    });


}
async function findById(MODEL, conditions, columns) {
    console.log(`[ DB ] begin findById`);
    return await MODEL.findById(conditions, columns, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB findById fail with: `, error);
            throw error;
        }
        console.log(`[ DB ] findById succefully`);
        return result;
    });
}

async function updateByConditions(MODEL, conditions, doc) {
    console.log(`[ DB ] begin updateByConditions`);
    return await MODEL.update(conditions, doc, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB updateByConditions fail with: `, error);
            throw error;
        }
        console.log(`[ DB ] updateByConditions succefully`);
        return result;
    });
}

async function updateManyByConditions(MODEL, conditions, doc, options) {
    console.log(`[ DB ] begin updateManyByConditions`);
    return await MODEL.updateMany(conditions, doc, options, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB updateManyByConditions fail with: `, error);
            throw error;
        }
        console.log(`[ DB ] updateManyByConditions succefully`);
        return result;
    });
}

async function saveBySchema(MODEL, schema) {
    let model = await new MODEL(schema);
    model.save();
}

async function insertMany(MODEL, docs, options) {
    return MODEL.insertMany(docs, options, function(error, result){
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB insertMany fail with: `, error);
            throw error;
        }
    });
}

async function aggregateBySchema(MODEL, schema) {
    console.log(`[ DB ] begin aggregateBySchema`);
    return await MODEL.aggregate(schema, function(error, result) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB aggregateBySchema fail with: `, error);
            throw error;
        }
        console.log(`[ DB ] aggregateBySchema succefully`);
        return result;
    });
}

async function paginateQuery(MODEL, query, options) {
    return await MODEL.paginate(query, options).then(function(result, error) {
        if (error) {
            console.error(`[ DB ] [ ERROR ] DB paginateQuery fail with: `, error);
            throw error;
        }
        return result;
    });
}

async function deleteManyByConditions(MODEL, conditions) {
    console.log(`[ DB ] begin deleteManyByConditions`);
    return await MODEL.deleteMany(conditions);
}

async function deleteOneByConditions(MODEL, conditions) {
    console.log('[ DB ] begin deleteItem ');
    return await MODEL.deleteOne(conditions, function(error, result) {
        if (error) {
            console.error('[ DB ] [ ERROR ] DB deleteItem fail with: ', error);
            throw error;
        }
        console.log('[ DB ] deleteItem succefully');
        return result;
    });
}

module.exports = {
    findByConditions,
    findAndCountByConditions,
    findOneByConditions,
    findOneAndUpdate,
    findById,
    updateByConditions,
    updateManyByConditions,
    saveBySchema,
    insertMany,
    aggregateBySchema,
    paginateQuery,
    deleteManyByConditions,
    deleteOneByConditions,
}