import { HttpErrorResponse } from '@angular/common/http';
import { Actions } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable, Subject, of, throwError } from 'rxjs';

import { NotificationService } from '../../../core/notify/notification.service';
import { TasksApi } from '../tasks.api';
import { makeTask } from '../testing/task-fixtures';
import { TasksApiActions, TasksPageActions } from './tasks.actions';
import * as effects from './tasks.effects';

describe('tasks effects', () => {
  let source: Subject<Action>;
  let actions$: Actions;
  let api: jasmine.SpyObj<TasksApi>;
  let notifications: jasmine.SpyObj<NotificationService>;
  const task = makeTask({ id: 7, title: 'Comprar café' });
  const httpError = (status: number, detail = 'Erro'): HttpErrorResponse =>
    new HttpErrorResponse({ status, error: { status, detail } });

  function collect<T>(stream: Observable<T>): T[] {
    const values: T[] = [];
    stream.subscribe((value) => values.push(value));

    return values;
  }

  beforeEach(() => {
    source = new Subject<Action>();
    actions$ = new Actions(source);
    api = jasmine.createSpyObj<TasksApi>('TasksApi', ['list', 'create', 'update', 'setDone', 'delete']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']);
  });

  it('load$ loads on open and retry', () => {
    api.list.and.returnValues(
      of([task]),
      throwError(() => httpError(0)),
    );
    const output = collect(effects.load$(actions$, api));

    source.next(TasksPageActions.opened({ filter: 'all' }));
    source.next(TasksPageActions.retryLoad());

    expect(output[0]).toEqual(TasksApiActions.loadSuccess({ tasks: [task] }));
    expect(output[1].type).toBe(TasksApiActions.loadFailure.type);
  });

  it('create$ reports success and failure with the request id', () => {
    api.create.and.returnValues(
      of(task),
      throwError(() => httpError(422, 'Dados inválidos')),
    );
    const output = collect(effects.create$(actions$, api));
    const input = { title: 'Comprar café', description: null };

    source.next(TasksPageActions.create({ requestId: 'a', input }));
    source.next(TasksPageActions.create({ requestId: 'b', input }));

    expect(output).toEqual([
      TasksApiActions.createSuccess({ requestId: 'a', task }),
      TasksApiActions.createFailure({
        requestId: 'b',
        error: { status: 422, message: 'Dados inválidos', violations: [] },
      }),
    ]);
  });

  it('update$ sends the full update', () => {
    api.update.and.returnValue(of(task));
    const output = collect(effects.update$(actions$, api));
    const update = { title: 'Comprar café', description: null, done: true };

    source.next(TasksPageActions.update({ requestId: 'a', id: 7, update }));

    expect(api.update).toHaveBeenCalledWith(7, update);
    expect(output).toEqual([TasksApiActions.updateSuccess({ requestId: 'a', task })]);
  });

  it('update$ reports failures with the task id', () => {
    api.update.and.returnValue(throwError(() => httpError(404, 'Tarefa não encontrada.')));
    const output = collect(effects.update$(actions$, api));

    source.next(
      TasksPageActions.update({ requestId: 'a', id: 7, update: { title: 'x', description: null, done: false } }),
    );

    expect(output).toEqual([
      TasksApiActions.updateFailure({
        requestId: 'a',
        id: 7,
        error: { status: 404, message: 'Tarefa não encontrada.', violations: [] },
      }),
    ]);
  });

  it('toggleDone$ remembers the previous value for rollback', () => {
    api.setDone.and.returnValues(
      of({ ...task, done: true }),
      throwError(() => httpError(500)),
    );
    const output = collect(effects.toggleDone$(actions$, api));

    source.next(TasksPageActions.toggleDone({ id: 7, done: true }));
    source.next(TasksPageActions.toggleDone({ id: 7, done: false }));

    expect(output[0]).toEqual(TasksApiActions.toggleDoneSuccess({ task: { ...task, done: true } }));
    expect(output[1]).toEqual(
      jasmine.objectContaining({ type: TasksApiActions.toggleDoneFailure.type, id: 7, previousDone: true }),
    );
  });

  it('delete$ deletes and reports failures', () => {
    api.delete.and.returnValues(
      of(undefined),
      throwError(() => httpError(500)),
    );
    const output = collect(effects.delete$(actions$, api));

    source.next(TasksPageActions.delete({ id: 7 }));
    source.next(TasksPageActions.delete({ id: 8 }));

    expect(output[0]).toEqual(TasksApiActions.deleteSuccess({ id: 7 }));
    expect(output[1]).toEqual(jasmine.objectContaining({ type: TasksApiActions.deleteFailure.type, id: 8 }));
  });

  it('notifySuccess$ confirms writes', () => {
    collect(effects.notifySuccess$(actions$, notifications));

    source.next(TasksApiActions.createSuccess({ requestId: 'a', task }));
    source.next(TasksApiActions.updateSuccess({ requestId: 'a', task }));
    source.next(TasksApiActions.deleteSuccess({ id: 7 }));

    expect(notifications.success.calls.allArgs()).toEqual([
      ['Tarefa criada.'],
      ['Tarefa atualizada.'],
      ['Tarefa excluída.'],
    ]);
  });

  it('notifyFailure$ explains failures except expired sessions', () => {
    collect(effects.notifyFailure$(actions$, notifications));
    const error = (status: number) => ({ status, message: 'Falhou', violations: [] });

    source.next(TasksApiActions.deleteFailure({ id: 7, error: error(500) }));
    source.next(TasksApiActions.toggleDoneFailure({ id: 7, previousDone: false, error: error(404) }));
    source.next(TasksApiActions.deleteFailure({ id: 7, error: error(401) }));

    expect(notifications.error.calls.allArgs()).toEqual([['Falhou'], ['Esta tarefa não existe mais.']]);
  });
});
