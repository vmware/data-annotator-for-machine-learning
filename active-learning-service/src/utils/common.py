# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import json
import logging
import time
import traceback

from django.http import JsonResponse


log = logging.getLogger('loop_al')


# common function to handle request
def request_handle(request, fun):
    start_time = time.time()
    log.info(f'[ {request.method}{request.path} ] request')

    try:

        # business logic function
        res = fun(request)

    except Exception as e:

        res = {"status": "ERROR", "data": str(e)}
        log.error(f'{e}, {traceback.format_exc()}')

    log.info(f'[ {request.method}{request.path} ] response time (in secs): {int(time.time() - start_time)}')
    return JsonResponse(res)