/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
var gulp = require("gulp");
var clean = require("gulp-clean");
var run = require("gulp-run-command").default;

gulp.task(
  "clean",
  gulp.series(
    async () => {
      gulp
        .src("coverage-output/*", {
          read: false,
        })
        .pipe(clean());
    },
    async () => {
      gulp
        .src(".nyc_output/*", {
          read: false,
        })
        .pipe(clean());
    }
  )
);

gulp.task("copy", async () => {
  gulp.src("../annotation-app/dist/**/*").pipe(gulp.dest("dist/"));
});

gulp.task(
  "instrument",
  gulp.series(
    "copy",
    run(
      "node --max-old-space-size=4096 node_modules/nyc/bin/nyc.js instrument dist coverage-output/annotation-app --exclude-after-remap=false --exclude=dist/libs/** --exclude=dist/vendor.js --exclude=dist/styles.js --exclude=dist/polyfills.*.js"
    ),
    async () => {
      gulp.src("coverage-output/annotation-app/*").pipe(gulp.dest("dist/"));

    },
    async () => {
      gulp.src("../annotation-app/src/**/*").pipe(gulp.dest("dist/root/src/"));
    }
  )
);

gulp.task("start", run("npm run e2e-serve --max-old-space-size=4096"));

gulp.task(
  "report",
  run(
    "node_modules/nyc/bin/nyc.js report --reporter=lcov --report-dir=coverage-output  --exclude=dist/root/build-script.js  --exclude=dist/root/src/dev-platform  --exclude=dist/root/src/micro-frontend  --exclude=dist/root/src/app/shared/routeReuseStrategy.ts  --exclude=dist/root/src/main.ts  --exclude=dist/root/src/app/model  --exclude=dist/root/src/app/component/login  --exclude=dist/root/src/app/component/page-not-found  --exclude=dist/root/src/libs/modelChart.js  --exclude=dist/root/src/environments/environment.*.ts  --exclude=dist/root/src/app/core.module.ts  --exclude=dist/root/src/app/services/user-auth.service.ts  --exclude=dist/root/src/app/services/environments.service.ts  --exclude=dist/root/src/app/guards  --exclude=dist/root/src/app/shared/form-validators  --exclude=dist/root/src/app/pipes/full-name.pipe.ts  --exclude=dist/root/src/app/services/common/s3.service.ts  --exclude=dist/root/src/app/services/common/email.service.ts  --exclude=dist/root/src/app/services/common/tool.service.ts  --exclude=dist/root/src/app/component/datasets/dnd.directive.ts"
  )
);
