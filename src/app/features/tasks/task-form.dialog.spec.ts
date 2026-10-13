import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Actions } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { EMPTY, Subject, of } from 'rxjs';

import { Task } from '../../shared/models/task';
import { TasksApiActions, TasksPageActions } from './store/tasks.actions';
import { TaskFormDialog } from './task-form.dialog';
import { makeTask } from './testing/task-fixtures';

describe('TaskFormDialog', () => {
  let fixture: ComponentFixture<TaskFormDialog>;
  let dialog: TaskFormDialog;
  let store: MockStore;
  let actions$: Subject<Action>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<TaskFormDialog, boolean>>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  async function setup(task?: Task): Promise<void> {
    actions$ = new Subject<Action>();
    dialogRef = jasmine.createSpyObj<MatDialogRef<TaskFormDialog, boolean>>('MatDialogRef', [
      'close',
      'backdropClick',
      'keydownEvents',
    ]);
    dialogRef.backdropClick.and.returnValue(EMPTY);
    dialogRef.keydownEvents.and.returnValue(EMPTY);
    matDialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [TaskFormDialog],
      providers: [
        provideNoopAnimations(),
        provideMockStore(),
        { provide: Actions, useValue: new Actions(actions$) },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { task } },
      ],
    })
      .overrideProvider(MatDialog, { useValue: matDialog })
      .compileComponents();

    fixture = TestBed.createComponent(TaskFormDialog);
    dialog = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture.detectChanges();
  }

  function lastDispatched(): Action & { requestId?: string } {
    return (store.dispatch as jasmine.Spy).calls.mostRecent().args[0];
  }

  it('requires a non-blank title', async () => {
    await setup();
    dialog.form.controls.title.setValue('    ');

    dialog.submit();
    fixture.detectChanges();

    expect(store.dispatch).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('mat-error')?.textContent).toContain(
      'O título é obrigatório.',
    );
  });

  it('creates a task with normalized input and closes after the API confirms', async () => {
    await setup();
    dialog.form.patchValue({ title: '  Comprar   café ', description: '  \n  ' });

    dialog.submit();

    const action = lastDispatched();
    expect(action).toEqual(
      TasksPageActions.create({ requestId: action.requestId!, input: { title: 'Comprar café', description: null } }),
    );
    expect(dialog.saving()).toBeTrue();
    expect(dialogRef.close).not.toHaveBeenCalled();

    dialog.submit();
    expect(store.dispatch).toHaveBeenCalledTimes(1);

    actions$.next(TasksApiActions.createSuccess({ requestId: 'someone-else', task: makeTask() }));
    expect(dialogRef.close).not.toHaveBeenCalled();

    actions$.next(TasksApiActions.createSuccess({ requestId: action.requestId!, task: makeTask() }));
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('shows API validation errors on the fields', async () => {
    await setup();
    dialog.form.patchValue({ title: 'Título' });
    dialog.submit();
    const { requestId } = lastDispatched();

    actions$.next(
      TasksApiActions.createFailure({
        requestId: requestId!,
        error: {
          status: 422,
          message: 'Dados inválidos',
          violations: [{ field: 'title', message: 'Título inválido.' }],
        },
      }),
    );

    expect(dialog.saving()).toBeFalse();
    expect(dialog.form.controls.title.errors).toEqual({ server: 'Título inválido.' });
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('shows other API errors above the form', async () => {
    await setup();
    dialog.form.patchValue({ title: 'Título' });
    dialog.submit();
    const { requestId } = lastDispatched();

    actions$.next(
      TasksApiActions.createFailure({
        requestId: requestId!,
        error: { status: 0, message: 'Sem conexão.', violations: [] },
      }),
    );

    expect(dialog.formError()).toBe('Sem conexão.');
  });

  it('edits a task, including done', async () => {
    await setup(makeTask({ id: 7, title: 'Antigo', description: 'd' }));
    expect(dialog.form.getRawValue()).toEqual({ title: 'Antigo', description: 'd', done: false });

    dialog.form.patchValue({ title: 'Novo', done: true });
    dialog.submit();

    const action = lastDispatched();
    expect(action).toEqual(
      TasksPageActions.update({
        requestId: action.requestId!,
        id: 7,
        update: { title: 'Novo', description: 'd', done: true },
      }),
    );
  });

  it('closes without a request when nothing changed', async () => {
    await setup(makeTask({ title: 'Igual' }));

    dialog.submit();

    expect(store.dispatch).not.toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('explains when the task was deleted elsewhere', async () => {
    await setup(makeTask({ id: 7 }));
    dialog.form.patchValue({ title: 'Novo' });
    dialog.submit();
    const { requestId } = lastDispatched();

    actions$.next(
      TasksApiActions.updateFailure({
        requestId: requestId!,
        id: 7,
        error: { status: 404, message: 'Tarefa não encontrada.', violations: [] },
      }),
    );

    expect(dialog.formError()).toContain('Esta tarefa não existe mais');
  });

  it('closes immediately when cancelling an untouched form', async () => {
    await setup();

    dialog.cancel();

    expect(matDialog.open).not.toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('asks before discarding changes', async () => {
    await setup();
    dialog.form.controls.title.setValue('Rascunho');
    dialog.form.markAsDirty();
    matDialog.open.and.returnValues(
      { afterClosed: () => of(false) } as ReturnType<MatDialog['open']>,
      { afterClosed: () => of(true) } as ReturnType<MatDialog['open']>,
    );

    dialog.cancel();
    expect(dialogRef.close).not.toHaveBeenCalled();

    dialog.cancel();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
