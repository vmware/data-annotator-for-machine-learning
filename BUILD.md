# Data Annotator for Machine Learning (DAML) build and development setup

The project includes three components:

- [**_annotation-app_**](./annotation-app): Angular application built with [Angular v14](https://angular.io/docs)
- [**_annotation-service_**](./annotation-service): Backend services built with [Node](https://nodejs.org/en/), [mongodb](https://www.mongodb.com/download-center/community), [express](https://www.npmjs.com/package/express)
- [**_active-learning-service_**](./active-learning-service): Django application providing active learning api built with [Python](https://www.python.org/downloads/) and [Django](https://www.djangoproject.com/) and [modAL](https://modal-python.readthedocs.io/en/latest/#) library for pool-based uncertainty sampling to rank the unlabelled data

## Tools used

Building requires:

- [Node.js 16](https://nodejs.org/en/)
- [mongodb 3.5](https://www.mongodb.com/download-center/community)
- [Python >=3.6, Python<=3.9](https://www.python.org/downloads/)

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
```

## Configuration

### annotation-app

You need to set the following required variables in the [annotation-app/src/environments/environment.ts](./annotation-app/src/environments/environment.ts) file to run the annotation-app locally.

```javascript
export const environment: Env = {
  // This section is required
  production: false,
  // Annotation service url
  annotationService: "http://localhost:3000",
};
```

To configure specific environments for dev, staging, production, go to annotation-app/src/app/services/environment.service.ts and set variables in different environments with the key **APP_CONFIG**. Then you can read the value in this environment.service.ts.

---

### annotation-service

- If you are a personal user, and just run the code on the local machine, you can use the default settings, don't need to set up any configs.

- If you are an organization user and want to deploy code to the server, we recommend you use AWS components, saving datasets to S3. You need to set some optional variables in [annotation-service/config/app-os.js](./annotation-service/config/app-os.js) file to run the annotation-service. such as uses AWS S3 to save datasets and SQS to generate large datasets, configuring these AWS services is required. if you are new to AWS you can reference the [AWS official guideline](https://docs.aws.amazon.com/en_us/). You can also use the DAML step by step [AWS config guideline](https://github.com/vmware/data-annotator-for-machine-learning/wiki/AWS-Config).

- If you are want to login with LDAP rather to register a account to you should config _loginWithLDAP_ values.

- If you are want to enable email notifications, you need to set _enableEmail_ to true. If you use AWS SES, set _useAWSSES_ to true and provide _sender_ value. For personal or special accounts, set _useAWSSES_ to false and provide _sender, emailPassword, emailServerHost, and emailServerPort_ values.

You need to set following required variables if you deploy the service in the server.

```javascript
module.exports = {
  //active-learning-service url
  loopALApiUrl: process.env.LOOP_AL_URL || "http://localhost:8000/api",
  //mongodb url
  mongoDBUrl: process.env.MONGODB_URL || "mongodb://localhost:27017/daml",
  //default admin users can see admin tab at ui. you can add your email list then to register
  adminDefault: ["poc-os@poc-os.com", "poc@poc.com"],
};
```

You can change the sysEnv at [annotation-service/config/config.js](./annotation-service/config/config.js) or get the value from server environment (_process.env.xxx_) for easy build and deployment.

```javascript
const sysEnv = process.env.SYS_ENV || "os";
```

---

### active-learning-service

- If you are a personal user, and just run the code on the local machine, you can use the default settings, don't need to set up any configs.
- If you are an organization user and want to deploy code to the server, we recommend you use AWS components, saving datasets to S3. You need to set the following required variables and some optional variables in [active-learning-service/config/app_os.py](./active-learning-service/config/app_os.py) file to run the active-learning-service.

You need to set following required variables if you deploy the service in the server.

```python
app = {
    # Mongodb url and collection name
    "MONGODB_URL": os.getenv("MONGODB_URL", "mongodb://localhost:27017/daml"),
    "MONGODB_COLLECTION": os.getenv("MONGODB_COLLECTION", "daml"),
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
# we use en_core_web_md as the default spacy module if you want to replace it. you need to set SPACY_MODEL in your system environment first.
#spacy models ref: https://spacy.io/models
# eg.(Unix Bash shell): export SPACY_MODEL=zh_core_web_md
# eg.(Windows shell): set SPACY_MODEL=zh_core_web_md
$ python manage.py runserver localhost:8000

```

## How to use

Open `http://localhost:4200` with your browser, now you can use full of the DAML application functions.
