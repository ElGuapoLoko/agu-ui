const DEFAULT_URL = '/tasks';

export function safeReturnUrl(url: unknown): string {
  if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//') || url.includes('\\')) {
    return DEFAULT_URL;
  }

  if (url.startsWith('/login') || url.startsWith('/register')) {
    return DEFAULT_URL;
  }

  return url;
}
