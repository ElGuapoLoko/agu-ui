import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Credentials, User } from '../../shared/models/user';
import { API_URL } from '../api/api-url.token';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  login(credentials: Credentials): Observable<string> {
    return this.http
      .post<{ token: string }>(`${this.apiUrl}/login`, credentials)
      .pipe(map((response) => response.token));
  }

  register(credentials: Credentials): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, credentials);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }
}
