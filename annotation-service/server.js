/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const glob = require('glob');
const { consumeSQSMessage } = require('./utils/sqs');
const { regularNotification } = require('./utils/taskSchedule');
const config = require('./config/config');
const { API_VERSION } = require('./config/constant')

// Get our API routes
const authService = require('./services/auth.service');
const {jwtTokenAuthrization} = require('./middlewares/jwt.middleware');

const app = express();
const routers = glob.sync(path.resolve(__dirname, `./routers/*.js`));

//manually swagger
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger2.json');
const ua = require('universal-analytics');

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())

// Enable CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type,Content-Range, Range, Accept, Authorization,Content-Length,yourHeaderFeild");
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  res.header('Access-Control-Expose-Headers', 'Content-Type, Content-Range, Content-Encoding, Accept-Ranges');
  next();
});

// mannually set up swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Server health check
app.get('/health', (req, res) => {
  return res.status(200).json({CODE: 200, MSG: "SUCCESS"});
});

// esp author
authService.authentication().then(data => {
  app.use(jwtTokenAuthrization(data))
  // google tracking except request from ui
  if (config.trackingId) {
    app.use(function (req, res, next) {
      if (req.headers.referer && req.headers.referer.includes("api-docs")) {
        const visitor = ua(config.trackingId, {uid: req.auth.email});
        visitor.pageview(req.originalUrl).send();
      }
      next();
    });
  }
   
  app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401).send({ MSG: "Invalid token" });
    }
  });
}).catch(error => {
  console.error(`[ SERVER-AUTH ][ ERROR ]`, error.message);
}).finally(()=>{
    // Set our api routers
    routers.forEach(
      api => app.use(`/api/${API_VERSION}`, require(api))
    );
    consumeSQSMessage();
    regularNotification();

    const server = http.createServer(app);
    server.listen(config.serverPort, () => console.log(`[ SERVER ] API running on localhost:${config.serverPort}`));
});