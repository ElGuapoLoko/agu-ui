import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, map, mergeMap, of, switchMap, tap } from 'rxjs';

import { toApiError } from '../../../core/http/api-error';
import { NotificationService } from '../../../core/notify/notification.service';
import { TasksApi } from '../tasks.api';
import { TasksApiActions, TasksPageActions } from './tasks.actions';

const UNAUTHORIZED = 401;

export const load$ = createEffect(
  (actions$ = inject(Actions), api = inject(TasksApi)) => {
    return actions$.pipe(
      ofType(TasksPageActions.opened, TasksPageActions.retryLoad),
      switchMap(() =>
        api.list().pipe(
          map((tasks) => TasksApiActions.loadSuccess({ tasks })),
          catchError((error: unknown) => of(TasksApiActions.loadFailure({ error: toApiError(error) }))),
        ),
      ),
    );
  },
  { functional: true },
);

/** Writes run in order (concatMap) so a later edit never lands before an earlier one. */
export const create$ = createEffect(
  (actions$ = inject(Actions), api = inject(TasksApi)) => {
    return actions$.pipe(
      ofType(TasksPageActions.create),
      concatMap(({ requestId, input }) =>
        api.create(input).pipe(
          map((task) => TasksApiActions.createSuccess({ requestId, task })),
          catchError((error: unknown) => of(TasksApiActions.createFailure({ requestId, error: toApiError(error) }))),
        ),
      ),
    );
  },
  { functional: true },
);

export const update$ = createEffect(
  (actions$ = inject(Actions), api = inject(TasksApi)) => {
    return actions$.pipe(
      ofType(TasksPageActions.update),
      concatMap(({ requestId, id, update }) =>
        api.update(id, update).pipe(
          map((task) => TasksApiActions.updateSuccess({ requestId, task })),
          catchError((error: unknown) =>
            of(TasksApiActions.updateFailure({ requestId, id, error: toApiError(error) })),
          ),
        ),
      ),
    );
  },
  { functional: true },
);

/** Toggles of different tasks may run in parallel; the reducer already applied them optimistically. */
export const toggleDone$ = createEffect(
  (actions$ = inject(Actions), api = inject(TasksApi)) => {
    return actions$.pipe(
      ofType(TasksPageActions.toggleDone),
      mergeMap(({ id, done }) =>
        api.setDone(id, done).pipe(
          map((task) => TasksApiActions.toggleDoneSuccess({ task })),
          catchError((error: unknown) =>
            of(TasksApiActions.toggleDoneFailure({ id, previousDone: !done, error: toApiError(error) })),
          ),
        ),
      ),
    );
  },
  { functional: true },
);

export const delete$ = createEffect(
  (actions$ = inject(Actions), api = inject(TasksApi)) => {
    return actions$.pipe(
      ofType(TasksPageActions.delete),
      mergeMap(({ id }) =>
        api.delete(id).pipe(
          map(() => TasksApiActions.deleteSuccess({ id })),
          catchError((error: unknown) => of(TasksApiActions.deleteFailure({ id, error: toApiError(error) }))),
        ),
      ),
    );
  },
  { functional: true },
);

export const notifySuccess$ = createEffect(
  (actions$ = inject(Actions), notifications = inject(NotificationService)) => {
    return actions$.pipe(
      ofType(TasksApiActions.createSuccess, TasksApiActions.updateSuccess, TasksApiActions.deleteSuccess),
      tap((action) => {
        const messages: Record<string, string> = {
          [TasksApiActions.createSuccess.type]: 'Tarefa criada.',
          [TasksApiActions.updateSuccess.type]: 'Tarefa atualizada.',
          [TasksApiActions.deleteSuccess.type]: 'Tarefa excluída.',
        };
        notifications.success(messages[action.type]);
      }),
    );
  },
  { functional: true, dispatch: false },
);

/**
 * Errors not shown inside a form. Create/update errors are shown in the dialog;
 * 401 is handled globally (session expired).
 */
export const notifyFailure$ = createEffect(
  (actions$ = inject(Actions), notifications = inject(NotificationService)) => {
    return actions$.pipe(
      ofType(TasksApiActions.toggleDoneFailure, TasksApiActions.deleteFailure),
      tap(({ error }) => {
        if (error.status === UNAUTHORIZED) {
          return;
        }
        notifications.error(error.status === 404 ? 'Esta tarefa não existe mais.' : error.message);
      }),
    );
  },
  { functional: true, dispatch: false },
);
