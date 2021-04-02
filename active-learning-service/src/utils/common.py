# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import json
import logging
import time
import traceback

from django.http import JsonResponse

from src.al.retry_service import support_al_retry
from src.exceptions.base_exceptions import AuthException
from src.utils.jwtVerification import verification_token

log = logging.getLogger('loop_al')


# common function to handle request
def request_handle(request, fun):
    start_time = time.time()
    log.info(f'[ {request.method}{request.path} ] request')

    try:
        # validate user and token
        verification_token(request)
        # business logic function
        res = fun(request)

    except AuthException as e:
        JsonResponse.status_code = 401
        res = {"status": "ERROR", "data": str(e)}
        log.error(f'{e}, {traceback.format_exc()}')
    except Exception as e:
        # support active learning retry
        support_al_retry(request, fun.__name__)
        JsonResponse.status_code = 500
        res = {"status": "ERROR", "data": str(e)}
        log.error(f'{e}, {traceback.format_exc()}')

    log.info(f'[ {request.method}{request.path} ] response time (in secs): {int(time.time() - start_time)}')
    return JsonResponse(res)