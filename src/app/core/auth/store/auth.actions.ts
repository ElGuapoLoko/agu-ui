import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { ApiError } from '../../http/api-error';
import { Credentials, User } from '../../../shared/models/user';

export const AuthPageActions = createActionGroup({
  source: 'Auth Page',
  events: {
    Opened: emptyProps(),
    Login: props<{ credentials: Credentials; returnUrl: string }>(),
    Register: props<{ credentials: Credentials; returnUrl: string }>(),
  },
});

export const AuthApiActions = createActionGroup({
  source: 'Auth API',
  events: {
    'Login Success': props<{ token: string; returnUrl: string }>(),
    'Login Failure': props<{ error: ApiError }>(),
    'Register Failure': props<{ error: ApiError }>(),
    'User Loaded': props<{ user: User }>(),
  },
});

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Session Restored': props<{ token: string }>(),
    Logout: emptyProps(),
    'Session Expired': props<{ returnUrl: string }>(),
  },
});
