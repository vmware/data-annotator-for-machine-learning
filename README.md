<div align='center'> <h1>Data Annotator for Machine Learning</h1> </div>

Data Annotator for Machine Learning is an application that helps machine learning teams facilitate the creation and management of annotations.

Specifically, the core features are:
- Supported annotation tasks:
  - text classification
  - named entity recognition
  - tabular classification and regresion
  - image recognition with bounding boxes and polygons
- Active learning with uncertainly sampling to distribute unlabeled data
- Project tracking with real time data aggregation
- User management panel with RBAC
- Data management
  - export to a common ML task format in CSV
  - data sharing through a community datasets tab

## Table of Contents

- [What is included](#what-is-included)
- [Quick start](#quick-start)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Run at Local](#run-at-local)
- [Bugs and feature requests](#bugs-and-feature-requests)
- [Copyright and license](#copyright-and-license)
<br>

## What is included

Data Annotator for Machine Learning project containes three components, and you need to set up all components before you can start to use the application.

#### [___annotation-app___](./annotation-app)
This is the front-end application built with Angular 8.x that with
- **AngularCLI** 8.2.13+
- **Node** 10+
- **NPM** 6+

#### [___annotation-service___](./annotation-service)
This is the back-end service that provides all the api for annotation-app.  It is built with Node.js and and MongoDB

#### [___active-learning-service___](./active-learning-service)
This is the back-end service that provides all active learning api.  It is built with Python and Django service in addition to Modal

## Quick start

Instructions to set up the three service components:

### Installation

```bash
# clone the repo
$ git clone https://github.com/vmware/data-annotator-for-machine-learning.git

# go into annotation-app's directory
$ cd annotation-app
$ npm install

# go into annotation-service's directory
$ cd annotation-service
$ npm install

# go into active-learning-service's directory
$ cd active-learning-service
$ pip install -r requirements.txt
$ python -m spacy download en_core_web_md
```

### Configuration

#### annotation-app

------------

##### Configuring annotation-app environments

- To configure the annotation-app/src/environments/environment.ts
	
	 annotation-app/src/environments/ folder contains the base configuration file, environment.ts and environment.prod.ts. 
	 <br>
	 In order to run the annotation-app **in local**, you **need to configure the environment.ts to add some important defaults there**. 
	   
	 For example,	

    ```javascript
		export const environment = {
			
			// This is required
			production: false,
			annotationService: 'http://localhost:3000', // Required. Your API host.
			serviceTitle: 'Data-annotation', // Required.
			provider: 'Data-annotation', // Required.
			USER_KEY: 'data-annotation-user', // Required.
			redirectUri: '/home', // Must.
			  
			// This is optional
			authUrl: '', // Optional. Allow to set the Vmware ESP auth api, or set empty to use the basic login provided.
			tokenUrl: '', // Optional. Allow to set the Vmware ESP auth token api, or set empty to use the basic token provided.
			logoutUrl: '', // Optional. Allow to set the Vmware ESP auth logout api, or set empty.
			CLIENT_ID: '', // Optional. Allow to set the Vmware ESP CLIENT_ID, or set empty.
			feedbackUrl: '', // Optional. Allow to set the Vmware ESP feedback service, or set empty.
			videoSrc: '', // Optional. Allow to set the demo video which will show in home page, or set empty.
			googleTrackId: '', // Optional. Allow to set google track ID or set empty.
			enableSendEmail: true // Optional. Allow set true/false.
		}
    ```

	
- If you want to configure specific environments for dev, staging, production, go to annotation-app/src/app/services/environment.service.ts to set variables in different environments with the key **APP_CONFIG**. Then you can read the value in this environment.service.ts.

------------
#### annotation-service

You need to configure values in [annotation-service/config/app-os.js](./annotation-service/config/app-os.js) file before using. some optional configs you can skip if you don't want to use.

```javascript
module.exports  = {
  //annotation-service default port [optional config]
  serverPort: process.env.SERVER_PORT || 3000,
  //annotation-service url
  WebClientUrl: process.env.WEBCLIENT_URL || 'http://localhost:4200',
  //active-learning-service url
  loopALApiUrl: process.env.LOOP_AL_URL || "http://localhost:8000/api",
  //mongodb url
  mongoDBUrl: process.env.MONGODB_URL || 'mongodb://localhost/loop',
  //Google Analytics tracking id [optional config]
  trackingId: process.env.TRACKING_ID || null,
  //default admin users
  adminDefault: ['xxx@xxx.com'],
  
  //send email function [optional config]
  enableEmail: process.env.ENABLE_EMAIL || false,
  useAWSSES: process.env.USE_AWS_SES || false,
  sender: process.env.EMAIL_FROM || null, //"xxx@xxx.com"
  emailPassword: process.env.EMAIL_PASSWORD || null,
  emailServerHost: process.env.EMAIL_SERVER_HOST || null, //"smtp.xxx.com"
  emailServerPort: process.env.EMAIL_SERVER_PORT || 465,

  //AWS IAM
  region: process.env.REGION || null,
  accessKeyId: process.env.ACCESSKEY_ID || null,
  secretAccessKey: process.env.SECRET_ACCESS_KEY || null,
  //AWS S3
  bucketName: process.env.BUCKET_NAME || null,
  s3RoleArn: process.env.S3_ROLEARN || null,
  //AWS SQS
  sqsRoleArn: process.env.SQS_ARN || null,
  sqsUrl: process.env.SQS_URL || null,
  //AWS CloudFront and cloudfront cert
  cloudFrontUrl: process.env.CLOUD_FRONT_URL || null, //"https://xxx.cloudfront.net"
  cloudFrontAccessKeyId: process.env.CLOUDFRONT_ACCESS_KEY_ID || null,
  cloudFrontPrivateCert: process.env.CLOUDFRONT_PRIVATE_CERT || null, //put the cert file into config/certs/ give file name to this value.
};
```

AS _annotation-service_ uses AWS S3 to save datasets and AWS CloudFront to access the datasets and SQS to generate large datasets. Configuration of these AWS services is mandatory.

If you are new to AWS you can reference the [AWS official guideline](https://docs.aws.amazon.com/en_us/) You also can see the step by step config guidelines we provide in the resources branch [AWS-step-by-step-config-with-chart.docx](https://github.com/vmware/data-annotator-for-machine-learning/blob/resources/AWS/AWS-step-by-step-config-with-chart.docx) or [AWS-step-by-step-config-with-descriptions.md](https://github.com/vmware/data-annotator-for-machine-learning/blob/resources/AWS/AWS-step-by-step-config-with-descriptions.md)

If you want to use the email function. we support AWS SES and your personal or special accounts. You must set _enableEmail_ to true. If use AWS SES you need set _useAWSSES_ to true and provide _sender_. For personal or special accounts, leave _useAWSSES_ as false and provide _sender, emailPassword, emailServerHost, emailServerPort_.

You can copy app-os.js file and change the name to app-xxx.js, deploy to different environment. such as local,sandbox,uat,prod.  you can change the value at [annotation-service/config/config.js](./annotation-service/config/config.js) just need change the "os" to "xxx", but we recommend configuring this in your server environment since it's easy to build and deploy to any environment.

```javascript
const sysEnv = process.env.SYS_ENV || "os"
```
All these config values can also be set in the server environment variable, _process.env.xxx_ is the way to get the value from the enviroment. if you set the values both in the environment and config files, it will get the value from the environment first instead of the config files.

------------
#### active-learning-service

You need to configure [active-learning-service/config/app_os.py](./active-learning-service/config/app_os.py) before using.
```python
app = {
    # mongodb url and collection name
    "MONGODB_URL": os.getenv("MONGODB_URL", "mongodb://localhost:27017/loop"),
    "MONGODB_COLLECTION": os.getenv("MONGODB_COLLECTION", "loop"),
    # AWS IAM
    "REGION": os.getenv("REGION", None),
    "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID", None),
    "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY", None),
    # AWS S3
    "S3_BUCKET_NAME": os.getenv("S3_BUCKET_NAME", None),
    "S3_ROLE_ARN": os.getenv("S3_ROLE_ARN", None),
}
```
Use the same mongodb, AWS configs from [annotation-service/config/app-os.js](./annotation-service/config/app-os.js) and replace the None and default value.


you can copy app_os.py file and change the name to app_xxx.py, deploy to different environment, such as local, sandbox, uat, prod. Just need change "os" to "xxx", in [active-learning-service/config/config.py](./active-learning-service/config/config.py) file. but we recommend setting the value value SYS_ENV='xxx' in your server environment since it's easy to build and deploy to any environment.

```python
env = os.getenv('SYS_ENV', 'os')
```
All these config values can also be set in the server environment variable, os.getenv("xxx") is the way to get the value from the enviroment. if you set the values both in the environment and config files, it will get the value from the environment first instead of the config files.

------------
### Run at Local
After Installation and configuration, now you can run these 3 services separately,
```bash

# go into annotation-app's directory
$ cd annotation-app
$ npm start

# go into annotation-service's directory
$ cd annotation-service
$ npm run start

# go into active-learning-service's directory
$ cd active-learning-service
$ python manage.py runserver 127.0.0.1:8000
```

## Bugs and feature requests

Have a bug or a feature request? Please first read the issue guidelines and search for existing and closed issues. If your problem or idea is not addressed yet, please open a new issue.
<br>

## Copyright and license

Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0.
