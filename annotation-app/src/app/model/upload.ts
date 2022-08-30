/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

export interface Upload {
  format: string;
}

export class UploadUtil {
  static init(): Upload {
    return {
      format: '',
    };
  }
}
