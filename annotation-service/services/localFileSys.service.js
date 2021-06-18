
/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const fs = require('fs');
const config = require('../config/config');
const {FILEPATH} = require('../config/constant');

async function saveFileToLocalSys(filePath, file){

  fs.writeFile(filePath, file, (err) => {
    if (err) throw {CODE: 5001, MSG: `SAVE FILE ERROR ${err}`};
  });

}
async function readFileFromLocalSys(filePath, options){
  await checkFileExistInLocalSys(filePath, false, true, true);
  return fs.createReadStream(filePath, options);
}

async function deleteFileFromLocalSys(filePath){
  await checkFileExistInLocalSys(filePath, false, true, true);
  fs.unlinkSync(filePath);
}

async function checkFileExistInLocalSys(filePath, createDir, thowError, checkFile){
  const exist = fs.existsSync(filePath);
  if (!exist && createDir) {
    fs.mkdirSync(filePath, {recursive: true});
  }
  if (!exist && thowError) {
    throw {CODE: 5002, MSG: `DIRECTORY OR FILE NOT EXIST`};
  }
  if (exist && thowError && checkFile) {
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile()) {
      throw {CODE: 5002, MSG: `INVALIDE FILE`};
    }
  }
  return exist;
}

async function downloadFileFromLocalSystem(req) {
  
  const filePath = req.query.file;
  await checkFileExistInLocalSys(filePath, false, true, true);
  
  return filePath;
}

async function checkFileExist(req) {
  const file = req.query.file;
  const user = req.auth.email;
  if (config.useLocalFileSys) {
    const path = `./${FILEPATH.UPLOAD}/${user}/${file}`;
    const exist = await checkFileExistInLocalSys(path);
    return {fileExist: exist};
  }
}

module.exports={
  checkFileExist,
  saveFileToLocalSys,
  readFileFromLocalSys,
  deleteFileFromLocalSys,
  checkFileExistInLocalSys,
  downloadFileFromLocalSystem,
}