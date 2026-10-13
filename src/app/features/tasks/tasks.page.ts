import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { Task, TaskFilter } from '../../shared/models/task';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/ui/confirm.dialog';
import { TasksPageActions } from './store/tasks.actions';
import {
  selectBusyIds,
  selectCounts,
  selectFilter,
  selectIsLoading,
  selectLoadError,
  selectLoadStatus,
  selectVisibleTasks,
} from './store/tasks.feature';
import { TaskFormDialog, TaskFormDialogData } from './task-form.dialog';
import { TaskItemComponent } from './task-item.component';

const FILTERS: TaskFilter[] = ['all', 'open', 'done'];

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    TaskItemComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tasks.page.html',
  styleUrl: './tasks.page.scss',
})
export class TasksPage implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  @Input() filter?: string;

  readonly tasks = this.store.selectSignal(selectVisibleTasks);
  readonly counts = this.store.selectSignal(selectCounts);
  readonly activeFilter = this.store.selectSignal(selectFilter);
  readonly loading = this.store.selectSignal(selectIsLoading);
  readonly loadStatus = this.store.selectSignal(selectLoadStatus);
  readonly loadError = this.store.selectSignal(selectLoadError);
  private readonly busyIds = this.store.selectSignal(selectBusyIds);
  readonly busy = computed(() => new Set(this.busyIds()));

  readonly today = new Date();
  readonly progress = computed(() => {
    const { total, done } = this.counts();

    return total === 0 ? 0 : Math.round((done / total) * 100);
  });

  readonly emptyMessage = computed(() => {
    if (this.counts().total === 0) {
      return 'Nenhuma tarefa ainda. Crie a primeira!';
    }

    return this.activeFilter() === 'done' ? 'Nenhuma tarefa concluída.' : 'Nenhuma tarefa pendente. Bom trabalho!';
  });

  ngOnInit(): void {
    const filter = FILTERS.includes(this.filter as TaskFilter) ? (this.filter as TaskFilter) : 'all';
    this.store.dispatch(TasksPageActions.opened({ filter }));
  }

  retry(): void {
    this.store.dispatch(TasksPageActions.retryLoad());
  }

  changeFilter(filter: TaskFilter): void {
    this.store.dispatch(TasksPageActions.filterChanged({ filter }));
    void this.router.navigate([], {
      queryParams: { filter: filter === 'all' ? null : filter },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  create(): void {
    this.openForm({});
  }

  edit(task: Task): void {
    this.openForm({ task });
  }

  toggle(task: Task, done: boolean): void {
    this.store.dispatch(TasksPageActions.toggleDone({ id: task.id, done }));
  }

  remove(task: Task): void {
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          title: 'Excluir tarefa?',
          message: `“${task.title}” será excluída permanentemente.`,
          confirmLabel: 'Excluir',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => confirmed && this.store.dispatch(TasksPageActions.delete({ id: task.id })));
  }

  private openForm(data: TaskFormDialogData): void {
    this.dialog.open<TaskFormDialog, TaskFormDialogData, boolean>(TaskFormDialog, {
      data,
      width: '560px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }
}
