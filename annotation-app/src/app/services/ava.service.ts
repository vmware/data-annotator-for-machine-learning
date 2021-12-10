/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SR, SrUserInput } from '../model/sr';
import { DatasetData } from '../model/index';
import * as _ from 'lodash';
import { EnvironmentsService } from './environments.service';
import { map } from 'rxjs/operators';

@Injectable()
export class AvaService {
  baseUrl: string;

  constructor(private http: HttpClient, private env: EnvironmentsService) {
    this.baseUrl = `${this.env.config.annotationService}/api/v1.0`;
  }

  public getAllUsers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users`);
  }

  public saveUser(payload): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, payload);
  }

  public deleteUser(payload: any): Observable<any> {
    const options = {
      headers: new HttpHeaders(),
      body: payload,
    };
    return this.http.delete(`${this.baseUrl}/users`, options);
  }

  public saveRoleEdit(payload: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users`, payload);
  }

  public getUserRole(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/roles`);
  }

  public getMyDatasets(format?: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/datasets?format=${format}`);
  }

  public getProjectsList(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/projects/names`);
  }

  public postDataset(formdata: FormData): Observable<any> {
    return this.http.post<DatasetData>(`${this.baseUrl}/projects`, formdata);
  }

  public saveProjectEdit(payload: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/projects`, payload);
  }

  public deleteProject(payload: any): Observable<any> {
    const options = {
      headers: new HttpHeaders(),
    }
    return this.http.delete(`${this.baseUrl}/projects/${payload.pid}`, options);
  }

  public getProjects(router: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects?src=${router}`);
  }

  public getProjectInfo(pid: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/projects/details?pid=${pid}`);
  }

  public findProjectName(param: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/names?pname=${param.pname}`);
  }

  public getAccuracy(projectId?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/al/accuracy?pid=${projectId}`);
  }

  public generate(id?: any, format?: string, src?: string, onlyLabelled?: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/projects/generate?pid=${id}&format=${format}&src=${src}&onlyLabelled=${onlyLabelled}`,
    );
  }

  public downloadProject(id?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/download?pid=${id}`);
  }

  public communityDownload(payload?: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/projects/download/community-download-count`, payload);
  }

  public shareStatus(payload: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/projects/share`, payload);
  }

  public getProblemCategories(id?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/labels?pid=${id}`);
  }

  public getChart(projectId?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/annotations?pid=${projectId}`);
  }

  public getProgress(payload: any): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/projects/users/progression?pid=${payload.id}&review=${payload.review}`,
    );
  }

  public putSrUserInput(srUserInput: SrUserInput): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/projects/tickets`, srUserInput);
  }

  public appendSrs(payload?: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/projects/tickets`, payload);
  }

  public deleteTicket(payload?: any): Observable<any> {
    const options = {
      headers: new HttpHeaders(),
      body: payload,
    };
    return this.http.delete(`${this.baseUrl}/projects/tickets`, options);
  }

  public getSample(dataSetId?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/tickets/examples?pid=${dataSetId}`).pipe(
      map((res) => {
        const flag = [];
        _.forIn(res.sampleSr, function (value, key) {
          flag.push({ key, value });
        });
        res.sampleSr = flag;
        return res;
      }),
    );
  }

  public getRandomSr(param): Observable<SR> {
    return this.http.get<SR>(`${this.baseUrl}/projects/tickets/annotations?pid=${param.id}`);
  }

  public skipToNext(param): Observable<SR> {
    return this.http.post<SR>(`${this.baseUrl}/projects/tickets/skip`, param);
  }

  public getALLSrs(payload: any): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/projects/tickets?pid=${payload.id}&fname=${payload.fname}&page=${payload.pageNumber}&limit=${payload.limit}`,
    );
  }

  public getSrById(payload: any): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/projects/tickets/details?tid=${payload.id}&pid=${payload.pid}`,
    );
  }

  public toFlagTicket(payload?: any): Observable<SR> {
    return this.http.post<SR>(`${this.baseUrl}/projects/tickets/flags`, payload);
  }

  public unflag(payload?: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/projects/tickets/flags/un-flag`, payload);
  }

  public getAllFlag(projectName?: any, pageNumber?: number, limit?: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/projects/tickets/users/flags?pname=${projectName}&page=${pageNumber}&limit=${limit}`,
    );
  }

  public getAllFlagTickets(
    projectName?: any,
    pageNumber?: number,
    limit?: number,
  ): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/projects/tickets/flags?pname=${projectName}&page=${pageNumber}&limit=${limit}`,
    );
  }

  public silenceTicket(payload?: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/projects/tickets/flags/silence`, payload);
  }

  public getS3UploadConfig(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/datasets/s3/credentials`);
  }

  public getCloudUrl(dataSetId?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/datasets/s3/signed-url?dsid=${dataSetId}`);
  }

  public uploadDateset(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/datasets`, payload);
  }

  public deleteMyDataset(payload: any): Observable<any> {
    const options = {
      headers: new HttpHeaders(),
    };
    return this.http.delete(`${this.baseUrl}/datasets/${payload.dsId}`, options);
  }

  public findDatasetName(dataSetName?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/datasets/names?dsname=${dataSetName}`);
  }

  public sendSQL(payload?: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/datasets/query-from-superCollider`, payload);
  }

  public sendEmailToOwner(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/emails/send-to-owners`, payload);
  }

  public sendEmailToAnnotator(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/emails/send-to-annotators`, payload);
  }

  public deleteLabel(payload: any): Observable<any> {
    const options = {
      headers: new HttpHeaders(),
      body: payload,
    };
    return this.http.delete(`${this.baseUrl}/projects/labels`, options);
  }

  public register(payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/register`, payload);
  }

  public login(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, payload);
  }

  public getToken(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/token`);
  }

  public getProjectsReviewList(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/review`);
  }

  public getOneReview(pid: any, user?: string, order?: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/projects/tickets/review?pid=${pid}&user=${user}&order=${order}`,
    );
  }

  public passTicket(payload: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/projects/tickets/review`, payload);
  }

  public getAllLogFilename(pid: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/log/files?pid=${pid}`);
  }

  public getSrByFilename(data: any): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/projects/log/filter?pid=${data.pid}&fname=${data.fname}`,
    );
  }

  public getSetData(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/datasets/set-data`, payload);
  }

  public checkLocalFileExist(filename: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/datasets/file?file=${filename}`).pipe(
      map(
        (res) => {
          if (res.fileExist) {
            return true;
          } else {
            return false;
          }
        },
        (err) => {
          console.log(err);
          return false;
        },
      ),
    );
  }
}
