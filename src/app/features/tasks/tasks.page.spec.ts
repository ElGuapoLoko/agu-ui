import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import { TasksPageActions } from './store/tasks.actions';
import { TasksState, adapter, initialTasksState } from './store/tasks.feature';
import { TaskFormDialog } from './task-form.dialog';
import { TasksPage } from './tasks.page';
import { makeTask } from './testing/task-fixtures';

describe('TasksPage', () => {
  let fixture: ComponentFixture<TasksPage>;
  let store: MockStore;
  let element: HTMLElement;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const open = makeTask({ id: 1, title: 'Pendente', createdAt: '2026-10-13T10:00:00+00:00' });
  const done = makeTask({ id: 2, title: 'Feita', done: true, createdAt: '2026-10-13T11:00:00+00:00' });

  async function setup(tasks: TasksState, filterFromUrl?: string): Promise<void> {
    registerLocaleData(localePt);
    matDialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [TasksPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideMockStore({ initialState: { tasks } }),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    })
      .overrideProvider(MatDialog, { useValue: matDialog })
      .compileComponents();

    fixture = TestBed.createComponent(TasksPage);
    if (filterFromUrl !== undefined) {
      fixture.componentRef.setInput('filter', filterFromUrl);
    }
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    element = fixture.nativeElement;
    fixture.detectChanges();
  }

  const loaded = (state: Partial<TasksState> = {}): TasksState =>
    adapter.setAll([open, done], { ...initialTasksState, loadStatus: 'loaded', ...state });

  it('loads tasks when opened', async () => {
    await setup(initialTasksState);

    expect(store.dispatch).toHaveBeenCalledOnceWith(TasksPageActions.opened({ filter: 'all' }));
  });

  it('restores the filter from the URL and ignores invalid values', async () => {
    await setup(initialTasksState, 'done');
    expect(store.dispatch).toHaveBeenCalledWith(TasksPageActions.opened({ filter: 'done' }));

    TestBed.resetTestingModule();
    await setup(initialTasksState, '<script>');
    expect(store.dispatch).toHaveBeenCalledWith(TasksPageActions.opened({ filter: 'all' }));
  });

  it('keeps the filter in the URL', async () => {
    await setup(loaded());
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    fixture.componentInstance.changeFilter('done');
    fixture.componentInstance.changeFilter('all');

    expect(navigate.calls.argsFor(0)[1]?.queryParams).toEqual({ filter: 'done' });
    expect(navigate.calls.argsFor(1)[1]?.queryParams).toEqual({ filter: null });
  });

  it('shows a progress bar while loading', async () => {
    await setup({ ...initialTasksState, loadStatus: 'loading' });

    expect(element.querySelector('mat-progress-bar')).not.toBeNull();
  });

  it('lists tasks with a summary', async () => {
    await setup(loaded());

    expect(Array.from(element.querySelectorAll('app-task-item .title')).map((t) => t.textContent)).toEqual([
      'Feita',
      'Pendente',
    ]);
    expect(element.querySelector('.summary')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '1 de 2 concluídas (1 pendente)',
    );
  });

  it('shows progress as a percentage of done tasks', async () => {
    await setup(loaded());

    expect(fixture.componentInstance.progress()).toBe(50);
    expect(element.querySelector('.today')?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('applies the filter', async () => {
    await setup(loaded({ filter: 'open' }));

    expect(Array.from(element.querySelectorAll('app-task-item .title')).map((t) => t.textContent)).toEqual([
      'Pendente',
    ]);
  });

  it('shows an empty state with a call to action', async () => {
    await setup({ ...initialTasksState, loadStatus: 'loaded' });

    expect(element.textContent).toContain('Nenhuma tarefa ainda. Crie a primeira!');
    expect(element.querySelector('mat-button-toggle-group')).toBeNull();
  });

  it('shows a filtered empty state', async () => {
    await setup(adapter.setAll([open], { ...initialTasksState, loadStatus: 'loaded', filter: 'done' }));

    expect(element.textContent).toContain('Nenhuma tarefa concluída.');
  });

  it('shows load errors with a retry button', async () => {
    await setup({ ...initialTasksState, loadStatus: 'error', loadError: 'Sem conexão.' });

    expect(element.querySelector('[role=alert]')?.textContent).toContain('Sem conexão.');
    element.querySelector<HTMLButtonElement>('[role=alert] button')!.click();

    expect(store.dispatch).toHaveBeenCalledWith(TasksPageActions.retryLoad());
  });

  it('dispatches toggles and filter changes', async () => {
    await setup(loaded());

    fixture.componentInstance.toggle(open, true);
    fixture.componentInstance.changeFilter('done');

    expect(store.dispatch).toHaveBeenCalledWith(TasksPageActions.toggleDone({ id: 1, done: true }));
    expect(store.dispatch).toHaveBeenCalledWith(TasksPageActions.filterChanged({ filter: 'done' }));
  });

  it('opens the form for new and existing tasks', async () => {
    await setup(loaded());

    fixture.componentInstance.create();
    fixture.componentInstance.edit(open);

    expect(matDialog.open.calls.argsFor(0)[0]).toBe(TaskFormDialog);
    expect(matDialog.open.calls.argsFor(0)[1]?.data).toEqual({});
    expect(matDialog.open.calls.argsFor(1)[1]?.data).toEqual({ task: open });
  });

  it('deletes only after confirmation', async () => {
    await setup(loaded());
    matDialog.open.and.returnValues(
      { afterClosed: () => of(false) } as ReturnType<MatDialog['open']>,
      { afterClosed: () => of(true) } as ReturnType<MatDialog['open']>,
    );

    fixture.componentInstance.remove(open);
    expect(store.dispatch).not.toHaveBeenCalledWith(TasksPageActions.delete({ id: 1 }));

    fixture.componentInstance.remove(open);
    expect(store.dispatch).toHaveBeenCalledWith(TasksPageActions.delete({ id: 1 }));
  });
});
