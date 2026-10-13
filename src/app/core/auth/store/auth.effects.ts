import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, EMPTY, exhaustMap, filter, map, of, switchMap, tap, timer } from 'rxjs';

import { toApiError } from '../../http/api-error';
import { AuthApi } from '../auth.api';
import { safeReturnUrl } from '../safe-return-url';
import { TokenStorage } from '../token-storage.service';
import { AuthActions, AuthApiActions, AuthPageActions } from './auth.actions';

export const login$ = createEffect(
  (actions$ = inject(Actions), api = inject(AuthApi)) => {
    return actions$.pipe(
      ofType(AuthPageActions.login),
      exhaustMap(({ credentials, returnUrl }) =>
        api.login(credentials).pipe(
          map((token) => AuthApiActions.loginSuccess({ token, returnUrl })),
          catchError((error: unknown) => of(AuthApiActions.loginFailure({ error: toApiError(error) }))),
        ),
      ),
    );
  },
  { functional: true },
);

export const register$ = createEffect(
  (actions$ = inject(Actions), api = inject(AuthApi)) => {
    return actions$.pipe(
      ofType(AuthPageActions.register),
      exhaustMap(({ credentials, returnUrl }) =>
        api.register(credentials).pipe(
          switchMap(() => api.login(credentials)),
          map((token) => AuthApiActions.loginSuccess({ token, returnUrl })),
          catchError((error: unknown) => of(AuthApiActions.registerFailure({ error: toApiError(error) }))),
        ),
      ),
    );
  },
  { functional: true },
);

export const loginSuccess$ = createEffect(
  (actions$ = inject(Actions), storage = inject(TokenStorage), router = inject(Router)) => {
    return actions$.pipe(
      ofType(AuthApiActions.loginSuccess),
      tap(({ token, returnUrl }) => {
        storage.set(token);
        void router.navigateByUrl(safeReturnUrl(returnUrl));
      }),
    );
  },
  { functional: true, dispatch: false },
);

export const loadUser$ = createEffect(
  (actions$ = inject(Actions), api = inject(AuthApi)) => {
    return actions$.pipe(
      ofType(AuthApiActions.loginSuccess, AuthActions.sessionRestored),
      switchMap(() =>
        api.me().pipe(
          map((user) => AuthApiActions.userLoaded({ user })),
          catchError(() => EMPTY),
        ),
      ),
    );
  },
  { functional: true },
);

export const expiryTimer$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) => {
    return actions$.pipe(
      ofType(AuthApiActions.loginSuccess, AuthActions.sessionRestored, AuthActions.logout, AuthActions.sessionExpired),
      switchMap((action) =>
        'token' in action
          ? timer(TokenStorage.msUntilExpiry(action.token)).pipe(
              map(() => AuthActions.sessionExpired({ returnUrl: router.url })),
            )
          : EMPTY,
      ),
    );
  },
  { functional: true },
);

export const logout$ = createEffect(
  (actions$ = inject(Actions), storage = inject(TokenStorage), router = inject(Router)) => {
    return actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        storage.clear();
        void router.navigateByUrl('/login');
      }),
    );
  },
  { functional: true, dispatch: false },
);

export const sessionExpired$ = createEffect(
  (actions$ = inject(Actions), storage = inject(TokenStorage), router = inject(Router)) => {
    return actions$.pipe(
      ofType(AuthActions.sessionExpired),
      filter(() => storage.get() !== null),
      tap(({ returnUrl }) => {
        storage.clear();
        void router.navigate(['/login'], { queryParams: { returnUrl: safeReturnUrl(returnUrl), expired: 1 } });
      }),
    );
  },
  { functional: true, dispatch: false },
);
