/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

export enum SessionStatus {
  NOT_AUTHENTICATED,
  AUTHENTICATED,
  EXPIRED,
}

export interface AuthRequestToken {
  grant_type?: string;
  client_id?: string;
  redirect_uri?: string;
  code?: string;
  client_secret?: string;
  provider?: string;
  username?: string;
  password?: string;
  refresh_token?: string;
  bypass_uri_check?: boolean;
}

export interface AuthResponseToken {
  access_token?: string;
  access_type?: string;
  expires_in?: number;
  refresh_token?: string;
  expires_time?: number;
}

export interface AuthUser {
  token?: AuthResponseToken;
  user?: {
    role?: any;
    email?: string;
    provider?: string;
    sub?: string;
    username?: string;
    exp?: number;
    iat?: number;
    iss?: string;
    name?: string;
  };
}

export class AuthUtil {
  public static isValidUser(user: AuthUser): boolean {
    if (user && user.user.email && user.token && user.token.access_token && user.token.refresh_token) {
      return true;
    }
    return false;
  }
  public static isValidBasicUser(user): boolean {
    if (user && user.user.email && user.token && user.token.access_token && user.token.expires_time) {
      return true;
    }
    return false;
  }
}
