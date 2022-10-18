/***
 * 
 * Copyright 2019-2022 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const express = require("express");
const router = express.Router();
const APIs = require('../resources/APIs');
const IPDS = require('../utils/ImportDataset.util');
const RIM = require('../scripts/reveiwInfoMigration');

router.post(APIs.DATASET_IMPORT, (req, res) => {
  console.log(`[ SCRIPTE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  IPDS.importDataset(req).then((response) => {
      console.log(`[ SCRIPTE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
      res.status(200).json(response);
  }).catch(error => {
      console.error(`[ SCRIPTE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
      res.status(500).send(error);
  });
});

router.get(APIs.MIGRATION_REVIEW_INFO, (req, res) => {
  console.log(`[ SCRIPTE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  RIM.migrationAllTicketsReviewInfo(req).then((response) => {
      console.log(`[ SCRIPTE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
      res.status(200).json(response);
  }).catch(error => {
      console.error(`[ SCRIPTE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
      res.status(500).send(error);
  });
});

module.exports = router;