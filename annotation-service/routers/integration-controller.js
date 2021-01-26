/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const express = require("express");
const router = express.Router();
const APIs = require('../resources/APIs');
const IntegrationService = require("../services/integration.service");

router.post(APIs.INTEGRATION_CSV, (req, res) => {
    console.log(`[ INTEGRATION ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    IntegrationService.SyncLabelledCaseToInstaML(req).then(response =>{
      console.log(`[ INTEGRATION ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
      res.status(200).json(response);
    }).catch(error =>{
      console.error(`[ INTEGRATION ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
      res.status(500).send(error);
    });
});

module.exports = router;