import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <mat-toolbar class="navbar">
      <div class="nav-container">
        <!-- Logo -->
        <a routerLink="/" class="brand">
          <mat-icon class="brand-icon">play_circle_filled</mat-icon>
          <span class="brand-text">InnovaTube</span>
        </a>

        <div class="spacer"></div>

        <!-- Navigation Links -->
        <div class="nav-links">
          @if (authService.isAuthenticated()) {
            <a routerLink="/videos" routerLinkActive="active-link" class="nav-item">
              <mat-icon>search</mat-icon>
              <span>Search</span>
            </a>
            <a routerLink="/favorites" routerLinkActive="active-link" class="nav-item">
              <mat-icon>favorite</mat-icon>
              <span>Favorites</span>
            </a>
            
            <!-- User Menu -->
            <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
              <mat-icon>account_circle</mat-icon>
              <span class="username-text">{{ authService.currentUser()?.username }}</span>
              <mat-icon>arrow_drop_down</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu" xPosition="before" class="dark-menu">
              <div class="menu-header">
                <p class="fullname">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</p>
                <p class="email">{{ authService.currentUser()?.email }}</p>
              </div>
              <button mat-menu-item (click)="logout()">
                <mat-icon>exit_to_app</mat-icon>
                <span>Cerrar sesión</span>
              </button>
            </mat-menu>
          } @else {
            <a routerLink="/auth/login" mat-button>Iniciar sesión</a>
            <a routerLink="/auth/register" mat-flat-button color="primary">Registrarse</a>
          }
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .navbar {
      background: rgba(19, 27, 46, 0.85) !important;
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 70px;
    }
    .nav-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      padding: 0 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: var(--text-primary);
      font-family: var(--font-family-title);
      font-weight: 800;
      font-size: 22px;
      letter-spacing: -0.5px;
    }
    .brand-icon {
      color: var(--color-accent);
      margin-right: 8px;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 8px;
      transition: var(--transition-smooth);
    }
    .nav-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .nav-item:hover {
      color: var(--text-primary);
      background-color: rgba(255, 255, 255, 0.05);
    }
    .active-link {
      color: var(--color-primary);
      background-color: rgba(99, 102, 241, 0.1);
    }
    .user-btn {
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 4px;
      background-color: var(--bg-surface-elevated);
      border-radius: 20px;
      padding: 4px 12px;
    }
    .username-text {
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .menu-header {
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
      min-width: 180px;
    }
    .fullname {
      margin: 0;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 14px;
    }
    .email {
      margin: 4px 0 0 0;
      color: var(--text-muted);
      font-size: 12px;
    }
    
    @media (max-width: 600px) {
      .nav-item span, .username-text {
        display: none;
      }
      .nav-links {
        gap: 8px;
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
