# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import logging
import time
import numpy as np
import pickle

from config.constant import cst
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import KNeighborsClassifier
from modAL.models import ActiveLearner
from functools import partial
from modAL.batch import uncertainty_batch_sampling
from modAL.uncertainty import uncertainty_sampling, margin_sampling, entropy_sampling

modelDir = "models/"
log = logging.getLogger('loop_al')


def train_model(data, project_id, estimator, query_strategy):
    log.info(f'train model')
    start_time = time.time()

    x_test = data['x_test']
    y_test = data['y_test']

    # initial model train model
    if estimator == cst['ESTIMATOR']['KNC']:
        estimator = KNeighborsClassifier()
    elif estimator == cst['ESTIMATOR']['GBC']:
        estimator = GradientBoostingClassifier()
    elif estimator == cst['ESTIMATOR']['RFC']:
        estimator = RandomForestClassifier()

    if query_strategy == cst['QUERY_STRATEGY']['POOL_BASED_SAMPLING']['PB_UNS']:
        query_strategy = uncertainty_sampling
    elif query_strategy == cst['QUERY_STRATEGY']['POOL_BASED_SAMPLING']['PB_MS']:
        query_strategy = margin_sampling
    elif query_strategy == cst['QUERY_STRATEGY']['POOL_BASED_SAMPLING']['PB_ES']:
        query_strategy = entropy_sampling
    elif query_strategy == cst['QUERY_STRATEGY']['RANKED_BATCH_MODE']['RBM_UNBS']:
        batch_size = 10
        query_strategy = partial(uncertainty_batch_sampling, n_instances=batch_size)

    learner = ActiveLearner(estimator=estimator, query_strategy=query_strategy, X_training=data['x_teach'], y_training=data['y_teach'])

    # save the model to disk
    model_name = project_id + "_model.pkl"
    with open('./' + modelDir + model_name, 'wb') as knn_pickle:
        pickle.dump(learner, knn_pickle)

    initial_accuracy = learner.score(x_test, y_test)

    log.info(f'Initial accuracy: { initial_accuracy } train model end (in secs): {int(time.time() - start_time)}')
    return {"accuracy": initial_accuracy, "model": model_name, "test": data['id_test']}
