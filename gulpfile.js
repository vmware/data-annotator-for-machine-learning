/*
Copyright 2019-2021 VMware, Inc.
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

// gulp.task('build', gulp.series('clean', run('ng build ')));
gulp.task("copy", async () => {
  gulp
    .src(
      "/Users/zhangruike/aBeyondsoft/loop/app-data-annotator-for-machine-learning/annotation-app/dist/**/*"
    )
    .pipe(gulp.dest("dist/"));
});

gulp.task(
  "instrument",
  gulp.series(
    // 'build',
    "copy",
    run(
      "node --max-old-space-size=8192 node_modules/nyc/bin/nyc.js instrument dist coverage-output/annotation-app --exclude-after-remap=false --exclude=dist/libs/** --exclude=dist/vendor.js --exclude=dist/styles.js --exclude=dist/polyfills.*.js"
    ),
    async () => {
      gulp.src("coverage-output/annotation-app/*").pipe(gulp.dest("dist/"));
    },
    async () => {
      gulp
        .src(
          "/Users/zhangruike/aBeyondsoft/loop/app-data-annotator-for-machine-learning/annotation-app/src/**/*"
        )
        .pipe(gulp.dest("dist/root/src/"));
    },
    async () => {
      gulp.src("coverage-output/annotation-app/*").pipe(gulp.dest("dist/"));
    }
  )
);

gulp.task("start", run("npm run e2e-serve --max-old-space-size=4096"));

gulp.task(
  "report",
  run(
    "node_modules/nyc/bin/nyc.js report --reporter=lcov --report-dir=coverage-output  --exclude=dist/root/src/main.ts  --exclude=dist/root/src/app/components/authentication  --exclude=dist/root/src/app/components/login  --exclude=dist/root/src/app/components/admin  --exclude=dist/root/src/app/components/projects/supercollider.component.ts  --exclude=dist/root/src/libs/feedback.js  --exclude=dist/root/src/libs/modelChart.js  --exclude=dist/root/src/environments/environment.*.ts  --exclude=dist/root/src/app/components/footer --exclude=dist/root/src/app/core.module.ts  --exclude=dist/root/src/app/services/user-auth.service.ts  --exclude=dist/root/src/app/services/feedback.service.ts  --exclude=dist/root/src/app/services/environments.service.ts  --exclude=dist/root/src/app/guards  --exclude=dist/root/src/app/shared/form-validators  --exclude=dist/root/src/app/pipes/full-name.pipe.ts  --exclude=dist/root/src/app/model"
  )
);
