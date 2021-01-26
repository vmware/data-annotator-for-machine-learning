/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const express = require("express");
const router = express.Router();
const APIs = require('../resources/APIs');
const communityService = require('../services/community.service');


router.post(APIs.COUNT_COMMUNITY_DOWNLOAD, (req, res) => {
  console.log(`[ FILE ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  communityService.countCommunityDownload(req).then((response) => {
      console.log(`[ FILE ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
      res.status(200).json(response);
  }).catch(error => {
      console.error(`[ FILE ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
      res.status(500).send(error);
  });
});

module.exports = router;