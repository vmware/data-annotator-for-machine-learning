# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import logging
import os
import time

import numpy as np
import pickle

log = logging.getLogger('loop_al')


def teach_model(model_name, data, test_sr):
    log.info(f'teach model')
    start_time = time.time()

    if model_name == None:
        print("No dataset file specified!")
        return
    elif not os.path.exists(model_name):
        print("Source file does not exist:", model_name)
        return

    test_sr_x = test_sr['sr_text']
    sr_len = data['sr_len']
    x_test = np.concatenate((data['x_test'], test_sr_x), axis=0)
    y_test = np.concatenate((data['y_test'], test_sr['labels']), axis=0)

    with open(model_name, 'rb') as model_al:
        learner = pickle.load(model_al)

    # we can tech several records once
    x_row = data['x_teach']
    y_row = data['y_teach']
    learner.teach(X=x_row, y=y_row)
    accuracy = learner.score(x_test, y_test)
    log.info(f'Accuracy after teach with {sr_len} tickets {accuracy}')

    with open(model_name, 'wb') as model_al:
        pickle.dump(learner, model_al)

    log.info(f'teach model end (in secs): {int(time.time() - start_time)}')
    return {"accuracy": accuracy, "test": data['id_test']}


