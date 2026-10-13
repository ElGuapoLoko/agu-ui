import { FormControl, FormGroup } from '@angular/forms';

import { differentFrom, matches, notBlank, passwordStrength, usernameFormat } from './validators';

describe('validators', () => {
  it('notBlank rejects whitespace-only values', () => {
    expect(notBlank(new FormControl('   '))).toEqual({ notBlank: true });
    expect(notBlank(new FormControl(' a '))).toBeNull();
  });

  describe('usernameFormat', () => {
    it('accepts valid usernames after normalization', () => {
      expect(usernameFormat(new FormControl('  Ana.Silva_1 '))).toBeNull();
    });

    it('ignores empty values (required handles them)', () => {
      expect(usernameFormat(new FormControl(''))).toBeNull();
    });

    ['ab', 'a'.repeat(51), 'ana silva', 'ana!'].forEach((value) => {
      it(`rejects "${value}"`, () => {
        expect(usernameFormat(new FormControl(value))).toEqual({ usernameFormat: true });
      });
    });
  });

  describe('passwordStrength', () => {
    it('accepts 8+ characters with letters and digits', () => {
      expect(passwordStrength(new FormControl('senha123'))).toBeNull();
      expect(passwordStrength(new FormControl('çãõ12345'))).toBeNull();
    });

    ['abc123', 'somenteletras', '12345678', 'a1'.repeat(65)].forEach((value) => {
      it(`rejects "${value.slice(0, 20)}"`, () => {
        expect(passwordStrength(new FormControl(value))).toEqual({ passwordStrength: true });
      });
    });
  });

  it('differentFrom compares with the normalized username', () => {
    const form = new FormGroup({
      username: new FormControl(' Ana12345 '),
      password: new FormControl('ana12345', differentFrom('username')),
    });
    form.controls.password.updateValueAndValidity();

    expect(form.controls.password.errors).toEqual({ sameAsUsername: true });

    form.controls.password.setValue('outra-senha-1');
    expect(form.controls.password.errors).toBeNull();
  });

  it('matches requires an equal sibling value', () => {
    const form = new FormGroup({
      password: new FormControl('senha-1234'),
      confirm: new FormControl('senha-9999', matches('password')),
    });
    form.controls.confirm.updateValueAndValidity();

    expect(form.controls.confirm.errors).toEqual({ mismatch: true });

    form.controls.confirm.setValue('senha-1234');
    expect(form.controls.confirm.errors).toBeNull();
  });
});
