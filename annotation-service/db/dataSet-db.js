/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const { DataSetModel } = require("./db-connect");


async function queryDataSetById(id) {
    console.log('[ DATASET ] DB begin queryDataSetById');
    return await DataSetModel.findById(id, function(error, result) {
        if (error) {
            console.error('[ DATASET ] [ ERROR ] DB queryDataSetById fail with: ', error);
            throw error;
        }
        console.log('[ DATASET ] DB queryDataSetById succefully');
        return result;
    });
}

async function queryDataSetByConditions(conditions, columns) {
    console.log('[ DATASET ] DB begin queryDataSetByConditions');
    return await DataSetModel.find(conditions, columns, function(error, result) {
        if (error) {
            console.error('[ DATASET ] [ ERROR ] DB queryDataSetByConditions fail with: ', error);
            throw error;
        }
        console.log('[ DATASET ] DB queryDataSetByConditions succefully');
        return result;
    });
}

async function saveDataSet(schema) {
    console.log('[ DATASET ] DB begin saveDataSet');
    let dataSet = new DataSetModel(schema);
    await dataSet.save(function(error) {
        if (error) {
            console.error('[ DATASET ] [ ERROR ] DB saveDataSet fail with: ', error);
            throw error;
        }
        console.log('[ DATASET ] DB saveDataSet succefully');
    });
}

async function removeDataSet(conditions) {
    console.log('[ DATASET ] DB begin removeDataSet');
    return await DataSetModel.remove(conditions, function(error, result) {
        if (error) {
            console.error('[ DATASET ] [ ERROR ] DB removeDataSet fail with: ', error);
            throw error;
        }
        console.log('[ DATASET ] DB removeDataSet succefully');
        return result;
    });
}

async function findAndUpdateDataSet(conditions, update, options) {
    console.log('[ DATASET ] DB begin findAndUpdateDataSet');
    return await DataSetModel.findOneAndUpdate(conditions, update, options).then(function(result, error) {
        if (error) {
            console.error('[ DATASET ] [ ERROR ] DB findAndUpdateDataSet fail with: ', error);
            throw error;
        }
        console.log('[ DATASET ] DB findAndUpdateDataSet succefully');
        return result;
    });


}

module.exports={
    queryDataSetById,
    queryDataSetByConditions,
    saveDataSet,
    removeDataSet,
    findAndUpdateDataSet,

}