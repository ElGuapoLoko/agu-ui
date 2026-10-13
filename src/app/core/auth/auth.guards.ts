import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { selectIsAuthenticated } from './store/auth.feature';

/** Protected pages: anonymous users go to the login page and come back afterwards. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(Store).selectSignal(selectIsAuthenticated)()) {
    return true;
  }

  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Login and registration pages are skipped when already authenticated. */
export const guestGuard: CanActivateFn = () => {
  if (!inject(Store).selectSignal(selectIsAuthenticated)()) {
    return true;
  }

  return inject(Router).createUrlTree(['/tasks']);
};
