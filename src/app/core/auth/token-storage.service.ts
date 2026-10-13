import { Injectable } from '@angular/core';

const STORAGE_KEY = 'agu.token';
/** Treat tokens as expired slightly early so requests never race the server-side expiry. */
const EXPIRY_SKEW_MS = 30_000;

/**
 * The only place that touches the persisted JWT. Storage access is wrapped because it
 * can throw (private mode, blocked storage); the app then simply behaves as logged out.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  get(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  set(token: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, token);
    } catch {
      // Session still works in memory for this tab.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
  }

  /** Expiry time in ms since epoch, or null if the token is malformed or has no exp claim. */
  static expiresAt(token: string): number | null {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    try {
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const exp: unknown = JSON.parse(json).exp;

      return typeof exp === 'number' ? exp * 1000 : null;
    } catch {
      return null;
    }
  }

  static isExpired(token: string, now: number = Date.now()): boolean {
    const expiresAt = TokenStorage.expiresAt(token);

    return expiresAt === null || expiresAt - EXPIRY_SKEW_MS <= now;
  }

  /** Milliseconds until the token should be considered expired (0 if already expired). */
  static msUntilExpiry(token: string, now: number = Date.now()): number {
    const expiresAt = TokenStorage.expiresAt(token);

    return expiresAt === null ? 0 : Math.max(0, expiresAt - EXPIRY_SKEW_MS - now);
  }
}
