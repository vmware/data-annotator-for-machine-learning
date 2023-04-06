/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Remove extra numbers after the full name (those numbers comes fromt the authentication service)
 */
@Pipe({ name: 'fullNamePipe' })
export class FullNamePipe implements PipeTransform {
  transform(fullName: string): string {
    const match = /^([^\d]+)/.exec(fullName);
    return match && match[1] ? match[1] : fullName;
  }
}
