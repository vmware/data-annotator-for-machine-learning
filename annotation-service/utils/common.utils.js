
/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const LDS = require("lodash");

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
    const max = LDS.max(times);

    if(LDS.indexOf(times, max) == LDS.lastIndexOf(times, max)){
        return maxEle;
    }
    return null;

}

async function findFrequentlyElementInObject(obj) {

    const values = Object.values(obj);
    const keys = Object.keys(obj);  
    const maxV = LDS.max(values);

    if (!LDS.sum(values)) {
        return null;
    }
    // more than one max value take first
    const key = keys[LDS.indexOf(values, maxV)];
    return {[key]: obj[key]};

    //max value is only one
    // if(LDS.indexOf(values, maxV) == LDS.lastIndexOf(values, maxV)){
    //     let resp = {};
    //     resp[keys[LDS.indexOf(values, maxV)]] = obj[keys[LDS.indexOf(values, maxV)]];
    //     return resp;
    // }
    
}


async function probabilisticInObject(obj) {

    const values = Object.values(obj);
    const total = (LDS.sum(values) == 0 ? 1 : LDS.sum(values));

    let probabilistic = {};
    for (const [key,value] of Object.entries(obj)) {
        probabilistic[key] = LDS.round(LDS.divide(value, total), 2);
    }
    return probabilistic;
}

module.exports = {
    findFrequentlyElementInArray,
    findFrequentlyElementInObject,
    probabilisticInObject,
}