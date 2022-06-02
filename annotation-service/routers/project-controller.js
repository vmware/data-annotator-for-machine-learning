/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const express = require("express");
const router = express.Router();
const projectService = require("../services/project.service");
const srService = require("../services/srs-service");
const APIs = require('../resources/APIs');
const alService = require('../services/activelearning.service');

/* GET all projects */
router.get(APIs.PROJECT_LIST, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.getProjects(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

/* GET annotation details */
router.get(APIs.PROJECT_LIST_ANNOTATOR, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.getProjectByAnnotator(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

router.get(APIs.PROJECT_NAME, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.getProjectName(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

router.get(APIs.PROJECT_INFO, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.getProjectInfo(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

router.delete(APIs.PROJECT_DELETE, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.deleteProject(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

/* to edit the exist project */
router.patch(APIs.PROJECT_SAVE, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.updateProject(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});


/* to update project share status */
router.patch(APIs.PROJECT_SHARE, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.updateProjectShare(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

/* GET annotation details */
router.get(APIs.PROJECT_PREVIEW, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.projectLeaderBoard(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

router.get(APIs.PROJECT_FLAGS, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  srService.queryAllFlagSrs(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

router.post(APIs.PROJECT_FLAGS_SLIENCE, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  srService.slienceFlagSrs(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

router.get(APIs.PROJECT_MODEL_ACCURACY, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  alService.findModelAccuracy(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

router.get(APIs.PROJECT_REVIEW_LIST, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.getReviewList(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

router.get(APIs.PROJECT_LOG_FILE_LIST, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.getLogProjectFileList(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

router.get(APIs.PROJECT_LOG_FILE_FILTER, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.fileterLogTicketsByFileName(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

router.patch(APIs.PROJECT_UPDATE_LABEL, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.updateProjectLabels(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

router.patch(APIs.PROJECT_INTEGRATION_EDIT, (req, res) => {
  console.log(`[ PROJECT ] [ ACCESS ] Router ${req.originalUrl} ${req.auth.email}`);
  projectService.projectIntegrationEdit(req).then(response => {
    console.log(`[ PROJECT ] [ SUCCESS ] Router ${req.originalUrl} ${req.auth.email}`);
    res.status(200).json(response);
  }).catch(error => {
    console.error(`[ PROJECT ] [ ERROR ] Router ${req.originalUrl} ${req.auth.email}`, error);
    res.status(500).send(error);
  });
});

module.exports = router;