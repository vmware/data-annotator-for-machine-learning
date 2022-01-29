# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

from src.db.mongo_connect import mongo_client


def pro_collection():
    db = mongo_client()
    return db["projects"]


def find_project_by_name(project_name):
    projects = pro_collection()
    return projects.find({"projectName": project_name})


def update_project(conditions, update):
    projects = pro_collection()
    projects.find_one_and_update(conditions, update)


def update_end_condition(sr_ids, project_name):
    if len(sr_ids) < 10:
        # add a stop condition
        conditions = {"projectName": project_name}
        update = {"$set": {"al.alFailed": True}}
        update_project(conditions, update)
        return True
