# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import pickle
import random
import numpy as np
import pandas as pd


# common function to separate sr data 80% for train and 20% for test
def separate_data(request):

    sr_ids = request['ids']

    id_test, x_test, y_test, x_teach, y_teach = [], [], [], [], []
    sr_len = int(len(sr_ids) * 0.8)

    sr_selected = random.sample(range(0, len(sr_ids)), sr_len)

    for index, sr_id in enumerate(sr_ids):
        if index in sr_selected:
            # x_teach.append(request['sr_vectors'][index])
            x_teach.append(request['sr_text'][index])
            y_teach.append(request['labels'][index])
        else:
            id_test.append(sr_id)
            # x_test.append(request['sr_vectors'][index])
            x_test.append(request['sr_text'][index])
            y_test.append(request['labels'][index])

    return {
        "x_teach": np.array(x_teach),
        "y_teach": np.array(y_teach),
        "x_test": np.array(x_test),
        "y_test": np.array(y_test),
        "id_test": id_test,
        "sr_len": sr_len
    }


# load vector model return sr vectors
def vector_sr(sr_array, model_file, project_type, obj_col, num_col):
    # use for tabular one-hot-encodding
    if project_type == 'tabular':
        num_sr, obj_sr = [], []
        if num_col:
            num_sr = pd.DataFrame(sr_array, columns=num_col).replace("", 0).replace(np.nan, 0)
            if not obj_col:
                sr_array = np.array(num_sr)
        if obj_col:
            obj_sr = pd.DataFrame(sr_array, columns=obj_col, dtype=np.str)
            with open(model_file, 'rb') as model_vector:
                vaporizer = pickle.load(model_vector)
                obj_sr = vaporizer.transform(obj_sr).toarray()
            if not num_col:
                sr_array = np.array(obj_sr)
        if num_col and obj_col:
            # combine number column and categorical column vector together
            sr_array = np.concatenate((obj_sr, num_sr), axis=1)
    else:
        # text project not used now
        with open(model_file, 'rb') as model_vector:
            vaporizer = pickle.load(model_vector)
            sr_array = vaporizer.transform(sr_array).toarray()
    return sr_array














