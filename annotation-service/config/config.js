/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const sysEnv = process.env.SYS_ENV || "local";
const app = require(`./app-${sysEnv}`);

module.exports = app

console.log('----------------------------------------------------------------------------------------');
console.log(`[ CONFIG ]  [ SYS_ENV ]=${ sysEnv }  [app]=`, module.exports);
console.log('----------------------------------------------------------------------------------------');
