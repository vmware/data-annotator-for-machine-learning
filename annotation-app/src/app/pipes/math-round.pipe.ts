/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Remove extra numbers after the full name (those numbers comes fromt the authentication service)
 */
@Pipe({ name: 'mathRoundPipe' })
export class MathRoundPipe implements PipeTransform {
  transform(mathRound: number): string {
    const a = Math.round(mathRound);
    return String(a);
  }
}
