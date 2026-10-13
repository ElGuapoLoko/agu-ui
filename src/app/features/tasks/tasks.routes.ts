import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';

import * as tasksEffects from './store/tasks.effects';
import { tasksFeature } from './store/tasks.feature';
import { TasksPage } from './tasks.page';

/** Lazy-loaded: the tasks store, effects and page only download after login. */
export const TASKS_ROUTES: Routes = [
  {
    path: '',
    title: 'Minhas tarefas | AGU Tarefas',
    providers: [provideState(tasksFeature), provideEffects(tasksEffects)],
    component: TasksPage,
  },
];
