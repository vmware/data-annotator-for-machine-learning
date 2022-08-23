/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { EnvironmentsService } from './environments.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
// import 'rxjs/Rx';
import { tap } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
  AuthRequestToken,
  AuthResponseToken,
  AuthUser,
  SessionStatus,
  AuthUtil,
} from '../model/authentication';
import { finalize } from 'rxjs/operators';

@Injectable()
export class UserAuthService {
  public userSubject: BehaviorSubject<any>;
  public sessionLifetimeSubject: BehaviorSubject<SessionStatus>;
  private jwtHelper: JwtHelperService;
  private tokenExpirationTimer: any;
  private currentSession: BehaviorSubject<any>;

  constructor(
    private location: Location,
    private http: HttpClient,
    private env: EnvironmentsService,
  ) {
    this.jwtHelper = new JwtHelperService();
    this.autoRefreshToken(); // autoRefresh validates if the stored token is still valid
    const status: SessionStatus = this.loggedUser()
      ? SessionStatus.AUTHENTICATED
      : SessionStatus.NOT_AUTHENTICATED;
    this.sessionLifetimeSubject = new BehaviorSubject<SessionStatus>(status);
    window.addEventListener('storage', this.storageEventListener.bind(this));
    this.userSubject = new BehaviorSubject<AuthUser>(this.loggedUser());
  }

  private storageEventListener(event: StorageEvent) {
    if (event.storageArea === localStorage && event.key === this.env.config.serviceTitle) {
      if (event.newValue) {
        const authUser: AuthUser = JSON.parse(event.newValue);
        this.userSubject.next(authUser);
      } else {
        this.logout();
      }
    }
  }

  public addUserToStorage(user: AuthUser, persistent: boolean) {
    if (persistent) {
      localStorage.setItem(this.env.config.serviceTitle, JSON.stringify(user));
    } else {
      sessionStorage.setItem(this.env.config.serviceTitle, JSON.stringify(user));
    }
  }

  public loggedUser(): AuthUser {
    const storedUser = localStorage.getItem(this.env.config.serviceTitle);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (AuthUtil.isValidUser(user)) {
        return user;
      } else if (AuthUtil.isValidBasicUser(user)) {
        return user;
      } else {
        this.logout(); // the user object on the storage is not valid (does not have email and token)
      }
    }
    return null;
  }

  public loggedUserListener(): Observable<AuthUser> {
    return this.userSubject.asObservable();
  }

  public sessionLifetimeListener(): Observable<SessionStatus> {
    return this.sessionLifetimeSubject.asObservable();
  }

  public isLoggedIn(): boolean {
    return this.loggedUser() != null;
  }

  public clearSession(): void {
    this.userSubject.next(null);
    localStorage.removeItem(this.env.config.serviceTitle);
    sessionStorage.removeItem(this.env.config.serviceTitle);
  }

  redirectToLogin() {
    const redirectUrl =
      window.location.origin +
      this.location.prepareExternalUrl(
        this.env.config.redirectUrl ? this.env.config.redirectUrl : '/home',
      );
    window.location.href = `${this.env.config.authUrl}/authorize?response_type=code&client_id=${this.env.config.CLIENT_ID}&redirect_uri=${redirectUrl}&state=${this.env.config.STATE}&bypass_uri_check=true`;
  }

  public loging(code: string, clientId: string, redirectUrl: string) {
    const authReqToken: AuthRequestToken = {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUrl,
      code,
      bypass_uri_check: true,
    };
    return this.getAuthToken(authReqToken);
  }

  getAccessToken() {
    const session = this.currentSession.getValue();
    return session ? session.access_token : null;
  }

  clearCurrentSession() {
    localStorage.removeItem(this.env.config.serviceTitle);
    this.currentSession.next(null);
  }

  isCurrentSessionExpired() {
    const currentToken = this.getAccessToken();
    if (!currentToken) {
      return true;
    } else {
      return this.jwtHelper.isTokenExpired(currentToken);
    }
  }

  public logout(): void {
    if (this.env.config.logoutUrl) {
      if (this.loggedUser()) {
        if (this.env.config.production) {
          this.http
            .post(`${this.env.config.logoutUrl}`, null, {
              headers: new HttpHeaders().append(
                'Authorization',
                this.loggedUser().token.access_token,
              ),
            })
            .pipe(
              finalize(() => {
                this.clearSession();
                this.redirectToHome();
              }),
            )
            .subscribe();
        } else {
          this.clearSession();
          const redirectUrl =
            window.location.origin + this.location.prepareExternalUrl(this.env.config.redirectUrl);
          window.location.href = `${this.env.config.logoutUrl}?client_id=${this.env.config.CLIENT_ID}&redirect_uri=${redirectUrl}&state=${this.env.config.STATE}`;
        }
        this.sessionLifetimeSubject.next(SessionStatus.NOT_AUTHENTICATED);
        if (this.tokenExpirationTimer) {
          clearTimeout(this.tokenExpirationTimer);
        }
        this.tokenExpirationTimer = null;
      }
    } else {
      this.sessionLifetimeSubject.next(SessionStatus.NOT_AUTHENTICATED);
      if (this.tokenExpirationTimer) {
        clearTimeout(this.tokenExpirationTimer);
      }
      this.tokenExpirationTimer = null;
      this.clearSession();
      this.redirectToHome();
    }
  }

  private refreshToken() {
    if (this.env.config.tokenUrl) {
      const authReqToken: AuthRequestToken = {
        grant_type: 'refresh_token',
        refresh_token: this.loggedUser().token.refresh_token,
        bypass_uri_check: true,
      };
      this.getAuthToken(authReqToken).subscribe(
        (_) => _,
        (error) => {
          // The session will expire when the 'refresh token' is not valid anymore.
          this.sessionLifetimeSubject.next(SessionStatus.EXPIRED);
        },
      );
    } else {
      this.getBasicAuthToken();
    }
  }

  public autoRefreshToken(): void {
    if (this.loggedUser()) {
      let expirationMilliseconds;
      if (this.env.config.tokenUrl) {
        const expirationDate: Date = this.jwtHelper.getTokenExpirationDate(
          this.loggedUser().token.access_token,
        );
        expirationMilliseconds =
          new Date(expirationDate).getTime() - new Date().getTime() - 20 * 1000;
      } else {
        expirationMilliseconds =
          this.loggedUser().token.expires_time * 1000 - new Date().getTime() - 60 * 1000;
      }
      this.tokenExpirationTimer = setTimeout(() => {
        this.refreshToken();
      }, Math.max(expirationMilliseconds, 0));
    }
  }

  public getAuthToken(authReqToken: AuthRequestToken): Observable<AuthResponseToken> {
    return this.http.post<AuthResponseToken>(`${this.env.config.tokenUrl}`, authReqToken).pipe(
      tap(
        (authResponse) => {
          const decodedToken = this.jwtHelper.decodeToken(authResponse.access_token);
          const user: AuthUser = {
            email: decodedToken.email,
            name: decodedToken.name,
            fullName: decodedToken.name,
            provider: decodedToken.provider,
            token: authResponse,
          };
          this.addUserToStorage(user, true);
          this.userSubject.next(user);
          this.sessionLifetimeSubject.next(SessionStatus.AUTHENTICATED);
          this.autoRefreshToken();
        },
        (error) => {
          this.logout();
          throwError(error);
        },
      ),
    );
  }

  public getBasicAuthToken() {
    this.http
      .get(`${this.env.config.annotationService}/api/v1.0/token`, {
        headers: new HttpHeaders().append('Authorization', this.loggedUser().token.access_token),
      })
      .subscribe(
        (res) => {
          const storedUser = JSON.parse(localStorage.getItem(this.env.config.serviceTitle));
          storedUser.token = res;
          localStorage.setItem(this.env.config.serviceTitle, JSON.stringify(storedUser));
          this.autoRefreshToken();
        },
        (err) => {
          this.sessionLifetimeSubject.next(SessionStatus.EXPIRED);
          this.logout();
        },
      );
  }

  redirectToHome() {
    const redirectUrl = window.location.origin + this.location.prepareExternalUrl('/');
    window.location.href = `${redirectUrl}`;
  }
}
