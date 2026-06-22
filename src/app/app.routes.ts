import { Routes } from '@angular/router';

/**
 * Application route definitions.
 *
 * Both components are lazy-loaded (loadComponent) so Angular only fetches
 * their JS chunks when the user actually navigates to that route — keeping
 * the initial bundle small.
 *
 * The wildcard '**' redirects any unknown path back to the dashboard
 * instead of showing a blank screen.
 */
export const routes: Routes = [
  {
    // Dashboard — the main screen with the card balance and all flows
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    // Flow detail page — shows history, chart and allocation for a single flow
    path: 'flow/:id',
    loadComponent: () =>
      import('./features/flow-detail/flow-detail.component').then(m => m.FlowDetailComponent),
  },
  // Catch-all: redirect unknown URLs to the dashboard
  { path: '**', redirectTo: '' },
];
