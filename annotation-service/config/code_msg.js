module.exports={
    //OPERATION
    SUCCESS: { CODE: 200, MSG: "SUCCESS" },
    ANNOTATE_DONE: { CODE: 200, "MSG": "ANNOTATION DONE" },
    ANNOTATE_DONE: { CODE: 200, "MSG": "REVIEW DONE" },
    ERROR: { CODE: 500, MSG: "SERVER ERROR" },
    
    //401 auth related
    VALIDATION_UNAUTH: { CODE: 401, MSG: "USERNAME OR PASSWORD IS INVALID" },
    VALIDATION_ACCESS: { CODE: 401, MSG: "ACCESS DENIED" },
    VALIDATION_PERMITION: { CODE: 401, MSG: "PERMISSION DENIED"},
    VALIDATION_UNAUTH_TOKEN: { CODE: 401, MSG: 'UNABLE TO GET TOKEN FROM AUTH SERVICE' },
    
    //1000 configuration related
    VALIDATION_LDAP: { CODE: 1000, MSG: "MISSING THE LDAP AUTHORIZATION LINK" },
    VALIDATION_FILE_SYS: {CODE:1001, MSG: "NO VALID FILE SYSTEM"},

    //2000 user related
    VALIDATION_USER_EXIST: {CODE: 2000, MSG: "USER ALREADY EXIST"},
    VALIDATION_USER_EMAIL: {CODE: 2001, MSG: "USER EMAIL MUST NOT BE EMPTY"},

    //3000 tickets related
    ERROR_TK_SETDATA: { CODE: 3000, MSG: "HANDLE DATA ERROR" },
    VALIDATION_TK_USER_INPUT_PC: { CODE: 3001, MSG: "[ ERROR ] userInput[0].problemCategory" },
    VALIDATION_TK_HEADEARS: { CODE: 3002, MSG: "ERROR INPUT TICKET'S HEADERS" },
    VALIDATION_TK_MAX_ANNOTATION: { CODE: 3003, MSG: "ticket:${_id} maxAnnotation is ${maxAnnotation} already achieved" },
    

    //4000 dataset related
    VALIDATION_DS_EMPTY: { CODE: 4000, MSG: "NO DATASET FOUND" },
    VALIDATION_DS_EXIST: { CODE: 4001, MSG: "DATASET ALREADY EXIST" },
    ERROR_DS_SAVE: { CODE: 4002, MSG: "SAVE DATASETS ERROR" },
    VALIDATION_DS_PATH: {CODE: 4003, MSG: "DIRECTORY OR FILE NOT EXIST" },
    VALIDATION_DS_FILE: {CODE: 4004, MSG: "INVALIDE FILE" },
    VALIDATION_DS_USING: { CODE: 4005, MSG: "DATA-SET USING BY: [${pnames}], PLEASE REMOVE THE PROJECTS FIRST." },
    VALIDATION_DS_FILE_FORMAT: { CODE: 4006, MSG: "FILE FORMAT NOT SUPPORTED" },

    //5000 project related
    VALIDATATION_PJ_ID_ROUTER: { CODE: 5001, MSG: "ERROR ID or src" },
    VALIDATATION_PJ_OWNER: { CODE: 5002, MSG: "PROJECT OWNER CAN'T BE EMPTY" },
    VALIDATATION_PJ_ORIGIN_LB: { CODE: 5003, MSG: "INPUT originLB ERROR" },
    VALIDATATION_PJ_EDIT_LB_EXIST: { CODE: 5004, MSG: "INPUT editLB already exist" },
    VALIDATATION_PJ_ORIGIN_LB_MAX_MIN: { CODE: 5005, MSG: "INPUT originLB min/max ERROR" },
    VALIDATATION_PJ_EDIT_LB_MAX_MIN: { CODE: 5006, MSG: "INPUT editLB min/max ERROR" },
    VALIDATATION_PJ_ADD_LB_MAX_MIN: { CODE: 5007, MSG: "INPUT addLabels min/max ERROR" },
    VALIDATATION_PJ_MAX_MIN: { CODE: 5008, MSG: "INPUT MIN/MAX ERROR" },
    VALIDATATION_PJ_EDIT_LB: { CODE: 5009, MSG: "INPUT EDITlABELS ERROR" },
    VALIDATATION_PJ_LB: { CODE: 5010, MSG: "LABEL NOT EXIST" },
    VALIDATATION_PJ_LB_ANNOTATED: { CODE: 5011, MSG: "LABEL HAS BEEN ANNOTATED" },
    VALIDATATION_PJ_LB_DEL: { CODE: 5012, MSG: "LABEL CAN BE DELETE" },
    VALIDATATION_PJ_LABEL: { CODE: 5013, MSG: "LABEL SHOULD NOT CONTAINS IN COLUMNS" },
    VALIDATATION_PJ_EMPTY: { CODE: 5014, MSG: "NO PROJECT FOUND" },
    VALIDATATION_PJ_EXIST: { CODE: 5015, MSG: "PROJECT EXIST" },
    VALIDATATION_PJ_FORMAT: {CODE: 5016, MSG: "ERROR PROJECT FORMAT"},

    //9000 common related
    VALIDATATION_INPUT: { CODE: 9000,  MSG: "INPUT FILED INVALIDE" },
    VALIDATATION_OPERATION: { CODE: 9001,  MSG: "INVALIDE OPERATION" },
    ERROR_DATABASE: { CODE: 9090,  MSG: "DATA BASE OPERATION ERROR" },

}