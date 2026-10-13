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

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiUrl = inject(API_URL);
  const token = inject(Store).selectSignal(selectToken)();

  if (token === null || !isApiRequest(request.url, apiUrl) || isPublicEndpoint(request.url, apiUrl)) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

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
        const returnUrl = router.getCurrentNavigation()?.extractedUrl.toString() ?? router.url;
        store.dispatch(AuthActions.sessionExpired({ returnUrl }));
      }

      return throwError(() => error);
    }),
  );
};
