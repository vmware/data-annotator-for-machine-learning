/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const axios = require("axios");
const fs = require("fs");
const path = require("path");
const authForNoe = require("../utils/authForNoe.service");
const config = require("../config/config");
const AWS = require('aws-sdk');
const STS = require('../utils/sts');
const { ACCESS_TIME_15, API_VERSION } = require('../config/constant')
const nodemailer = require("nodemailer");
const APIs = require('../resources/APIs');

//email template
const OwnerTemp = fs.readFileSync(path.join(__dirname, "../resources/template-owner.html"), "utf8");
const annotatorTemp = fs.readFileSync(path.join(__dirname, "../resources/template-annotator.html"), "utf8");
const generaterTemp = fs.readFileSync(path.join(__dirname, "../resources/template-generater.html"), "utf8");
const notStartTemp = fs.readFileSync(path.join(__dirname, "../resources/template-notStart.html"), "utf8");
const notFinishTemp = fs.readFileSync(path.join(__dirname, "../resources/template-notFinish.html"), "utf8");

async function sendEmailToOwner(req) {
    const subject = req.body.pname + " has been created successfully";
    const htmlTemplate = OwnerTemp.replace("${hostname}", config.WebClientUrl)
        .replace("${projectName}", req.body.pname)
        .replace("${fileName}", req.body.fileName);

    console.log(`[ EMAIL ] Service sendEmailToOwner`);
    return sendEmail(subject, htmlTemplate, req.body.projectOwner);
};

async function sendEmailToAnnotator(req) {
    const subject = req.body.pname + " has been assigned to you";
    const htmlTemplate = annotatorTemp.replace("${hostname}", config.WebClientUrl)
        .replace("${projectOwner}", req.auth.email)
        .replace("${projectName}", req.body.pname);

    console.log(`[ EMAIL ] Service sendEmailToAnnotator`);
    return sendEmail(subject, htmlTemplate, req.body.annotator);
};

async function sendGenerationEmailToOwner(user, fileName) {
    const subject =  `Your dataset ${fileName} is ready for download`;
    const htmlTemplate = generaterTemp.replace("${hostname}", config.WebClientUrl)
        .replace("${fileName}", fileName);
    
    console.log(`[ EMAIL ] Service sendGenerationEmailToOwner`);
    return sendEmail(subject, htmlTemplate, [user]);
};

async function sendNotStartLabelingNotificationEmail(user, projectName, projectOwner, assignedDate) {
    const subject =  `Start your data annotation`;
    const htmlTemplate = notStartTemp.replace(/\${user}/g, user)
        .replace(/\${projectName}/g, projectName)
        .replace(/\${serviceHost}/g, config.annotationServiceUrl)
        .replace(/\${apiVersion}/g, API_VERSION)
        .replace(/\${notification}/g, APIs.EMAIL_REGULAR_NOTIFICATION)
        .replace("${projectOwner}", projectOwner)
        .replace("${assignedDate}", assignedDate)
        .replace("${hostname}", config.WebClientUrl);

    console.log(`[ EMAIL ] Service sendNotStartLabelingNotificationEmail`);
    return sendEmail(subject, htmlTemplate, [user]);
};

async function sendNotFinishLabelingNotificationEmail(user, projectName, projectOwner, assignedDate) {
    const subject =  `Complete your ${config.teamTitle} Data Annotation Task`;
    const htmlTemplate = notFinishTemp.replace(/\${user}/g, user)
        .replace(/\${projectName}/g, projectName)
        .replace(/\${serviceHost}/g, config.annotationServiceUrl)
        .replace(/\${apiVersion}/g, API_VERSION)
        .replace(/\${notification}/g, APIs.EMAIL_REGULAR_NOTIFICATION)
        .replace("${projectOwner}", projectOwner)
        .replace("${assignedDate}", assignedDate)
        .replace("${hostname}", config.WebClientUrl);

    console.log(`[ EMAIL ] Service sendNotFinishLabelingNotificationEmail`);
    return sendEmail(subject, htmlTemplate, [user]);
};


async function sendEmail(subject, htmlTemplate, toAddresses) {
    const enable = await isEnableEamil();
    if(!enable){
        return;
    }
    if (config.ESP) {
        htmlTemplate = htmlTemplate.replace(/\${team}/g, config.teamTitle);
        let toList = [];
        for (const email of toAddresses) {
            toList.push({address: email});
        }
        
        console.log(`[ EMAIL ] Service sendEmailToOwner.getEsp2NoeToken`);
        const emailToken = await authForNoe.getEsp2NoeToken();
        
        return axios.post(`${config.noeServiceUrl}/noe/send/message`, {
            subject: subject,
            content: { html: htmlTemplate },
            from: { address: config.sender },
            destinations: { toList: toList },
            options: { foreach: ["true"] }
        }, { 
            headers: { "x-noe-auth-type": "jwt-esp" },
            auth: { username: config.esp2NoeClientId, password: emailToken }
        });

    }else{
        htmlTemplate = htmlTemplate.replace(/\${team}/g, config.teamTitle);
        if (config.useAWSSES) {
            const data = await STS.prepareCredentials(AWSRESOURCE.S3, ACCESS_TIME_15);
            await AWS.config.update({
                region: config.region,
                accessKeyId: data.Credentials.AccessKeyId,
                secretAccessKey:data.Credentials.SecretAccessKey,
                sessionToken:data.Credentials.SessionToken
            });
            
            const sendParams = { 
                Source: config.sender, 
                Destination: { ToAddresses: toAddresses },
                Message: { 
                    Body: { Html: { Charset: "UTF-8", Data: htmlTemplate } },
                    Subject: { Charset: 'UTF-8', Data: subject }
                }
            };
            
            return new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(sendParams).promise();  
        }else{
            const transporter = nodemailer.createTransport({
                host: config.emailServerHost,
                port: config.emailServerPort,
                secure: config.emailServerPort == 465 ? true: false, // true for 465, false for other ports
                auth: {
                    user: config.sender,        // generated ethereal user
                    pass: config.emailPassword, // generated ethereal password
                }
            });
            
            return transporter.sendMail({
                from: config.sender,            // sender address
                to: toAddresses.toString(),     // list of receivers
                subject: subject,               // Subject line
                html: htmlTemplate              // html body
            });
        }   
    }
}

async function isEnableEamil(){

    if(config.ESP){
        return true;
    }
    if (!config.enableEmail) {
        return false;
    }
    const awsEmail = config.useAWSSES && config.sender;
    const hostEmail = config.sender && config.emailPassword && config.emailServerHost && config.emailServerPort;
    const ossEmail = awsEmail || hostEmail;
    if(ossEmail){
        return true;
    }
    return false;
}

module.exports = {
    sendEmailToOwner,
    sendEmailToAnnotator,
    sendGenerationEmailToOwner,
    sendEmail,
    isEnableEamil,
    sendNotStartLabelingNotificationEmail,
    sendNotFinishLabelingNotificationEmail,
}