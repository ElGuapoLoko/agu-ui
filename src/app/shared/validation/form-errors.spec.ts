import { FormControl, FormGroup, Validators } from '@angular/forms';

import { applyServerErrors, errorMessage } from './form-errors';

describe('form-errors', () => {
  describe('errorMessage', () => {
    it('returns null for valid or missing controls', () => {
      expect(errorMessage(new FormControl('ok', Validators.required))).toBeNull();
      expect(errorMessage(null)).toBeNull();
    });

    it('uses field-specific overrides', () => {
      const control = new FormControl('', Validators.required);

      expect(errorMessage(control, { required: 'O título é obrigatório.' })).toBe('O título é obrigatório.');
      expect(errorMessage(control)).toBe('Campo obrigatório.');
    });

    it('describes maxlength with the limit', () => {
      expect(errorMessage(new FormControl('abcd', Validators.maxLength(3)))).toBe('Máximo de 3 caracteres.');
    });

    it('shows server messages as they are', () => {
      const control = new FormControl('ana');
      control.setErrors({ server: 'Este nome de usuário já está em uso.' });

      expect(errorMessage(control)).toBe('Este nome de usuário já está em uso.');
    });

    it('falls back to a generic message for unknown errors', () => {
      const control = new FormControl('x');
      control.setErrors({ somethingElse: true });

      expect(errorMessage(control)).toBe('Valor inválido.');
    });
  });

  describe('applyServerErrors', () => {
    it('sets errors on matching fields and returns the rest', () => {
      const form = new FormGroup({ username: new FormControl('ana') });

      const unmatched = applyServerErrors(form, [
        { field: 'username', message: 'Em uso.' },
        { field: 'other', message: 'Sem campo.' },
      ]);

      expect(form.controls.username.errors).toEqual({ server: 'Em uso.' });
      expect(form.controls.username.touched).toBeTrue();
      expect(unmatched).toEqual([{ field: 'other', message: 'Sem campo.' }]);
    });

    it('clears the server error when the user edits the field', () => {
      const form = new FormGroup({ username: new FormControl('ana') });
      applyServerErrors(form, [{ field: 'username', message: 'Em uso.' }]);

      form.controls.username.setValue('ana2');

      expect(form.controls.username.errors).toBeNull();
    });
  });
});
