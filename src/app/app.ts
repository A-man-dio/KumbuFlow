import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AlertComponent } from './shared/components/alert/alert.component';

/**
 * Root component — the shell that wraps the entire application.
 *
 * Layout (top to bottom):
 *   <app-navbar>   — sticky header with logo, month badge, and action buttons
 *   <router-outlet> — lazy-loaded page content (Dashboard or FlowDetail)
 *   <app-alert>    — global overlay layer for toasts and confirm dialogs
 *   <footer>       — developer signature, always visible at the bottom
 *
 * AlertComponent is placed at root level so its toasts and dialogs appear
 * above all page content regardless of which route is active.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AlertComponent],
  template: `
    <app-navbar />
    <router-outlet />
    <app-alert />
    <footer class="app-footer">
      <div class="footer-inner">
        <span class="footer-dev">Dev by</span>
        <span class="footer-name">A_man_dio<span class="footer-suffix"> IV</span></span>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }

    .app-footer {
      margin-top: auto;
      padding: 20px 24px;
      border-top: 1px solid rgba(255,255,255,0.04);
      display: flex;
      justify-content: center;
    }

    .footer-inner {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    /* "Dev by" label — small, muted */
    .footer-dev {
      font-family: 'Inter', sans-serif;
      font-size: 0.65rem;
      font-weight: 400;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    /* Developer signature in JetBrains Mono — blue highlight */
    .footer-name {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      font-weight: 700;
      color: #3B82F6;
      letter-spacing: 0.04em;
    }

    /* " IV" suffix in a lighter grey */
    .footer-suffix {
      font-weight: 400;
      color: #64748B;
    }
  `]
})
export class App {}
