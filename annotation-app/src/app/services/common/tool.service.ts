/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/


import { Injectable } from '@angular/core';
import * as _ from "lodash";



@Injectable()
export class ToolService {


    constructor() { }

    hexToRgb(c) {
        if (c.length == 4) {
            c = '#' + [c[1], c[1], c[2], c[2], c[3], c[3]].join('');
        }
        c = '0x' + c.substring(1);
        return 'rgb(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',0.4)';

    }


}