/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const config = require('../config/config');
const { USER_ROLE } = require('../config/constant');
const mongoose = require("mongoose"),
    Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

// MongoDB database name
mongoose.connect(config.mongoDBUrl, { autoIndex: false });

// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "[ ERROR ] [ DB ] connection errors"));

mongoose.set('useFindAndModify', false);

/**
 * Create mongoose SR schema for all cases
 */
const srSchema = new mongoose.Schema({
    projectName: { type: String },
    userInputsLength: { type: Number },
    userInputs: [],
    originalData: { type: Object },
    flag: {
        users: [],
        silence: { type: Boolean, default: false }
    },
    text_vector: { type: String },
    al_test: { type: Boolean }
}, { _id: true });
srSchema.set("toJSON", { virtuals: true });
srSchema.index({ projectName: 1 });
srSchema.index({ "flag.users": 1 });
srSchema.plugin(mongoosePaginate);

// create SR model
const SrModel = mongoose.model("SR", srSchema);


/**
 * Create mongoose image tickets schema for all cases
 */
const imgSchema = new mongoose.Schema({
    projectName: { type: String },
    userInputsLength: { type: Number },
    userInputs: [],
    originalData: { type: Object },
    flag: {
        users: [],
        silence: { type: Boolean, default: false }
    }
}, { _id: true });
imgSchema.set("toJSON", { virtuals: true });
imgSchema.index({ projectName: 1 });
imgSchema.index({ "flag.users": 1 });
imgSchema.plugin(mongoosePaginate);

// create Image model
const ImgModel = mongoose.model("IMAGE", imgSchema);

/**
 * Create mongoose image tickets schema for all cases
 */
const logSchema = new mongoose.Schema({
    projectName: { type: String },
    userInputsLength: { type: Number },
    userInputs: [],
    originalData: { type: Object },
    fileInfo:{ type: Object },
    flag: {
        users: [],
        silence: { type: Boolean, default: false }
    }
}, { _id: true });
logSchema.set("toJSON", { virtuals: true });
logSchema.index({ projectName: 1 });
logSchema.index({ "flag.users": 1 });
logSchema.plugin(mongoosePaginate);

// create Image model
const LogModel = mongoose.model("LOG", logSchema);

/**
 * Create mongoose User schema
 */
const userSchema = new mongoose.Schema({
    _id: { type: String },
    email: { type: String },
    password: {type: String},
    fullName: { type: String },
    points: { type: Number, default: 0 },
    role: { type: String, default: USER_ROLE },
    createdDate: { type: String, default: Date.now() }
}, { _id: false });
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// create User model
const UserModel = mongoose.model("User", userSchema);


/**
 * Create mongoose Annotation Project Name schema
 */
const projectSchema = new mongoose.Schema({
    creator: { type: Array },
    createdDate: { type: String },
    updatedDate: { type: String },
    projectName: { type: String },
    taskInstructions: { type: String },
    totalCase: { type: Number },
    projectCompleteCase: { type: Number },
    userCompleteCase: [{
        user: { type: String },
        completeCase: { type: Number, default: 0 },
        skip: { type: Number, default: 0 },
    }],
    maxAnnotation: { type: Number },
    categoryList: { type: String },
    assignmentLogic: { type: String },
    annotator: { type: Array },
    dataSource: { type: String },
    selectedDataset: { type: String },
    selectedColumn: { type: Array },
    annotationQuestion: { type: String },
    shareStatus: { type: Boolean },
    shareDescription: { type: String },
    generateInfo: {
        status: { type: String, default: "pending" },
        messageId: { type: String },
        startTime: { type: String },
        updateTime: { type: String },
        file: { type: String },
        format: { type: String, default: "standard" },
        onlyLabelled: { type: String}
    },
    fileSize: { type: Number, default: 0 },
    appendSr: { type: String, default: "pending" },
    labelType: { type: String },
    projectType: { type: String },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    downloadCount: {
        community: { type: Number }
    },
    al: {
        labelID: { type: Object },
        model: { type: String },
        vectorModel: { type: String },
        newLBSr: { type: Array },
        queriedSr: [ { type: Schema.Types.ObjectId } ],
        frequency: { type: Number, default: 10 },
        trigger: { type: Number, default: 50 },
        trained: { type: Boolean, default: false },
        alFailed: { type: Boolean, default: false },
        training: { type: Boolean, default: false },
        querying: { type: Boolean, default: false },
        teaching: { type: Boolean, default: false },
        accuracy: { type: Array },
        estimator: { type: String },
        numberColumn: { type: Array },
        objectColumn: { type: Array }
    },
    encoder: { type: String },
    isMultipleLabel: { type: Boolean, default: false }

}, { _id: true });
projectSchema.index({ projectName: 1 });
projectSchema.set("toJSON", { virtuals: true });

// create Annotation Project model
const ProjectModel = mongoose.model("Project", projectSchema);

//dataSet Model
const dataSetSchema = new mongoose.Schema({
    dataSetName: { type: String },
    fileName: { type: String },
    fileKey: { type: String },
    user: { type: String },
    description: { type: String },
    topReview: { type: Object },
    hasHeader: { type: String },
    location: { type: String },
    format: { type: String },
    fileSize: { type: Number },
    createTime: { type: String },
    updateTime: { type: String, default: Date.now() },
    columnInfo: [{
        name: { type: String },
        type: { type: String },
        uniqueLength: { type: Number }
    }],
    images:[{
        fileName: { type: String },
        location: { type: String },
        fileSize: { type: Number },
    }]
});
dataSetSchema.set("toJSON", { virtuals: true });
dataSetSchema.index({ dataSetName: 1 });

const DataSetModel = mongoose.model("DataSet", dataSetSchema);


module.exports = {
    SrModel,
    ImgModel,
    LogModel,
    UserModel,
    ProjectModel,
    DataSetModel,
    db,

}