/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');
const Jasmine2HtmlReporter = require('protractor-jasmine2-html-reporter');

var conf = {
    my_specs: [
        // './**/annotate-project-spec copy.ts',
    ],

    ci_specs: [
        // './**/creat-text-project-spec.ts',
        // './**/annotate-project-buttons-spec.ts',
        // './**/edit-project-spec.ts',
        // './**/annotate-project-dropdown-spec.ts',
        // './**/creat-text-multiple-project-spec.ts',
        // './**/download-projects-ci-spec.ts',
        // './**/upload-new-dataset-spec.ts',
        // './**/delete-spec.ts',
    ],

    specsConst: [
        // './**/login-spec.ts',
        './**/sign-up-external-spec.ts',
        './**/login-external-spec.ts',
    ],

    specsAll: [],
}

exports.config = {
    allScriptsTimeout: 20000,//first page loading time
    // specs: conf.specsConst.concat(conf.my_specs),
    specs: conf.specsConst.concat(conf.ci_specs),
    // specs: conf.specsConst,
    capabilities: {
        'browserName': 'chrome',
        chromeOptions: {
            args: [
                'disable-dev-shm-usage',
                'window-size=1280,1024',
                'ignore-certificate-errors',
                'ignore-ssl-errors',
                'no-sandbox',
                'headless',
            ],
            prefs: {
                download: {
                    'prompt_for_download': false,
                    'directory_upgrade': true,
                    'default_directory': process.cwd() + '\/doc\/download'
                }
            }
        }
    },
    directConnect: true,
    baseUrl: 'http://localhost:4200',
    framework: 'jasmine2',
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 100000,
        print: function () { }
    },
    onPrepare() {
        require('ts-node').register({
            project: process.cwd() + '\/tsconfig.e2e.json'

        });
        jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
        jasmine.getEnv().addReporter(
            new Jasmine2HtmlReporter({
                savePath: process.cwd() + '\/doc\/reporter',
                screenshotsFolder: 'images',
                takeScreenshots: true,
                takeScreenshotsOnlyOnFailures: true,
                cleanDestination: true
            })
        );
    },
}

