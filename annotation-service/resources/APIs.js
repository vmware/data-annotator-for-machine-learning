/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

module.exports = {
    //register
    REGISTER: "/register",
    LOGIN: "/login",
    TOKEN_REFRESH: "/token",
    //user
    USERS: "/users", //swagger
    USER_SAVE: "/users", //swagger
    USER_DELETE: "/users", //swagger
    USER_ROLE_EDIT: "/users", //swagger
    USER_ROLE: "/users/roles", //swagger
    USER_DASHBOARD: "/users/dashboard", //swagger
    FILE_DATASET_QUERY: "/users/datasets",//swagger
    PROJECT_LIST_ANNOTATOR: "/users/projects/names", // no

    USER_RANK: "/users/:uid/rank", //no
    USER_TOTALPOINTS: "/stats/totalpoints", //no
    USER_LEADERS: "/users/leaders/:limit", //no

    //projects
    FILE_PROJECT_CREATE: "/projects",//swagger
    PROJECT_SAVE: "/projects", // no
    PROJECT_DELETE: "/projects", // swagger
    PROJECT_LIST: "/projects", // swagger
    PROJECT_INTEGRATION_EDIT: "/projects/integration",
    PROJECT_INFO: "/projects/details", // swagger
    PROJECT_NAME: "/projects/names", // no
    PROJECT_MODEL_ACCURACY: "/projects/al/accuracy",//swagger
    FILE_PROJECT_GENERATE: "/projects/generate", //swagger--
    FILE_PROJECT_DOWNLOAD: "/projects/download", //swagger--
    COUNT_COMMUNITY_DOWNLOAD: "/projects/download/community-download-count",
    PROJECT_SHARE: "/projects/share", // swagger
    SRS_CATEGORIES: "/projects/labels", //no
    PROJECT_UPDATE_LABEL: "/projects/labels",//swagger
    SRS_DELETE_LABEL: "/projects/labels",//swagger
    PROJECT_PREVIEW: "/projects/annotations", // swagger
    SRS_PROGRESS: "/projects/users/progression",//no
    PROJECT_REVIEW_LIST: "/projects/review",
    PROJECT_LOG_FILE_LIST: "/projects/log/files",
    PROJECT_LOG_FILE_FILTER: "/projects/log/filter",

    //tickets
    SRS_UPDATE: "/projects/tickets",//swagger
    SRS_APPEND: "/projects/tickets", //swagger
    SRS_DELETE: "/projects/tickets",//swagger
    SRS_ALL: "/projects/tickets", //swagger
    SRS_SAMPLE: "/projects/tickets/examples", //swagger
    SRS_GETONE: "/projects/tickets/annotations",//swagger
    SRS_SKIP_ONE: "/projects/tickets/skip",
    SRS_QUERY_BY_ID: "/projects/tickets/details",//swagger
    SRS_FLAG: "/projects/tickets/flags", // swagger
    SRS_UNFLAG: "/projects/tickets/flags/un-flag", // swagger
    SRS_USER_FLAGS: "/projects/tickets/users/flags", // swagger
    PROJECT_FLAGS: "/projects/tickets/flags",  // swagger
    PROJECT_FLAGS_SLIENCE: "/projects/tickets/flags/silence", //swagger
    SRS_REVIEW: "/projects/tickets/review",
    SRS_QUERY_FOR_REVIEW: "/projects/tickets/review",

    //file
    FILE_S3_CONFIGS: "/datasets/s3/credentials",//no
    FILE_UPLOAD: "/datasets/s3/upload", //swagger
    FILE_SIGN_URL: "/datasets/s3/signed-url",//no
    FILE_DATASET_SAVE: "/datasets", //swagger--
    FILE_DATASET_DELETE: "/datasets",//swagger
    FILE_DATASET_UPDATE: "/datasets",
    FILE_DATASET_NAME_UNIQUE: "/datasets/names",//no
    FILE_SUPER_COLLIDER_QUERY: "/query-from-superCollider",// swagger
    FILE_SET_DATA: "/datasets/set-data",
    FILE_DOWNLOAD_FROM_LOCAL_SYSTEM: "/datasets/download-from-local-system",
    FILE_DATASET_FILE_UNIQUE: "/datasets/file",

    //email
    EMAIL_TO_OWNER: "/emails/send-to-owners",//swagger
    EMAIL_TO_ANNOTATOR: "/emails/send-to-annotators",//swagger
    EMAIL_REGULAR_NOTIFICATION: "/emails/regular-notification/unsubscription",

    //Integration
    INTEGRATION_CSV: "/integration/labelled/csv",

    //import labelled dataset
    DATASET_IMPORT: "/datasets/import",
    DB_UPDATE_COLUMN_TYPE: "/db/update-column-type",
    //migration reviewed tickets info
    MIGRATION_REVIEW_INFO: "/migration/review-info",

    CONVERSATION_LIST: "/conversations-list"
}