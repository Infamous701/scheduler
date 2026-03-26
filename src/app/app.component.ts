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

    <footer class="app-footer">
      <div class="footer-inner">
        <div class="footer-meta">
          <span class="footer-version">v1.0.0</span>
          <span class="footer-copy">&copy; {{ year }} Scheduler. All rights reserved.</span>
        </div>
      </div>
    </footer>
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
      position: relative;
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
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
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
    :host { display: flex; flex-direction: column; height: 100vh; }
    .main-outlet { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .app-footer {
      background: #1a1f2e;
      color: rgba(255,255,255,0.6);
      padding: 6px 10%;
    }
    .footer-inner {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #fff;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .footer-links {
      display: flex;
      gap: 20px;
      a {
        color: rgba(255,255,255,0.6);
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
        transition: color 0.15s;
        &:hover { color: #fff; }
      }
    }
    .footer-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 12px;
    }
    .footer-version {
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      padding: 2px 8px;
      font-family: monospace;
      font-size: 12px;
      color: rgba(255,255,255,0.7);
    }
    .footer-copy { color: rgba(255,255,255,0.4); }
  `]
})
export class AppComponent {
  readonly year = new Date().getFullYear();
}
