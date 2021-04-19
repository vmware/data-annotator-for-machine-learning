<div align='center'> <h1>Data Annotator for Machine Learning</h1> </div>

Data Annotator for Machine Learning is an application that helps machine learning teams facilitating the creation and management of annotations.

Core features include:
- Support for common annotation tasks:
  - Text classification
  - Named entity recognition
  - Tabular classification and regresion
  - Images recognition with bounding boxes and polygons
  - Log labeling 
- Active learning with uncertainly sampling to query unlabeled data
- Project tracking with real time data aggregation and review process
- User management panel with role-based access control
- Data management
  - Import common data formats
  - Export in ML friendly formats
  - Data sharing through community datasets
- Swagger API for programmatic labeling, connect to data pipelines and more

## Table of Contents

- [What is included](#what-is-included)
- [Quick start](#quick-start)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Run at Local](#run-at-local)
- [Contributing](#contributing)
- [Bugs and feature requests](#bugs-and-feature-requests)
- [Copyright and license](#copyright-and-license)
<br>

## What is included

You have to set up and configure three components in  Data Annotator for Machine Learning before you can use the application.

#### [___annotation-app___](./annotation-app)
This is the front-end application built with **Angular** 8.x, **Node** 10+, **NPM** 6+

#### [___annotation-service___](./annotation-service)
This is the back-end service that provides all the api for annotation-app built with [__Node__](https://nodejs.org/en/) 10+, [__mongodb__](https://www.mongodb.com/download-center/community) 3.5+, [__express__](https://www.npmjs.com/package/express) 4.17.1

#### [___active-learning-service___](./active-learning-service)
This is the back-end service that provides all active learning api.  It is built with [__Python__](https://www.python.org/) 3.6+ and [__Django__](https://www.djangoproject.com/) 3.0.7 service in addition to Modal

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

##### Configuring annotation-app environments

You need to configure the following required variables in environment.ts file before run the annotation-app in local.
	   

```javascript
export const environment: Env = {

  // This section is required
  production: false,
  annotationService: 'http://localhost:3000', // Annotation service url
  serviceTitle: 'Data-annotation', // UI name of annotation-app.
  provider: 'Data-annotation', // Authentcation provider
  USER_KEY: 'data-annotation-user', // user key name in localstorage
  redirectUrl: '/home', // redirect URL after logout or token is expired

  // This section is optional
  videoSrc: null, // demo video link in home page, or set null to show nothing
  googleTrackId: null, // google track ID
  enableSendEmail: true // Set to true to enable email notification for project creation or annotator assignment
}
```

	
If you want to configure specific environments for dev, staging, production, go to annotation-app/src/app/services/environment.service.ts to set variables in different environments with the key **APP_CONFIG**. Then you can read the value in this environment.service.ts.

------------
#### annotation-service

You need to configure the following required variables in [annotation-service/config/app-os.js](./annotation-service/config/app-os.js) file before using. 

```javascript
module.exports  = {
  //AWS CONFIG IAM
  region: process.env.REGION || null,
  accessKeyId: process.env.ACCESSKEY_ID || null,
  secretAccessKey: process.env.SECRET_ACCESS_KEY || null,
  //AWS S3
  bucketName: process.env.BUCKET_NAME || null,
  s3RoleArn: process.env.S3_ROLEARN || null,
  //AWS SQS
  sqsRoleArn: process.env.SQS_ARN || null,
  sqsUrl: process.env.SQS_URL || null,

  //annotation-app url
  WebClientUrl: process.env.WEBCLIENT_URL || 'http://localhost:4200',
  //active-learning-service url
  loopALApiUrl: process.env.LOOP_AL_URL || "http://localhost:8000/api",
  //mongodb url
  mongoDBUrl: process.env.MONGODB_URL || 'mongodb://localhost/loop',

};
```

As _annotation-service_ uses AWS S3 to save datasets and SQS to generate large datasets. Configuration of these AWS services is required.

If you are new to AWS you can reference the [AWS official guideline](https://docs.aws.amazon.com/en_us/). You can also use DAML step by step [AWS config guideline](https://github.com/vmware/data-annotator-for-machine-learning/wiki/AWS-Config).

To enable email notifications, you need to set _enableEmail_ to true. If you use AWS SES, set _useAWSSES_ to true and provide _sender_. For personal or special accounts, set _useAWSSES_ to false and provide _sender, emailPassword, emailServerHost, emailServerPort_.

You can copy app-os.js file and change the name to app-xxx.js and deploy to different environments, such as local,sandbox,uat and prod.  You can change the sysEnv at [annotation-service/config/config.js](./annotation-service/config/config.js) or get the value from server environment (_process.env.xxx_) for easy build and deployment.

```javascript
const sysEnv = process.env.SYS_ENV || "os"
```

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
Use the same mongodb, AWS configs from [annotation-service/config/app-os.js](./annotation-service/config/app-os.js) and replace the default values.


You can copy app_os.py file and change the name to app_xxx.py and deploy to different environments, such as local, sandbox, uat, prod. You can change the default env at  in [active-learning-service/config/config.py](./active-learning-service/config/config.py) file or set the SYS_ENV='xxx' in your server environment for easy build and deployment.

```python
env = os.getenv('SYS_ENV', 'os')
```

------------
### Run at Local
After Installation and configuration, now you can run these 3 services separately,
```bash

# go into annotation-app's directory
$ cd annotation-app
$ npm start

# go into annotation-service's directory
$ cd annotation-service
$ npm start

# go into active-learning-service's directory
$ cd active-learning-service
$ python manage.py runserver localhost:8000
```

## Contributing

The Data Annotator for Machine Learning (DAML) project team welcomes contributions from the community. For more detailed information, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Bugs and feature requests

Have a bug or a feature request? Please first read the issue guidelines and search for existing and closed issues. If your problem or idea is not addressed yet, please open a new issue.
<br>

## Copyright and license

Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0.
