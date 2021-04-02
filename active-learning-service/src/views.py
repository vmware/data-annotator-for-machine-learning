
# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .al.activelearning import active_learning_query, active_learning_train, active_learning_teach

from .al.vector_sr import srs_vector
from .ner.named_entity_recognition import get_user_tokens
from .utils.common import request_handle
import src.tests as poc


# api_poc
@csrf_exempt
def api_poc(request):
    return request_handle(request, poc.api_poc)


# ner tokens
@csrf_exempt
def ner_user_tokens(request):
    return request_handle(request, get_user_tokens)


# vector all sr data
@csrf_exempt
def al_srs_vector(request):
    return request_handle(request, srs_vector)


# active learning train a model
@csrf_exempt
def al_train_model(request):
    return request_handle(request, active_learning_train)


# active learning query instance from model
@csrf_exempt
def al_query_instance(request):
    return request_handle(request, active_learning_query)


# active learning teach a model
@csrf_exempt
def al_teach_model(request):
    return request_handle(request, active_learning_teach)


# health check
@csrf_exempt
def health(request):
    return JsonResponse({"status": "OK"})


