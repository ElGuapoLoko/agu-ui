import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { Task } from '../../shared/models/task';

/** One entry of the docket. Presentational: emits intents, never touches the store. */
@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [DatePipe, MatCheckboxModule, MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="item" [class.done]="task.done" [attr.aria-busy]="busy">
      <mat-checkbox
        class="check"
        [checked]="task.done"
        [disabled]="busy"
        (change)="toggle.emit($event.checked)"
        [aria-label]="(task.done ? 'Marcar como pendente: ' : 'Marcar como concluída: ') + task.title"
      />
      <div class="body">
        <div class="heading">
          <h3 class="title">{{ task.title }}</h3>
          @if (task.done) {
            <span class="stamp" aria-hidden="true">Concluída</span>
          }
        </div>
        @if (task.description) {
          <p class="description">{{ task.description }}</p>
        }
        <p class="meta">
          <time [attr.datetime]="task.createdAt">Criada em {{ task.createdAt | date: 'short' }}</time>
          @if (task.updatedAt !== task.createdAt) {
            <time class="edited" [attr.datetime]="task.updatedAt">editada em {{ task.updatedAt | date: 'short' }}</time>
          }
        </p>
      </div>
      <button
        mat-icon-button
        class="actions"
        [matMenuTriggerFor]="menu"
        [disabled]="busy"
        [attr.aria-label]="'Ações da tarefa ' + task.title"
      >
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu" xPosition="before">
        <button mat-menu-item (click)="edit.emit()">
          <mat-icon aria-hidden="true">edit</mat-icon>
          <span>Editar</span>
        </button>
        <button mat-menu-item class="danger" (click)="remove.emit()">
          <mat-icon aria-hidden="true">delete</mat-icon>
          <span>Excluir</span>
        </button>
      </mat-menu>
    </article>
  `,
  styleUrl: './task-item.component.scss',
})
export class TaskItemComponent {
  @Input({ required: true }) task!: Task;
  @Input() busy = false;

  @Output() readonly toggle = new EventEmitter<boolean>();
  @Output() readonly edit = new EventEmitter<void>();
  @Output() readonly remove = new EventEmitter<void>();
}
