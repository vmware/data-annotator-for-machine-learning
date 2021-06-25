
/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/

const fs = require('fs');
const config = require('../config/config');
const {FILEPATH} = require('../config/constant');
const compressing = require('compressing');
const path = require('path');
const mkdirp = require('mkdirp');


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
  fs.unlink(filePath);
}

async function deleteFileFolderFromLocalSys(filePath){
  await checkFileExistInLocalSys(filePath, false, true);
  fs.rmdir(filePath, {recursive: true});
}

async function checkFileExistInLocalSys(filePath, createDir, thowError, checkFile){
  const exist = fs.existsSync(filePath);
  if (!exist && createDir) {
    await fs.mkdir(filePath, {recursive: true});
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
  
  const user = req.auth.email;
  const filePath = req.query.file;

  //check file permission
  await checkFilePermission(user, filePath);
  //check file exist
  await checkFileExistInLocalSys(filePath, false, true, true);
  
  return filePath;
}


async function checkFilePermission(user, filePath) {
  if (filePath.indexOf(user) == -1) {
    throw {CODE: 4001, MSG: "PERMISSION DENIED"};
  }
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

async function unzipStreamToLocalSystem(fileStream, filePath) {
  await checkFileExistInLocalSys(filePath, true);
  await compressing.zip.uncompress(fileStream, filePath);
}

async function singleUnzipStreamToLocalSystem(filePosition, unzipFolder, statusCheck) {
  let dataSet = [];
  await checkFileExistInLocalSys(unzipFolder, true);
  await new compressing.zip.UncompressStream({source: filePosition})
    .on('entry', (header, stream, next) => {
        stream.on('end', next);

      if(header.name.startsWith("__MACOSX")){ 
        stream.resume() 
      }else if (header.type === 'file') {
        stream.pipe(fs.createWriteStream(path.join(unzipFolder, header.name)));
        dataSet.push({
          fileName: header.name,
          location: `${unzipFolder}/${header.name}`,
          fileSize: header.yauzl.uncompressedSize
        });
      } else { // directory
        mkdirp(path.join(unzipFolder, header.name), err => {
          if (err) console.error("[ UNZIP-ERROR-mkdirp ]", err);
          stream.resume();
        });
      }
  }).on('error', (err)=>{console.error("[ UNZIP-ERROR ]", err)})
    .on('finish', ()=>{ statusCheck.emit('done', dataSet)})
}



module.exports={
  checkFileExist,
  saveFileToLocalSys,
  readFileFromLocalSys,
  deleteFileFromLocalSys,
  deleteFileFolderFromLocalSys,
  checkFileExistInLocalSys,
  downloadFileFromLocalSystem,
  unzipStreamToLocalSystem,
  singleUnzipStreamToLocalSystem,
  checkFilePermission,

}