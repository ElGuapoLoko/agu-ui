import { HttpErrorResponse } from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Actions } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable, Subject, of, throwError } from 'rxjs';

import { AuthApi } from '../auth.api';
import { fakeToken } from '../testing/fake-token';
import { TokenStorage } from '../token-storage.service';
import { AuthActions, AuthApiActions, AuthPageActions } from './auth.actions';
import * as effects from './auth.effects';

describe('auth effects', () => {
  const credentials = { username: 'ana', password: 'senha-teste-1' };
  let actions$: Subject<Action>;
  let api: jasmine.SpyObj<AuthApi>;
  let storage: jasmine.SpyObj<TokenStorage>;
  let router: jasmine.SpyObj<Router>;

  function collect<T>(source: Observable<T>): T[] {
    const values: T[] = [];
    source.subscribe((value) => values.push(value));

    return values;
  }

  beforeEach(() => {
    actions$ = new Subject<Action>();
    api = jasmine.createSpyObj<AuthApi>('AuthApi', ['login', 'register', 'me']);
    storage = jasmine.createSpyObj<TokenStorage>('TokenStorage', ['get', 'set', 'clear']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl', 'navigate'], { url: '/tasks' });
    router.navigateByUrl.and.resolveTo(true);
    router.navigate.and.resolveTo(true);
  });

  it('login$ emits success with the token', () => {
    api.login.and.returnValue(of('jwt'));
    const output = collect(effects.login$(new Actions(actions$), api));

    actions$.next(AuthPageActions.login({ credentials, returnUrl: '/tasks' }));

    expect(api.login).toHaveBeenCalledWith(credentials);
    expect(output).toEqual([AuthApiActions.loginSuccess({ token: 'jwt', returnUrl: '/tasks' })]);
  });

  it('login$ converts HTTP errors into a user-facing error', () => {
    api.login.and.returnValue(
      throwError(
        () => new HttpErrorResponse({ status: 401, error: { status: 401, detail: 'Usuário ou senha inválidos.' } }),
      ),
    );
    const output = collect(effects.login$(new Actions(actions$), api));

    actions$.next(AuthPageActions.login({ credentials, returnUrl: '/tasks' }));

    expect(output).toEqual([
      AuthApiActions.loginFailure({ error: { status: 401, message: 'Usuário ou senha inválidos.', violations: [] } }),
    ]);
  });

  it('login$ ignores repeated submits while a request is in flight', () => {
    const response = new Subject<string>();
    api.login.and.returnValue(response);
    collect(effects.login$(new Actions(actions$), api));

    actions$.next(AuthPageActions.login({ credentials, returnUrl: '/tasks' }));
    actions$.next(AuthPageActions.login({ credentials, returnUrl: '/tasks' }));

    expect(api.login).toHaveBeenCalledTimes(1);
  });

  it('register$ logs in after registering', () => {
    api.register.and.returnValue(of({ id: 1, username: 'ana' }));
    api.login.and.returnValue(of('jwt'));
    const output = collect(effects.register$(new Actions(actions$), api));

    actions$.next(AuthPageActions.register({ credentials, returnUrl: '/tasks' }));

    expect(output).toEqual([AuthApiActions.loginSuccess({ token: 'jwt', returnUrl: '/tasks' })]);
  });

  it('register$ reports validation errors', () => {
    api.register.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { status: 409, detail: 'Em uso.', violations: [{ field: 'username', message: 'Em uso.' }] },
          }),
      ),
    );
    const output = collect(effects.register$(new Actions(actions$), api));

    actions$.next(AuthPageActions.register({ credentials, returnUrl: '/tasks' }));

    expect(output).toEqual([
      AuthApiActions.registerFailure({
        error: { status: 409, message: 'Em uso.', violations: [{ field: 'username', message: 'Em uso.' }] },
      }),
    ]);
  });

  it('loginSuccess$ stores the token and goes to a safe return URL', () => {
    collect(effects.loginSuccess$(new Actions(actions$), storage, router));

    actions$.next(AuthApiActions.loginSuccess({ token: 'jwt', returnUrl: '//evil.example' }));

    expect(storage.set).toHaveBeenCalledWith('jwt');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tasks');
  });

  it('loadUser$ loads the current user and swallows errors', () => {
    api.me.and.returnValues(
      of({ id: 1, username: 'ana' }),
      throwError(() => new Error('401')),
    );
    const output = collect(effects.loadUser$(new Actions(actions$), api));

    actions$.next(AuthActions.sessionRestored({ token: 'jwt' }));
    actions$.next(AuthActions.sessionRestored({ token: 'jwt' }));

    expect(output).toEqual([AuthApiActions.userLoaded({ user: { id: 1, username: 'ana' } })]);
  });

  it('expiryTimer$ expires the session when the token expires', fakeAsync(() => {
    const output = collect(effects.expiryTimer$(new Actions(actions$), router));

    actions$.next(AuthActions.sessionRestored({ token: fakeToken(90) }));
    tick(59_000);
    expect(output).toEqual([]);

    tick(2_000);
    expect(output).toEqual([AuthActions.sessionExpired({ returnUrl: '/tasks' })]);
  }));

  it('expiryTimer$ is cancelled by logout', fakeAsync(() => {
    const output = collect(effects.expiryTimer$(new Actions(actions$), router));

    actions$.next(AuthActions.sessionRestored({ token: fakeToken(90) }));
    actions$.next(AuthActions.logout());
    tick(120_000);

    expect(output).toEqual([]);
  }));

  it('logout$ clears the token and goes to login', () => {
    collect(effects.logout$(new Actions(actions$), storage, router));

    actions$.next(AuthActions.logout());

    expect(storage.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('sessionExpired$ sends the user to login once, explaining why', () => {
    storage.get.and.returnValues('jwt', null);
    collect(effects.sessionExpired$(new Actions(actions$), storage, router));

    actions$.next(AuthActions.sessionExpired({ returnUrl: '/tasks' }));
    actions$.next(AuthActions.sessionExpired({ returnUrl: '/tasks' }));

    expect(storage.clear).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login'], { queryParams: { returnUrl: '/tasks', expired: 1 } });
  });
});
