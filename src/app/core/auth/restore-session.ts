import { APP_INITIALIZER, Provider } from '@angular/core';
import { Store } from '@ngrx/store';

import { TokenStorage } from './token-storage.service';
import { AuthActions } from './store/auth.actions';

/**
 * Restores a stored, unexpired session before the first navigation, so guards
 * already see the user as logged in after a page reload.
 */
export function provideSessionRestore(): Provider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    deps: [Store, TokenStorage],
    useFactory: (store: Store, storage: TokenStorage) => () => {
      const token = storage.get();
      if (token === null) {
        return;
      }

      if (TokenStorage.isExpired(token)) {
        storage.clear();

        return;
      }

      store.dispatch(AuthActions.sessionRestored({ token }));
    },
  };
}
