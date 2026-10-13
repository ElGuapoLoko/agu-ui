import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';

import { API_URL } from '../api/api-url.token';
import { AuthActions } from './store/auth.actions';
import { selectToken } from './store/auth.feature';

const PUBLIC_ENDPOINTS = ['/login', '/register'];

function isApiRequest(url: string, apiUrl: string): boolean {
  return url === apiUrl || url.startsWith(`${apiUrl}/`);
}

function isPublicEndpoint(url: string, apiUrl: string): boolean {
  return PUBLIC_ENDPOINTS.some((path) => url === `${apiUrl}${path}`);
}

/** Adds the JWT only to requests for our own API (never to third-party URLs). */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiUrl = inject(API_URL);
  const token = inject(Store).selectSignal(selectToken)();

  if (token === null || !isApiRequest(request.url, apiUrl) || isPublicEndpoint(request.url, apiUrl)) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

/** A 401 on an authenticated request means the session is no longer valid. */
export const unauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  const apiUrl = inject(API_URL);
  const store = inject(Store);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest(request.url, apiUrl) &&
        !isPublicEndpoint(request.url, apiUrl) &&
        store.selectSignal(selectToken)() !== null
      ) {
        // During the first navigation router.url is still "/"; prefer the URL being navigated to.
        const returnUrl = router.getCurrentNavigation()?.extractedUrl.toString() ?? router.url;
        store.dispatch(AuthActions.sessionExpired({ returnUrl }));
      }

      return throwError(() => error);
    }),
  );
};
