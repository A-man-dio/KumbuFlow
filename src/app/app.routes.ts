import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'flow/:id',
    loadComponent: () => import('./features/flow-detail/flow-detail.component').then(m => m.FlowDetailComponent),
  },
  { path: '**', redirectTo: '' },
];
