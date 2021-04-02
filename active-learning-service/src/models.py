# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import mongoengine


class Srs(mongoengine.Document):
    id = mongoengine.ObjectIdField(required=True)
    problemCategory=mongoengine.StringField(required=True)
    projectName=mongoengine.StringField(required=True)
    userInputsLength=mongoengine.StringField(required=True)
