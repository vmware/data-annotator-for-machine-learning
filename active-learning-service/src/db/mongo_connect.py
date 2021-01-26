# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import pymongo

from config.config import config


def mongo_client():
    client = pymongo.MongoClient(config["MONGODB_URL"])
    db = client[config["MONGODB_COLLECTION"]]
    return db
