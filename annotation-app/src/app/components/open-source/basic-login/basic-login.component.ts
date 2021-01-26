/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { DatasetValidator } from '../../../shared/form-validators/dataset-validator';
import { FormGroup, FormControl } from "@angular/forms";
import { FormValidatorUtil } from '../../../shared/form-validators/form-validator-util';
import { AvaService } from 'app/services/ava.service';
import { UserAuthService } from 'app/services/user-auth.service';
import { SessionStatus } from "../../../model/authentication";
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './basic-login.component.html',
  styleUrls: ['./basic-login.component.scss']
})
export class basicLoginComponent implements OnInit {

  dsForm: FormGroup;
  error;
  loading: boolean;
  isClickSignup: boolean;
  registerSuccess: string;
  registerFailed: string;


  constructor(
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private router: Router,
  ) { }


  ngOnInit() {
    this.error = false;
    this.isClickSignup = false;
    this.createForm();
  }


  createForm(): void {
    this.dsForm = new FormGroup({
      firstname: new FormControl('', null),
      lastname: new FormControl('', null),
      username: new FormControl('', DatasetValidator.validNormalEmail()),
      password: new FormControl('', DatasetValidator.validPassword()),

    });
  }


  clickSignup() {
    this.isClickSignup = true;
    this.dsForm.get("firstname").setValidators(DatasetValidator.required());
    this.dsForm.get("firstname").updateValueAndValidity();
    this.dsForm.get("lastname").setValidators(DatasetValidator.required());
    this.dsForm.get("lastname").updateValueAndValidity();
    this.cleanInputValue();

  }


  clickSignin() {
    this.isClickSignup = false;
    this.dsForm.get("firstname").setValue(null);
    this.dsForm.get("firstname").setValidators(null);
    this.dsForm.get("firstname").updateValueAndValidity();
    this.dsForm.get("lastname").setValue(null);
    this.dsForm.get("lastname").setValidators(null);
    this.dsForm.get("lastname").updateValueAndValidity();
    this.cleanInputValue();
  }


  cleanInputValue() {
    this.loading = false;
    this.error = false;
    this.dsForm.reset();
    this.registerFailed = '';
    this.registerSuccess = '';

  }



  clickLog() {
    FormValidatorUtil.markControlsAsTouched(this.dsForm);
    if (!this.dsForm.invalid) {
      this.loading = true;
      let param = {
        email: this.dsForm.get('username').value,
        password: this.dsForm.get('password').value,
      };
      this.avaService.login(param).subscribe(res => {
        if (res.MSG) {
          this.error = true;
          this.loading = false;
          return;
        }
        let user = {
          email: res.email,
          name: res.fullName,
          fullName: res.fullName,
          provider: 'Data-annotation',
          token: res.token
        };
        this.userAuthService.addUserToStorage(user, true)
        this.userAuthService.userSubject.next(user);
        this.userAuthService.sessionLifetimeSubject.next(SessionStatus.AUTHENTICATED);
        this.userAuthService.autoRefreshToken();
        this.loading = false;
        this.router.navigate(['/home']);

      }, err => {
        this.error = true;
        this.loading = false;
        return;

      })
    }
  };



  clickSign() {
    this.registerFailed = '';
    this.registerSuccess = '';
    FormValidatorUtil.markControlsAsTouched(this.dsForm);
    if (!this.dsForm.invalid) {
      this.loading = true;
      let name = this.dsForm.get('firstname').value + ' ' + this.dsForm.get('lastname').value;
      let fullName = [];
      name.split(' ').forEach(e => {
        fullName.push(e.replace(e[0], e[0].toUpperCase()));
      })
      let param = {
        email: this.dsForm.get('username').value,
        password: this.dsForm.get('password').value,
        uname: fullName.join(' ')
      };
      this.avaService.register(param).subscribe(res => {
        if (!res.MSG) {
          this.registerSuccess = 'Sign Up Complete!'
        } else if (res.MSG) {
          this.registerFailed = res.MSG
        }
        this.loading = false;
      }, err => {
        this.registerFailed = err.error.MSG;
        this.error = false;
        this.loading = false;
      })
    } else {
      this.error = true;
    }
  }



}
