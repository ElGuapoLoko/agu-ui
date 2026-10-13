/**
 * Field limits shared with the backend.
 * Keep in sync with agu-php/backend/src/Validation/Limits.php.
 */
export const LIMITS = {
  usernameMin: 3,
  usernameMax: 50,
  usernamePattern: /^[a-z0-9._-]+$/,
  passwordMin: 8,
  passwordMax: 128,
  taskTitleMax: 255,
  taskDescriptionMax: 2000,
} as const;
