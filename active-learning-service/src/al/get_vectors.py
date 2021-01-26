# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import logging
import time
import requests
import json
from config.config import config
import numpy as np
import spacy

nlp = spacy.load("en_core_web_md")
log = logging.getLogger('loop_al')


def esp_text_vectors(user, sr_text, token):

    url_vectors = config["VECTOR_API_URL"]
    headers = {
        'Authorization': "Bearer " + token,
        'Content-Type': "application/json"
    }
    input_cols = {"user": user, "name": "aclImdb", "rows": sr_text}

    res = requests.post(url_vectors, headers=headers, data=json.dumps(input_cols))

    if res.status_code == 200:
        response = json.loads(res.text)
        vectors = []
        for row in response['rows']:
            vectors.append(row['weights'])

        return vectors
    else:
        log.error(f"Request text vector fail: {res}")


def os_text_vectors(sr_text):

    vectors = []
    for text in sr_text:
        average = []
        for token in nlp(text):
            average.append(nlp.vocab[token.text].vector)
        vectors.append(np.mean(average, axis=0))
    return vectors


def request_text_vectors(user, sr_text, token):
    star_time = time.time()
    if "ESP" in config and config["ESP"]:
        vectors = esp_text_vectors(user, sr_text, token)
    else:
        vectors = os_text_vectors(sr_text)

    log.info(f'Response Time(in secs): {int(time.time() - star_time)}')
    return vectors
