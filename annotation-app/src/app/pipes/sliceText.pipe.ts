/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'SliceTextPipe' })
export class SliceTextPipe implements PipeTransform {
  transform(fullText: string): string {
    const sliceText = fullText.slice(0, 20) + '...';
    return sliceText;
  }
}
