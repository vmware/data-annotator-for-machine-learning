# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0


class NetWorkException(Exception):
    def __init__(self, code, message):
        self.code = code
        self.message = message


class AuthException(Exception):
    def __init__(self, code, message):
        self.code = code
        self.message = message