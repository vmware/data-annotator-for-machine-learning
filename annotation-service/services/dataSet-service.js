/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const DataSetDB = require('../db/dataSet-db');
const S3Utils = require('../utils/s3');
const {DATASETTYPE, S3OPERATIONS, FILEPATH} = require('../config/constant');
const ObjectId = require("mongodb").ObjectID;
const validator = require('../utils/validator');
const config = require('../config/config');
const localFileSysService = require('./localFileSys.service');
const EventEmitter = require('events');
const _ = require("lodash");
const fs = require('fs');


async function saveDataSetInfo(req) {

    await validator.checkDataSet({ dataSetName: req.body.dsname }, false);
    
    const user = req.auth.email;
    let location = req.body.location;
    let fileKey = req.body.fileKey;

    let dataSet = {
        dataSetName: req.body.dsname,
        fileName: req.body.fileName,
        fileSize: req.body.fileSize,
        user: user,
        description: req.body.description,
        format: req.body.format,
        createTime: Date.now(),
        updateTime: Date.now()
    };
    
    if (config.useLocalFileSys) {

        const folder = `./${FILEPATH.UPLOAD}/${user}`;
        location = `${folder}/${req.file.originalname}`;
        fileKey = process.cwd();
        await localFileSysService.checkFileExistInLocalSys(folder, true);
        const exist = await localFileSysService.checkFileExistInLocalSys(location);
        if (exist) {
            throw {CODE: 5001, MSG: "DATASET ALREADY EXIST"};
        }
        await localFileSysService.saveFileToLocalSys(location, req.file.buffer);

        typeof req.body.topReview == "string"? req.body.topReview=JSON.parse(req.body.topReview) : null;
    }
    
    if (req.body.format == DATASETTYPE.IMGAGE) {
        if (config.useLocalFileSys) {
            const statusCheck = new EventEmitter();
            const unzipFolder = `./${FILEPATH.UPLOAD}/${user}/${FILEPATH.UNZIPIMAGE}/${Date.now()}`;
            await localFileSysService.singleUnzipStreamToLocalSystem(req.file.buffer, unzipFolder, statusCheck);
            await new Promise((resolve) => statusCheck.on('done', (images)=>{ resolve(dataSet.images = images) }));
            dataSet.fileKey = fileKey;
            dataSet.location = location;
 
        }else{
            if (req.body.images) {
                dataSet.images = JSON.parse(req.body.images);
            }else{
                dataSet.images = await JSON.parse(Buffer.from(req.file.buffer).toString()).images;
            }
        }
        
    }else if (req.body.format == DATASETTYPE.CSV || req.body.format == DATASETTYPE.TABULAR) {
        
        console.log(`[ DATASET ] Service fileter no-Eglish data`);
        const reviews = { 'header': req.body.topReview.header, 'topRows': [] };

        req.body.topReview.topRows.forEach(row => {
            for (let i = 0; i < row.length; i++) {
                if (!validator.isASCII(row[i])) {
                    row = null;
                    break;
                }
            }
            if (row) {
                reviews.topRows.push(row);
            }
        });

        dataSet.fileKey = fileKey;
        dataSet.hasHeader = req.body.hasHeader;
        dataSet.location = location;
        dataSet.columnInfo = req.body.columnInfo;
        dataSet.topReview = reviews;

    }else if (req.body.format == DATASETTYPE.LOG) {
        dataSet.fileKey = fileKey;
        dataSet.location = location;
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
    const format = req.query.format;
    if (format) {
        if (format == DATASETTYPE.CSV) {
            condition.$or = [
                {format: DATASETTYPE.CSV},
                {format: DATASETTYPE.TABULAR}
            ];
        }else{
            condition.format = format;
        }
    }
    const datasets = await DataSetDB.queryDataSetByConditions(condition);
    if (!format || format == DATASETTYPE.IMGAGE) {
        return await imageTopPreview(datasets);
    }
    return datasets;
    
}

async function imageTopPreview(datasets, singleData) {
   
    if (singleData) datasets = [datasets];
    
    if (config.useLocalFileSys){
        for (const ds of datasets) {
            if (ds.format == DATASETTYPE.IMGAGE) {
                let preveiw = [], index = 0;
                
                for (const image of ds.images) { 
                    if (index>2) break;
                    preveiw.push(image);
                    index++;
                }
                ds._doc.topReview = preveiw;
            }
        }
    }else{
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
    }

    return singleData? datasets[0]: datasets;
}

async function queryDataSetByDataSetName(req) {
    console.log(`[ DATASET ] Service queryDataSetByDataSetName`);
    return await DataSetDB.queryDataSetByConditions({ dataSetName: req.query.dsname });
}

async function deleteDataSet(req) {
    
    const ds = await validator.checkDataSet({ dataSetName: req.body.dsname }, true);
    const user = req.auth.email;

    if (ds[0].format == DATASETTYPE.CSV || ds[0].format == DATASETTYPE.TABULAR || ds[0].format == DATASETTYPE.LOG) {

        if (config.ESP || config.useAWS &&  config.bucketName && config.s3RoleArn) {
            console.log(`[ DATASET ] Service deleteDataSet.S3Utils.deleteAnObject`);
            await S3Utils.deleteAnObject(req.body.fileKey);
        }else if (config.useLocalFileSys) {
            console.log(`[ DATASET ] Service localFileSysService.deleteFileFromLocalSys`);
            await localFileSysService.deleteFileFromLocalSys(req.body.fileKey)
        }
        
    }else if (ds[0].format == DATASETTYPE.IMGAGE) {

        await validator.checkDataSetInUse(req.body.dsname, true);
        
        if (config.ESP || config.useAWS &&  config.bucketName && config.s3RoleArn) {
            console.log(`[ DATASET ] Service deleteDataSet.S3Utils.deleteMultiObjects`);
            // delete unziped images at s3
           let index = 0; keys = [];
           for await (const img of ds[0].images) {
                keys.push({Key: img.location});
                index += 1;
                if (index == 1000) {
                    await S3Utils.deleteMultiObjects(keys);
                    keys = [];
                    index = 0;
                }
           }
           if (!keys.length) {
            await S3Utils.deleteMultiObjects(keys);
           }
            
        }else if (config.useLocalFileSys) {
 
            const folder = `./${FILEPATH.UPLOAD}/${user}/${FILEPATH.UNZIPIMAGE}/`;
            //images dataset has single appened images
            let fileFolders = await ds[0].images.reduce((arr, curr) => arr.concat(curr.location.split(FILEPATH.UNZIPIMAGE)[1].split("/")[1]), []);
            fileFolders = await _.uniq(fileFolders);
            // delete the zip file
            await localFileSysService.deleteFileFromLocalSys(ds[0].location);
            // dalete the unziped files
            for (const fo of fileFolders) {
                await localFileSysService.deleteFileFolderFromLocalSys(folder+fo);
            }
        }

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
    imageTopPreview,
}