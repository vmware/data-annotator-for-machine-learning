
/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/
const _ = require("lodash");



async function generateObj(type, text, style, value, action_id, block_id) {
    let obj = {
        "type": type,
        "text": text,
        "style": style,
        "value": value,
        "action_id": action_id,
        "block_id": block_id

    }
    return obj
}


async function returnAllPageFunc(pageSize, arr) {
    let pageNum = 1
    let pageObj = {
        pageSize,
        total: arr.length,
        pageNum: 1,
        data: []
    }
    let pageResult = []

    let newArr = _.cloneDeep(arr);
    let totalPage = newArr.length ? Math.ceil(arr.length / pageSize) : 0

    for (let i = 1; i <= totalPage; i++) {
        if (totalPage == 1) {
            pageNum += 1
            pageObj.data = newArr.splice(0, arr.length)
        } else if (i <= totalPage) {
            pageNum += 1
            pageObj.data = newArr.splice(0, pageSize)
        } else {
            pageObj.data = newArr.splice(0, arr.length % pageSize)
        }
        pageResult.push(pageObj)
        pageObj = {
            pageSize,
            total: arr.length,
            pageNum: pageNum,
            data: []
        }
    }
    return pageResult
}

module.exports = {
    generateObj,
    returnAllPageFunc
}
