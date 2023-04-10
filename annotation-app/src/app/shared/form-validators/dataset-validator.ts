/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { AbstractControl, ValidatorFn } from '@angular/forms';

export class DatasetValidator {
  private static readonly REQUIRED_FIELD: string = 'This field is required';
  private static readonly REQUIRED_FIELD_LABEL: string = 'This field is required at least 2 labels';
  private static readonly REQUIRED_FIELD_POP_LABEL: string = 'This field is required at least 2 secondary labels';
  private static readonly REQUIRED_FIELD_ENTITY: string = 'This field is required at least 1 entity';
  private static readonly FILE_FORMAT_NOT_SUPPORT: string = 'Selected file format is not supported';
  private static readonly FILE_SIZE_EXCEED_LIMIT: string = 'Selected file size exceeds the limit 500MB';
  private static readonly IMAGE_FILE_SIZE_EXCEED_LIMIT: string = 'Selected file size exceeds the limit 1MB';
  private static readonly FILE_DUPLICATED: string = 'Selected file has already exist in database';
  private static readonly FILE_EXCEEDS_100MB: string =
    'File exceeds 100MB. Please use the My Datasets tab for larger dataset upload. Once completed, data will be available in this menu.';
  static modelName(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }

      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }

      const pattern = `^[a-zA-Z0-9 _\\-\\.]+$`;
      const argRegEx = new RegExp(pattern, 'g');
      if (!control.value.match(argRegEx)) {
        return {
          msg: {
            value: 'Wrong format! Model name only allow letters, digits, dots, underscores and hyphen',
          },
        };
      }
      return null!;
    };
  }

  static datasetName(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }

      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }

      const pattern = `^[a-zA-Z0-9._-]+$`;
      const argRegEx = new RegExp(pattern, 'g');
      if (!control.value.match(argRegEx)) {
        return {
          msg: {
            value: 'Wrong format! Dataset name only allow digits, letters, dots, underscore, and hyphen',
          },
        };
      }
      return null!;
    };
  }

  static validEmail(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }

      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }

      const pattern = `@vmware.com\\s*$`;
      const argRegEx = new RegExp(pattern, 'g');
      if (!control.value.match(argRegEx)) {
        return {
          msg: { value: 'Wrong format! Email only accept vmware emailbox' },
        };
      }
      return null!;
    };
  }

  static validNormalEmail(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }

      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }

      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (pattern.test(control.value)) {
        return null!;
      } else {
        return { msg: { value: 'Wrong format! Only accept email address' } };
      }
    };
  }

  static validPassword(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }

      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }
      return null!;
    };
  }

  static validRow(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }
      if (DatasetValidator.isEmpty(control.value)) {
        // return { 'msg': { value: DatasetValidator.REQUIRED_FIELD } };
        return { msg: { value: 'Please set data source!' } };
      }

      if (control.value == 0) {
        return { msg: { value: 'Please set data source!' } };
      }
      return null!;
    };
  }

  static localFile(projectType: any, enableAWSS3: any, duplicate: any): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }
      const inputFile = control.parent?.get('localFile')?.value;
      if (inputFile) {
        if (!DatasetValidator.validateFileExt(inputFile, projectType)) {
          return { msg: { value: DatasetValidator.FILE_FORMAT_NOT_SUPPORT } };
        }
        if (!DatasetValidator.validateFileSize(inputFile)) {
          return { msg: { value: DatasetValidator.FILE_SIZE_EXCEED_LIMIT } };
        }
        if (!enableAWSS3) {
          return duplicate ? { msg: { value: DatasetValidator.FILE_DUPLICATED } } : null!;
        }
      }
    };
  }

  static localLabelFile(type: string, inputFile: any): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }
      if (inputFile) {
        if (!DatasetValidator.validateLabelFile(type, inputFile)) {
          return { msg: { value: DatasetValidator.FILE_FORMAT_NOT_SUPPORT } };
        }
        if (!DatasetValidator.validateFileSize(inputFile)) {
          return { msg: { value: DatasetValidator.FILE_SIZE_EXCEED_LIMIT } };
        }
      }
      return DatasetValidator.isEmpty(control.value)
        ? { msg: { value: DatasetValidator.REQUIRED_FIELD } }
        : (null as any);
    };
  }

  static imageFile(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }

      const inputFile = control.parent!.get('localFile')!.value;
      if (inputFile) {
        if (!DatasetValidator.validateImageFile(inputFile)) {
          return { msg: { value: DatasetValidator.FILE_FORMAT_NOT_SUPPORT } };
        }
        if (!DatasetValidator.validateImageFileSize(inputFile)) {
          return {
            msg: { value: DatasetValidator.IMAGE_FILE_SIZE_EXCEED_LIMIT },
          };
        }
      }
      return DatasetValidator.isEmpty(control.value) ? { msg: { value: DatasetValidator.REQUIRED_FIELD } } : null!;
    };
  }

  static required(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }
      return null!;
    };
  }

  static requiredTwo(type: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (type == 'ner' || type == 'image' || type == 'log') {
        if (control.value.length < 1) {
          return { msg: { value: DatasetValidator.REQUIRED_FIELD_ENTITY } };
        }
      } else {
        if (control.value.length < 2) {
          return { msg: { value: DatasetValidator.REQUIRED_FIELD_LABEL } };
        }
      }
      return null!;
    };
  }

  static requiredTwoPopLabel(type: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (type == 'ner') {
        if (control.value.length < 2) {
          return { msg: { value: DatasetValidator.REQUIRED_FIELD_POP_LABEL } };
        }
      }
      return null!;
    };
  }

  static numberOnly(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }

      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }

      const pattern = `^[0-9]+$`;
      const argRegEx = new RegExp(pattern, 'g');
      if (!String(control.value).match(argRegEx)) {
        return { msg: { value: 'Wrong format! number only!' } };
      }
      return null!;
    };
  }

  static maxAnnotation(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }
      const pattern = `^[0-9]+$`;
      const argRegEx = new RegExp(pattern, 'g');
      if (
        !String(control.value).match(argRegEx) ||
        control.value <= 0 ||
        control.value == null ||
        control.value == undefined
      ) {
        return {
          msg: { value: 'Please enter a integer number greater than 0.' },
        };
      }
      return null!;
    };
  }

  static threshold(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }

      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }

      const pattern = `^[0-9]+$`;
      const argRegEx = new RegExp(pattern, 'g');
      if (!String(control.value).match(argRegEx)) {
        return { msg: { value: 'Wrong format! number only!' } };
      }

      if (control.value < 50) {
        return {
          msg: { value: 'Should not less than the minimum threshold 50 !' },
        };
      }

      return null!;
    };
  }

  static textOnly(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null!;
      }

      if (DatasetValidator.isEmpty(control.value)) {
        return { msg: { value: DatasetValidator.REQUIRED_FIELD } };
      }

      const pattern = `^[a-zA-Z]+$`;
      const argRegEx = new RegExp(pattern, 'g');
      if (!control.value.match(argRegEx)) {
        return { msg: { value: 'Wrong format! text only' } };
      }
      return null!;
    };
  }

  private static validateFileExt(inputFile: any, projectType: string): boolean | undefined {
    const ext = inputFile.name.split('.').pop().toLowerCase();
    if (projectType || projectType == '') {
      if (projectType == 'image') {
        if (ext == 'zip') {
          return true;
        } else {
          return false;
        }
      }
      if (
        projectType == 'ner' ||
        projectType == 'text' ||
        projectType == 'csv' ||
        projectType == 'tabular' ||
        projectType == ''
      ) {
        if (ext == 'csv') {
          return true;
        } else {
          return false;
        }
      }
      if (projectType == 'txt' || projectType == 'log') {
        if (ext == 'zip' || ext == 'tgz') {
          return true;
        } else {
          return false;
        }
      }
    } else {
      return false;
    }
    return false;
  }

  private static validateLabelFile(type: string, inputFile: any): boolean {
    const ext = inputFile.name.split('.').pop().toLowerCase();
    if (type === 'json') {
      return type === ext.toLowerCase();
    } else {
      return ['yaml', 'yml'].includes(ext.toLowerCase());
    }
  }

  private static validateImageFile(inputFile: any): boolean {
    const ext = inputFile.name.split('.').pop();
    if (ext == 'jpg' || ext == 'jpeg' || ext == 'png' || ext == 'gif') {
      return true;
    } else {
      return false;
    }
  }

  private static validateImageFileSize(inputFile: any): boolean {
    const size = inputFile.size;

    // 1 MB
    if (inputFile.size < 100000000) {
      return true;
    } else {
      return false;
    }
  }

  private static validateFileSize(inputFile: any): boolean {
    const size = inputFile.size;
    return true;
  }

  private static isEmpty(str: any): boolean {
    if (!str) {
      return true;
    } else if (str instanceof String && str.trim().length === 0) {
      return true;
    } else if (str instanceof Array && str.length === 0) {
      return true;
    } else if (str instanceof Object) {
      return this.isEmptyObject(str);
    }
    return false;
  }

  private static isEmptyObject(obj: any): boolean {
    for (const key in obj) {
      if (obj[key] !== null && obj[key] !== '') {
        return false;
      }
    }
    return true;
  }

  static isInvalidNumber(input: any) {
    return input === null || input === '';
  }

  static isNotIntegerNum(input: any) {
    return Math.round(input) !== input;
  }

  static isRepeatArr(arr: any) {
    let hasArr: any = {};
    for (var i in arr) {
      if (arr[i] && hasArr[arr[i]]) {
        return true;
      }
      hasArr[arr[i]] = true;
    }
    return false;
  }

  static uploadFileSizeLimit(uploadFrom, configFileSize): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!control.parent) {
        return null;
      }
      const inputFile = control.parent.get('localFile').value;
      if (inputFile) {
        if (inputFile.size > 104857600 && uploadFrom == 'create') {
          return { msg: { value: DatasetValidator.FILE_EXCEEDS_100MB } };
        } else if (inputFile.size > configFileSize && uploadFrom == 'datasets') {
          const limitFileSize =
            configFileSize >= 1024 * 1024 * 1024
              ? configFileSize / (1024 * 1024 * 1024) + 'GB'
              : configFileSize / (1024 * 1024) + 'MB';
          return {
            msg: {
              value: `File size exceeds the maximum ${limitFileSize}. Please select a new file to upload. `,
            },
          };
        }
      }
    };
  }
}
