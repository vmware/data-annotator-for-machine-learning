/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

module.exports = {
    API_VERSION: process.env.API_VERSION || 'v1.0',
    API_BASE_PATH: process.env.API_BASE_PATH || '',
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
    PAGINATETEXTLIMIT: 100,
    FILESIZE: 1024*1024*50, //less than 50MB directly download
    ACCESS_TIME_60: 60*60, //in seconds
    ACCESS_TIME_30: 60*30, //in seconds
    ACCESS_TIME_15: 60*15, //in seconds
    //TOKEN
    TOKEN_EXPIRE_TIME: process.env.TOKEN_EXPIRE_TIME || 60*30,
    TOKEN_ALGORITHM: process.env.TOKEN_ALGORITHM || "HS256",
    //generate the key yourself. should keep the same with active-learning-serviceTOKEN_SECRET_OR_PRIVATE_KEY
    TOKEN_SECRET_OR_PRIVATE_KEY: process.env.TOKEN_SECRET_OR_PRIVATE_KEY || "OPEN SOURCE",    
    TOKEN_EXPIRED_MESSAGE: 'SQS receive message failed: The security token included in the request is expired', //SQS Clinet
    ANNOTATION_QUESTION: "What label does this ticket belong to ?",
    TICKET_DESCRIPTION: "Passage",
    FILEFORMAT:{
        STANDARD:"standard",
        TOPLABEL:"topLabel",
        PROBABILISTIC: "probabilistic",
    },
    LABELTYPE:{
        TEXT: "textLabel",
        NUMERIC: "numericLabel",
        HIERARCHICAL: "HTL",  //Hierarchical Taxonomy Label
    },
    PROJECTTYPE:{
        TABULAR: "tabular",
        TEXT: "text",
        NER: "ner",
        IMGAGE: "image",
        LOG:"log",
        QA: "qa",
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
        LOG: "txt",
    },
    YES: "Yes",
    NO: "No",
    S3OPERATIONS:{
        GETOBJECT: 'getObject',
    },
    FILETYPE:{
        ZIP: "zip",
        TGZ: "tgz",
        CSV: "csv",
    },
    QUERYORDER:{
        RANDOM: "random",
        SEQUENTIAL: "sequential",
        MOST_UNCERTAIN: "most_uncertain",
    },
    SPECAILCHARTOSTRING:{
        "UNDEFINED":"undefined",
        "NULL":"null",
        "TRUE":"true",
        "FALSE":"false",
        "ZERO":"0",
        "NAN":"NaN",
        "STRING":"string",
        "NUMBER":"number",
        "OBJECT":"object",
        "BOOLEAN":"boolean",
    },
    FILEPATH:{
        UPLOAD: "FILE_SYS/UPLOAD",
        DOWNLOAD: "FILE_SYS/DOWNLOAD",
        UNZIPIMAGE: "_UNZIPED-IMAGES_",
    },
    AWSRESOURCE:{
        S3: "S3",
        SQS: "SQS",
    },
    MILLISECOND_DAY: 1000 * 60 * 60 * 24,
    REGULAR_NOTIFICATNO: process.env.REGULAR_NOTIFICATNO || "0 0 9 * * 1-5",
    CURRENT_TIME_ZONE: process.env.CURRENT_TIME_ZONE || "America/Los_Angeles",
    NOT_START_DAY: process.env.NOT_START_DAY || 7,
    NOT_FINISH_DAY: process.env.NOT_FINISH_DAY || 14,
    SOURCE: {
        MODEL_FEEDBACK: "MODEL_FEEDBACK",
        NIMBUS: "NIMBUS",
    },
    QUERY_STRATEGY: {
        POOL_BASED_SAMPLING: {
            PB_UNS: "PB_UNS",
            PB_MS: "PB_MS",
            PB_ES: "PB_ES",
        },
        RANKED_BATCH_MODE: {
            RBM_UNBS: "RBM_UNBS",
        },
    },
    ESTIMATOR: {
        KNC: "KNC",
        GBC: "GBC",
        RFC: "RFC",
    },
    OPERATION:{
        DELETE: -1,
        ADD: 1,
        UPDATE: 0,
        QUERY: 2,
    }
}