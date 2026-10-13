import { APP_INITIALIZER } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { provideSessionRestore } from './restore-session';
import { AuthActions } from './store/auth.actions';
import { fakeToken } from './testing/fake-token';
import { TokenStorage } from './token-storage.service';

describe('provideSessionRestore', () => {
  function runInitializer(stored: string | null): { store: MockStore; storage: TokenStorage } {
    localStorage.clear();
    if (stored !== null) {
      localStorage.setItem('agu.token', stored);
    }
    TestBed.configureTestingModule({ providers: [provideMockStore(), provideSessionRestore()] });
    const store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    TestBed.inject(APP_INITIALIZER).forEach((init) => init());

    return { store, storage: TestBed.inject(TokenStorage) };
  }

  afterEach(() => localStorage.clear());

  it('restores a valid stored session', () => {
    const token = fakeToken(3600);
    const { store } = runInitializer(token);

    expect(store.dispatch).toHaveBeenCalledOnceWith(AuthActions.sessionRestored({ token }));
  });

  it('discards an expired token', () => {
    const { store, storage } = runInitializer(fakeToken(-60));

    expect(store.dispatch).not.toHaveBeenCalled();
    expect(storage.get()).toBeNull();
  });

  it('does nothing without a stored token', () => {
    const { store } = runInitializer(null);

    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
