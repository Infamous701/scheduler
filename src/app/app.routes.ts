import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'timeline', pathMatch: 'full' },
  {
    path: 'timeline',
    loadComponent: () => import('./features/timeline/timeline.component').then(m => m.TimelineComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
  },
  {
    path: 'users/new',
    loadComponent: () => import('./features/users/components/user-detail/user-detail.component').then(m => m.UserDetailComponent)
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./features/users/components/user-detail/user-detail.component').then(m => m.UserDetailComponent)
  },
  { path: '**', redirectTo: 'timeline' }
];
