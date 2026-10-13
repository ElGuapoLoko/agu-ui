import { ApiError } from '../../http/api-error';
import { AuthActions, AuthApiActions, AuthPageActions } from './auth.actions';
import { AuthState, authFeature, initialAuthState, selectIsAuthenticated } from './auth.feature';

describe('auth reducer', () => {
  const reducer = authFeature.reducer;
  const credentials = { username: 'ana', password: 'senha-teste-1' };
  const error: ApiError = { status: 401, message: 'Usuário ou senha inválidos.', violations: [] };

  it('marks login and registration as pending and clears old errors', () => {
    const withError: AuthState = { ...initialAuthState, error };

    expect(reducer(withError, AuthPageActions.login({ credentials, returnUrl: '/tasks' }))).toEqual({
      ...initialAuthState,
      pending: true,
    });
    expect(reducer(withError, AuthPageActions.register({ credentials, returnUrl: '/tasks' })).pending).toBeTrue();
  });

  it('stores the token on login success', () => {
    const state = reducer(
      { ...initialAuthState, pending: true },
      AuthApiActions.loginSuccess({ token: 'jwt', returnUrl: '/' }),
    );

    expect(state).toEqual({ ...initialAuthState, token: 'jwt' });
  });

  it('keeps the error on failure', () => {
    expect(reducer({ ...initialAuthState, pending: true }, AuthApiActions.loginFailure({ error }))).toEqual({
      ...initialAuthState,
      error,
    });
    expect(reducer(initialAuthState, AuthApiActions.registerFailure({ error })).error).toBe(error);
  });

  it('clears the form state when a page opens', () => {
    expect(reducer({ ...initialAuthState, pending: true, error }, AuthPageActions.opened())).toEqual(initialAuthState);
  });

  it('stores the loaded user and restored token', () => {
    const user = { id: 1, username: 'ana' };

    expect(reducer(initialAuthState, AuthApiActions.userLoaded({ user })).user).toEqual(user);
    expect(reducer(initialAuthState, AuthActions.sessionRestored({ token: 'jwt' })).token).toBe('jwt');
  });

  it('forgets everything on logout and session expiry', () => {
    const loggedIn: AuthState = { ...initialAuthState, token: 'jwt', user: { id: 1, username: 'ana' } };

    expect(reducer(loggedIn, AuthActions.logout())).toEqual(initialAuthState);
    expect(reducer(loggedIn, AuthActions.sessionExpired({ returnUrl: '/tasks' }))).toEqual(initialAuthState);
  });

  it('derives isAuthenticated from the token', () => {
    expect(selectIsAuthenticated.projector('jwt')).toBeTrue();
    expect(selectIsAuthenticated.projector(null)).toBeFalse();
  });
});
