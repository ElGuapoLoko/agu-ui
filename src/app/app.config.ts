import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';

import { devtoolsProviders } from '../environments/devtools';
import { routes } from './app.routes';
import { authInterceptor, unauthorizedInterceptor } from './core/auth/auth.interceptors';
import { provideSessionRestore } from './core/auth/restore-session';
import * as authEffects from './core/auth/store/auth.effects';
import { authFeature } from './core/auth/store/auth.feature';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, unauthorizedInterceptor])),
    provideAnimationsAsync(),
    provideStore(),
    provideState(authFeature),
    provideEffects(authEffects),
    provideSessionRestore(),
    devtoolsProviders,
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
