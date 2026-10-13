import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  DestroyRef,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { AuthPageActions } from '../../core/auth/store/auth.actions';
import { selectAuthError, selectAuthPending } from '../../core/auth/store/auth.feature';
import { applyServerErrors, errorMessage, focusFirstInvalid } from '../../shared/validation/form-errors';
import { LIMITS } from '../../shared/validation/limits';
import { normalizeUsername } from '../../shared/validation/normalize';
import { differentFrom, matches, notBlank, passwordStrength, usernameFormat } from '../../shared/validation/validators';
import { AuthCardComponent } from './auth-card.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    AuthCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.page.html',
  styleUrl: './auth-form.scss',
})
export class RegisterPage implements OnInit {
  private readonly store = inject(Store);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly limits = LIMITS;
  readonly pending = this.store.selectSignal(selectAuthPending);
  readonly error = this.store.selectSignal(selectAuthError);
  readonly formError = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly errorMessage = errorMessage;

  readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required, notBlank, usernameFormat]],
    password: ['', [Validators.required, passwordStrength, differentFrom('username')]],
    confirmPassword: ['', [Validators.required, matches('password')]],
  });

  constructor() {
    effect(
      () => {
        const error = this.error();
        if (!error) {
          this.formError.set(null);

          return;
        }

        const unmatched = applyServerErrors(this.form, error.violations);
        const fieldErrorsShown = error.violations.length > unmatched.length;
        this.formError.set(fieldErrorsShown ? null : error.message);
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    this.store.dispatch(AuthPageActions.opened());

    const { username, password, confirmPassword } = this.form.controls;
    username.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => password.updateValueAndValidity({ emitEvent: false }));
    password.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => confirmPassword.updateValueAndValidity({ emitEvent: false }));
  }

  normalizeUsernameField(): void {
    const control = this.form.controls.username;
    const normalized = normalizeUsername(control.value);
    if (normalized !== control.value) {
      control.setValue(normalized);
    }
  }

  submit(): void {
    this.normalizeUsernameField();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement);

      return;
    }
    if (this.pending()) {
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.store.dispatch(AuthPageActions.register({ credentials: { username, password }, returnUrl: '/tasks' }));
  }
}
