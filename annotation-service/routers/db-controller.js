/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const express = require("express");
const router = express.Router();
const APIs = require('../resources/APIs');
const DBOP = require('../utils/DB.OPERATIONS');


router.post(APIs.DB_UPDATE_COLUMN_TYPE, (req, res) => {
  console.log(`[ DB ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  DBOP.updateDBColumnType(req).then((response) => {
      console.log(`[ DB ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
      res.status(200).json(response);
  }).catch(error => {
      console.error(`[ DB ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
      res.status(500).send(error);
  });
});


module.exports = router;