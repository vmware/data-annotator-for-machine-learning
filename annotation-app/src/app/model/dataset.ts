/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

export interface Dataset {
  format: string;
  name: string;
  description: string;
  maxAnnotations: number;
  file: string;
  hasHeader: string;
  isMultiLabel: string;
  headRows: any[];
  task: string;
  classField: string;
  textField: string;
  template: any;
  label?: string;
  columns?: any[];
  source?: string;
}

export class DatasetUtil {
  static init(): DatasetData {
    return {
      user: '',
      name: '',
      description: '',
      annotationQuestion: 'What label does this ticket belong to ?',
      maxAnnotations: 1,
      annotationDisplayName: 'Passage',
      labels: [],
      assigmentLogic: 'random',
      assignee: [],
      localFile: null,
      selectDescription: [],
      selectLabels: null,
      totalRow: 0,
      selectedFile: {
        name: '',
        location: '',
        provider: '',
      },
      min: null,
      max: null,
      multipleLabel: 'n',
      selectedText: null,
      isShowFilename: 'no',
      selectedDisplayColumn: [],
      slack: [],
      projectType: 'text',
    };
  }

  static uploadInit(): UploadData {
    return {
      hasHeader: 'yes',
      localFile: null,
      fileFormat: null,
    };
  }

  static sqlInit(): QueryDatasetData {
    return {
      user: '',
      name: '',
      description: '',
      source: 'VAC',
      format: 'tabular',
      hasHeader: 'yes',
      isMultiLabel: 'no',
      query: '',
    };
  }
}

export interface DatasetData {
  user: string;
  name: string;
  description: string;
  maxAnnotations: number;
  labels: any;
  assigmentLogic: string;
  assignee: any;
  localFile: any;
  selectedFile?: DatasetFile;
  selectDescription: any[];
  selectLabels: string;
  totalRow: number;
  annotationQuestion: string;
  annotationDisplayName: string;
  min: any;
  max: any;
  multipleLabel: string;
  selectedText: string;
  isShowFilename: string;
  selectedDisplayColumn: any[];
  slack: any;
  projectType: string;
}

export interface DatasetFile {
  name: string;
  location: string;
  provider: string;
  selected?: string;
  size?: number;
  md5Checksum?: string;
  sha1Checksum?: string;
  localFile?: string;
  platforms?: string;
  key?: string;
}

export interface DatasetOption {
  textCol: string;
  labelCol: string;
  dsRowLimit: number;
  classRowFloor: number;
  classRowCeiling: number;
  dsGrepText: string;
  optascii: string;
  optjoin: string;
}

export interface QueryDatasetData {
  user: string;
  name: string;
  description: string;
  format: string;
  hasHeader: string;
  isMultiLabel: string;
  source: string;
  query: string;
}

export interface UploadData {
  hasHeader: string;
  localFile: any;
  fileFormat: string;
}
