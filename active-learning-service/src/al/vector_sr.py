
# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import logging
import traceback

import pandas as pd

from src.al.project_service import find_project_by_name, update_project
from src.al.sr_service import query_all_srs
import numpy as np
from sklearn.preprocessing import OneHotEncoder
import pickle
import json

import src.utils.fileSystem as fileSystem

modelDir = "models/"
log = logging.getLogger('loop_al')


def srs_vector(request):
    try:
        req = json.loads(request.body)
        token = request.headers["Authorization"]
        pro = find_project_by_name(req['projectName'])

        # one hot encoding generate tickets vector model
        if pro[0]['encoder'] == 'oneHot':
            sr_text, obj_col, num_col, upload_file = [], [], [], None

            for sr in query_all_srs(req['projectName']):
                sr_text.append(sr['originalData'])
            sr_text = pd.DataFrame(sr_text).drop_duplicates().reset_index(drop=True)
            sr_text.replace("", 0, inplace=True)

            for k, v in sr_text.dtypes.items():
                if v != 'object':
                    num_col.append(k)
                else:
                    obj_col.append(k)

            if obj_col:
                vaporizer = OneHotEncoder(handle_unknown='ignore')
                sr_text = pd.DataFrame(sr_text, columns=obj_col, dtype=np.str)
                vaporizer.fit(sr_text)

                model_name = str(pro[0]["_id"]) + "_vaporizer_model.pkl"
                with open(modelDir + model_name, 'wb') as model_file:
                    pickle.dump(vaporizer, model_file)

                local_file = str("./"+modelDir + model_name)
                upload_file = modelDir + str(pro[0]["_id"])+'/' + model_name
                upload_file = fileSystem.upload_file(upload_file, local_file, token)

            # save vector model name to db
            update = {
                "$set": {
                    "al.vectorModel": upload_file,
                    'al.numberColumn': num_col,
                    'al.objectColumn': obj_col,
                    "al.alFailed": False
                }
            }

            update_project({"projectName": req['projectName']}, update)
            res = {"status": "OK", "data": upload_file}
    except Exception as e:
        # set flag to this project and reset newLBSr=[]
        update_project({"projectName": req['projectName']}, {"al.alFailed": True})
        res = {"status": "ERROR", "data": req['projectName'] + " vector srs fail " + str(e)}
        log.error(f'{e}, {traceback.format_exc()}')
    finally:
        return res




























