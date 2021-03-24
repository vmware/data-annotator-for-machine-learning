# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import jwt
from config.config import config
import json
import requests
import logging

from src.exceptions.base_exceptions import NetWorkException, AuthException

log = logging.getLogger('loop_al')
public_key = None


def verification_token(request):

    if "ESP" in config and config["ESP"]:
        pk = obtain_public_key()
        key = bytes(pk['key'].replace("RSA ", ""), encoding="utf8")
        algorithms = pk['alg']
    else:
        key = config["TOKEN_SECRET_OR_PRIVATE_KEY"]
        algorithms = config["TOKEN_ALGORITHM"]

    if "Authorization" not in request.headers:
        raise AuthException(401, f"missing token in header['Authorization']")

    token = request.headers["Authorization"]

    try:
        decode = jwt.decode(token, key, algorithms=algorithms)
    except Exception as e:
        raise AuthException(401, f"invalid token: {e}")

    if request.method == "POST" and request.body:
        req = json.loads(request.body)
        if req["user"] and req["user"] != decode["email"]:
            raise AuthException(401, "invalid user or token")


def obtain_public_key():
    global public_key

    if public_key == None:
        res = requests.get(config['TOKEN_SECRET_OR_PRIVATE_KEY'])
        if res.status_code == 200:
            public_key = res.json()
        else:
            raise NetWorkException(res.status_code, f"Request token public key fail: {res}")

    return public_key