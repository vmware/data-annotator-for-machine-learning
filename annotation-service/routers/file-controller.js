/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const express = require("express");
const router = express.Router();
const multer = require("multer");
const fileService = require('../services/file-service');
const dataSetService = require('../services/dataSet-service');
const APIs = require('../resources/APIs');
const s3Service = require('../services/s3.service');
const sqsService = require('../services/sqs.service');
const superColliderService = require('../services/supercollider.service');
const upload = multer();


router.get(APIs.FILE_S3_CONFIGS, (req, res) => {
    console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    s3Service.prepareS3Configs(req).then(response => {
        console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(403).send(error);
    });
});

// create new project table and insert new project info
router.post(APIs.FILE_PROJECT_CREATE, upload.none(), (req, res) => {
    console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    fileService.createProject(req).then(response => {
        console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(201).json({ status: "success", msg: response });
    }).catch(error => {
        console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send({ status: "failed", msg: error });
    });
});

router.get(APIs.FILE_PROJECT_DOWNLOAD, (req, res) => {
    console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    fileService.queryFileForDownlad(req).then((response) => {
        console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.get(APIs.FILE_PROJECT_GENERATE, (req, res) => {
    console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    sqsService.generateFile(req).then((response) => {
        console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.get(APIs.FILE_DATASET_QUERY, (req, res) => {
    console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    dataSetService.queryDataSetByUser(req).then((response) => {
        console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.post(APIs.FILE_DATASET_SAVE, upload.single("file"), (req, res) => {
    console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    dataSetService.saveDataSetInfo(req).then(response => {
        console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.get(APIs.FILE_DATASET_NAME_UNIQUE, (req, res) => {
    console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    dataSetService.queryDataSetByDataSetName(req).then((response) => {
        console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.delete(APIs.FILE_DATASET_DELETE, (req, res) => {
    console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    dataSetService.deleteDataSet(req).then(response => {
        console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.get(APIs.FILE_SIGN_URL, (req, res) => {
    console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    dataSetService.signS3Url(req).then((response) => {
        console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.post(APIs.FILE_SUPER_COLLIDER_QUERY, (req, res) => {
    console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    superColliderService.superColliderQuery(req).then((response) => {
        console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});


router.post(APIs.FILE_UPLOAD, upload.single("file"), (req, res) => {
    console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    fileService.uploadFile(req).then((response) => {
        console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.post(APIs.FILE_SET_DATA, (req, res) => {
    console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    fileService.setData(req, res).then((response) => {
        console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

module.exports = router;