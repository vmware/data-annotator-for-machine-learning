/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

export interface User {
  id?: string;
  email?: string;
  btoa?: string;
  fullName?: string;
  srs?: number[];
  srCount?: number;
  optOutProducts?: string[];
  points?: number;
  percentage?: number;
}
