# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import os
app = {

    "MONGODB_URL": os.getenv("MONGODB_URL", "mongodb://localhost:27017/daml"),
    "MONGODB_COLLECTION": os.getenv("MONGODB_COLLECTION", "daml"),
    #If True will save datasets to local, If set USE_AWS=true set it to false
    "USE_LOCAL_FILE_SYS": os.getenv("USE_LOCAL_FILE_SYS", True),
    
    #If True, will save datasets to S3, shoud set USE_LOCAL_FILE_SYS=False
    "USE_AWS": os.getenv("USE_AWS", False),
    # AWS IAM
    "REGION": os.getenv("REGION", None),
    "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID", None),
    "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY", None),
    # AWS S3
    "S3_BUCKET_NAME": os.getenv("S3_BUCKET_NAME", None),
    "S3_ROLE_ARN": os.getenv("S3_ROLE_ARN", None),

    # spacy model default is en_core_web_md, NOTE: [sm: no word vectors] more: https://spacy.io/models
    "SPACY_MODEL": os.getenv("SPACY_MODEL", "en_core_web_md"),

    # optional token config
    "TOKEN_ALGORITHM": os.getenv("TOKEN_ALGORITHM", "HS256"),
    # generate the key yourself. should keep the same with annotation-service TOKEN_SECRET_OR_PRIVATE_KEY
    "TOKEN_SECRET_OR_PRIVATE_KEY": os.getenv("TOKEN_SECRET_OR_PRIVATE_KEY", "OPEN SOURCE"),

    # generate the key yourself. django SECRET_KEY a random generated value https://docs.djangoproject.com/en/3.2/ref/settings/#std:setting-SECRET_KEY
    "DJANGO_SECRET_KEY": os.getenv("DJANGO_SECRET_KEY", "your_key"),

}