import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { AuthPageActions } from '../../core/auth/store/auth.actions';
import { authFeature, initialAuthState } from '../../core/auth/store/auth.feature';
import { RegisterPage } from './register.page';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let page: RegisterPage;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideMockStore({ initialState: { auth: initialAuthState } }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    page = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch').and.callThrough();
    fixture.detectChanges();
  });

  afterEach(() => store.resetSelectors());

  function errors(): string[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('mat-error')).map(
      (e) => e.textContent?.trim() ?? '',
    );
  }

  it('validates every field before submitting', () => {
    page.form.setValue({ username: 'a!', password: 'curta', confirmPassword: 'outra' });

    page.submit();
    fixture.detectChanges();

    expect(errors()).toEqual([
      'Use de 3 a 50 caracteres: letras, números, ponto, hífen ou sublinhado.',
      'A senha precisa ter de 8 a 128 caracteres, com letras e números.',
      'As senhas não conferem.',
    ]);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.objectContaining({ type: AuthPageActions.register.type }));
  });

  it('rejects a password equal to the username', () => {
    page.form.setValue({ username: 'Ana12345', password: 'ana12345', confirmPassword: 'ana12345' });

    page.submit();
    fixture.detectChanges();

    expect(errors()).toContain('A senha não pode ser igual ao nome de usuário.');
  });

  it('revalidates the confirmation when the password changes', () => {
    page.form.setValue({ username: 'ana', password: 'senha-teste-1', confirmPassword: 'senha-teste-1' });
    expect(page.form.controls.confirmPassword.valid).toBeTrue();

    page.form.controls.password.setValue('senha-teste-2');

    expect(page.form.controls.confirmPassword.errors).toEqual({ mismatch: true });
  });

  it('normalizes the username and registers', () => {
    page.form.setValue({ username: '  Ana.Silva ', password: 'senha-teste-1', confirmPassword: 'senha-teste-1' });

    page.submit();

    expect(page.form.controls.username.value).toBe('ana.silva');
    expect(store.dispatch).toHaveBeenCalledWith(
      AuthPageActions.register({
        credentials: { username: 'ana.silva', password: 'senha-teste-1' },
        returnUrl: '/tasks',
      }),
    );
  });

  it('shows a duplicate username error on the field', () => {
    store.overrideSelector(authFeature.selectError, {
      status: 409,
      message: 'Este nome de usuário já está em uso.',
      violations: [{ field: 'username', message: 'Este nome de usuário já está em uso.' }],
    });
    store.refreshState();
    fixture.detectChanges();

    expect(page.form.controls.username.errors).toEqual(
      jasmine.objectContaining({ server: 'Este nome de usuário já está em uso.' }),
    );
    expect(page.formError()).toBeNull();
  });

  it('shows errors without a field (e.g. rate limit) above the form', () => {
    store.overrideSelector(authFeature.selectError, { status: 429, message: 'Muitas tentativas.', violations: [] });
    store.refreshState();
    fixture.detectChanges();

    expect(page.formError()).toBe('Muitas tentativas.');
    expect((fixture.nativeElement as HTMLElement).querySelector('[role=alert]')?.textContent).toContain(
      'Muitas tentativas.',
    );
  });
});
