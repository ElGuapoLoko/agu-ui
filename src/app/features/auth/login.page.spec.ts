import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { AuthPageActions } from '../../core/auth/store/auth.actions';
import { initialAuthState } from '../../core/auth/store/auth.feature';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let store: MockStore;
  let element: HTMLElement;

  async function setup(auth = initialAuthState, expired?: string): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), provideNoopAnimations(), provideMockStore({ initialState: { auth } })],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    fixture.componentRef.setInput('returnUrl', '/tasks?x=1');
    if (expired) {
      fixture.componentRef.setInput('expired', expired);
    }
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch').and.callThrough();
    element = fixture.nativeElement;
    fixture.detectChanges();
  }

  function submit(): void {
    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('clears previous errors when opened', async () => {
    await setup();

    expect(store.dispatch).toHaveBeenCalledWith(AuthPageActions.opened());
  });

  it('shows field errors instead of submitting an empty form', async () => {
    await setup();

    submit();

    const errors = Array.from(element.querySelectorAll('mat-error')).map((e) => e.textContent?.trim());
    expect(errors).toEqual(['Informe o nome de usuário.', 'Informe a senha.']);
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.objectContaining({ type: AuthPageActions.login.type }));
  });

  it('rejects a whitespace-only username', async () => {
    await setup();
    fixture.componentInstance.form.setValue({ username: '   ', password: 'x' });

    submit();

    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.objectContaining({ type: AuthPageActions.login.type }));
  });

  it('logs in with a normalized username and the return URL', async () => {
    await setup();
    fixture.componentInstance.form.setValue({ username: '  ANA ', password: ' senha 1 ' });

    submit();

    expect(store.dispatch).toHaveBeenCalledWith(
      AuthPageActions.login({ credentials: { username: 'ana', password: ' senha 1 ' }, returnUrl: '/tasks?x=1' }),
    );
  });

  it('disables the button and ignores submits while pending', async () => {
    await setup({ ...initialAuthState, pending: true });
    fixture.componentInstance.form.setValue({ username: 'ana', password: 'x' });

    submit();

    expect(element.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBeTrue();
    expect(store.dispatch).not.toHaveBeenCalledWith(jasmine.objectContaining({ type: AuthPageActions.login.type }));
  });

  it('shows API errors', async () => {
    await setup({
      ...initialAuthState,
      error: { status: 401, message: 'Usuário ou senha inválidos.', violations: [] },
    });

    expect(element.querySelector('[role=alert]')?.textContent).toContain('Usuário ou senha inválidos.');
  });

  it('explains an expired session', async () => {
    await setup(initialAuthState, '1');

    expect(element.querySelector('[role=status]')?.textContent).toContain('Sua sessão expirou');
  });

  it('toggles password visibility', async () => {
    await setup();
    const input = element.querySelector<HTMLInputElement>('input[formcontrolname=password]')!;
    const toggle = element.querySelector<HTMLButtonElement>('button[aria-label="Mostrar senha"]')!;

    expect(input.type).toBe('password');
    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
  });
});
