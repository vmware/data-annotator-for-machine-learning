# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import logging
import boto3
import botocore
from botocore.exceptions import ClientError
from .sts import aws_credentials
from config.config import config


def s3_client(token):
    cred = aws_credentials(token)

    return boto3.client(
        's3',
        aws_access_key_id=cred['accessKeyId'],
        aws_secret_access_key=cred['secretAccessKey'],
        aws_session_token=cred['sessionToken']
    )


def upload_file_to_s3(file_name,  object_name, token):
    try:
        s3_client(token).upload_file(file_name, config["S3_BUCKET_NAME"], object_name)
    except ClientError as e:
        logging.error(e)
        return False
    return True


def download_file_from_s3(key, local_name, token):
    try:
        s3_client(token).download_file(config["S3_BUCKET_NAME"], key, local_name)
    except botocore.exceptions.ClientError as e:
        if e.response['Error']['Code'] == "404":
            print("The object does not exist.")
        else:
            logging.error(e)
        return False
    return True


