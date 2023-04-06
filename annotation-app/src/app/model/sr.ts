/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

export interface SR {
  _id?: number;
  originalData?: any;
  problemCategory?: any;
  productName?: string;
  issueType?: string;
  resoltionCode?: string;
  resolution?: string;
  caseNumber?: string;
  userInputs?: UserInput[];
  MSG?: string;
  flag?: any;
  images?: any;
  userInputsLength?: number;
  fileInfo?: any;
  ticketQuestions?: any;
}
export interface UserInput {
  problemCategory: any;
  timestamp?: string;
  tid: number;
  user: string;
  logFreeText?: string;
}

export interface SrUserInput {
  pid: number;
  user?: string;
  userInput: any;
}
