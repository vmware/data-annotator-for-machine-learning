/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const userDB = require('../db/user-db');
const { ROLES } = require('../config/constant');
const validator = require('../utils/validator');
const config = require('../config/config');


async function getAllusers(req) {
    await validator.checkUserRole(req.auth.email, ROLES.ADMIN);
    console.log('[ USER ] service getAllusers');
    return userDB.queryUserByCondition({});
}

async function saveUser(req) {
    
    if (config.ESP) {
        await validator.checkUserRole(req.auth.email, ROLES.ADMIN);
    }else{
        if (!req.body.email || !req.body.password) {
            throw{CODE: 401, MSG: "USERNAME OR PASSWORD IS EMPTY"}
        }
    }
    console.log('[ USER ] service saveUser find user if exist');
    const user = await userDB.queryUserById(req.body.email);
    if (user) {
        throw{CODE: 4003, MSG: "USER ALREADY EXIST"}
    }
    //save user
    console.log('[ USER ] service user not exist');
    let schema = {
        _id: req.body.email,
        email: req.body.email,
        fullName: req.body.uname,
        createdDate: Date.now()
    };
    if (!req.body.uname) {
        schema.fullName = req.body.email.split("@")[0];
    }
    if (req.body.password) {
        schema.password = Buffer.from(req.body.password).toString("base64");
    }
    if (req.body.role) {
        schema.password = req.body.role;
    }
    const flag = config.adminDefault.indexOf(req.body.email);
    if (flag != -1) {
        schema.role = 'Admin';
    }
    console.log(`[ USER ] service saveUser ${req.body.email} info when first time login`);
    return userDB.saveUser(schema);
}

async function deleteUser(req) {
    await validator.checkUserRole(req.auth.email, ROLES.ADMIN);
    console.log('[ USER ] service deleteUser ID: ', req.body.uid);
    await userDB.deleteUserById(req.body.uid);
}

async function updateUserRole(req) {
    
    await validator.checkUserRole(req.auth.email, ROLES.ADMIN);

    console.log('[ USER ] service updateUserRole user: ', req.auth.email);
    let conditions = { _id: req.body.user };
    let update = { $set: { role: req.body.role, createdDate: Date.now() } };
    let options = { new: true };
    return userDB.findUpdateUser(conditions, update, options);

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
    let userData = await userDB.aggregateUserData(schema);
    return userData[0].ranking + 1;
}

async function getUserLeaders(req) {
    console.log('[ USER ] service getUserLeaders');
    const limit = parseInt(req.params.limit, 10);
    return await userDB.sortAndLimtUser({}, "-points", limit);
}

async function getUserPoint() {
    console.log('[ USER ] service getUserPoint');
    const schema = [{
        $group: {
            _id: "_id",
            totalpoints: { $sum: "$points" },
        }
    }];
    let userData = await userDB.aggregateUserData(schema);
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
            const update = { $set: { fullName: req.auth.name } };
            return userDB.findUpdateUser(conditions, update, options);
        }
        return user;
        
    }else{
        console.log('[ USER ] service user not exist');
        let schema = {
            _id: req.auth.email,
            email: req.auth.email,
            fullName: req.auth.name,
            createdDate: Date.now()
        };
        const flag = config.adminDefault.indexOf(req.auth.email);
        if (flag != -1) {
            schema.role = 'Admin';
        }
        return userDB.saveUser(schema);
    }
}

async function queryUserById(uid){
    console.log('[ USER ] service queryUserById: ', uid);
    return userDB.queryUserById({ _id: uid });
}

async function queryAndUpdateUser(email, userName){
    if (!email) {
        throw{CODE: 4001, MSG: "email must not be empty"};
    }
    const user = await userDB.queryUserById(email);
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
        await userDB.saveUser(schema);

        return userDB.queryUserById(email);
    }
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
}