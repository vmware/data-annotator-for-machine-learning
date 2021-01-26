/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const express = require("express");
const router = express.Router();
const emailService = require('../services/email-service');
const APIs = require('../resources/APIs');

router.post(APIs.EMAIL_TO_OWNER, (req, res) => {
  console.log(`[ EMAIL ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  emailService.sendEmailToOwner(req).then(() => {
    console.log(`[ EMAIL ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json("email ok");
  }).catch(error => {
    console.error(`[ EMAIL ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).json("email failed");
  });
});


router.post(APIs.EMAIL_TO_ANNOTATOR, (req, res) => {
  console.log(`[ EMAIL ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  emailService.sendEmailToAnnotator(req).then(() => {
    console.log(`[ EMAIL ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json("email ok");
  }).catch(error => {
    console.error(`[ EMAIL ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).json("email failed");
  });
});

module.exports = router;