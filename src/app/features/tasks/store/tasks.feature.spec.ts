import { AuthActions } from '../../../core/auth/store/auth.actions';
import { ApiError } from '../../../core/http/api-error';
import { makeTask } from '../testing/task-fixtures';
import { TasksApiActions, TasksPageActions } from './tasks.actions';
import {
  TasksState,
  adapter,
  initialTasksState,
  selectCounts,
  selectVisibleTasks,
  tasksFeature,
} from './tasks.feature';

describe('tasks reducer', () => {
  const reducer = tasksFeature.reducer;
  const error = (status: number): ApiError => ({ status, message: 'Erro', violations: [] });
  const older = makeTask({ id: 1, title: 'Antiga', createdAt: '2026-10-13T10:00:00+00:00' });
  const newer = makeTask({ id: 2, title: 'Nova', createdAt: '2026-10-13T11:00:00+00:00', done: true });
  const loaded = (): TasksState =>
    adapter.setAll([older, newer], { ...initialTasksState, loadStatus: 'loaded' as const });

  const ids = (state: TasksState): number[] => state.ids as number[];

  it('loads tasks newest first', () => {
    let state = reducer(initialTasksState, TasksPageActions.opened({ filter: 'done' }));
    expect(state.loadStatus).toBe('loading');
    expect(state.filter).toBe('done');

    state = reducer(state, TasksApiActions.loadSuccess({ tasks: [older, newer] }));
    expect(state.loadStatus).toBe('loaded');
    expect(ids(state)).toEqual([2, 1]);
  });

  it('breaks createdAt ties by id', () => {
    const a = makeTask({ id: 5 });
    const b = makeTask({ id: 9 });

    expect(ids(reducer(initialTasksState, TasksApiActions.loadSuccess({ tasks: [a, b] })))).toEqual([9, 5]);
  });

  it('keeps the error message when loading fails', () => {
    const state = reducer(initialTasksState, TasksApiActions.loadFailure({ error: error(0) }));

    expect(state.loadStatus).toBe('error');
    expect(state.loadError).toBe('Erro');
    expect(reducer(state, TasksPageActions.retryLoad()).loadError).toBeNull();
  });

  it('adds created and updated tasks', () => {
    const created = makeTask({ id: 3, createdAt: '2026-10-13T12:00:00+00:00' });
    let state = reducer(loaded(), TasksApiActions.createSuccess({ requestId: 'r', task: created }));
    expect(ids(state)).toEqual([3, 2, 1]);

    state = reducer(state, TasksApiActions.updateSuccess({ requestId: 'r', task: { ...older, title: 'Editada' } }));
    expect(state.entities[1]?.title).toBe('Editada');
  });

  it('toggles optimistically and confirms', () => {
    let state = reducer(loaded(), TasksPageActions.toggleDone({ id: 1, done: true }));
    expect(state.entities[1]?.done).toBeTrue();
    expect(state.busyIds).toEqual([1]);

    state = reducer(state, TasksApiActions.toggleDoneSuccess({ task: { ...older, done: true } }));
    expect(state.busyIds).toEqual([]);
    expect(state.entities[1]?.done).toBeTrue();
  });

  it('rolls a failed toggle back', () => {
    let state = reducer(loaded(), TasksPageActions.toggleDone({ id: 1, done: true }));
    state = reducer(state, TasksApiActions.toggleDoneFailure({ id: 1, previousDone: false, error: error(500) }));

    expect(state.entities[1]?.done).toBeFalse();
    expect(state.busyIds).toEqual([]);
  });

  it('removes tasks that no longer exist on the server', () => {
    let state = reducer(loaded(), TasksApiActions.toggleDoneFailure({ id: 1, previousDone: false, error: error(404) }));
    expect(ids(state)).toEqual([2]);

    state = reducer(loaded(), TasksApiActions.updateFailure({ requestId: 'r', id: 2, error: error(404) }));
    expect(ids(state)).toEqual([1]);

    state = reducer(loaded(), TasksApiActions.deleteFailure({ id: 2, error: error(404) }));
    expect(ids(state)).toEqual([1]);
  });

  it('keeps tasks on other update failures', () => {
    expect(ids(reducer(loaded(), TasksApiActions.updateFailure({ requestId: 'r', id: 2, error: error(422) })))).toEqual(
      [2, 1],
    );
  });

  it('deletes after the API confirms', () => {
    let state = reducer(loaded(), TasksPageActions.delete({ id: 2 }));
    expect(state.busyIds).toEqual([2]);
    expect(ids(state)).toEqual([2, 1]);

    state = reducer(state, TasksApiActions.deleteSuccess({ id: 2 }));
    expect(ids(state)).toEqual([1]);
    expect(state.busyIds).toEqual([]);
  });

  it('keeps the task when delete fails for another reason', () => {
    let state = reducer(loaded(), TasksPageActions.delete({ id: 2 }));
    state = reducer(state, TasksApiActions.deleteFailure({ id: 2, error: error(500) }));

    expect(ids(state)).toEqual([2, 1]);
    expect(state.busyIds).toEqual([]);
  });

  it('changes the filter', () => {
    expect(reducer(loaded(), TasksPageActions.filterChanged({ filter: 'done' })).filter).toBe('done');
  });

  it('forgets tasks on logout and session expiry', () => {
    expect(reducer(loaded(), AuthActions.logout())).toEqual(initialTasksState);
    expect(reducer(loaded(), AuthActions.sessionExpired({ returnUrl: '/' }))).toEqual(initialTasksState);
  });

  describe('selectors', () => {
    it('filters visible tasks', () => {
      expect(selectVisibleTasks.projector([newer, older], 'all')).toEqual([newer, older]);
      expect(selectVisibleTasks.projector([newer, older], 'open')).toEqual([older]);
      expect(selectVisibleTasks.projector([newer, older], 'done')).toEqual([newer]);
    });

    it('counts tasks', () => {
      expect(selectCounts.projector([newer, older])).toEqual({ total: 2, open: 1, done: 1 });
      expect(selectCounts.projector([])).toEqual({ total: 0, open: 0, done: 0 });
    });
  });
});
