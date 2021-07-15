
# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import logging
import os
import src.aws.s3 as S3


log = logging.getLogger('loop_al')


def upload_file(remote_file, local_file, token):
    file_path = remote_file
    if not os.path.exists(local_file):
        log.error(f"LOCAL FILE NOT EXIST {local_file}")
        raise Exception(500, f"LOCAL FILE NOT EXIST {local_file}")

    if not S3.check_aws_config():
        file_path = local_file
    else:
        S3.upload_file_to_s3(local_file, remote_file, token)

    return file_path


def download_file(condition, remote_file, local_file,  token):
    if not S3.check_aws_config():
        if not os.path.exists(local_file):
            log.error(f"LOCAL FILE NOT EXIST {local_file}")
            raise Exception(500, f"LOCAL FILE NOT EXIST {local_file}")
    elif condition:
        if not os.path.exists(local_file):
            S3.download_file_from_s3(remote_file, local_file, token)
    else:
        S3.download_file_from_s3(remote_file, local_file, token)
