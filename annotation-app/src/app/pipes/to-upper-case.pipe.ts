/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toUpperCase'
})
export class ToUpperCasePipe implements PipeTransform {

  transform(value: string): any {
    let temp = value.split('');
    temp[0] = temp[0].toUpperCase();
    let newStr = temp.join('');
    return newStr;
  }

}
