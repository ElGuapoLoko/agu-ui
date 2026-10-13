import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';

import { AuthActions } from '../../../core/auth/store/auth.actions';
import { Task, TaskFilter } from '../../../shared/models/task';
import { TasksApiActions, TasksPageActions } from './tasks.actions';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface TasksState extends EntityState<Task> {
  loadStatus: LoadStatus;
  loadError: string | null;
  filter: TaskFilter;
  /** Tasks with a toggle or delete request in flight. */
  busyIds: number[];
}

/** Newest first; ties broken by id (same order as the API). */
export const adapter = createEntityAdapter<Task>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id,
});

export const initialTasksState: TasksState = adapter.getInitialState({
  loadStatus: 'idle',
  loadError: null,
  filter: 'all',
  busyIds: [],
});

const withoutBusy = (busyIds: number[], id: number): number[] => busyIds.filter((busyId) => busyId !== id);
const NOT_FOUND = 404;

export const tasksFeature = createFeature({
  name: 'tasks',
  reducer: createReducer(
    initialTasksState,
    on(TasksPageActions.opened, (state, { filter }): TasksState => ({
      ...state,
      filter,
      loadStatus: 'loading',
      loadError: null,
    })),
    on(TasksPageActions.retryLoad, (state): TasksState => ({ ...state, loadStatus: 'loading', loadError: null })),
    on(TasksApiActions.loadSuccess, (state, { tasks }): TasksState =>
      adapter.setAll(tasks, { ...state, loadStatus: 'loaded', busyIds: [] }),
    ),
    on(TasksApiActions.loadFailure, (state, { error }): TasksState => ({
      ...state,
      loadStatus: 'error',
      loadError: error.message,
    })),
    on(TasksPageActions.filterChanged, (state, { filter }): TasksState => ({ ...state, filter })),
    on(
      TasksApiActions.createSuccess,
      TasksApiActions.updateSuccess,
      TasksApiActions.toggleDoneSuccess,
      (state, { task }): TasksState =>
        adapter.upsertOne(task, { ...state, busyIds: withoutBusy(state.busyIds, task.id) }),
    ),
    // Optimistic toggle: update immediately, roll back on failure.
    on(TasksPageActions.toggleDone, (state, { id, done }): TasksState =>
      adapter.updateOne({ id, changes: { done } }, { ...state, busyIds: [...state.busyIds, id] }),
    ),
    on(TasksApiActions.toggleDoneFailure, (state, { id, previousDone, error }): TasksState => {
      const next = { ...state, busyIds: withoutBusy(state.busyIds, id) };

      return error.status === NOT_FOUND
        ? adapter.removeOne(id, next)
        : adapter.updateOne({ id, changes: { done: previousDone } }, next);
    }),
    on(TasksPageActions.delete, (state, { id }): TasksState => ({ ...state, busyIds: [...state.busyIds, id] })),
    on(TasksApiActions.deleteSuccess, (state, { id }): TasksState =>
      adapter.removeOne(id, { ...state, busyIds: withoutBusy(state.busyIds, id) }),
    ),
    on(TasksApiActions.deleteFailure, (state, { id, error }): TasksState => {
      const next = { ...state, busyIds: withoutBusy(state.busyIds, id) };

      // Already gone on the server: remove it here too.
      return error.status === NOT_FOUND ? adapter.removeOne(id, next) : next;
    }),
    on(TasksApiActions.updateFailure, (state, { id, error }): TasksState =>
      error.status === NOT_FOUND ? adapter.removeOne(id, state) : state,
    ),
    // Never keep one user's tasks in memory after logout.
    on(AuthActions.logout, AuthActions.sessionExpired, (): TasksState => initialTasksState),
  ),
  extraSelectors: ({ selectTasksState, selectFilter, selectLoadStatus }) => {
    const { selectAll } = adapter.getSelectors(selectTasksState);
    const selectAllTasks = createSelector(selectAll, (tasks) => tasks);

    return {
      selectAllTasks,
      selectVisibleTasks: createSelector(selectAllTasks, selectFilter, (tasks, filter) =>
        filter === 'all' ? tasks : tasks.filter((task) => task.done === (filter === 'done')),
      ),
      selectCounts: createSelector(selectAllTasks, (tasks) => {
        const done = tasks.filter((task) => task.done).length;

        return { total: tasks.length, open: tasks.length - done, done };
      }),
      selectIsLoading: createSelector(selectLoadStatus, (status) => status === 'loading'),
    };
  },
});

export const {
  selectVisibleTasks,
  selectCounts,
  selectFilter,
  selectIsLoading,
  selectLoadStatus,
  selectLoadError,
  selectBusyIds,
} = tasksFeature;
