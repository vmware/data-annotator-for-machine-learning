# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import logging
import time
import numpy as np
import pickle

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import KNeighborsClassifier
from modAL.models import ActiveLearner

modelDir = "models/"
log = logging.getLogger('loop_al')


def train_model(data, project_id, estimator):
    log.info(f'train model')
    start_time = time.time()

    x_test = data['x_test']
    y_test = data['y_test']

    # initial model train model
    if(estimator == 'KNC'):
        estimator = KNeighborsClassifier()
    elif(estimator == 'GBC'):
        estimator = GradientBoostingClassifier()
    elif(estimator == 'RFC'):
        estimator = RandomForestClassifier()
    learner = ActiveLearner(estimator=estimator, X_training=data['x_teach'], y_training=data['y_teach'])

    # save the model to disk
    model_name = project_id + "_model.pkl"
    with open('./' + modelDir + model_name, 'wb') as knn_pickle:
        pickle.dump(learner, knn_pickle)

    initial_accuracy = learner.score(x_test, y_test)

    log.info(f'Initial accuracy: { initial_accuracy } train model end (in secs): {int(time.time() - start_time)}')
    return {"accuracy": initial_accuracy, "model": model_name, "test": data['id_test']}
