/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { DatasetValidator } from '../../../shared/form-validators/dataset-validator';
import { FormGroup, FormControl } from '@angular/forms';
import { FormValidatorUtil } from '../../../shared/form-validators/form-validator-util';
import { AvaService } from 'app/services/ava.service';
import { UserAuthService } from 'app/services/user-auth.service';
import { SessionStatus } from '../../../model/authentication';
import { Router } from '@angular/router';
import { EnvironmentsService } from 'app/services/environments.service';

@Component({
  selector: 'app-login',
  templateUrl: './basic-login.component.html',
  styleUrls: ['./basic-login.component.scss'],
})
export class BasicLoginComponent implements OnInit {
  dsForm: FormGroup;
  error;
  loading: boolean;
  isClickSignup: boolean;
  registerSuccess: string;
  registerFailed: string;
  loginType: string;
  isLadp: boolean;

  constructor(
    private avaService: AvaService,
    private userAuthService: UserAuthService,
    private router: Router,
    public env: EnvironmentsService,
  ) {}

  ngOnInit() {
    this.error = false;
    this.isClickSignup = false;
    this.isLadp = false;
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
    this.dsForm.get('firstname').setValidators(DatasetValidator.required());
    this.dsForm.get('firstname').updateValueAndValidity();
    this.dsForm.get('lastname').setValidators(DatasetValidator.required());
    this.dsForm.get('lastname').updateValueAndValidity();
    this.cleanInputValue();
  }

  clickSignin() {
    this.isClickSignup = false;
    this.dsForm.get('firstname').setValue(null);
    this.dsForm.get('firstname').setValidators(null);
    this.dsForm.get('firstname').updateValueAndValidity();
    this.dsForm.get('lastname').setValue(null);
    this.dsForm.get('lastname').setValidators(null);
    this.dsForm.get('lastname').updateValueAndValidity();
    this.cleanInputValue();
  }

  cleanInputValue() {
    this.loading = false;
    this.error = false;
    this.dsForm.reset();
    this.registerFailed = '';
    this.registerSuccess = '';
  }

  selectedUserType(event) {
    if (event.target.value === 'ldap') {
      this.isLadp = true;
    } else {
      this.isLadp = false;
    }
  }

  clickLog() {
    FormValidatorUtil.markControlsAsTouched(this.dsForm);
    if (!this.dsForm.invalid) {
      this.loading = true;
      const param = {
        email: this.dsForm.get('username').value,
        password: this.dsForm.get('password').value,
      };
      if (this.isLadp) {
        param['ldap'] = true;
      }
      this.avaService.login(param).subscribe(
        (res) => {
          const user = {
            email: res.email,
            name: res.fullName,
            fullName: res.fullName,
            provider: this.env.config.serviceTitle,
            token: res.token,
          };
          this.userAuthService.addUserToStorage(user, true);
          this.userAuthService.userSubject.next(user);
          this.userAuthService.sessionLifetimeSubject.next(SessionStatus.AUTHENTICATED);
          this.userAuthService.autoRefreshToken();
          this.loading = false;
          this.router.navigate(['/home']);
        },
        (err) => {
          this.error = true;
          this.loading = false;
          return;
        },
      );
    }
  }

  clickSign() {
    this.registerFailed = '';
    this.registerSuccess = '';
    this.error = false;
    FormValidatorUtil.markControlsAsTouched(this.dsForm);
    if (!this.dsForm.invalid) {
      this.loading = true;
      const name = this.dsForm.get('firstname').value + ' ' + this.dsForm.get('lastname').value;
      const fullName = [];
      name.split(' ').forEach((e) => {
        fullName.push(e.replace(e[0], e[0].toUpperCase()));
      });
      const param = {
        email: this.dsForm.get('username').value,
        password: this.dsForm.get('password').value,
        uname: fullName.join(' '),
      };
      this.avaService.register([param]).subscribe(
        (res) => {
          this.registerSuccess = 'Sign Up Complete!';
          this.loading = false;
          setTimeout(() => {
            this.isClickSignup = false;
            this.registerSuccess = '';
          }, 500);
        },
        (err) => {
          this.registerFailed = err.error.MSG;
          this.error = false;
          this.loading = false;
        },
      );
    } else {
      this.error = true;
    }
  }
}
