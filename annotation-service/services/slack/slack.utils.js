
/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/



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

module.exports = {
    generateObj
}
