import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Entrar | AGU Tarefas',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'Criar conta | AGU Tarefas',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: 'tasks', loadChildren: () => import('./features/tasks/tasks.routes').then((m) => m.TASKS_ROUTES) },
      { path: '', pathMatch: 'full', redirectTo: 'tasks' },
    ],
  },
  { path: '**', redirectTo: 'tasks' },
];
