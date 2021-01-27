<div align='center'> <h1>Data Annotator for Machine Learning</h1> </div>


This Data Annotator for Machine Learning is an open-source application that helps data science teams facilitate the creation and management of annotations for your machine learning project.

Data Annotator for Machine Learning streamlines the entire annotation precess so you can centrally create, manage and administer annotation projects.

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
This is the front-end application built with Angular8.x that based on the following,
- **Angular** 8.x
- **AngularCLI** 8.2.13+
- **Node** 10+
- **NPM** 6+

#### [___annotation-service___](./annotation-service)
This is the back-end service that provides all the api for annotation-app.  It is built with Node.js and based on the following,
- __[Node](https://nodejs.org/en/)__ 10+
- __[mongodb](https://www.mongodb.com/download-center/community)__ 3.5
- __[compass](https://www.mongodb.com/download-center/compass)__ [option]

#### [___active-learning-service___](./active-learning-service)
This is the back-end service that provides all active learning api.  It is built with Python Django service and based on the following,
- __[Python](https://www.python.org/)__ 3.6



<br>

## Quick start

Please follow the instructions to set up the three components.

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
<br>

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
			annotationService: 'http://localhost:3000', // Must. Your API host.
			serviceTitle: 'Data-annotation', // Must.
			provider: 'Data-annotation', // Must.
			USER_KEY: 'data-annotation-user', // Must.
			redirectUri: '/home', // Must.
			  
			// This is optional
			authUrl: '', // Option. Allow to set the Vmware ESP auth api, or set empty to use the basic login provided.
			tokenUrl: '', // Option. Allow to set the Vmware ESP auth token api, or set empty to use the basic token provided.
			logoutUrl: '', // Option. Allow to set the Vmware ESP auth logout api, or set empty.
			CLIENT_ID: '', // Option. Allow to set the Vmware ESP CLIENT_ID, or set empty.
			feedbackUrl: '', // Option. Allow to set the Vmware ESP feedback service, or set empty.
			videoSrc: '', // Option. Allow to set the demo video which will show in home page, or set empty.
			googleTrackId: '', // Option. Allow to set google track ID or set empty.
			enableSendEmail: true // Option. Allow set true/false.
		}
    ```

	
- If you want to configure environment-specific such as production, then go to annotation-app/src/app/services/environment.service.ts. Please set you variables in different environment with the key **APP_CONFIG**. Then you can read the value in this environment.service.ts.


<br>
<br>

#### annotation-service

##### AWS Config
------------
The file has a step by step config guideline: [___AWS-config.docx___](https://github.com/vmware/data-annotator-for-machine-learning/blob/resources/AWS/AWS-config.docx)

If you don't have an AWS account at present, you need register an account [aws portal signup](https://portal.aws.amazon.com/billing/signup#/start "aws portal signup") . if you have an account login directly [aws portal login](https://console.aws.amazon.com/console/home "aws portal login") . Loop need below component as dependency.

Recommend all aws component in the same region. __S3, CloudFront, SQS, SES, IAM__ it's mandatory dependencies.

- __region__

Replace the default region,copy the region from your login portal url or The drop-down box in the upper right corner, and replace the null with string value in [annotation-service/config/app-os.js](./annotation-service/config/app-os.js)

	region: process.env.REGION || "xxx"

##### 1. S3
You also can ference the official guideline from here <https://docs.aws.amazon.com/s3/index.html>
research "S3" and click then go to Amazon S3 page

##### 1.1 Create Bucket
Bucket Tab --> Create bucket --> input bucket name and Region(use the same default region with other components) copy the Bucket name and Region to some where first --> Create bucket

- __bucketName__

Replace the bucketName with you copied value just now

	bucketName: process.env.BUCKET_NAME || "xxx"

##### 1.2 Edit Bucket permissions
S3 --> Buckets --> click your Bucket name --> Permissions --> Cross-origin resource sharing (CORS) --> Edit --> replace with the below json --> Save changes

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE"
    ],
    "AllowedOrigins": [
      "*"
    ],
    "ExposeHeaders": []
  }
]
```
	
##### 2. CloudFront
You also can ference the official guideline from here <https://docs.aws.amazon.com/cloudfront/index.html>

##### 2.1 Credentials
In right above click your account will show a dropdown list then click My Security Credentials --> CloudFront Key pairs --> Create New Key Pair --> Download Private Key File --> Close
put the cert file you download just now into [annotation-service/config/certs/](./annotation-service/config/certs/)
copy the Access Key ID and copy the cert name.

- __cloudFrontAccessKeyId, cloudFrontPrivateCert__

Replace the cloudFrontAccessKeyId and cloudFrontPrivateCert with your copied string value

    cloudFrontAccessKeyId: process.env.CLOUDFRONT_ACCESS_KEY_ID || "xxx"
    cloudFrontPrivateCert: process.env.CLOUDFRONT_PRIVATE_CERT || "xxx"


##### 2.2 Create Origin Access Identity
Research "CloudFront" and click then go to CloudFront Distributions page
CloudFront --> Security --> Origin Access Identity --> Create Origin Access Identity --> input Comment --> Create

 ##### 2.3 Create CloudFront
CloudFront --> Distributions Tab --> Create Distribution --> select Web --> Get Started -->

    Origin Domain Name: select the S3 bucket name you create in the II. Step1,
    Restrict Bucket Access: Yes,
    Origin Access Identity: Use an Existing Identity,
    Your Identities: Chose the Identities name you create in the III.step1 Create Origin Access Identity
    Grant Read Permissions on Bucket: Yes, Update Bucket Policy

    Allowed HTTP Methods: GET, HEAD, OPTIONS,
    Cache and origin request settings:Use legacy cache settings,
    Cache Based on Selected Request Headers: Whitelist,
    Whitelist Headers:Access-Control-Request-Headers,Access-Control-Request-Method,Origin,

    Restrict Viewer Access(Use Signed URLs orSigned Cookies): Yes,
    Trusted Key Groups or Trusted Signer: Trusted Signer,
    Trusted Signers:Self,

    Comment: comment it to make it easy to identify,

    Others leave as default value,

 -> Create Distribution

- __cloudFrontUrl__

Replace the cloudFrontUrl value CloudFront --> Distributions --> copy the Domain Name Add https for the domain(such as: <https://d2mb0te0123456.cloudfront.net>) and replace the null value

    cloudFrontUrl: process.env.CLOUD_FRONT_URL || "xxx"

##### 3. SQS
You also can ference the official guideline from here <https://docs.aws.amazon.com/sqs/index.html>

Research "SQS" and click "Simple Queue Service" then go to Amazon SQS page

##### 3.1 create queue
SQS --> Create queue --> 

    selete standard queue
    input queue name
    others leave as default value

--> Create Queue --> copy the queue URL
- __sqsUrl__

Replace the sqsUrl with your copied string value

    sqsUrl: process.env.SQS_URL || "xxx"

##### 4. SES [ optional ]
If you want to use AWS SES as the email service, you can config this settings below, otherwise you can skip this part.
You also can ference the official guideline from here <https://docs.aws.amazon.com/ses/index.html>

Research "SQS" and click "Simple Email Service" then go to Amazon Simple Email Service(SES)page

##### 4.1 Sandbox
Sandbox is default in SES, that is only send email to verified Email address, both sender and to email address. there are two ways to verify the email address by Domains or By Email Addresses
By Domains you can verify all the same type email address.
By Email Addresses you only can verify one by one.

##### 4.2 Production Access
Production can send to any email address, but need application from AWS Team.
SES --> Sending Statistics --> Edit your account Details --> input the basic information --> Submit for review

If you just want to run Loop as the demo or just few workmate. sandbox if enough. but if you want to deploy to production for many users to use you need apply production access.anyway, you need a sender address

- __sender, enableEmail, useAWSSES [ optional ]__

If you want enable send email function and want to use AWS SES as the email service replace the sender, and change enableEmail to true and change useAWSSES to true

    enableEmail: process.env.ENABLE_EMAIL || true,
    useAWSSES: process.env.USE_AWS_SES || true,
    sender: process.env.EMAIL_FROM || "xxx@xxx.com"

##### 5. IAM User
You also can ference the official guideline from here <https://docs.aws.amazon.com/iam/index.html>

Research "IAM" and click then go to Identity and Access Management (IAM) page

 ##### 5.1 create Policies
Policies tab --> Create policy --> JSON --> input the json below
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "ses:*",
                "s3:*",
                "sqs:*"
            ],
            "Resource": "*"
        }
    ]
}
```
--> Review Policy  --> input the policy name --> Create policy

 ##### 5.2 create user
Users tab --> Add user --> input User Name and tick allow Programmatic access --> Next:Permisions --> Next:Tags --> Next:Review --> Create user --> click __Download.csv__ (important, only have one opportunity to download) save the csv file to your local pc --> Close

 ##### 5.3 create Roles
Roles tab --> Create role --> Another AWS account --> input Account ID(you can see from right above, your name dropdown list, My Account) --> Next: Permissions --> Next:Tags --> Next:Preview --> input Role name --> Create role

 ###### 5.3.1 Edit Roles Trust Relationship
Click User tab --> copy User ARN
click Roles --> click the Role Name you created just now --> click Tust relationships --> click edit trust relationship --> replace the root user with you copied user role. -->click update Trust Policy

 ###### 5.3.2 Edit Roles Permissions
Click Roles --> click Permissions --> click Attach policies --> filter the policies with the name you just created in step1 and tick it  --> click Attach policy

- __accessKeyId,secretAccessKey__

Replace the accessKeyId and secretAccessKey with string values
copy the Access key ID and Secret access key from you download csv file (new_user_credentials.csv)

    accessKeyId: process.env.ACCESSKEY_ID || "xxx"
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "xxx"

- __s3RoleArn,sqsRoleArn__

Replace the s3RoleArn and sqsRoleArn with string values
IAM --> Roles Tab --> the Role you reated in I.step3  --> copy the Role ARN --> replace the null with string value

    s3RoleArn: process.env.S3_ROLEARN || "xxx"
    sqsRoleArn: process.env.SQS_ARN || "xxx"

##### Email function config [ optional ]
------------
- If you don't want to use email function you can skip this part.
- If you want to use send email function, you can set _enableEmail_ to true, default is false.

      enableEmail: process.env.ENABLE_EMAIL || true
- If you want to use AWS SES as the email server, set _useAWSSES_ to ture, default is false. and set _sender_ as your send email address. you can reference ___part 4. SES___.

      useAWSSES: process.env.USE_AWS_SES || true
      sender: process.env.EMAIL_FROM || "xxx@xxx.com"
- If you want to use your specific account as the email server. you should leave _useAWSSES_ as false, and need provide the _sender_ as your send email address. config your email password to _emailPassword_, config the send email server host to _emailServerHost_, and the port to _emailServerPort_. if your enabled the SSL/TLS the port should be 465. defalut is 465.

      useAWSSES: process.env.USE_AWS_SES || false
      sender: process.env.EMAIL_FROM || "xxx@xxx.com"
      emailPassword: process.env.EMAIL_PASSWORD || "xxx"
      emailServerHost: process.env.EMAIL_SERVER_HOST || "smtp.xxx.com"
      emailServerPort: process.env.EMAIL_SERVER_PORT || 465,

##### Google Analytics config [ optional ]
------------
If you want to use Google Analytics you need provide the trackingId but it's optional.
you can follow this to set up <https://support.google.com/analytics/topic/3544906?hl=en&ref_topic=10094551>
- __trackingId [ optional ]__

Replace the trackingId to your own value is ok.

    trackingId: process.env.TRACKING_ID || "xxx"

##### Dababase config
------------
You can put your database in anywhere you want just need provide an accessable link
- __mongoDBUrl__

Replace the default localhost one is ok.

    mongoDBUrl: process.env.MONGODB_URL || "xxx"

##### Other configs
------------
- __loopALApiUrl__

_active-learning-service_ provide Active Learning and NER tokens for _annotation-service_, it's a python project. you can deploy the project to any where you want just provide the accessable link and replace the localhost one is ok.

    loopALApiUrl: process.env.LOOP_AL_URL || "xxx"

- __WebClientUrl__

It's annotation-app project url, it's angular project, the same at above you just need provide the link and repalce the localhost link is ok.

	WebClientUrl: process.env.WEBCLIENT_URL || "xxx"

- __adminDefault__ 

It's an array you can define the admin user in the array, then register with this email. when login will have admin access.

    adminDefault: ['xxx@xxx.com']

- __serverPort [ optional ]__

_annotation-serive_ porject port. default vaule is 3000, you can leave it or edit the the port.

    process.env.SERVER_PORT || 3000

##### System Environment Config
------------
- __SYS_ENV__

You can copy app-os.js file and change the name to app-local.js, app-sandbox.js app-uat.js or app-prod.js for all different deploy environment. you can change the value at `annotation-service/config/config.js` just need change the "os" to the "local"/"sandbox"/"uat"/"prod" ...

    const sysEnv = process.env.SYS_ENV || "os"

But it's recommend set this value in the environment such at SYS_ENV=prod, it's easy to build and deploy to any environment.

##### Const Configs
------------
In [annotation-service/config/constant.js](./annotation-service/config/constant.js) files you also can change the below default values all it's optional

- _API_VERSION_
- _USER_ROLE_
- _TOKEN_EXPIRE_TIME_
- _TOKEN_ALGORITHM_
- _T_OKEN_SECRET_OR_PRIVATEKEY_



All these values can also be set in the server environment variable, ___process.env.xxx___ is the way to get the value from the enviroment. if you set the values both in the environment and config files, it will get the value from the environment first instead of the config files.

#### active-learning-service

##### mongodb config
------------
it's share the same mongodb, so you can copy the value from [annotation-service/config/app-os.js] just need to replace the None value is ok.
- __MONGODB_URL, MONGODB_COLLECTION__

      "MONGODB_URL": os.getenv("MONGODB_URL", "mongodb://localhost:27017/loop")
      "MONGODB_COLLECTION": os.getenv("MONGODB_COLLECTION", "loop")
_MONGODB_URL_ is the database link, _MONGODB_COLLECTION_ is the database name.

##### AWS Config
------------
it's share the same AWS config, so you can copy the value from [annotation-service/config/app-os.js](./annotation-service/config/app-os.js) just need to replace the None value is ok.
- __REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY__

      "REGION": os.getenv("REGION", None)
      "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID", None)
      "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY", None)

- __S3_BUCKET_NAME,S3_ROLE_ARN__

      "S3_BUCKET_NAME": os.getenv("S3_BUCKET_NAME", None)
      "S3_ROLE_ARN": os.getenv("S3_ROLE_ARN", None)

##### System Environment Config
------------
you can copy app_os.py file and change the name to app_xxx.py to deploy to different environment, 'xxx' can be your different environment name such as sandbox, uat, prod and so on.
and change the default value 'os' to 'xxx' in [config/config.py](./active-learning-service/config/config.py) file. or set the SYS_ENV='xxx' in your system environment (recommend).
- __SYS_ENV__

      env = os.getenv('SYS_ENV', 'os')

### Run at Local
------------
After Installation and configuration, now you can run these 3 services separately,
```bash

# go into annotation-app's directory
$ cd annotation-app
$ npm start

# go into annotation-service's directory
$ cd annotation-service
$ npm run statr

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
