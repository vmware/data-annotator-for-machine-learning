/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const express = require("express");
const router = express.Router();
const userService = require("../services/user-service");
const APIs = require('../resources/APIs');
const authService = require("../services/auth.service");

router.put(APIs.REGISTER, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl}`);
  userService.saveUser(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl}`, error);
    res.status(500).send(error);
  });
});

router.post(APIs.LOGIN, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl}`);
  authService.login(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl}`, error);
    res.status(500).send(error);
  });
});

router.get(APIs.TOKEN_REFRESH, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  authService.refreshToken(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

module.exports = router;