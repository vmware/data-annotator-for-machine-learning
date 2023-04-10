const fs = require('fs');
const fse = require('fs-extra');
const concat = require('concat');

const bundleFileName = 'micro-bundle-loop.js';
const path = './dist/';
const filesToConcat = [];

const buildFiles = fs.readdirSync(path);
for (const file of buildFiles) {
  if ((file.includes('main') || file.includes('src_app_') || file.includes('scripts') || file.includes('vendors-')) && !(file.includes('.map'))) {
    filesToConcat.push(path + file);
  }
}

(async function build() {
  await fse.ensureDir('elements');
  await concat(filesToConcat, 'elements/' + bundleFileName);
})();