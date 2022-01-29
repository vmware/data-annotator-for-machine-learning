# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

FROM python:3.7.10

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_md

COPY . /app

EXPOSE 8000

CMD [ "python", "manage.py","runserver","0.0.0.0:8000" ]