# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import logging
import spacy
import json

nlp = spacy.load("en_core_web_md")
log = logging.getLogger('loop_al')


def get_user_tokens(request):

    req = json.loads(request.body)
    tickets_data = []

    for ticket in req['data']:
        data = {
            "text": ticket['text'],
            "tokens": []
        }
        doc = nlp(ticket['text'])

        for token in doc.to_json()['tokens']:
            user_token = {
                "id": token['id'],
                "start": token['start'],
                "end": token['end'],
                "text": str(doc.__getitem__(token['id']))
            }
            data['tokens'].append(user_token)

        tickets_data.append(data)

    return {"data": tickets_data}


