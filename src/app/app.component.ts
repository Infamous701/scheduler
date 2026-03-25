import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <mat-toolbar color="primary" class="topbar">
      <div class="brand">
        <mat-icon>calendar_month</mat-icon>
        <span class="brand-text">Scheduler</span>
      </div>

      <nav class="nav-tabs">
        <a mat-button routerLink="/timeline" routerLinkActive="active-tab">
          <mat-icon>calendar_today</mat-icon>
          Timeline
        </a>
        <a mat-button routerLink="/users" routerLinkActive="active-tab">
          <mat-icon>group</mat-icon>
          Users
        </a>
      </nav>

      <span class="spacer"></span>
    </mat-toolbar>

    <main class="main-outlet">
      <router-outlet />
    </main>
  `,
  styles: [`
    .topbar {
      position: sticky;
      top: 0;
      z-index: 200;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-right: 16px;
    }
    .nav-tabs {
      display: flex;
      gap: 4px;
      a {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        font-weight: 600;
        opacity: 0.75;
        border-radius: 6px;
        transition: opacity 0.15s;
        &.active-tab { opacity: 1; background: rgba(255,255,255,0.15); }
        &:hover { opacity: 1; }
        mat-icon { font-size: 18px; width: 18px; height: 18px; }
      }
    }
    .spacer { flex: 1; }
    .main-outlet { min-height: calc(100vh - 64px); }
  `]
})
export class AppComponent {}
