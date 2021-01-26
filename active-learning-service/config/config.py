# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import os
import importlib
import logging

# logging
log = logging.getLogger('loop_al')

# import modules
env = os.getenv('SYS_ENV', 'local')
path_file = f"config.app_{env}"
app = importlib.import_module(path_file)

config = app.app
config["ENV"] = env
log.info(f'[ ENV ] = {env}')
log.info(f'[ CONFIG ] = {config}')

