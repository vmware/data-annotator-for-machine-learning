/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const { ROLES } = require('../config/constant');
const validator = require('../utils/validator');
const config = require('../config/config');
const mongoDb = require('../db/mongo.db');
const { UserModel } = require('../db/db-connect');
const MESSAGE = require('../config/code_msg');

async function getAllusers(req) {
    await validator.checkUserRole(req.auth.email, ROLES.ADMIN);
    console.log('[ USER ] service getAllusers');
    return mongoDb.findByConditions(UserModel, {});
}

async function saveUser(req) {
    
    if (config.ESP) {
        await validator.checkUserRole(req.auth.email, ROLES.ADMIN);
    }
    const users = req.body;
    for (const u of users) {
        if (!config.ESP && (!u.email || !u.password)) {
            throw MESSAGE.VALIDATION_UNAUTH;
        }
        console.log('[ USER ] service saveUser find user if exist');
        const user = await mongoDb.findById(UserModel, u.email);
        
        if (user) {
            if (!user.manul) {
                throw MESSAGE.VALIDATION_USER_EXIST;
            }
            //user set by manul already
            const conditions = {_id: u.email};
            const options = {new: true};
            let update = {
                $set: {
                    fullName: u.uname?u.uname: u.email.split("@")[0],
                    manul: false,
                }
            };
            if (u.password) {
                update.$set.password = Buffer.from(u.password).toString("base64");
            }
            if (u.role) {
                update.$set.role = u.role;
            }
            await mongoDb.findOneAndUpdate(UserModel, conditions, update, options);
        }

        let schema = {
            _id: u.email,
            email: u.email,
            fullName: u.uname,
            createdDate: Date.now(),
            updateDate: Date.now(),
        };
        if (!u.uname) {
            schema.fullName = u.email.split("@")[0];
        }
        if (u.password) {
            schema.password = Buffer.from(u.password).toString("base64");
        }
        if (u.role) {
            schema.role = u.role;
        }
        const flag = config.adminDefault.indexOf(u.email);
        if (flag != -1) {
            schema.role = ROLES.ADMIN;
        }
        
        console.log(`[ USER ] service saveUser ${u.email} info when first time login`);
        await mongoDb.saveBySchema(UserModel, schema);
    }
}

async function deleteUser(req) {
    await validator.checkUserRole(req.auth.email, ROLES.ADMIN);
    console.log('[ USER ] service deleteUser ID: ', req.body.uid);
    await mongoDb.removeByConditions(UserModel, {_id: req.body.uid});
}

async function updateUserRole(req) {
    
    await validator.checkUserRole(req.auth.email, ROLES.ADMIN);

    console.log('[ USER ] service updateUserRole user: ', req.auth.email);
    let conditions = { _id: req.body.user };
    let update = { $set: { 
        role: req.body.role, 
        updateDate: Date.now(),
    } };
    let options = { new: true };
    return mongoDb.findOneAndUpdate(UserModel, conditions, update, options);

}


async function getUserRank(req) {
    console.log('[ USER ] service ugetUserRank ID: ', req.params.uid);
    const schema = [{ $sort: { points: -1 } },
        {
            $group: {
                _id: false,
                users: {
                    $push: {
                        _id: "$_id",
                        email: "$email",
                        points: "$points"
                    }
                }
            }
        }, {
            $unwind: {
                path: "$users",
                includeArrayIndex: "ranking"
            }
        }, {
            $match: {
                "users._id": req.params.uid
            }
        }
    ];
    let userData = await mongoDb.aggregateBySchema(UserModel, schema);
    return userData[0].ranking + 1;
}

async function getUserLeaders(req) {
    console.log('[ USER ] service getUserLeaders');
    const limit = parseInt(req.params.limit, 10);
    return mongoDb.findSortAndLimitByConditions(UserModel, {}, "-points", limit);
}

async function getUserPoint() {
    console.log('[ USER ] service getUserPoint');
    const schema = [{
        $group: {
            _id: "_id",
            totalpoints: { $sum: "$points" },
        }
    }];
    let userData = await mongoDb.aggregateBySchema(UserModel, schema);
    return userData[0].totalpoints;
}

async function getUserRoleById(req) {
    console.log('[ USER ] service getUserRoleById ID: ', req.auth.email);
    const user = await queryUserById(req.auth.email);
    
    if (user) {
        if (req.auth.name && user.fullName != req.auth.name) {
            console.log('[ USER ] service update user fullName');
            const conditions = { _id: req.auth.email };
            const options = { new: true };
            const update = { $set: { 
                fullName: req.auth.name,
                updateDate: Date.now(),
            } };
            return mongoDb.findOneAndUpdate(UserModel, conditions, update, options);
        }
        return user;
        
    }else{
        console.log('[ USER ] service user not exist');
        let schema = {
            _id: req.auth.email,
            email: req.auth.email,
            fullName: req.auth.name,
            createdDate: Date.now(),
            updateDate: Date.now(),
        };
        const flag = config.adminDefault.indexOf(req.auth.email);
        if (flag != -1) {
            schema.role = 'Admin';
        }
        return mongoDb.saveBySchema(UserModel, schema);
    }
}

async function queryUserById(uid){
    console.log('[ USER ] service queryUserById: ', uid);
    return mongoDb.findById(UserModel, uid);
}

async function queryAndUpdateUser(email, userName){
    if (!email) {
        throw MESSAGE.VALIDATION_USER_EMAIL;
    }
    const user = await mongoDb.findById(UserModel, email);
    if (user) {
        return user;
    }else{
        let schema = {
            _id: email,
            email: email,
            fullName: userName,
            createdDate: Date.now()
        };
        if (!userName) {
            schema.fullName = email.split("@")[0];
        }
        const flag = config.adminDefault.indexOf(email);
        if (flag != -1) {
            schema.role = 'Admin';
        }
        await mongoDb.saveBySchema(UserModel, schema);

        return mongoDb.findById(UserModel, email);
    }
}

async function saveUserDashboard(req) {
    const dashboard = req.body.dashboard;
    const email = req.auth.email;
    
    console.log('[ USER ] service saveUserDashboard check user exist: ', email);
    const user = await mongoDb.findById(UserModel, email);
    if (!user) {
        throw MESSAGE.VALIDATION_USER_NO_EXIST;
    }
  
    const now = Date.now();
    const conditions = {_id: email};
    const options = {new: true};
    
    let update = {
        $set: {
            "dashboard.updateDate": now,
            "dashboard.data": dashboard,
        }
    };
    if (!user.dashboard.createdDate) {
        update.$set["dashboard.createdDate"] = now;
    }
    
    console.log('[ USER ] service saveUserDashboard update dashboard: ', email);
    return mongoDb.findOneAndUpdate(UserModel, conditions, update, options);
}

module.exports = {
    getAllusers,
    saveUser,
    deleteUser,
    updateUserRole,
    getUserRank,
    getUserLeaders,
    getUserPoint,
    getUserRoleById,
    queryUserById,
    queryAndUpdateUser,
    saveUserDashboard,
    
}