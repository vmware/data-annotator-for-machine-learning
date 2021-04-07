/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const express = require("express");
const router = express.Router();
const srsService = require("../services/srs-service");
const APIs = require('../resources/APIs');
const multer = require("multer");
const upload = multer();

/* Add SR user input */
router.patch(APIs.SRS_UPDATE, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.updateSrsUserInput(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

/* GET all SR categories. */
router.get(APIs.SRS_CATEGORIES, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.getCategoriesSrs(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

/* GET a sequential sr. */
router.get(APIs.SRS_GETONE, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.getOneSrs(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.get(APIs.SRS_ALL, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.getALLSrs(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.get(APIs.SRS_QUERY_BY_ID, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.getSelectedSrsById(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});


router.get(APIs.SRS_PROGRESS, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.getProgress(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.post(APIs.SRS_SKIP_ONE, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.skipOne(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.post(APIs.SRS_APPEND, upload.any(), (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.appendSrsData(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.get(APIs.SRS_SAMPLE, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.sampleSr(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.get(APIs.SRS_USER_FLAGS, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.queryUserFlagTicket(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.post(APIs.SRS_FLAG, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.flagSr(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.post(APIs.SRS_UNFLAG, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.unflagSr(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.delete(APIs.SRS_DELETE, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.deleteSrs(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.delete(APIs.SRS_DELETE_LABEL, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.deleteLabel(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.patch(APIs.SRS_REVIEW, (req, res) => {
    console.log(`[ SRS ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    srsService.updateSrsUserInput(req).then(response =>{
        console.log(`[ SRS ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ SRS ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

module.exports = router;