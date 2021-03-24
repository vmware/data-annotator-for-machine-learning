# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import json

from src.al.project_service import update_project


def support_al_retry(request, function_name):

    if request.method == "POST" and request.body:
        req = json.loads(request.body)
    else:
        return

    if function_name == "active_learning_train":
        update = {"$set": {"al.training": False}}
    elif function_name == "active_learning_query":
        update = {"$set": {"al.querying": False}}
    elif function_name == "active_learning_teach":
        update = {"$set": {"al.teaching": False}}
    else:
        return

    conditions = {"projectName": req['projectName']}
    update_project(conditions, update)