
/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const _ = require("lodash");

//Find the most frequent element in the array
async function findFrequentlyElementInArray(arr) {

    let maxEle;
    let maxNum=1;
    const obj = arr.reduce(function (p,k) {
        p[k]?p[k]++:p[k]=1;
        if(p[k] >= maxNum){
            maxEle=k;
            maxNum++;
        }
        return p;
    },{})

    const times = Object.values(obj);    
    const max = _.max(times);

    if(_.indexOf(times, max) == _.lastIndexOf(times, max)){
        return maxEle;
    }
    return null;

}

async function findFrequentlyElementInObject(obj) {

    const values = Object.values(obj);
    const keys = Object.keys(obj);  
    const maxV = _.max(values);

    if (!_.sum(values)) {
        return null;
    }
    // more than one max value take first
    const key = keys[_.indexOf(values, maxV)];
    return {[key]: obj[key]};

    //max value is only one
    // if(_.indexOf(values, maxV) == _.lastIndexOf(values, maxV)){
    //     let resp = {};
    //     resp[keys[_.indexOf(values, maxV)]] = obj[keys[_.indexOf(values, maxV)]];
    //     return resp;
    // }
    
}


async function probabilisticInObject(obj) {

    const values = Object.values(obj);
    const total = (_.sum(values) == 0 ? 1 : _.sum(values));

    let probabilistic = {};
    for (const [key,value] of Object.entries(obj)) {
        probabilistic[key] = _.round(_.divide(value, total), 2);
    }
    return probabilistic;
}

module.exports = {
    findFrequentlyElementInArray,
    findFrequentlyElementInObject,
    probabilisticInObject,
}