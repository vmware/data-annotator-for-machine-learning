# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import logging
import os
import time

import numpy as np
import pickle

log = logging.getLogger('loop_al')


def query_instance(df_pool, model_name, n_query):
    log.info(f'query instance')
    start_time = time.time()

    if model_name == None:
        print("No dataset file specified!")
        return
    elif not os.path.exists(model_name):
        print("Source file does not exist:", model_name)
        return

    # load the model from disk
    with open(model_name, 'rb') as model_al:
        learner = pickle.load(model_al)
    # x_pool = np.array(df_pool['sr_vectors'])
    x_pool = np.array(df_pool['sr_text'])
    y_pool = np.array(df_pool['ids'])

    query_result = []
    for i in range(n_query):
        query_idx, vector = learner.query(x_pool)
        sr_id = y_pool[query_idx]

        # print(query_idx, sr_id[0])
        x_pool = np.delete(x_pool, query_idx, axis=0)
        y_pool = np.delete(y_pool, query_idx, axis=0)

        query_result.append(sr_id[0])

    log.info(f'query instance end (in secs): {int(time.time() - start_time)}')
    return query_result

