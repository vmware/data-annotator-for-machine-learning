/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatasetData } from '../model/index';
import * as _ from 'lodash';
import { EnvironmentsService } from './environments.service';

@Injectable({
  providedIn: 'root',
})
export class InternalApiService {
  baseUrl: string;
  inUrl: string;
  hubUrl: string;

  constructor(private http: HttpClient, private env: EnvironmentsService) {
    this.baseUrl = `${this.env.config.annotationService}/api/v1.0`;
    this.inUrl = `${this.env.config.inUrl}`;
    this.hubUrl = `${this.env.config.hubService}/api/3.0`;
  }

  public getAllInternalUsers(): Observable<any> {
    return this.http.get<any>(`${this.hubUrl}/roles`);
  }

  public saveUser(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, payload);
  }

  public saveInternalUser(payload: any): Observable<any> {
    return this.http.post<any>(`${this.hubUrl}/roles`, payload);
  }

  public deleteInternalUser(email: any): Observable<any> {
    return this.http.delete(`${this.hubUrl}/role?email=${email}`);
  }

  public saveInternalRoleEdit(payload: any): Observable<any> {
    return this.http.post(`${this.hubUrl}/role`, payload);
  }

  public getS3UploadConfig(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/datasets/s3/credentials`);
  }

  public getCloudUrl(dataSetId?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/datasets/s3/signed-url?dsid=${dataSetId}`);
  }

  public sendEmailToOwner(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/emails/send-to-owners`, payload);
  }

  public sendEmailToAnnotator(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/emails/send-to-annotators`, payload);
  }

  public validSlackChannel(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/conversations-list`, payload);
  }

  // upload dataset to inst
  public postInDataset(formdata: FormData): Observable<any> {
    return this.http.post<DatasetData>(this.inUrl + '/api/1.0/datasets', formdata);
  }

  // delete dataset to inst
  public deleteInDataset(payload: any): Observable<any> {
    const options: any = {
      body: payload,
    };
    return this.http.delete<DatasetData>(this.inUrl + '/api/1.0/datasets', options);
  }
}
