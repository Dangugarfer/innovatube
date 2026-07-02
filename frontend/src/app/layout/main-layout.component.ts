import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../features/videos/navbar/navbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent
  ],
  template: `
    <div class="layout-wrapper">
      <app-navbar></app-navbar>
      <main class="content-container">
        <router-outlet></router-outlet>
      </main>
      <footer class="footer">
        <div class="footer-content">
          <p>© 2026 InnovaTube. Todos los derechos reservados. Desarrollado por Daniel Ferrer.
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .layout-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .content-container {
      flex: 1 1 auto;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 16px;
      box-sizing: border-box;
    }
    .footer {
      border-top: 1px solid var(--border-color);
      padding: 24px 16px;
      background-color: var(--bg-surface);
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
    }
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class MainLayoutComponent { }
