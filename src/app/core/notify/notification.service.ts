import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

/** Short user-facing messages (Material snackbar). */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string, action?: string): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(message, action ?? 'OK', { duration: 4000, panelClass: 'app-snackbar-success' });
  }

  error(message: string): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(message, 'Fechar', {
      duration: 6000,
      panelClass: 'app-snackbar-error',
      politeness: 'assertive',
    });
  }
}
