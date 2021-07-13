# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import os
app = {

    "MONGODB_URL": os.getenv("MONGODB_URL", "mongodb://localhost:27017/daml"),
    "MONGODB_COLLECTION": os.getenv("MONGODB_COLLECTION", "daml"),

    "USE_LOCAL_FILE_SYS": os.getenv("USE_LOCAL_FILE_SYS", True),
    "USE_AWS": os.getenv("USE_AWS", False),
    "REGION": os.getenv("REGION", None),
    "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID", None),
    "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY", None),

    "S3_BUCKET_NAME": os.getenv("S3_BUCKET_NAME", None),
    "S3_ROLE_ARN": os.getenv("S3_ROLE_ARN", None),

    # optional token config
    "TOKEN_ALGORITHM": os.getenv("TOKEN_ALGORITHM", "HS256"),
    "TOKEN_SECRET_OR_PRIVATE_KEY": os.getenv("TOKEN_SECRET_OR_PRIVATE_KEY", "OPEN SOURCE"),


}