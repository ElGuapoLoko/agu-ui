import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, inject, signal } from '@angular/core';
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
import { errorMessage, focusFirstInvalid } from '../../shared/validation/form-errors';
import { normalizeUsername } from '../../shared/validation/normalize';
import { notBlank } from '../../shared/validation/validators';
import { AuthCardComponent } from './auth-card.component';

@Component({
  selector: 'app-login-page',
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
  templateUrl: './login.page.html',
  styleUrl: './auth-form.scss',
})
export class LoginPage implements OnInit {
  private readonly store = inject(Store);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Bound from the query string (?returnUrl=...) by withComponentInputBinding. */
  @Input() returnUrl?: string;
  /** Set (?expired=1) when the user was sent here because the session expired. */
  @Input() expired?: string;

  readonly pending = this.store.selectSignal(selectAuthPending);
  readonly error = this.store.selectSignal(selectAuthError);
  readonly showPassword = signal(false);
  readonly errorMessage = errorMessage;

  readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required, notBlank]],
    password: ['', Validators.required],
  });

  ngOnInit(): void {
    this.store.dispatch(AuthPageActions.opened());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement);

      return;
    }
    if (this.pending()) {
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.store.dispatch(
      AuthPageActions.login({
        credentials: { username: normalizeUsername(username), password },
        returnUrl: this.returnUrl ?? '/tasks',
      }),
    );
  }
}
