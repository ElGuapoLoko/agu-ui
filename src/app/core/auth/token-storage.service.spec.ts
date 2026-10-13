import { TestBed } from '@angular/core/testing';

import { fakeToken } from './testing/fake-token';
import { TokenStorage } from './token-storage.service';

describe('TokenStorage', () => {
  let storage: TokenStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = TestBed.inject(TokenStorage);
  });

  afterEach(() => localStorage.clear());

  it('stores, reads and clears the token', () => {
    expect(storage.get()).toBeNull();

    storage.set('abc');
    expect(storage.get()).toBe('abc');

    storage.clear();
    expect(storage.get()).toBeNull();
  });

  it('behaves as logged out when storage is blocked', () => {
    spyOn(localStorage, 'getItem').and.throwError('SecurityError');
    spyOn(localStorage, 'setItem').and.throwError('SecurityError');
    spyOn(localStorage, 'removeItem').and.throwError('SecurityError');

    expect(() => storage.set('abc')).not.toThrow();
    expect(storage.get()).toBeNull();
    expect(() => storage.clear()).not.toThrow();
  });

  describe('expiry', () => {
    const now = Date.UTC(2026, 9, 13, 12, 0, 0);

    it('reads the exp claim', () => {
      expect(TokenStorage.expiresAt(fakeToken(3600, now))).toBe(now + 3600 * 1000);
    });

    it('considers a token expired 30 seconds early', () => {
      expect(TokenStorage.isExpired(fakeToken(3600, now), now)).toBeFalse();
      expect(TokenStorage.isExpired(fakeToken(20, now), now)).toBeTrue();
      expect(TokenStorage.msUntilExpiry(fakeToken(3600, now), now)).toBe(3570 * 1000);
      expect(TokenStorage.msUntilExpiry(fakeToken(-10, now), now)).toBe(0);
    });

    ['not-a-jwt', 'a.%%%.c', `a.${btoa('{"sub":"x"}')}.c`].forEach((token) => {
      it(`treats malformed token "${token}" as expired`, () => {
        expect(TokenStorage.expiresAt(token)).toBeNull();
        expect(TokenStorage.isExpired(token)).toBeTrue();
        expect(TokenStorage.msUntilExpiry(token)).toBe(0);
      });
    });
  });
});
