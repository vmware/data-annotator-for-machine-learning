#!/usr/bin/env python

# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import os
import importlib
from config.config import config


def download_spacy_module():

    print(f'[ MODULE ] {config["SPACY_MODEL"]}')
    is_model_exist = is_setup_module(config['SPACY_MODEL'])
    if is_model_exist:
        return
    else:
        module = f"python -m spacy download {config['SPACY_MODEL']}"
        try:
            print(f'[ MODULE ] [ DOWNLOAD ]: {module}')
            os.system(module)
        except:
            # if error occurs will try again
            print(f'[ ERROR ] [ DOWNLOAD ]: {module}')
            print(f'[ RETRY ] [ DOWNLOAD ]: {module}')
            os.system(module)


def is_setup_module(name):
    try:
        importlib.import_module(name)
        return True
    except:
        return False