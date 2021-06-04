
const {FILEPATH} = require('../config/constant');
const fs = require('fs');

async function saveFileToLocalSys(filePath, file){

  fs.writeFile(filePath, file, (err) => {
    if (err) throw {CODE: 5001, MSG: `SAVE FILE ERROR ${err}`};
  });

}
async function readFileFromLocalSys(filePath){
  await checkFileExistInLocalSys(filePath, false, true, true);
  return fs.createReadStream(filePath);
}

async function deleteFileFromLocalSys(filePath){
  await checkFileExistInLocalSys(filePath, false, true, true);
}

async function checkFileExistInLocalSys(filePath, createDir, thowError, checkFile){
  const exist = fs.existsSync(filePath);
  if (!exist && createDir) {
    fs.mkdirSync(filePath);
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

module.exports={
  saveFileToLocalSys,
  readFileFromLocalSys,
  deleteFileFromLocalSys,
  checkFileExistInLocalSys,
}