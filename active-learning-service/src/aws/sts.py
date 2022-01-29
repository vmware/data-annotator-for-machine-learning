# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0


import boto3
import requests
import json

from config.config import config


def sts_role(arn, session_name):

    sts = boto3.client(
        'sts',
        region_name=config["REGION"],
        aws_access_key_id=config["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=config["AWS_SECRET_ACCESS_KEY"]
    )

    data = sts.assume_role(
        DurationSeconds=1800,
        RoleArn=arn,
        RoleSessionName=session_name
    )
    data = data['Credentials']

    return {
        'accessKeyId': data['AccessKeyId'],
        'secretAccessKey': data['SecretAccessKey'],
        'sessionToken': data['SessionToken']
    }


def esp_sts_credentials(token):
    data = {
        "iamRoleArn": config["S3_ROLE_ARN"],
        "externalId": config["S3_EXTERNAL"],
        "region": config["REGION"],
        "durationInSeconds": 1800
    }
    headers = {"Authorization": token}

    credentials = requests.get(config["ESP_AUTHORIZE_URL"], params=data, headers=headers)
    credentials = json.loads(credentials.content)

    return credentials


def aws_credentials(token):
    if "ESP" in config and config["ESP"]:
        credentials = esp_sts_credentials(token)
    else:
        credentials = sts_role(config["S3_ROLE_ARN"], 'loop_al')

    return credentials
