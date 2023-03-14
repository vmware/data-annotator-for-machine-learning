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

/* GET all users */
router.get(APIs.USERS, (req, res) => {
    console.log(`[ USER ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    userService.getAllusers(req).then(response => {
        console.log(`[ USER ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ USER ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.post(APIs.USER_SAVE, (req, res) => {
    console.log(`[ USER ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    userService.saveUser(req).then(response => {
        console.log(`[ USER ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(201).json(response);
    }).catch(error => {
        console.log(`[ USER ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

router.delete(APIs.USER_DELETE, (req, res) => {
    console.log(`[ USER ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    userService.deleteUser(req).then(response => {
        console.log(`[ USER ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json({ status: "success", msg: "have been deleted：" + response });
    }).catch(error => {
        console.log(`[ USER ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send({ status: "failed", msg: error });
    });
});

/* to edit the exist user's role */
router.patch(APIs.USER_ROLE_EDIT, (req, res) => {
    console.log(`[ USER ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    userService.updateUserRole(req).then(response => {
        console.log(`[ USER ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ USER ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

/* GET user role */
router.get(APIs.USER_ROLE, (req, res) => {
    console.log(`[ USER ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    userService.getUserRoleById(req).then(response => {
        console.log(`[ USER ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ USER ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

/* PUTCH USER update dashboard */
router.patch(APIs.USER_DASHBOARD, (req, res) => {
    console.log(`[ USER ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    userService.saveUserDashboard(req).then(response => {
        console.log(`[ USER ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ USER ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

/* Get user Rank */
router.get(APIs.USER_RANK, (req, res) => {
    console.log(`[ USER ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    userService.getUserRank(req).then(response => {
        console.log(`[ USER ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ USER ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

/* GET leaders */
router.get(APIs.USER_LEADERS, (req, res) => {
    console.log(`[ USER ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    userService.getUserLeaders(req).then(response => {
        console.log(`[ USER ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ USER ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});

/* Get all points so far */
router.get(APIs.USER_TOTALPOINTS, (req, res) => {
    console.log(`[ USER ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    userService.getUserPoint().then(response => {
        console.log(`[ USER ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
        res.status(200).json(response);
    }).catch(error => {
        console.log(`[ USER ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
        res.status(500).send(error);
    });
});


module.exports = router;