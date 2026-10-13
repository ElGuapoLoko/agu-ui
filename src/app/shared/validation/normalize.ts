/* eslint-disable no-control-regex */

export function normalizeSingleLine(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeMultiLine(value: unknown): string {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]+/g, ' ')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

export function normalizeUsername(value: unknown): string {
  return normalizeSingleLine(value).toLowerCase();
}
