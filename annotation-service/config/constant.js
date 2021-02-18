/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

module.exports = {
    API_VERSION: process.env.API_VERSION || 'v1.0',
    USER_ROLE: process.env.USER_ROLE || 'Project Owner',
    ROLES:{
        ANNOTATOR: "Annotator",
        PROJECT_OWNER: "Project Owner",
        ADMIN: "Admin",
    },
    SRCS: {
        ADMIN: "admin",
        PROJECTS: "projects",
        COMMUNITY: "community",
        ANNOTATE: "annotate"
    },
    GENERATESTATUS:{
        DEFAULT: "pending",
        PREPARE: "prepare",
        GENERATING: "generating",
        DONE: "done"
    },
    APPENDSR:{
        DEFAULT: "pending",
        ADDING: "adding",
        DONE: "done"
    },
    PAGINATELIMIT: 5000,
    FILESIZE: 1024*1024*5, //less than 5MB directly download
    ACCESS_TIME_60: 60*60, //in seconds
    ACCESS_TIME_30: 60*30, //in seconds
    ACCESS_TIME_15: 60*15, //in seconds
    //TOKEN
    TOKEN_EXPIRE_TIME: process.env.TOKEN_EXPIRE_TIME || 60*30,
    TOKEN_ALGORITHM: process.env.TOKEN_ALGORITHM || "HS256",
    TOKEN_SECRET_OR_PRIVATEKEY: process.env.TOKEN_SECRET_OR_PRIVATEKEY || "OPEN SOURCE",    
    TOKEN_EXPIRED_MESSAGE: 'SQS receive message failed: The security token included in the request is expired',//SQS Clinet

    FILEFORMAT:{
        STANDARD:"standard",
        TOPLABEL:"topLabel",
        PROBABILISTIC: "probabilistic",
    },
    LABELTYPE:{
        TEXT: "textLabel",
        NUMERIC: "numericLabel",
    },
    PROJECTTYPE:{
        TABULAR: "tabular",
        TEXT: "text",
        REGRESSION: "regression",
        NER: "ner",
        IMGAGE: "image",
    },
    DOWNLOADSRC:{
        COMMUNITY: "community",
    },
    ENCODE:{
        EMBEDDINGS:"embeddings",
        ONEHOT:"oneHot",
    },
    DATASETTYPE:{
        CSV: "csv",
        TABULAR: "tabular",
        IMGAGE: "image",
    },
    YES: "Yes",
    NO: "No",
    TEAM:{
        ESP: "VMware InstaML Loop",
        OSS: "Data-Annotator-For-Machine-Learning",
    },
    S3OPERATIONS:{
        GETOBJECT: 'getObject',
    },
    FILETYPE:{
        ZIP: "zip",
        TGZ: "tgz",
        GZ: "gz"
    },
}