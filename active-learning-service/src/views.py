
# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .al.activelearning import active_learning_query, active_learning_train, active_learning_teach

from .al.vector_sr import srs_vector
from .utils.common import request_handle
import src.tests as poc


# vector all sr data
@require_POST
def al_srs_vector(request):
    return request_handle(request, srs_vector)


# active learning train a model
@require_POST
def al_train_model(request):
    return request_handle(request, active_learning_train)


# active learning query instance from model
@require_POST
def al_query_instance(request):
    return request_handle(request, active_learning_query)


# active learning teach a model
@require_POST
def al_teach_model(request):
    return request_handle(request, active_learning_teach)


# health check
@require_GET
def health(request):
    return JsonResponse({"status": "OK"})


# api_poc
@require_GET
def api_poc(request):
    return request_handle(request, poc.api_poc)
