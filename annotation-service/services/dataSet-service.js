/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const S3Utils = require('../utils/s3');
const {DATASETTYPE, S3OPERATIONS, FILEPATH, OPERATION, SRCS} = require('../config/constant');
const ObjectId = require("mongodb").ObjectID;
const validator = require('../utils/validator');
const config = require('../config/config');
const localFileSysService = require('./localFileSys.service');
const EventEmitter = require('events');
const _ = require("lodash");
const fs = require('fs');
const mongoDb = require('../db/mongo.db');
const { ProjectModel, DataSetModel } = require('../db/db-connect');
const MESSAGE = require('../config/code_msg');
const {queryUserById} = require('./user-service');


async function saveDataSetInfo(req) {

    await validator.checkDataSet({ dataSetName: req.body.dsname }, false);
    
    const user = req.auth.email;
    let dataSynchronize = req.body.dataSynchronize? req.body.dataSynchronize: [];
    dataSynchronize = typeof dataSynchronize == 'string'? JSON.parse(dataSynchronize): dataSynchronize;

    let dataSet = {
        dataSetName: req.body.dsname,
        fileName: req.body.fileName,
        fileSize: req.body.fileSize,
        fileKey: req.body.fileKey,
        location: req.body.location,
        user: user,
        description: req.body.description,
        format: req.body.format,
        createTime: Date.now(),
        updateTime: Date.now(),
        dataSynchronize: dataSynchronize,
        totalRows: req.body.totalRows,
        totalColumns: req.body.totalColumns? req.body.totalColumns: 0,
    };
    
    if (config.useLocalFileSys) {

        const folder = `./${FILEPATH.UPLOAD}/${user}`;
        dataSet.location = `${folder}/${req.file.originalname}`;
        dataSet.fileKey = process.cwd();
        await localFileSysService.checkFileExistInLocalSys(folder, true);
        const exist = await localFileSysService.checkFileExistInLocalSys(dataSet.location);
        if (exist) {
            throw MESSAGE.VALIDATION_DS_EXIST;
        }
        await localFileSysService.saveFileToLocalSys(dataSet.location, req.file.buffer);

        if (typeof req.body.topReview == "string") {
            req.body.topReview = JSON.parse(req.body.topReview)
        }

    }
    
    if (req.body.format == DATASETTYPE.IMGAGE) {
        if (config.useLocalFileSys) {
            const statusCheck = new EventEmitter();
            const unzipFolder = `./${FILEPATH.UPLOAD}/${user}/${FILEPATH.UNZIPIMAGE}/${Date.now()}`;
            await localFileSysService.singleUnzipStreamToLocalSystem(req.file.buffer, unzipFolder, statusCheck);
            await new Promise((resolve) => statusCheck.on('done', (images)=>{ resolve(dataSet.images = images) }));
 
 
        }else{
            if (req.body.images) {
                dataSet.images = JSON.parse(req.body.images);
            }else{
                dataSet.images = await JSON.parse(Buffer.from(req.file.buffer).toString()).images;
            }
        }
        
    }else if (req.body.format == DATASETTYPE.CSV || req.body.format == DATASETTYPE.TABULAR) {
        
        console.log(`[ DATASET ] Service fileter no-Eglish data`);
        const reviews = { 'header': req.body.topReview.header, 'topRows': req.body.topReview.topRows };

        dataSet.hasHeader = req.body.hasHeader;
        dataSet.columnInfo = req.body.columnInfo;
        dataSet.topReview = reviews;

    }else if (req.body.format == DATASETTYPE.LOG) {
        dataSet.topReview = req.body.topReview;
    }
    
    let conditions = { dataSetName: req.body.dsname };
    let update = { $set: dataSet };
    let options = { new: true, upsert: true };
    console.log(`[ DATASET ] Service save dataset info to db`);
    const datasets =  await mongoDb.findOneAndUpdate(DataSetModel, conditions, update, options);

    return imageTopPreview(datasets, true);

}

async function queryDataSetByUser(req) {
    
    const user = req.auth.email;
    const format = req.query.format;
    const src = req.query.src;
    const dsid = req.query.dsid;
    
    //query current user's dataset
    let condition = { user: user };
    //query by format
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
    //query single dataset
    if (dsid) {
        condition = { _id: dsid };
    }
    //admin query all dataset
    if (src == SRCS.ADMIN) {
        await validator.checkAdmin(user)
        condition = {};
    }
    
    console.log(`[ DATASET ] Service queryDataSetByUser`);
    const datasets = await mongoDb.findByConditions(DataSetModel, condition);
    return imageTopPreview(datasets);
    
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
    const datasets = await mongoDb.findByConditions(DataSetModel, { dataSetName: req.query.dsname });
    return imageTopPreview(datasets);
}

async function deleteDataSet(req) {
    
    const ds = await validator.checkDataSet({ _id: ObjectId(req.query.dsid) }, true);
    const user = req.auth.email;

    if (ds[0].format == DATASETTYPE.CSV || ds[0].format == DATASETTYPE.TABULAR || ds[0].format == DATASETTYPE.LOG) {
        
        if (ds[0].format == DATASETTYPE.LOG) {
            await validator.checkDataSetInUse(ds[0].dataSetName, true);
        }
        
        if (config.ESP || config.useAWS &&  config.bucketName && config.s3RoleArn) {
            console.log(`[ DATASET ] Service deleteDataSet.S3Utils.deleteAnObject`);
            await S3Utils.deleteAnObject(ds[0].location);
        }else if (config.useLocalFileSys) {
            console.log(`[ DATASET ] Service localFileSysService.deleteFileFromLocalSys`);
            await localFileSysService.deleteFileFromLocalSys(ds[0].location)
        }
        
    }else if (ds[0].format == DATASETTYPE.IMGAGE) {

        await validator.checkDataSetInUse(ds[0].dataSetName, true);
        
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
    for (const projectName of ds[0].projects) {
        await require('./project.service').updateProjectDatasetInfo(projectName, ds[0].dataSetName, OPERATION.DELETE);
    }
    console.log(`[ DATASET ] Service deleteDataSet.removeDataSet`);
    await mongoDb.removeByConditions(DataSetModel, { dataSetName: ds[0].dataSetName });
    
}


async function signS3Url(req) {

    console.log(`[ DATASET ] Service query datasets`);
    const dataSet = await mongoDb.findById(DataSetModel, ObjectId(req.query.dsid));

    console.log(`[ DATASET ] Service S3Utils.signedUrlByS3`);
    return S3Utils.signedUrlByS3(S3OPERATIONS.GETOBJECT, dataSet.location);
}

async function updateDataset(req) {

    console.log(`[ DATASET ] Service updateDataset`);
    const dsid = req.body.dsid;
    const operation = req.body.o;
    const system = req.body.system;
    const _id = req.body._id;

    if (operation == OPERATION.ADD) {
        update = { 
            $push:  { 
                dataSynchronize: {
                    system: system,
                    _id: _id
                } 
            }
        }
    }else if(operation == OPERATION.DELETE){
        update = { 
            $pull: { 
                dataSynchronize: { 
                    system: system,
                    _id: _id
                }
            }
        };
    }else{
        throw  MESSAGE.VALIDATATION_OPERATION;
    }
    
    const conditions = {_id: ObjectId(dsid)};
    const options = { new: true, upsert: true };
    return mongoDb.findOneAndUpdate(DataSetModel, conditions, update, options);

}

async function updateDatasetProjectInfo(dataSetName, projectName, operation, newProjectName) {

    const condition = {dataSetName: dataSetName};
    const options = { new: true, upsert: true };
    let update = {};

    if (OPERATION.ADD == operation) {
        update = { $addToSet: { projects: projectName } }
    }else if (OPERATION.DELETE == operation) {
        update = { $pull: { projects: projectName } }
    }else if (OPERATION.UPDATE == operation) {
        condition['projects'] = projectName
        update = { $set: {"projects.$": newProjectName} }
        
    }else{
        throw  MESSAGE.VALIDATATION_OPERATION;
    }
    
    console.log(`[ DATASET ] Service updateDatasetProjectInfo`);
    return mongoDb.findOneAndUpdate(DataSetModel, condition, update, options);
    
}

module.exports = {
    saveDataSetInfo,
    queryDataSetByUser,
    queryDataSetByDataSetName,
    deleteDataSet,
    signS3Url,
    imageTopPreview,
    updateDataset,
    updateDatasetProjectInfo,
}