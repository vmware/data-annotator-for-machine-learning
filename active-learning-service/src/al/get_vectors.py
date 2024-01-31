# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import logging
import time

from config.config import config
import numpy as np
import spacy

from src.exceptions.base_exceptions import NetWorkException

nlp = spacy.load(config['SPACY_MODEL'])
log = logging.getLogger('loop_al')


def os_text_vectors(sr_text):
    
    vectors = []
    for text in sr_text:
        average = []
        for token in nlp(text):
            average.append(nlp.vocab[token.text].vector)
        vectors.append(np.mean(average, axis=0))
    return vectors


def request_text_vectors(sr_text):
    star_time = time.time()
    vectors = os_text_vectors(sr_text)
    log.info(f'Response Time(in secs): {int(time.time() - star_time)}')
    return vectors
