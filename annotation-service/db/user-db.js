/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const { UserModel } = require("./db-connect");

async function queryUserByCondition(condition){
    console.log('[ USER ] DB begin queryUserByCondition');
    return await UserModel.find(condition, function(error, result){
        if(error){       
            console.error('[ USER ] [ ERROR ] DB queryUserByCondition fail with: ', error );
            throw error
        }
        console.log('[ USER ] DB queryUserByCondition succefully');
        return result;
    });
}

async function queryUserById(conditions){
    console.log('[ USER ] DB begin queryUserById');
    return await UserModel.findById(conditions, function(error, result){
        if(error){       
            console.error('[ USER ] [ ERROR ] DB queryUserById fail with: ', error );
            throw error
        }
        console.log('[ USER ] DB queryUserById succefully');
        return result;
    });
}

async function findUpdateUser(conditions, update, options){
    console.log('[ USER ] DB begin findUpdateUser');
    return await UserModel.findOneAndUpdate(conditions, update, options).then(function (result, error){
        if(error){
            console.error('[ USER ] [ ERROR ] DB findUpdateUser fail with: ', error );
            throw error;
        }
        console.log('[ USER ] DB findUpdateUser succefully');
        return result;
    });
}

async function sortAndLimtUser(conditions, sort, limit){
    console.log('[ USER ] DB begin sortAndLimtUser');
    return await UserModel.find(conditions).sort(sort).limit(limit).exec().then(function(result, error){
        if(error){
            console.error('[ USER ] [ ERROR ] DB sortAndLimtUser fail with: ', error );
            throw error;
        }
        console.log('[ USER ] DB sortAndLimtUser succefully');
        return result;
    });
}

async function deleteUserById(id){
    console.log('[ USER ] DB begin deleteUserById');
    return await UserModel.remove({ _id: id }, function (error, result) {
        if(error){
            console.error('[ USER ] [ ERROR ] DB deleteUserById fail with: ', error );
            throw error;
        }
        console.log('[ USER ] DB deleteUserById succefully');
        return result;
    });
}

async function saveUser(schema){
    console.log('[ USER ] DB begin saveUser');
    let user = await new UserModel(schema);
    return await user.save().then(function(result,error){
        if(error){
            console.error('[ USER ] [ ERROR ] DB saveUser fail with: ', error );
            throw error;
        }
        console.log('[ USER ] DB saveUser succefully');
        return result;
    });
}

async function aggregateUserData(schema){
    console.log('[ USER ] DB begin aggregateUserData');
    return await UserModel.aggregate(schema).then(function(result, error){
        if(error || !result.length){
            console.error('[ USER ] [ ERROR ] DB aggregateUserData fail with: ', error );
            throw error;
        }
        console.log('[ USER ] DB aggregateUserData succefully');
        return Promise.resolve(result);
    });

}

module.exports = {
    queryUserByCondition,
    queryUserById,
    findUpdateUser,
    sortAndLimtUser,
    deleteUserById,
    saveUser,
    aggregateUserData,
    
}