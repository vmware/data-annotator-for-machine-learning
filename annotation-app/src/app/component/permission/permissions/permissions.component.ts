/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ToolService } from 'src/app/services/common/tool.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { ClrLoadingState } from '@clr/angular';
import { InternalApiService } from 'src/app/services/internal-api.service';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss'],
})
export class PermissionsComponent implements OnInit {
  errorMessage;
  infoMessage;
  loading: boolean;
  datasets;
  totalItems;
  editUser: any = {};
  createUserDialog: boolean;
  deleteDatasetDialog: boolean;
  msgDelete;
  setUserErrMessage;
  collaborators: any = [];
  inputValueChange = new Subject<string>();
  loadingBtn: ClrLoadingState = ClrLoadingState.DEFAULT;

  constructor(
    private apiService: ApiService,
    private toolService: ToolService,
    public env: EnvironmentsService,
    private internalApiService: InternalApiService,
  ) {}

  ngOnInit(): void {
    if (this.env.config.hubService) {
      this.getAllInternalUsers();
    } else {
      this.getAllUsers();
    }

    this.collaborators.push({ email: '', role: 'Power User' });
  }

  inputUserNameUpdate(index) {
    this.inputValueChange.next(index);
    this.inputValueChange.pipe(debounceTime(400), distinctUntilChanged()).subscribe((index) => {
      this.validateUserName(index, this.collaborators[index].email.trim());
    });
  }
  getAllUsers() {
    this.loading = true;
    this.apiService.getAllUsers().subscribe(
      (res) => {
        this.loading = false;
        this.datasets = res;
        this.totalItems = res.length;
      },
      (error: any) => {
        this.errorMessage = 'Failed to load';
        this.loading = false;
      },
    );
  }

  getAllInternalUsers() {
    this.loading = true;
    this.internalApiService.getAllInternalUsers().subscribe(
      (res) => {
        this.loading = false;
        this.datasets = res.result;
        this.totalItems = res.result.length;
      },
      (error: any) => {
        this.errorMessage = 'Failed to load';
        this.loading = false;
      },
    );
  }

  // to open the user email and role modal
  selectedUser(info?) {
    this.createUserDialog = true;
    this.collaborators = [{ email: '', role: 'Power User' }];
    if (info) {
      if (!this.env.config.hubService) {
        this.editUser.role = info.role === 'Admin' ? 'Power User' : 'User';
      } else {
        this.editUser.role = info.role;
      }
      this.editUser.email = info.email;
      this.collaborators = [{ email: info.email, role: this.editUser.role }];
    }
  }

  changeSetRadio(value, i) {
    this.collaborators[i].role = value;
  }

  close() {
    this.createUserDialog = false;
    this.editUser = {};
  }

  addNewRow() {
    this.collaborators.push({ email: '', role: 'Power User' });
  }

  deleteUserRow(index) {
    if (this.collaborators.length > 1) {
      this.collaborators.splice(index, 1);
    }
  }

  validateUserName(index, value: any) {
    if (value) {
      const emailReg = this.toolService.toRegEmail([value]);
      if (emailReg) {
        this.collaborators[index].setUserErrMessage = '';
      } else {
        this.collaborators[index].setUserErrMessage = this.env.config.enableAWSS3
          ? 'Wrong format! Email only accept vmware email box'
          : 'Wrong format! Only accept email address';
      }
    } else {
      this.collaborators[index].setUserErrMessage = 'This field is required';
    }
  }

  toSetUser(param) {
    this.internalApiService.saveUser(param).subscribe(
      (res) => {
        this.loadingBtn = ClrLoadingState.DEFAULT;
        this.editUser = {};
        this.createUserDialog = false;
        this.errorMessage = '';
        this.infoMessage = 'Succeed to add collaborator.';
        this.getAllUsers();
        setTimeout(() => {
          this.infoMessage = '';
        }, 5000);
      },
      (error: any) => {
        this.errorMessage = 'Failed to add collaborator.';
        this.loadingBtn = ClrLoadingState.DEFAULT;
        this.editUser = {};
        this.createUserDialog = false;
        this.getAllUsers();
      },
    );
  }

  toSetInternalUser(param) {
    this.internalApiService.saveInternalUser(param).subscribe(
      (res) => {
        if (res.status == 'OK') {
          this.loadingBtn = ClrLoadingState.DEFAULT;
          this.createUserDialog = false;
          this.errorMessage = '';
          this.infoMessage = 'Succeed to add collaborator.';
          this.getAllInternalUsers();
          setTimeout(() => {
            this.infoMessage = '';
          }, 5000);
        } else {
          this.errorMessage = res.message;
          this.loadingBtn = ClrLoadingState.DEFAULT;
          this.createUserDialog = false;
        }
      },
      (error: any) => {
        this.errorMessage = 'Failed to add collaborator.';
        this.loadingBtn = ClrLoadingState.DEFAULT;
        this.createUserDialog = false;
        this.getAllInternalUsers();
      },
    );
  }

  toSaveRoleEdit(obj) {
    this.apiService.saveRoleEdit(obj).subscribe(
      (res) => {
        this.loadingBtn = ClrLoadingState.DEFAULT;
        this.editUser = {};
        this.createUserDialog = false;
        this.errorMessage = '';
        this.infoMessage = 'Success to modify the user role';
        this.getAllUsers();
        setTimeout(() => {
          this.infoMessage = '';
        }, 1000);
      },
      (error: any) => {
        this.errorMessage = 'Failed to save';
        this.loadingBtn = ClrLoadingState.DEFAULT;
        this.editUser = {};
        this.createUserDialog = false;
        this.getAllUsers();
      },
    );
  }

  toSaveInternalRoleEdit(obj) {
    this.internalApiService.saveInternalRoleEdit(obj).subscribe(
      (res) => {
        if (res.status == 'OK') {
          this.loadingBtn = ClrLoadingState.DEFAULT;
          this.editUser = {};
          this.createUserDialog = false;
          this.errorMessage = '';
          this.infoMessage = 'Success to modify the user role';
          setTimeout(() => {
            this.infoMessage = '';
          }, 2000);
          // to edit this user in loop
          if (obj.role === 'Power User') {
            obj.role = 'Admin';
          } else {
            obj.role = 'Project Owner';
          }
          this.apiService.saveRoleEdit(obj).subscribe();
        } else {
          this.errorMessage = res.message;
          this.loadingBtn = ClrLoadingState.DEFAULT;
          this.editUser = {};
          this.createUserDialog = false;
        }
        this.getAllInternalUsers();
      },
      (error: any) => {
        this.errorMessage = 'Failed to save';
        this.loadingBtn = ClrLoadingState.DEFAULT;
        this.editUser = {};
        this.createUserDialog = false;
        this.getAllInternalUsers();
      },
    );
  }

  saveRoleCreate() {
    let array = [];
    this.collaborators.forEach((element) => {
      if (element.email && !element.setUserErrMessage) {
        array.push(element);
      } else if (element.setUserErrMessage) {
        array = [];
        return;
      }
    });
    if (array.length > 0) {
      array.forEach((element) => {
        element.user = element.email;
        if (!this.env.config.hubService) {
          element.role = element.role === 'Power User' ? 'Admin' : 'Project Owner';
        }
      });
      this.loadingBtn = ClrLoadingState.LOADING;
      if (this.editUser.email) {
        if (!this.env.config.hubService) {
          this.toSaveRoleEdit(array[0]);
        } else {
          this.toSaveInternalRoleEdit(array[0]);
        }
      } else {
        // should be set role
        if (!this.env.config.hubService) {
          this.toSetUser(array);
        } else {
          let param = { assignments: array };
          this.toSetInternalUser(param);
        }
      }
    }
  }

  deleteUser(info) {
    this.loading = true;
    const param = {
      uid: info.email,
    };
    this.apiService.deleteUser(param).subscribe(
      (res) => {
        this.deleteDatasetDialog = false;
        this.infoMessage = 'Success to delete the user';
        this.getAllUsers();
        setTimeout(() => {
          this.infoMessage = '';
        }, 1000);
      },
      (error: any) => {
        this.errorMessage = 'Failed to save';
        this.deleteDatasetDialog = false;
        this.loading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 1000);
      },
    );
  }

  deleteInternalUser(email) {
    this.loading = true;
    this.internalApiService.deleteInternalUser(email).subscribe(
      (res) => {
        this.deleteDatasetDialog = false;
        this.infoMessage = 'Success to delete the user';
        this.getAllInternalUsers();
        setTimeout(() => {
          this.infoMessage = '';
        }, 2000);
        // need reset user also in loop
        let obj = {
          email: email,
          role: 'Project Owner',
        };
        this.apiService.saveRoleEdit(obj).subscribe();
      },
      (error: any) => {
        this.errorMessage = 'Failed to save';
        this.deleteDatasetDialog = false;
        this.loading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 1000);
      },
    );
  }

  clickDeleteUserBtn(user) {
    this.deleteDatasetDialog = true;
    this.msgDelete = {
      modalHeader: this.env.config.hubService && this.env.config.embedded ? 'Reset User' : 'Delete User',
      modalContent:
        this.env.config.hubService && this.env.config.embedded
          ? "Please be sure this is going to reset this user'role to User."
          : 'Please be sure this is not reversible, still delete selected user?',
      selectedData: user,
    };
  }

  receiveCloseDelete(value: boolean) {
    if (value) {
      this.deleteDatasetDialog = false;
      this.msgDelete = {};
    }
  }

  receiveDeleteOkBtn(value: boolean) {
    if (value) {
      if (this.env.config.hubService) {
        this.deleteInternalUser(this.msgDelete.selectedData.email);
      } else {
        this.deleteUser(this.msgDelete.selectedData);
      }
    }
  }
}
