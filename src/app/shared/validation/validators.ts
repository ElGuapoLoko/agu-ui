import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { LIMITS } from './limits';
import { normalizeSingleLine, normalizeUsername } from './normalize';

export const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  normalizeSingleLine(control.value) === '' ? { notBlank: true } : null;

export const usernameFormat: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const username = normalizeUsername(control.value);
  if (username === '') {
    return null;
  }

  const validLength = username.length >= LIMITS.usernameMin && username.length <= LIMITS.usernameMax;

  return validLength && LIMITS.usernamePattern.test(username) ? null : { usernameFormat: true };
};

export const passwordStrength: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = String(control.value ?? '');
  if (password === '') {
    return null;
  }

  const validLength = password.length >= LIMITS.passwordMin && password.length <= LIMITS.passwordMax;

  return validLength && /\p{L}/u.test(password) && /\d/.test(password) ? null : { passwordStrength: true };
};

export function differentFrom(siblingName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const sibling = control.parent?.get(siblingName);
    if (!sibling || control.value === '' || control.value === null) {
      return null;
    }

    return String(control.value) === normalizeUsername(sibling.value) ? { sameAsUsername: true } : null;
  };
}

export function matches(siblingName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const sibling = control.parent?.get(siblingName);
    if (!sibling || control.value === '' || control.value === null) {
      return null;
    }

    return control.value === sibling.value ? null : { mismatch: true };
  };
}
