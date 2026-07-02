import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  // Rutas de Autenticación (Solo para invitados)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      }
    ]
  },

  // Rutas protegidas de la aplicación (Envueltas en MainLayout)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'videos',
        pathMatch: 'full'
      },
      {
        path: 'videos',
        loadComponent: () => import('./features/videos/video-list/video-list.component').then(m => m.VideoListComponent)
      },
      {
        path: 'favorites',
        loadComponent: () => import('./features/favorites/favorite-list/favorite-list.component').then(m => m.FavoriteListComponent)
      }
    ]
  },

  // Ruta comodín de respaldo (Fallback)
  {
    path: '**',
    redirectTo: 'videos'
  }
];
