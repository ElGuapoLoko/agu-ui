import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { API_URL } from '../api/api-url.token';
import { authInterceptor, unauthorizedInterceptor } from './auth.interceptors';
import { AuthActions } from './store/auth.actions';
import { initialAuthState } from './store/auth.feature';

describe('auth interceptors', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let store: MockStore;

  function setup(token: string | null): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, unauthorizedInterceptor])),
        provideHttpClientTesting(),
        provideMockStore({ initialState: { auth: { ...initialAuthState, token } } }),
        { provide: API_URL, useValue: '/api' },
        { provide: Router, useValue: { url: '/tasks', getCurrentNavigation: () => null } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
  }

  afterEach(() => backend.verify());

  it('adds the bearer token to API requests', () => {
    setup('jwt');

    http.get('/api/tasks').subscribe();

    expect(backend.expectOne('/api/tasks').request.headers.get('Authorization')).toBe('Bearer jwt');
  });

  it('never sends the token to other hosts or to login/register', () => {
    setup('jwt');

    http.get('https://example.com/api/tasks').subscribe();
    http.post('/api/login', {}).subscribe();
    http.post('/api/register', {}).subscribe();
    http.get('/apiary').subscribe();

    for (const url of ['https://example.com/api/tasks', '/api/login', '/api/register', '/apiary']) {
      expect(backend.expectOne(url).request.headers.has('Authorization')).withContext(url).toBeFalse();
    }
  });

  it('sends requests without a header when logged out', () => {
    setup(null);

    http.get('/api/me').subscribe();

    expect(backend.expectOne('/api/me').request.headers.has('Authorization')).toBeFalse();
  });

  it('expires the session on a 401 from an authenticated request', () => {
    setup('jwt');

    http.get('/api/tasks').subscribe({ error: () => undefined });
    backend.expectOne('/api/tasks').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(store.dispatch).toHaveBeenCalledOnceWith(AuthActions.sessionExpired({ returnUrl: '/tasks' }));
  });

  it('uses the URL being navigated to during the first navigation', () => {
    setup('jwt');
    const router = TestBed.inject(Router) as unknown as { getCurrentNavigation: () => unknown };
    router.getCurrentNavigation = () => ({ extractedUrl: { toString: () => '/tasks?x=1' } });

    http.get('/api/me').subscribe({ error: () => undefined });
    backend.expectOne('/api/me').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(store.dispatch).toHaveBeenCalledOnceWith(AuthActions.sessionExpired({ returnUrl: '/tasks?x=1' }));
  });

  it('does not treat a failed login (401) as an expired session', () => {
    setup('jwt');

    http.post('/api/login', {}).subscribe({ error: () => undefined });
    backend.expectOne('/api/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('ignores 401s when already logged out and other errors', () => {
    setup(null);

    http.get('/api/me').subscribe({ error: () => undefined });
    backend.expectOne('/api/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.get('/api/tasks').subscribe({ error: () => undefined });
    backend.expectOne('/api/tasks').flush(null, { status: 500, statusText: 'Error' });

    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
