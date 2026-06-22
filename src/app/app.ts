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
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
