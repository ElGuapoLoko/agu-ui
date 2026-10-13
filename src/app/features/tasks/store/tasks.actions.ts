import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { ApiError } from '../../../core/http/api-error';
import { Task, TaskFilter, TaskInput, TaskUpdate } from '../../../shared/models/task';

export const TasksPageActions = createActionGroup({
  source: 'Tasks Page',
  events: {
    Opened: props<{ filter: TaskFilter }>(),
    'Retry Load': emptyProps(),
    'Filter Changed': props<{ filter: TaskFilter }>(),
    Create: props<{ requestId: string; input: TaskInput }>(),
    Update: props<{ requestId: string; id: number; update: TaskUpdate }>(),
    'Toggle Done': props<{ id: number; done: boolean }>(),
    Delete: props<{ id: number }>(),
  },
});

export const TasksApiActions = createActionGroup({
  source: 'Tasks API',
  events: {
    'Load Success': props<{ tasks: Task[] }>(),
    'Load Failure': props<{ error: ApiError }>(),
    'Create Success': props<{ requestId: string; task: Task }>(),
    'Create Failure': props<{ requestId: string; error: ApiError }>(),
    'Update Success': props<{ requestId: string; task: Task }>(),
    'Update Failure': props<{ requestId: string; id: number; error: ApiError }>(),
    'Toggle Done Success': props<{ task: Task }>(),
    'Toggle Done Failure': props<{ id: number; previousDone: boolean; error: ApiError }>(),
    'Delete Success': props<{ id: number }>(),
    'Delete Failure': props<{ id: number; error: ApiError }>(),
  },
});
