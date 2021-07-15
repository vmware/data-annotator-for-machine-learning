# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

import re
from spacy.tokenizer import Tokenizer


def custom_tokenizer(nlp):
    special_cases = {":)": [{"ORTH": ":)"}]}
    prefix_re = re.compile(r'''^[\`\'\"\(\{\[\<]''')
    suffix_re = re.compile(r'''[\`\'\"\!\,\.\?\:\)\}\]\>]$''')
    #infix_re = re.compile(r'''[]''')
    simple_url_re = re.compile(r'''^https?://|^http?://''')

    return Tokenizer(
        nlp.vocab,
        rules=special_cases,
        prefix_search=prefix_re.search,
        suffix_search=suffix_re.search,
        #infix_finditer=infix_re.finditer,
        url_match=simple_url_re.match
    )

