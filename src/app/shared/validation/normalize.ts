/* eslint-disable no-control-regex */

/**
 * Text clean-up applied before validating and sending, mirroring the backend's
 * InputNormalizer, so harmless typing mistakes never turn into errors.
 */

/** Trims, removes control characters and collapses whitespace. */
export function normalizeSingleLine(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Like normalizeSingleLine but keeps line breaks. */
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
