/*
Copyright 2019-2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require("jasmine-spec-reporter");
const Jasmine2HtmlReporter = require("protractor-jasmine2-html-reporter");
let AllureReporter = require("jasmine-allure-reporter");
let HtmlReporter = require("protractor-beautiful-reporter");
const fs = require("fs");
const path = require("path");
const nycOutput = ".nyc_output";



var conf = {
  ci_specs: [
    "./features/clear-old-e2e-projects-datasets-spec.ts",
    "./features/upload-new-dataset-and-delete-spec.ts",

    "./features/create-project-log-spec.ts",
    "./features/annotate-project-log-spec.ts",
    "./features/append-project-log-spec.ts",
    "./features/edit-project-log-spec.ts",
    "./features/preview-project-log-spec.ts",
    "./features/download-share-log-spec.ts",

    "./features/create-project-text-spec.ts",
    "./features/annotate-project-buttons-spec.ts",
    "./features/append-project-spec.ts",
    "./features/edit-text-al-project-spec.ts",
    "./features/annotate-project-dropdown-spec.ts",
    "./features/preview-text-al-project-spec.ts",

    "./features/create-tabular-project-spec.ts",
    "./features/create-tabular-numeric-project-spec.ts",
    "./features/annotate-project-tabular-numeric-spec.ts",
    "./features/edit-tabular-numeric-project-spec.ts",

    "./features/create-text-multiple-project-spec.ts",
    "./features/annotate-project-multiple-spec.ts",
    "./features/download-share-text-multiple-spec.ts",

    "./features/create-ner-labels-existing-project-spec.ts",
    "./features/annotate-project-ner-labels-existing-spec.ts",
    "./features/append-ner-project-spec.ts",
    "./features/preview-ner-project-spec.ts",

    "./features/create-image-project-spec.ts",
    "./features/annotate-project-image-spec.ts",
    "./features/append-project-image-spec.ts",
    "./features/preview-image-project-spec.ts",
    "./features/preview-image-dataset-spec.ts",

    "./features/create-multi-numeric-project-spec.ts",
    "./features/annotate-project-multi-numeric-spec.ts",
    "./features/edit-project-multi-numeric-spec.ts",

    "./features/create-hierarchical-project-spec.ts",
    "./features/annotate-project-hierarchical-label-spec.ts",
    "./features/review-project-hierarchical-label-spec.ts",
    "./features/preview-hierarchical-project-spec.ts",
    "./features/share-hierarchical-project-spec.ts",

    "./features/create-project-qa-spec.ts",
    "./features/annotate-project-qa-spec.ts",

    "./features/create-project-qa-regression-true-spec.ts",
    "./features/annotate-project-qa-regression-true-spec.ts",

    "./features/create-project-qa-chat-spec.ts",
    "./features/annotate-project-qa-chat-spec.ts",

    "./features/create-project-qa-chat-existingQA-spec.ts",
    "./features/annotate-project-qa-chat-existingQA-spec.ts",
    "./features/append-qaChat-project-spec.ts",

    "./features/delete-e2e-projects-spec.ts",
    "./features/faq-spec.ts",
  ],
  specsConstOut: [
    "./general/sign-up-spec.ts",
    "./general/logout-spec.ts",
    "./general/login-spec.ts",
    "./general/permission-spec.ts"
  ],
  specsConstIn: [
    "./general/login-spec.ts",
  ],
  poc_specs: [
    "./general/login-spec.ts",
    "./features/clear-old-e2e-projects-datasets-spec.ts",
  ],
  specsAll: [],
};

exports.config = {
  chromeDriver:'./node_modules/chromedriver/lib/chromedriver/chromedriver',
  allScriptsTimeout: 20000, //first page loading time
  specs: conf.specsConstOut.concat(conf.ci_specs),
  capabilities: {
    browserName: "chrome",
    chromeOptions: {
      args: [
        "disable-dev-shm-usage",
        "window-size=1280,1024",
        "lang=en-us",
        "ignore-certificate-errors",
        "ignore-ssl-errors",
        "no-sandbox",
        "headless",
      ],
      prefs: {
        download: {
          prompt_for_download: false,
          directory_upgrade: true,
          default_directory: require("path").join(__dirname, "/doc/download"),
        },
      },
    },
  },
  directConnect: true,
  baseUrl: process.env.IN ? process.env.BASE_URL : "http://localhost:4200/",
  framework: "jasmine",
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 100000,
    print: function () { },
  },
  async beforeLaunch() {
    await setup();
  },
  onPrepare() {
    require("ts-node").register({
      project: process.cwd() + "/tsconfig.e2e.json",
    });
    // wait ng serve complete before e2e test start
    browser.sleep(15000);
    jasmine.getEnv().addReporter(
      new SpecReporter({
        spec: { displayStacktrace: true },
        summary: { displayDuration: true },
      })
    );

    if (!fs.existsSync(nycOutput)) {
      fs.mkdirSync(nycOutput);
    }
    afterEach(async function () {
      await browser
        .executeScript("return JSON.stringify(window.__coverage__);")
        .then(function (coverage) {
          if (coverage) {
            const report = coverage.split("webpack://").join("root");
            require("fs").writeFile(
              process.cwd() +
              "/" +
              nycOutput +
              `\/coverage-${new Date().getTime()}.json`,
              report,
              function (err) {
                if (err) {
                  return console.log(err);
                }
                console.log(
                  "Coverage file extracted from server and saved to .nyc_output"
                );
              }
            );
          }
        });
    });
    // generate allure report
    jasmine.getEnv().addReporter(
      new AllureReporter({
        resultsDir: process.cwd() + "/allure-results",
      })
    );
    // generate beautiful report
    jasmine.getEnv().addReporter(
      new HtmlReporter({
        baseDirectory: process.cwd() + "/allure-results/beautifulReport",
      }).getJasmine2Reporter()
    );
    // attach screenshot to allure report for failed cases
    const originalAddExpectationResult =
      jasmine.Spec.prototype.addExpectationResult;
    jasmine.Spec.prototype.addExpectationResult = function () {
      if (!arguments[0]) {
        browser.takeScreenshot().then((png) => {
          allure.createAttachment(
            "Screenshot",
            () => {
              // return new Buffer(png, "base64");
              return Buffer.from(png, "base64");

            },
            "image/png"
          )();
        });
      }
      return originalAddExpectationResult.apply(this, arguments);
    };
  },
};
const { exec } = require("child_process");
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const setup = () => {
  return new Promise(async (resolve, reject) => {

    let loopCount = 5;
    let flag = true;
    while (flag) {
      try {
        const result = await new Promise(async (resolve2, reject) => {
          await setTimeout(() => {
            exec("forever list", async (err, stdout, stderr) => {
              if (err) {
                console.log(err);
                return;
              }
              let out = `${stdout}`;
              let reg = "uid";
              if (out.includes(reg)) {
                await sleep(8000);
                console.log(
                  "\x1B[32m%s\x1b[0m",
                  "test localhost service is started successfully"
                );
                console.log(out);
                resolve2(true);
              } else if (loopCount > 0) {
                console.log(
                  "\x1b[33m%s\x1b[0m",
                  "test localhost sevice is not started,will retry again"
                );
                loopCount--;
                console.log(out);
              } else {
                console.log(
                  "\x1b[31m%s\x1b[0m",
                  "kill starting test processs directlly due to failure of starting test localhost service"
                );
                process.exit(1);
              }
            });
          }, 5000);
        });
        if (result) {
          flag = false;
          resolve(true);
        }
      } catch (error) { }
    }
  });
};
