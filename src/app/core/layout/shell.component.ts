import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';

import { AuthActions } from '../auth/store/auth.actions';
import { selectUser } from '../auth/store/auth.feature';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="skip-link" (click)="skipToContent(main)">Pular para o conteúdo</button>
    <mat-toolbar class="toolbar">
      <a routerLink="/tasks" class="brand">
        <mat-icon aria-hidden="true">task_alt</mat-icon>
        <span class="brand-name" translate="no">AGU Tarefas</span>
      </a>
      <span class="spacer"></span>
      <button mat-button [matMenuTriggerFor]="userMenu" aria-label="Menu do usuário" class="user-button">
        <span class="avatar" aria-hidden="true">{{ initial() }}</span>
        <span class="username">{{ user()?.username ?? '' }}</span>
        <mat-icon aria-hidden="true" iconPositionEnd>expand_more</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu" xPosition="before">
        <button mat-menu-item (click)="logout()">
          <mat-icon aria-hidden="true">logout</mat-icon>
          <span>Sair</span>
        </button>
      </mat-menu>
    </mat-toolbar>
    <main class="content" id="main" tabindex="-1" #main>
      <router-outlet />
    </main>
  `,
  styles: `
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 2;
      height: 64px;
      background: var(--app-ink);
      color: var(--app-on-ink);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: inherit;
      text-decoration: none;
    }
    .brand-name {
      font-family: var(--app-display);
      font-size: 1.25rem;
      font-weight: 600;
    }
    .spacer {
      flex: 1;
    }
    .user-button {
      --mdc-text-button-label-text-color: var(--app-on-ink);
      height: 40px;
    }
    .avatar {
      display: inline-grid;
      place-items: center;
      width: 28px;
      height: 28px;
      margin-right: 8px;
      border-radius: 50%;
      background: #2e7d5b;
      color: #fff;
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .username {
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 500;
    }
    .content:focus {
      outline: none;
    }
    .content {
      max-width: 820px;
      margin: 0 auto;
      padding: 40px 20px 112px;
    }
    @media (max-width: 480px) {
      .username {
        display: none;
      }
      .content {
        padding-top: 28px;
      }
    }
  `,
})
export class ShellComponent {
  private readonly store = inject(Store);

  readonly user = this.store.selectSignal(selectUser);
  readonly initial = computed(() => this.user()?.username.charAt(0) ?? '');

  skipToContent(main: HTMLElement): void {
    main.focus();
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
