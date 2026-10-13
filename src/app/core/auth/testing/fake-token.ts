/** Builds an unsigned JWT-shaped string for tests (the client never verifies signatures). */
export function fakeToken(expiresInSeconds: number, now: number = Date.now()): string {
  const encode = (value: object): string =>
    btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(now / 1000) + expiresInSeconds;

  return `${encode({ alg: 'none' })}.${encode({ username: 'ana', exp })}.signature`;
}
