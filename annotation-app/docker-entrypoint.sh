#!/bin/sh

# Copyright 2019-2022 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

## Substitutes env variables in main.*.js bundle
sed -i 's/${APP_CONFIG}/'"${APP_CONFIG}"'/' $(ls /usr/share/nginx/html/main*.js)
sed -i 's/${CLIENT_ID}/'"${CLIENT_ID}"'/' $(ls /usr/share/nginx/html/main*.js)
## Starts the application
nginx -g 'daemon off;'