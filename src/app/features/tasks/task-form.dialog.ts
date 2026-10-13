import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, merge, take } from 'rxjs';

import { Task } from '../../shared/models/task';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/ui/confirm.dialog';
import { applyServerErrors, errorMessage, focusFirstInvalid } from '../../shared/validation/form-errors';
import { LIMITS } from '../../shared/validation/limits';
import { normalizeMultiLine, normalizeSingleLine } from '../../shared/validation/normalize';
import { notBlank } from '../../shared/validation/validators';
import { TasksApiActions, TasksPageActions } from './store/tasks.actions';

export interface TaskFormDialogData {
  /** Present when editing. */
  task?: Task;
}

let nextRequestId = 0;

/** Create/edit dialog. Stays open until the API confirms, so validation errors can be shown in place. */
@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CdkTextareaAutosize,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-form.dialog.html',
  styleUrl: './task-form.dialog.scss',
})
export class TaskFormDialog implements OnInit {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly dialogRef = inject<MatDialogRef<TaskFormDialog, boolean>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly data = inject<TaskFormDialogData>(MAT_DIALOG_DATA);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly limits = LIMITS;
  readonly task = this.data.task;
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly errorMessage = errorMessage;

  readonly form = inject(NonNullableFormBuilder).group({
    title: [this.task?.title ?? '', [Validators.required, notBlank, Validators.maxLength(LIMITS.taskTitleMax)]],
    description: [this.task?.description ?? '', Validators.maxLength(LIMITS.taskDescriptionMax)],
    done: [this.task?.done ?? false],
  });

  ngOnInit(): void {
    // Closing by Esc or clicking outside asks before discarding changes.
    this.dialogRef.disableClose = true;
    merge(
      this.dialogRef.backdropClick(),
      this.dialogRef.keydownEvents().pipe(filter((event) => event.key === 'Escape')),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cancel());
  }

  cancel(): void {
    if (this.saving()) {
      return;
    }
    if (!this.form.dirty) {
      this.dialogRef.close(false);

      return;
    }

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          title: 'Descartar alterações?',
          message: 'As alterações feitas nesta tarefa serão perdidas.',
          confirmLabel: 'Descartar',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((discard) => discard && this.dialogRef.close(false));
  }

  submit(): void {
    if (this.saving()) {
      return;
    }

    const title = normalizeSingleLine(this.form.controls.title.value);
    const description = normalizeMultiLine(this.form.controls.description.value) || null;
    this.form.patchValue({ title, description: description ?? '' });

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement);

      return;
    }

    const done = this.form.controls.done.value;
    if (this.task && title === this.task.title && description === this.task.description && done === this.task.done) {
      this.dialogRef.close(false);

      return;
    }

    const requestId = `task-${++nextRequestId}`;
    this.saving.set(true);
    this.formError.set(null);
    this.watchResult(requestId);

    this.store.dispatch(
      this.task
        ? TasksPageActions.update({ requestId, id: this.task.id, update: { title, description, done } })
        : TasksPageActions.create({ requestId, input: { title, description } }),
    );
  }

  private watchResult(requestId: string): void {
    this.actions$
      .pipe(
        ofType(
          TasksApiActions.createSuccess,
          TasksApiActions.updateSuccess,
          TasksApiActions.createFailure,
          TasksApiActions.updateFailure,
        ),
        filter((action) => action.requestId === requestId),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((action) => {
        this.saving.set(false);
        if ('task' in action) {
          this.dialogRef.close(true);

          return;
        }

        if (action.error.status === 404) {
          this.formError.set('Esta tarefa não existe mais. Ela pode ter sido excluída em outra aba.');

          return;
        }

        const unmatched = applyServerErrors(this.form, action.error.violations);
        if (unmatched.length === action.error.violations.length) {
          this.formError.set(action.error.message);
        }
      });
  }
}
