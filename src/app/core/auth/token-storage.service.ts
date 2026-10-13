import { Injectable } from '@angular/core';

const STORAGE_KEY = 'agu.token';
const EXPIRY_SKEW_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  get(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  set(token: string): boolean {
    return this.tryStorage(() => localStorage.setItem(STORAGE_KEY, token));
  }

  clear(): boolean {
    return this.tryStorage(() => localStorage.removeItem(STORAGE_KEY));
  }

  private tryStorage(action: () => void): boolean {
    try {
      action();

      return true;
    } catch {
      return false;
    }
  }

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

  static msUntilExpiry(token: string, now: number = Date.now()): number {
    const expiresAt = TokenStorage.expiresAt(token);

    return expiresAt === null ? 0 : Math.max(0, expiresAt - EXPIRY_SKEW_MS - now);
  }
}
