# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import json
from bson import ObjectId
import datetime


# to handle the objectID and datetime
class JSONEncoder(json.JSONEncoder):
   def default(self, o):
      if isinstance(o, ObjectId):
         return str(o)
      if isinstance(o, datetime.datetime):
         return o.strftime('%Y-%m-%d %H:%M:%S')
      return json.JSONEncoder.default(self, o)



