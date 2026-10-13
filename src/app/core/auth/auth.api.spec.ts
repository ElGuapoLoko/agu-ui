import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '../api/api-url.token';
import { AuthApi } from './auth.api';

describe('AuthApi', () => {
  let api: AuthApi;
  let backend: HttpTestingController;
  const credentials = { username: 'ana', password: 'senha-teste-1' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api' }],
    });
    api = TestBed.inject(AuthApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('logs in and returns the token', () => {
    let token: string | undefined;
    api.login(credentials).subscribe((value) => (token = value));

    const request = backend.expectOne('/api/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);
    request.flush({ token: 'jwt' });

    expect(token).toBe('jwt');
  });

  it('registers and loads the current user', () => {
    api.register(credentials).subscribe();
    const register = backend.expectOne('/api/register');
    expect(register.request.method).toBe('POST');
    register.flush({ id: 1, username: 'ana' }, { status: 201, statusText: 'Created' });

    api.me().subscribe((user) => expect(user).toEqual({ id: 1, username: 'ana' }));
    backend.expectOne({ method: 'GET', url: '/api/me' }).flush({ id: 1, username: 'ana' });
  });
});
