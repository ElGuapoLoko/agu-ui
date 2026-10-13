import { createFeature, createReducer, createSelector, on } from '@ngrx/store';

import { ApiError } from '../../http/api-error';
import { User } from '../../../shared/models/user';
import { AuthActions, AuthApiActions, AuthPageActions } from './auth.actions';

export interface AuthState {
  token: string | null;
  user: User | null;
  /** Login or registration request in flight. */
  pending: boolean;
  error: ApiError | null;
}

export const initialAuthState: AuthState = {
  token: null,
  user: null,
  pending: false,
  error: null,
};

const loggedOut = (): AuthState => initialAuthState;

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialAuthState,
    on(AuthPageActions.opened, (state): AuthState => ({ ...state, pending: false, error: null })),
    on(AuthPageActions.login, AuthPageActions.register, (state): AuthState => ({
      ...state,
      pending: true,
      error: null,
    })),
    on(AuthApiActions.loginSuccess, (state, { token }): AuthState => ({
      ...state,
      token,
      pending: false,
      error: null,
    })),
    on(AuthApiActions.loginFailure, AuthApiActions.registerFailure, (state, { error }): AuthState => ({
      ...state,
      pending: false,
      error,
    })),
    on(AuthApiActions.userLoaded, (state, { user }): AuthState => ({ ...state, user })),
    on(AuthActions.sessionRestored, (state, { token }): AuthState => ({ ...state, token })),
    on(AuthActions.logout, AuthActions.sessionExpired, loggedOut),
  ),
  extraSelectors: ({ selectToken }) => ({
    selectIsAuthenticated: createSelector(selectToken, (token) => token !== null),
  }),
});

export const {
  selectToken,
  selectUser,
  selectPending: selectAuthPending,
  selectError: selectAuthError,
  selectIsAuthenticated,
} = authFeature;
