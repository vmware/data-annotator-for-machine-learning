/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { FormControl, FormGroup, FormArray, AbstractControl } from "@angular/forms";

export class FormValidatorUtil {

  /**
   * Forces the required tooltip to appear in the form
   * @param formElement
   */
  static markControlsAsTouched(formElement: AbstractControl): void {
    if (formElement instanceof FormControl) {
      formElement.markAsTouched();
    } else if (formElement instanceof FormGroup) {
      Object.keys(formElement.controls).forEach(key => {
        this.markControlsAsTouched(formElement.get(key));
      });
    } else if (formElement instanceof FormArray) {
      formElement.controls.forEach(control => {
        this.markControlsAsTouched(control);
      });
    }
  }

}