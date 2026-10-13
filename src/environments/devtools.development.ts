import { EnvironmentProviders, Provider } from '@angular/core';
import { Action } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (key, item) => (key === 'password' || key === 'token' ? '***' : item))) as T;
}

export const devtoolsProviders: (Provider | EnvironmentProviders)[] = [
  provideStoreDevtools({
    maxAge: 25,
    connectInZone: true,
    actionSanitizer: (action: Action) => sanitize(action),
    stateSanitizer: (state: object) => sanitize(state),
  }),
];
