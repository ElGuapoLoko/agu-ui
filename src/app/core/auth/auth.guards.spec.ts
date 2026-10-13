import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';

import { authGuard, guestGuard } from './auth.guards';
import { initialAuthState } from './store/auth.feature';

describe('auth guards', () => {
  function run(guard: typeof authGuard, token: string | null, url = '/tasks'): boolean | UrlTree {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideMockStore({ initialState: { auth: { ...initialAuthState, token } } })],
    });

    return TestBed.runInInjectionContext(
      () => guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot) as boolean | UrlTree,
    );
  }

  it('authGuard lets authenticated users in', () => {
    expect(run(authGuard, 'jwt')).toBeTrue();
  });

  it('authGuard sends anonymous users to login with a return URL', () => {
    const result = run(authGuard, null, '/tasks?x=1');

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Ftasks%3Fx%3D1');
  });

  it('guestGuard lets anonymous users see login/register', () => {
    expect(run(guestGuard, null)).toBeTrue();
  });

  it('guestGuard sends authenticated users to their tasks', () => {
    const result = run(guestGuard, 'jwt');

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/tasks');
  });
});
