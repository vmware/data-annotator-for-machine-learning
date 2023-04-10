/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

export interface Incentive {
  points: number;
  donation: number;
}

export const ColorsRainbow = [
  '#00ffff',
  '#ff00ff',
  '#00ff7f',
  '#ff6347',
  '#9B0D54',
  '#00bfff',
  '#FF0000',
  '#ff69b4',
  '#7fffd4',
  '#ffd700',
  '#FBC1DA',
  '#4D007A',
  '#ffdab9',
  '#adff2f',
  '#FFA500',
  '#FFFF00',
  '#583fcf',
  '#A32100',
  '#0F1E82',
  '#F89997',
  '#003D79',
  '#00D4B8',
  '#6C5F59',
  '#AADB1E',
  '#36C9E1',
  '#D0ACE4',
  '#798893',
  '#ED186F',
  '#D87093',
  '#DAA520',
  '#20B2AA',
  '#cb6360',
  '#c98886',
  '#703d3b',
  '#4c0b09',
  '#1890ff',
  '#189044',
  '#36c9d9',
  '#40a9ff',
  '#ff40a8',
  '#673ab7',
  '#faad14',
  '#03a9f4',
  '#9b4f4a',
  '#FF1493',
  '#228B22',
  '#0077b8',
  '#ff7875',
  '#97d778',
  '#2F4F4F',
];

export const PopLabelColors = [
  '#55b128',
  '#d70c3b',
  '#3377dd',
  '#973633',
  '#f7a604',
  '#864ac1',
  '#09cbe5',
  '#a0f709',
  '#edf709',
  '#e9098f',
];

export const ClrTimelineStepState = {
  NOT_STARTED: 'not-started',
  CURRENT: 'current',
  SUCCESS: 'success',
  ERROR: 'error',
  PROCESSING: 'processing',
};

export const Classifier = [
  { name: 'RandomForestClassifier', value: 'RFC' },
  { name: 'KNeighborsClassifier', value: 'KNC' },
  { name: 'GradientBoostingClassifier', value: 'GBC' },
];

export const Encoder = [
  { name: ' One-Hot Encoding', value: 'oneHot' },
  { name: 'Categorical Embeddings', value: 'embeddings' },
];

export const QueryStrategyBase = [
  { name: 'uncertainty_sampling', value: 'PB_UNS' },
  { name: 'margin_sampling', value: 'PB_MS' },
  { name: 'entropy_sampling', value: 'PB_ES' },
  { name: 'uncertainty_batch_sampling', value: 'RBM_UNBS' },
];

export const PopLabels = [
  { name: 'Positive', value: 'Positive', setLableErrMessage: '' },
  { name: 'Negative', value: 'Negative', setLableErrMessage: '' },
  { name: 'Neutral', value: 'Neutral', setLableErrMessage: '' },
];
