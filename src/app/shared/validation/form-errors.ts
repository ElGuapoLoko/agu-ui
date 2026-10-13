import { AbstractControl, FormGroup } from '@angular/forms';

import { FieldViolation } from '../../core/http/api-error';
import { LIMITS } from './limits';

const DEFAULT_MESSAGES: Record<string, string> = {
  required: 'Campo obrigatório.',
  notBlank: 'Campo obrigatório.',
  usernameFormat: `Use de ${LIMITS.usernameMin} a ${LIMITS.usernameMax} caracteres: letras, números, ponto, hífen ou sublinhado.`,
  passwordStrength: `A senha precisa ter de ${LIMITS.passwordMin} a ${LIMITS.passwordMax} caracteres, com letras e números.`,
  sameAsUsername: 'A senha não pode ser igual ao nome de usuário.',
  mismatch: 'As senhas não conferem.',
};

export function errorMessage(control: AbstractControl | null, overrides: Record<string, string> = {}): string | null {
  const errors = control?.errors;
  if (!errors) {
    return null;
  }

  const key = Object.keys(errors)[0];
  if (key === 'server') {
    return String(errors['server']);
  }
  if (key === 'maxlength') {
    return `Máximo de ${errors['maxlength'].requiredLength} caracteres.`;
  }

  return overrides[key] ?? DEFAULT_MESSAGES[key] ?? 'Valor inválido.';
}

export function focusFirstInvalid(root: HTMLElement): void {
  root.querySelector<HTMLElement>('input.ng-invalid, textarea.ng-invalid')?.focus();
}

export function applyServerErrors(form: FormGroup, violations: FieldViolation[]): FieldViolation[] {
  const unmatched: FieldViolation[] = [];

  for (const violation of violations) {
    const control = form.get(violation.field);
    if (!control) {
      unmatched.push(violation);
      continue;
    }

    control.setErrors({ ...control.errors, server: violation.message });
    control.markAsTouched();
  }

  return unmatched;
}
