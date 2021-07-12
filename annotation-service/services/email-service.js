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
const { ACCESS_TIME_15 } = require('../config/constant')
const nodemailer = require("nodemailer");

//email template
const OwnerTemp = fs.readFileSync(
    path.join(__dirname, "../resources/template-owner.html"), "utf8"
);
const annotatorTemp = fs.readFileSync(
    path.join(__dirname, "../resources/template-annotator.html"), "utf8"
);
const generaterTemp = fs.readFileSync(
    path.join(__dirname, "../resources/template-generater.html"), "utf8"
);

async function sendEmailToOwner(req) {
    const subject = req.body.pname + " has been created successfully";
    const htmlTemplate = OwnerTemp.replace("${hostname}", config.WebClientUrl).replace("${projectName}", req.body.pname).replace("${fileName}", req.body.fileName);

    console.log(`[ EMAIL ] Service sendEmailToOwner`);
    return await sendEmail(subject, htmlTemplate, req.body.projectOwner);
};

async function sendEmailToAnnotator(req) {
    const subject = req.body.pname + " has been assigned to you";
    const htmlTemplate = annotatorTemp.replace("${hostname}", config.WebClientUrl).replace("${projectOwner}", req.auth.email).replace("${projectName}", req.body.pname);

    console.log(`[ EMAIL ] Service sendEmailToAnnotator`);
    return await sendEmail(subject, htmlTemplate, req.body.annotator);
};

async function sendGenerationEmailToOwner(user, fileName) {
    const subject =  `Your dataset ${fileName} is ready for download`;
    const htmlTemplate = generaterTemp.replace("${hostname}", config.WebClientUrl).replace("${fileName}", fileName);
    
    console.log(`[ EMAIL ] Service sendGenerationEmailToOwner`);
    return await sendEmail(subject, htmlTemplate, [user]);
};



async function sendEmail(subject, htmlTemplate, toAddresses) {
    if (config.ESP) {
        htmlTemplate = htmlTemplate.replace(/\${team}/g, config.teamTitle);
        let toList = [];
        for (const email of toAddresses) {
            toList.push({address: email});
        }
        
        console.log(`[ EMAIL ] Service sendEmailToOwner.getEsp2NoeToken`);
        const emailToken = await authForNoe.getEsp2NoeToken();
        
        return await axios.post(`${config.noeServiceUrl}/noe/send/message`, {
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
        if (!config.enableEmail) {
            return
        }
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
            
            return await new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(sendParams).promise();  
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
            
            return await transporter.sendMail({
                from: config.sender,            // sender address
                to: toAddresses.toString(),     // list of receivers
                subject: subject,               // Subject line
                html: htmlTemplate              // html body
            });
        }   
    }
}


module.exports = {
    sendEmailToOwner,
    sendEmailToAnnotator,
    sendGenerationEmailToOwner,
    sendEmail,
    
}