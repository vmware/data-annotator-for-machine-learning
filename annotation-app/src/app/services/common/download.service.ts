/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/


import { Injectable } from '@angular/core';
import * as _ from "lodash";



@Injectable()
export class DownloadService {


    constructor() { }

    downloadMultiple(urls) {
        urls.forEach((url, index) => {
            var hiddenIFrameID = 'hiddenDownloader' + index;
            var iframe = document.createElement('iframe');
            iframe.id = hiddenIFrameID;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            iframe.src = url;
        })
    }


}