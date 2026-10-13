import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { selectIsAuthenticated } from './store/auth.feature';

export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(Store).selectSignal(selectIsAuthenticated)()) {
    return true;
  }

  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const guestGuard: CanActivateFn = () => {
  if (!inject(Store).selectSignal(selectIsAuthenticated)()) {
    return true;
  }

  return inject(Router).createUrlTree(['/tasks']);
};
