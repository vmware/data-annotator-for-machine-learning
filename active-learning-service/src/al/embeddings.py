# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import logging

from fastai.tabular import *

from src.al.project_service import update_project
from src.al.sr_service import query_all_srs
import src.utils.fileSystem as fileSystem

modelDir = "models/"
log = logging.getLogger('loop_al')


# generate embeddings model
def embeddings_model(dataset, cat_names, cont_names, dep_var):
    procs = [FillMissing, Categorify, Normalize]
    test = TabularList.from_df(dataset.iloc[40:50].copy(), path=".", cat_names=cat_names, cont_names=cont_names)
    data = (TabularList.from_df(dataset, path=".", cat_names=cat_names, cont_names=cont_names, procs=procs)
            .split_by_idx(list(range(40, 50)))
            .label_from_df(cols=dep_var)
            .add_test(test)
            .databunch())
    learn = tabular_learner(data, layers=[1000, 500], metrics=accuracy)
    return learn


# get embeddings vector list
def get_cat_emb_list(learn):
    cat_emb_list, idx = {}, 0
    for k, v in learn.data.train_ds.x.classes.items():
        emb_weights = list(learn.model.named_parameters())[idx][1]
        emb_np = to_np(emb_weights.data)
        # lm2vec = pd.DataFrame(emb_np)
        # lm2vec.index = [str(i).replace(" ", "") for i in v]
        # cat_emb_list[k] = lm2vec
        vec = {}
        for i, sr_lb in enumerate(v):
            vec[sr_lb] = emb_np[i]
        cat_emb_list[k] = pd.DataFrame(vec)
        idx += 1
    return cat_emb_list


# load all sr data and seperate number column and categorical column
def prepare_dataset(project_name):
    sr_text, num_col, obj_col = [], [], []
    for sr in query_all_srs(project_name):
        sr_label, top_label = [], None
        if sr['userInputs']:
            for label in sr['userInputs']:
                sr_label.append(label['problemCategory'])
            top_label = Counter(sr_label).most_common(1)[0][0]
        if top_label:
            sr['originalData']['_top_label_'] = top_label
        sr_text.append(sr['originalData'])

    sr_text = pd.DataFrame(sr_text).drop_duplicates().reset_index(drop=True)
    sr_text.replace("", 0, inplace=True)
    sr_text.replace(np.nan, "", inplace=True)

    for k, v in sr_text.dtypes.items():
        if k == '_top_label_':
            continue
        if v != 'object':
            num_col.append(k)
        else:
            obj_col.append(k)
    return {"sr_text": sr_text, "num_col": num_col, "obj_col": obj_col}


# train a embedding model to generate sr vectors and get sr vectors
def train_embedding_model_gain_vector(project_id, project_name, sr_text, token):

    sr_data = prepare_dataset(project_name)

    learn = embeddings_model(sr_data['sr_text'], sr_data['obj_col'], sr_data['num_col'], '_top_label_')

    emb_list = get_cat_emb_list(learn)

    # save the model to disk
    model_name = project_id + "_vaporizer_model.pkl"
    local_file = str("./" + modelDir + model_name)
    with open(local_file, 'wb') as vec_pickle:
        pickle.dump(emb_list, vec_pickle)

    # upload model to s3
    upload_file = modelDir + project_id + '/' + model_name
    upload_file = fileSystem.upload_file(upload_file, local_file, token)

    # update al info
    update = {"$set": {
        "al.vectorModel": upload_file,
        'al.numberColumn': sr_data['num_col'],
        'al.objectColumn': sr_data['obj_col'],
        "al.alFailed": False
    }}
    update_project({"projectName": project_name}, update)

    srs_vectors = embedding_vectors(sr_text, emb_list, sr_data['num_col'])
    return srs_vectors


# map embeddings vector
def embedding_vectors(sr_text, emb_list, num_col):
    srs_vectors = []
    for sr in sr_text:
        vectors = []
        num_vec = []
        for k, v in sr.items():
            if k in num_col:
                num_vec.append(v)
            else:
                if v in emb_list[k]:
                    vectors = np.append(vectors, emb_list[k][v])
                else:
                    vectors = np.append(vectors, emb_list[k]["#na#"])
        sr_vector = np.append(vectors, num_vec)
        srs_vectors.append(sr_vector)
    srs_vectors = pd.DataFrame(srs_vectors).replace(np.nan, 0).replace("", 0)
    srs_vectors = srs_vectors.to_numpy()
    return np.array(srs_vectors)


# get embeddings vector
def gain_srs_embedding_vector(sr_text, vector_model, project_id, num_col, token):
    # download embeddings model if not exist
    model_name = project_id + "_vaporizer_model.pkl"
    local_file = str("./" + modelDir + model_name)
    fileSystem.download_file(True, vector_model, local_file, token)

    # load embedding model to get sr vectors
    with open(local_file, 'rb') as model_vec:
        emb_list = pickle.load(model_vec)

    srs_vectors = embedding_vectors(sr_text, emb_list, num_col)
    return srs_vectors
