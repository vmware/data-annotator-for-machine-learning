import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserAuthService } from 'app/services/user-auth.service';
import { DatasetValidator } from 'app/shared/form-validators/dataset-validator';
import { FormValidatorUtil } from 'app/shared/form-validators/form-validator-util';
import * as _ from 'lodash';
import { DatasetUtil, UploadData } from 'app/model';
const YAML = require('js-yaml');

@Component({
  selector: 'app-upload-label',
  templateUrl: './upload-label.component.html',
  styleUrls: ['./upload-label.component.scss']
})
export class UploadLabelComponent implements OnInit {

  @Output('onCloseDialog')
  onCloseDialogEmitter = new EventEmitter();

  @Output('uploadSuccess')
  uploadSuccessEmitter = new EventEmitter();

  user: any;
  uploadGroup: FormGroup;
  loading = false;
  uploadSet: UploadData;
  inputFile: any;
  uploadComplete = false;
  waitingTip = false;

  constructor(
    private formBuilder: FormBuilder,
    private userAuthService: UserAuthService,
  ) {}

  ngOnInit() {
    this.user = this.userAuthService.loggedUser().email;
    this.createUploadForm();
  }

  createUploadForm(): void {
    if (!this.uploadSet) {
      this.uploadSet = DatasetUtil.uploadInit();
    }
    this.uploadSet.fileFormat = 'json';
    this.uploadGroup = this.formBuilder.group({
      localFile: [null, DatasetValidator.localLabelFile(this.uploadSet.fileFormat, this.inputFile)],
      fileFormat: [this.uploadSet.fileFormat, ''],
    });
  }

  onCloseDialog() {
    this.onCloseDialogEmitter.emit();
  }

  onLocalFileChange(event) {
    if (event.target.files.length > 0) {
      this.inputFile = event.target.files[0];
      this.checkLocalFile();
    } else {
      this.inputFile = '';
      this.checkLocalFile();
    }
  }

  checkLocalFile() {
    this.uploadGroup.get('localFile').setValue(this.inputFile);
    this.uploadGroup.get('localFile').setValidators(DatasetValidator.localLabelFile(this.uploadSet.fileFormat, this.inputFile));
    this.uploadGroup.get('localFile').updateValueAndValidity(); 
    FormValidatorUtil.markControlsAsTouched(this.uploadGroup);
  }

  saveUpload() {
    this.checkLocalFile();
    if (this.inputFile && !this.uploadGroup.invalid) {
      this.uploadComplete = true;
      this.inputFile.size < 10485760 ? (this.waitingTip = false) : (this.waitingTip = true);
      this.uploadLabelFile();
    }
  }

  uploadLabelFile() {
    const fileread = new FileReader();
    const _this = this;
    fileread.onload = () => {
        _this.showLables(fileread.result);
    };
    fileread.readAsText(this.inputFile);
  }

  showLables(content: any) {
    let result;
    if (this.uploadGroup.get('fileFormat').value === 'yaml') {
      result = YAML.load(content);
    } else {
      result = JSON.parse(content);
    }
    this.uploadSuccessEmitter.emit(result);
  }

  cancelUpload() {
    this.uploadGroup.get('localFile').reset();
    this.inputFile = null;
    this.uploadComplete = false;
    this.uploadGroup.get('datasetsName').reset();
    this.waitingTip = false;
  }

  changeFileFormat(e) {
    this.uploadSet.fileFormat = e;
    this.checkLocalFile();
  }
}
