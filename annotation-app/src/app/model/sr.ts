/*
Copyright 2019-2024 VMware, Inc.
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
  questionForText?: any;
  userInput?: UserInput[];
  pid?: number;
}
export interface UserInput {
  problemCategory?: any;
  timestamp?: string;
  tid?: number;
  user?: string;
  logFreeText?: string;
  questionForText?: QaChat[];
}

export interface SrUserInput {
  pid?: number;
  user?: string;
  userInput?: any;
}

export interface QaChat {
  prompt: string;
  response: string;
  reference?: any;
  followUps?: QaChat[];
}

export class DatasetUtil {
  static initQaChat(): SR {
    return {
      userInput: [{ questionForText: [{ prompt: '', response: '', reference: [], followUps: [] }] }],
    };
  }
}
