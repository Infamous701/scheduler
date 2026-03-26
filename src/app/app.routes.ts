import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'timeline', pathMatch: 'full' },
  {
    path: 'timeline',
    title: 'Timeline – Scheduler',
    loadComponent: () => import('./features/timeline/timeline.component').then(m => m.TimelineComponent)
  },
  {
    path: 'users',
    title: 'Users – Scheduler',
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
  },
  // 'users/new' must come before 'users/:id' to prevent 'new' matching as an id
  {
    path: 'users/new',
    title: 'New User – Scheduler',
    loadComponent: () => import('./features/users/components/user-detail/user-detail.component').then(m => m.UserDetailComponent)
  },
  {
    path: 'users/:id',
    title: 'Edit User – Scheduler',
    loadComponent: () => import('./features/users/components/user-detail/user-detail.component').then(m => m.UserDetailComponent)
  },
  {
    path: 'shifts/:userId',
    title: 'Baseline Shifts – Scheduler',
    loadComponent: () => import('./features/users/components/user-baseline/user-baseline.component').then(m => m.UserBaselineComponent)
  },
  { path: '**', redirectTo: 'timeline' }
];
