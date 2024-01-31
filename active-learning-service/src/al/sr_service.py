# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

from bson import ObjectId

from src.al.project_service import find_project_by_name
from config.config import config
from src.db.mongo_connect import mongo_client
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer


def srs_collection():
    db = mongo_client()
    return db["srs"]


def sr_unlabeled(project_name, project_type):
    srs = srs_collection()
    unlabeled_sr = srs.find({"projectName": project_name, "userInputsLength": 0}).limit(100)
    sr_ids, sr_vectors, sr_text = [], [], []
    for sr in unlabeled_sr:
        # sr_vectors.append(eval(sr['text_vector']))
        if project_type == 'tabular':
            sr_text.append(sr['originalData'])
        else:
            sr_text.append(",".join(sr['originalData'].values()))
        sr_ids.append(sr['_id'])
    return {"sr_vectors": sr_vectors, "ids": sr_ids, "sr_text": sr_text}


def random_find_sr_unlabeled(project_name, project_type):
    srs = srs_collection()
    # set max query pool for tabular project or os user
    if project_type == 'tabular' or "ESP" not in config:
        pipeline = [
            {"$match": {"projectName": project_name, "userInputsLength": 0}},
            {"$sample": {"size": 10000}}
        ]
    else:
        # text project
        pipeline = [
            {"$match": {"projectName": project_name, "userInputsLength": 0, "text_vector": {"$exists": False}}},
            {"$sample": {"size": 100}}
        ]
    unlabeled_sr = srs.aggregate(pipeline)
    sr_ids, sr_text = [], []
    for sr in unlabeled_sr:
        if project_type == 'tabular':
            sr_text.append(sr['originalData'])
        else:
            sr_text.append(",".join(sr['originalData'].values()))
        sr_ids.append(sr['_id'])
    return {"ids": sr_ids, "sr_text": sr_text}


def query_sr_by_id(sr_id, options):
    srs = srs_collection()
    return srs.find_one({"_id": sr_id}, options)


def query_srs_by_ids(sr_ids):
    srs = srs_collection()
    return srs.find({'_id': {'$in': sr_ids}})


def query_labeled_sr(project_name):
    srs = srs_collection()
    return srs.find({"projectName": project_name, "userInputsLength": {"$gt": 0}})


def query_test_sr(project_name):
    srs = srs_collection()
    return srs.find({"projectName": project_name, "test": True})


def query_train_srs_by_name(project_name, project_label_id, project_type):
    srs = srs_collection()
    sr_all = srs.find({"projectName": project_name, "userInputsLength": {"$gt": 0}})

    sr_ids, sr_vectors, labels, sr_text = [], [], [], []
    for sr in sr_all:
        sr_label = []
        for label in sr['userInputs']:
            sr_label.append(label['problemCategory'])
        top_label = Counter(sr_label).most_common(1)[0][0]

        sr_ids.append(sr['_id'])
        # sr_vectors.append(eval(sr['text_vector']))
        if project_type == 'tabular':
            sr_text.append(sr['originalData'])
        else:
            sr_text.append(",".join(sr['originalData'].values()))
        labels.append(project_label_id[top_label])

    return {"ids": sr_ids, "sr_vectors": sr_vectors, "labels": labels, 'sr_text': sr_text}


def save_all_sr_text_vectors(project_name):
    srs = srs_collection()
    sr_all = srs.find({"projectName": project_name})
    sr_ids, sr_text = [], []
    for sr in sr_all:
        sr_text.append(",".join(sr['originalData'].values()))
        sr_ids.append(sr['_id'])
    sr_all = None
    # convert text to vector
    sr_text = TfidfVectorizer().fit_transform(sr_text).toarray()
    # batch update sr vector
    batch = srs.initialize_unordered_bulk_op()
    for index, sr_id in enumerate(sr_ids):
        vector = tuple(sr_text[index])
        batch.find({"_id": sr_id}).upsert().update_one({"$set": {"text_vector": str(vector)}})
    batch.execute()


def sr_vectors_labels(srs, project_label_id, project_type, test):
    if srs is None or srs.count() == 0:
        return

    sr_ids, labels, sr_text = [], [], []
    for sr in srs:
        sr_label = []
        for label in sr['userInputs']:
            sr_label.append(label['problemCategory'])
        top_label = Counter(sr_label).most_common(1)[0][0]

        sr_ids.append(sr['_id'])
        labels.append(project_label_id[top_label])

        if project_type == 'tabular':
            sr_text.append(sr['originalData'])
        else:
            sr_text.append(",".join(sr['originalData'].values()))
    return {'labels': labels, "ids": sr_ids, "sr_text": sr_text}


def find_new_labeled_sr(project_name, project_type):
    pro = find_project_by_name(project_name)

    srs = []
    for sr in pro[0]['al']['newLBSr']:
        srs.append(ObjectId(sr))
    srs = query_srs_by_ids(srs)

    data = sr_vectors_labels(srs, pro[0]['al']['labelID'], project_type, False)
    return {'labels': data['labels'], "ids": data['ids'], 'sr_text': data['sr_text']}


def find_all_test_sr(project_name, project_type):
    pro = find_project_by_name(project_name)
    srs = query_test_sr(project_name)
    data = sr_vectors_labels(srs, pro[0]['al']['labelID'], project_type, True)
    return {'labels': data['labels'], 'sr_text': data['sr_text']}


def batch_update_srs(sr_ids):
    srs = srs_collection()
    batch = srs.initialize_unordered_bulk_op()
    for sr_id in sr_ids:
        batch.find({"_id": sr_id}).upsert().update_one({"$set": {"test": True}})
    batch.execute()


def query_all_labeled_sr_amount(project_name):
    srs = srs_collection()
    return srs.find({"projectName": project_name, "userInputsLength": {"$gt": 0}}).count()


def query_all_srs(project_name):
    srs = srs_collection()
    return srs.find({"projectName": project_name})


def save_sr_vectors(sr_id, sr_vec, project_type):
    if project_type == 'text' and ("ESP" in config) and config["ESP"]:
        srs = srs_collection()
        # batch update sr vector
        batch = srs.initialize_unordered_bulk_op()
        for index, _id in enumerate(sr_id):
            vector = tuple(sr_vec[index])
            batch.find({"_id": _id}).upsert().update_one({"$set": {"text_vector": str(vector)}})
        batch.execute()


def query_saved_sr_vectors(project_name):
    srs = srs_collection()
    condition = {"projectName": project_name, "userInputsLength": 0, "text_vector": {"$exists": True}}

    srs_vec = srs.find(condition).limit(10000)
    sr_ids, sr_vectors = [], []
    for sr in srs_vec:
        sr_ids.append(sr['_id'])
        sr_vectors.append(eval(sr['text_vector']))

    return {"ids": sr_ids, "sr_text": sr_vectors}