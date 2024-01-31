# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0
import json
import logging
import os

from config.constant import cst
from src.al.embeddings import gain_srs_embedding_vector, train_embedding_model_gain_vector
from src.al.get_vectors import request_text_vectors
from src.al.separate_data import separate_data, vector_sr
from src.al.sr_service import find_all_test_sr, query_all_labeled_sr_amount, \
    find_new_labeled_sr, query_train_srs_by_name, batch_update_srs, save_sr_vectors, random_find_sr_unlabeled, \
    query_saved_sr_vectors
from src.al.project_service import find_project_by_name, update_project, update_end_condition
from src.al.query_instance import query_instance
from src.al.teach_model import teach_model
from src.al.train_model import train_model
from config.config import config
import src.utils.fileSystem as fileSystem

modelDir = "models/"
vec_mod = '_vaporizer_model.pkl'
al_mod = "_model.pkl"
log = logging.getLogger('loop_al')


# 1. train model
def active_learning_train(request):

    req = json.loads(request.body)
    token = request.headers["Authorization"]

    # query labels to map labelid
    pro = find_project_by_name(req['projectName'])
    labels = pro[0]['categoryList'].split(',')
    project_id = str(pro[0]['_id'])
    label_id = {}
    for index, label in enumerate(labels):
        label_id[label] = index

    # query all labeled sr text id and label
    project_type = pro[0]['projectType']
    srs = query_train_srs_by_name(req['projectName'], label_id, project_type)

    if project_type == 'tabular':
        if 'encoder' in pro[0] and pro[0]['encoder'] == 'embeddings':
            # embeddings use sr vector to replace sr text
            srs['sr_text'] = train_embedding_model_gain_vector(project_id, req['projectName'], srs['sr_text'], token)


        elif pro[0]['encoder'] == 'oneHot':
            vector_local = './' + modelDir + project_id + vec_mod
            if pro[0]['al']["objectColumn"]:
                # one-hot-encoding download latest vectorModel from s3
                fileSystem.download_file(pro[0]['al']['vectorModel'], pro[0]['al']['vectorModel'], vector_local, token)
            # use sr vector to replace sr text
            srs['sr_text'] = vector_sr(srs['sr_text'], vector_local, project_type, pro[0]['al']['objectColumn'], pro[0]['al']['numberColumn'])
    else:
        # text request sr vector
        srs['sr_text'] = request_text_vectors(srs['sr_text'])

    data = separate_data(srs)

    # al train the model with the labeled sr data
    query_strategy = cst['QUERY_STRATEGY']['POOL_BASED_SAMPLING']['PB_UNS']
    if 'queryStrategy' in pro[0]['al']:
        query_strategy = pro[0]['al']['queryStrategy']
    al = train_model(data, project_id, pro[0]['al']['estimator'], query_strategy)

    # upload al-model to s3
    local_file = './' + modelDir + al['model']
    upload_file = modelDir + project_id + "/" + al['model']
    upload_file = fileSystem.upload_file(upload_file, local_file, token)

    # save all test data
    batch_update_srs(al['test'])

    # update al info
    update = {
        "$set": {"al.labelID": label_id, "al.model": upload_file, "al.trained": True},
        "$push": {"al.accuracy": {"index": len(srs['ids']), "accuracy": al['accuracy']}},
        "$pull": {"al.newLBSr": {"$in": srs['ids']}}
    }
    update_project({"projectName": req['projectName']}, update)

    return {"status": "OK", "data": al['accuracy']}


# 2. query instance from model
def active_learning_query(request):

    req = json.loads(request.body)
    token = request.headers["Authorization"]

    # query al info
    pro = find_project_by_name(req['projectName'])
    project_id = str(pro[0]['_id'])

    # download latest al model from s3 if not exist
    model_file = './' + modelDir + project_id + al_mod
    fileSystem.download_file(True, pro[0]['al']['model'], model_file, token)

    # random query sr text from db
    project_type = pro[0]['projectType']
    unl_srs = random_find_sr_unlabeled(req['projectName'], project_type)
    # check al stop condition
    if update_end_condition(unl_srs['ids'], req['projectName']): return

    if project_type == 'tabular':
        if 'encoder' in pro[0] and pro[0]['encoder'] == 'embeddings':
            # use embeding vector replace sr_text
            unl_srs['sr_text'] = gain_srs_embedding_vector(unl_srs['sr_text'], pro[0]['al']['vectorModel'], project_id, pro[0]['al']['numberColumn'], token)
        elif pro[0]['encoder'] == 'oneHot':
            vector_local = './' + modelDir + project_id + vec_mod
            if pro[0]['al']["objectColumn"]:
                # one-hot-encoding download latest vectorModel from s3 if not exist
                fileSystem.download_file(pro[0]['al']['vectorModel'], pro[0]['al']['vectorModel'], vector_local, token)

            # use one-hot-encoding vector replace sr_text
            unl_srs['sr_text'] = vector_sr(unl_srs['sr_text'], vector_local, project_type, pro[0]['al']['objectColumn'], pro[0]['al']['numberColumn'])
    else:
        # text project request sr vector
        unl_srs['sr_text'] = request_text_vectors(unl_srs['sr_text'])

    # al query uncertain instance
    query_strategy = cst['QUERY_STRATEGY']['POOL_BASED_SAMPLING']['PB_UNS']
    if 'queryStrategy' in pro[0]['al']:
        query_strategy = pro[0]['al']['queryStrategy']
    sr_queried = query_instance(unl_srs, model_file, 10, query_strategy)

    # save queried instance
    conditions = {"projectName": req['projectName']}
    update = {
        "$push": {"al.queriedSr": {"$each": sr_queried}},
        "$set": {"al.querying": False}
    }
    update_project(conditions, update)

    return {"status": "OK", "data": "Query instance success"}


# 3. teach model
def active_learning_teach(request):

    req = json.loads(request.body)
    token = request.headers["Authorization"]

    # query al info
    pro = find_project_by_name(req['projectName'])
    project_id = str(pro[0]['_id'])

    # download latest al model from s3 for multiple instance
    model_file = './' + modelDir + project_id + al_mod
    fileSystem.download_file(False, pro[0]['al']['model'], model_file, token)

    # query all labeled sr amount
    srs_labeled_amount = query_all_labeled_sr_amount(req['projectName'])

    # query new labeled sr
    project_type = pro[0]['projectType']
    new_labeled_sr = find_new_labeled_sr(req['projectName'], project_type)
    all_test_sr = find_all_test_sr(req['projectName'], project_type)

    if project_type == 'tabular':
        # embedding
        if 'encoder' in pro[0] and pro[0]['encoder'] == 'embeddings':
            # use sr vector replace sr_text
            new_labeled_sr['sr_text'] = gain_srs_embedding_vector(new_labeled_sr['sr_text'], pro[0]['al']['vectorModel'], project_id, pro[0]['al']['numberColumn'], token)
            # query all test sr
            all_test_sr['sr_text'] = gain_srs_embedding_vector(all_test_sr['sr_text'], pro[0]['al']['vectorModel'], project_id, pro[0]['al']['numberColumn'], token)
        # one-hot-encoding
        elif pro[0]['encoder'] == 'oneHot':
            vector_local = './' + modelDir + project_id + vec_mod
            if pro[0]['al']["objectColumn"]:
                # download latest vector Model from s3
                fileSystem.download_file(pro[0]['al']['vectorModel'], pro[0]['al']['vectorModel'], vector_local, token)

            # use sr vector replace sr_text
            new_labeled_sr['sr_text'] = vector_sr(new_labeled_sr['sr_text'], vector_local, project_type, pro[0]['al']['objectColumn'], pro[0]['al']['numberColumn'])
            # query all test sr
            all_test_sr['sr_text'] = vector_sr(all_test_sr['sr_text'], vector_local, project_type, pro[0]['al']['objectColumn'], pro[0]['al']['numberColumn'])
    # text project
    else:
        # use sr vector replace sr_text
        new_labeled_sr['sr_text'] = request_text_vectors(new_labeled_sr['sr_text'])
        all_test_sr['sr_text'] = request_text_vectors(all_test_sr['sr_text'])

    data = separate_data(new_labeled_sr)

    # teach al model and get accuracy
    al = teach_model(model_file, data, all_test_sr)

    # save accuracy and pull trained sr form newLBSr
    conditions = {"projectName": req['projectName']}
    update = {
        "$set": {"al.teaching": False},
        "$push": {"al.accuracy": {"index": srs_labeled_amount, "accuracy": al['accuracy']}},
        "$pull": {"al.newLBSr": {"$in": new_labeled_sr['ids']}}
    }
    update_project(conditions, update)

    # save all test data
    batch_update_srs(al['test'])
    # save ESP text sr vector to db for reuse
    save_sr_vectors(data['id_test'], data['x_test'], project_type)

    # upload file trained al model to s3
    fileSystem.upload_file(pro[0]['al']['model'], model_file, token)

    return {"status": "OK", "data": al['accuracy']}







