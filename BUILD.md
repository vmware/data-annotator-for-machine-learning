# Data Annotator for Machine Learning (DAML) build and development setup

The project includes three components:

- [**_annotation-app_**](./annotation-app): Angular application built with [Angular 8.x](https://angular.io/guide/router-tutorial)
- [**_annotation-service_**](./annotation-service): Backend services built with [Node 14+](https://nodejs.org/en/), [mongodb 3.5+](https://www.mongodb.com/download-center/community), [express 4.17.1](https://www.npmjs.com/package/express)
- [**_active-learning-service_**](./active-learning-service): Django application providing active learning api built with [Python 3.6+](https://www.python.org/downloads/) and [Django 3.2](https://www.djangoproject.com/) and [modAL](https://modal-python.readthedocs.io/en/latest/#) library for pool-based uncertainty sampling to rank the unlabelled data

## Tools used

Building requires:
- [Node.js](https://nodejs.org/en/)
- [Mongodb](https://www.mongodb.com/download-center/community)
- [Python](https://www.python.org/downloads/)

## Installation

```bash
# clone the repo
$ git clone https://github.com/vmware/data-annotator-for-machine-learning.git

# install annotation-app
$ cd annotation-app
$ npm install

# install annotation-service
$ cd annotation-service
$ npm install

# install active-learning-service
$ cd active-learning-service
$ pip install -r requirements.txt
$ python -m spacy download en_core_web_md
```

## Configuration

### annotation-app

You need to set the following required variables in the environment.ts file to run the annotation-app locally.

```javascript
export const environment: Env = {
  // This section is required
  production: false,
  annotationService: "http://localhost:3000", // Annotation service url
  serviceTitle: "Data Annotator for Machine Learning", // UI name of annotation-app.

  // This section is optional
  redirectUrl: "/home", // redirect URL after logout or token is expired
  videoSrc: null, // demo video link in home page, or set null to show nothing
  googleTrackId: null, // google track ID
  enableSendEmail: false // Set to true to enable email notification for project creation, annotator assignment or edit project owner
  enableAWSS3: false, // Set to true to upload and download files with AWS S3 that requires some related AWS CONFIG IAM to be configured in annotation-service
};
```

To configure specific environments for dev, staging, production, go to annotation-app/src/app/services/environment.service.ts and set variables in different environments with the key **APP_CONFIG**. Then you can read the value in this environment.service.ts.

---

### annotation-service

- If you are a personal user, and just run the code on the local machine, you can use the default settings, don't need to set up any configs.
- If you are an organization user and want to deploy code to the server, we recommend you use AWS components, saving datasets to S3. You need to set the following required variables and some optional variables in [annotation-service/config/app-os.js](./annotation-service/config/app-os.js) file to run the annotation-service.

```javascript
module.exports = {
  //Change the default value to false, avoid saving datasets on the local
  useLocalFileSys: process.env.USE_LOCAL_FILE_SYS || false,

  //Change default value to true, will save datasets to S3
  useAWS: process.env.USE_AWS || true,
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

  //active-learning-service url
  loopALApiUrl: process.env.LOOP_AL_URL || "http://localhost:8000/api",
  //mongodb url
  mongoDBUrl: process.env.MONGODB_URL || "mongodb://localhost:27017/daml",
  //default admin users can see admin tab at ui. you can add your email list then to register
  adminDefault: ["poc-os@poc-os.com"],
};
```

As _annotation-service_ uses AWS S3 to save datasets and SQS to generate large datasets, configuring these AWS services is required.

If you are new to AWS you can reference the [AWS official guideline](https://docs.aws.amazon.com/en_us/). You can also use the DAML step by step [AWS config guideline](https://github.com/vmware/data-annotator-for-machine-learning/wiki/AWS-Config).

To enable email notifications, you need to set _enableEmail_ to true. If you use AWS SES, set _useAWSSES_ to true and provide _sender_ value. For personal or special accounts, set _useAWSSES_ to false and provide _sender, emailPassword, emailServerHost, and emailServerPort_ values.

You can change the sysEnv at [annotation-service/config/config.js](./annotation-service/config/config.js) or get the value from server environment (_process.env.xxx_) for easy build and deployment.

```javascript
const sysEnv = process.env.SYS_ENV || "os";
```

---

### active-learning-service

- If you are a personal user, and just run the code on the local machine, you can use the default settings, don't need to set up any configs.
- If you are an organization user and want to deploy code to the server, we recommend you use AWS components, saving datasets to S3. You need to set the following required variables and some optional variables in [active-learning-service/config/app_os.py](./active-learning-service/config/app_os.py) file to run the active-learning-service.

```python
app = {
    # Mongodb url and collection name
    "MONGODB_URL": os.getenv("MONGODB_URL", "mongodb://localhost:27017/daml"),
    "MONGODB_COLLECTION": os.getenv("MONGODB_COLLECTION", "daml"),

    # Change the default value to False, avoid saving datasets on the local
    "USE_LOCAL_FILE_SYS": os.getenv("USE_LOCAL_FILE_SYS", False),

    # Change default value to True, will save datasets to S3
    "USE_AWS": os.getenv("USE_AWS", True),
    # AWS IAM
    "REGION": os.getenv("REGION", None),
    "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID", None),
    "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY", None),
    # AWS S3
    "S3_BUCKET_NAME": os.getenv("S3_BUCKET_NAME", None),
    "S3_ROLE_ARN": os.getenv("S3_ROLE_ARN", None),
}
```

You can change the default env in [active-learning-service/config/config.py](./active-learning-service/config/config.py) file or set the SYS_ENV='xxx' in your server environment for easy build and deployment.

```python
env = os.getenv('SYS_ENV', 'os')
```

## Run at Local

After the installation and configuration of DAML, you can run the DAML application as follow:

```bash
# run annotation-app
$ cd annotation-app
$ npm start

# run annotation-service
$ cd annotation-service
$ npm start

# run active-learning-service
$ cd active-learning-service
$ python manage.py runserver localhost:8000
```
