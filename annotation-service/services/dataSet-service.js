/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const DataSetDB = require('../db/dataSet-db');
const S3Utils = require('../utils/s3');
const {DATASETTYPE, S3OPERATIONS} = require('../config/constant');
const ObjectId = require("mongodb").ObjectID;
const { isASCII } = require('../utils/validator');
const validator = require('../utils/validator');

async function checkDatasetsName(dsname){
    console.log(`[ DATASET ] Service checkDatasetsName dataSet name is unique`);
    return await DataSetDB.queryDataSetByConditions({ dataSetName: dsname });
}

async function saveDataSetInfo(req) {

    await validator.checkDataSet({ dataSetName: req.body.dsname }, false);
    
    let dataSet = {
        dataSetName: req.body.dsname,
        fileName: req.body.fileName,
        fileSize: req.body.fileSize,
        user: req.auth.email,
        description: req.body.description,
        format: req.body.format,
        createTime: Date.now(),
        updateTime: Date.now()
    };
    
    if (req.body.format == DATASETTYPE.IMGAGE) {
        if (req.body.images) {
            dataSet.images = JSON.parse(req.body.images);
        }else{
            dataSet.images = await JSON.parse(Buffer.from(req.file.buffer).toString()).images;
        }
        
    }else if (req.body.format == DATASETTYPE.CSV || req.body.format == DATASETTYPE.TABULAR) {
        
        console.log(`[ DATASET ] Service fileter no-Eglish data`);
        const reviews = { 'header': req.body.topReview.header, 'topRows': [] };

        req.body.topReview.topRows.forEach(row => {
            for (let i = 0; i < row.length; i++) {
                if (!isASCII(row[i])) {
                    row = null;
                    break;
                }
            }
            if (row) {
                reviews.topRows.push(row);
            }
        });

        dataSet.fileKey = req.body.location;
        dataSet.hasHeader = req.body.hasHeader;
        dataSet.location = req.body.location;
        dataSet.columnInfo = req.body.columnInfo;
        dataSet.topReview = reviews;

    }else if (req.body.format == DATASETTYPE.LOG) {
        dataSet.fileKey = req.body.fileKey;
        dataSet.location = req.body.location;
        dataSet.topReview = req.body.topReview;
        dataSet.totalRows = req.body.totalRows;
    }
    
    let conditions = { dataSetName: req.body.dsname };
    let update = { $set: dataSet };
    let options = { new: true, upsert: true };
    console.log(`[ DATASET ] Service save dataset info to db`);
    const datasets =  await DataSetDB.findAndUpdateDataSet(conditions, update, options);

    return await imageTopPreview(datasets, true);

}

async function queryDataSetByUser(req) {
    console.log(`[ DATASET ] Service queryDataSetByUser`);
    const condition = { user: req.auth.email };
    const datasets = await DataSetDB.queryDataSetByConditions(condition);
    
    return await imageTopPreview(datasets);
}

async function imageTopPreview(datasets, singleData) {
    
    if (singleData) datasets = [datasets];
    const S3 = await S3Utils.s3Client();

    for (const ds of datasets) {
        if (ds.format == DATASETTYPE.IMGAGE) {
            let preveiw = [], index = 0;
            
            for (const image of ds.images) { 
                if (index>2) break;
                image.location = await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, image.location, S3);
                preveiw.push(image);
                index++;
            }
            ds._doc.topReview = preveiw;
        }
    }
    return singleData? datasets[0]: datasets;
}

async function queryDataSetByDataSetName(req) {
    console.log(`[ DATASET ] Service queryDataSetByDataSetName`);
    return await DataSetDB.queryDataSetByConditions({ dataSetName: req.query.dsname });
}

async function deleteDataSet(req) {
    
    const ds = await validator.checkDataSet({ dataSetName: req.body.dsname }, true);

    if (ds[0].format == DATASETTYPE.CSV || ds[0].format == DATASETTYPE.TABULAR) {
        console.log(`[ DATASET ] Service deleteDataSet.S3Utils.deleteAnObject`);
        await S3Utils.deleteAnObject(req.body.fileKey);
    }

    console.log(`[ DATASET ] Service deleteDataSet.removeDataSet`);
    await DataSetDB.removeDataSet({ dataSetName: req.body.dsname });
    
    return { CODE: 0000, MSG: "delete success" };
}

async function signS3Url(req) {

    console.log(`[ DATASET ] Service DataSetDB.queryDataSetById`);
    const dataSet = await DataSetDB.queryDataSetById(ObjectId(req.query.dsid));

    console.log(`[ DATASET ] Service S3Utils.signedUrlByS3`);
    return  await S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, dataSet.location);
}



module.exports = {
    saveDataSetInfo,
    queryDataSetByUser,
    queryDataSetByDataSetName,
    deleteDataSet,
    signS3Url,
    checkDatasetsName,
    imageTopPreview,
}