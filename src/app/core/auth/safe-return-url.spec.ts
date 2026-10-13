import { safeReturnUrl } from './safe-return-url';

describe('safeReturnUrl', () => {
  it('keeps internal paths', () => {
    expect(safeReturnUrl('/tasks')).toBe('/tasks');
    expect(safeReturnUrl('/tasks?filter=done')).toBe('/tasks?filter=done');
  });

  [
    undefined,
    null,
    42,
    '',
    'tasks',
    '//evil.example',
    'https://evil.example',
    '/\\evil.example',
    '/login',
    '/register',
  ].forEach((url) => {
    it(`falls back to /tasks for ${JSON.stringify(url)}`, () => {
      expect(safeReturnUrl(url)).toBe('/tasks');
    });
  });
});
