/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

export interface Incentive {
  points: number;
  donation: number;
}

export const Incentives: Incentive[] = [
  { points: 1, donation: 750 },
  { points: 5, donation: 1500 },
  { points: 15, donation: 2250 },
  { points: 30, donation: 3000 },
  { points: 60, donation: 3750 },
  { points: 125, donation: 4500 },
  { points: 250, donation: 5250 },
  { points: 500, donation: 6000 },
];
