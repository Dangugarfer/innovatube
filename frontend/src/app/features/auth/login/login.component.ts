import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header class="auth-header">
          <div class="brand">
            <mat-icon class="brand-icon">play_circle_filled</mat-icon>
            <span class="brand-text">InnovaTube</span>
          </div>
          <mat-card-title>Iniciar Sesión</mat-card-title>
          <mat-card-subtitle>Ingresa para ver y guardar tus videos favoritos</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
            <mat-form-field appearance="fill">
              <mat-label>Usuario o Correo electrónico</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput formControlName="usernameOrEmail" required />
              @if (loginForm.get('usernameOrEmail')?.hasError('required')) {
                <mat-error>El usuario o correo es requerido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Contraseña</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" required />
              <button mat-icon-button matSuffix (click)="togglePassword($event)" type="button">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (loginForm.get('password')?.hasError('required')) {
                <mat-error>La contraseña es requerida</mat-error>
              }
            </mat-form-field>

            <div class="forgot-pwd-wrapper">
              <a routerLink="/auth/forgot-password" class="link-small">¿Olvidaste tu contraseña?</a>
            </div>

            @if (errorMessage()) {
              <div class="error-banner">
                {{ errorMessage() }}
              </div>
            }

            <button 
              mat-flat-button 
              color="primary" 
              type="submit" 
              [disabled]="loginForm.invalid || loading()"
              class="submit-btn"
            >
              {{ loading() ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
            </button>
          </form>
        </mat-card-content>

        <mat-card-footer class="auth-footer">
          <p>¿No tienes una cuenta? <a routerLink="/auth/register" class="link">Regístrate gratis</a></p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 120px);
      padding: 16px;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 16px;
    }
    .auth-header {
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    .brand-icon {
      color: var(--color-accent);
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-right: 8px;
    }
    .brand-text {
      font-family: var(--font-family-title);
      font-weight: 800;
      font-size: 24px;
      color: var(--text-primary);
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .forgot-pwd-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }
    .link-small {
      font-size: 13px;
      color: var(--text-muted);
      text-decoration: none;
    }
    .link-small:hover {
      color: var(--text-primary);
      text-decoration: underline;
    }
    .submit-btn {
      height: 48px;
      font-size: 16px;
    }
    .error-banner {
      background-color: rgba(239, 68, 68, 0.15);
      border: 1px solid var(--color-danger);
      color: #fca5a5;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 12px;
      text-align: center;
    }
    .auth-footer {
      text-align: center;
      margin-top: 24px;
      padding-bottom: 16px;
      color: var(--text-secondary);
      font-size: 14px;
    }
    .link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
    }
    .link:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loginForm: FormGroup;
  hidePassword = signal(true);
  loading = signal(false);
  errorMessage = signal('');

  constructor() {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  togglePassword(event: MouseEvent): void {
    event.stopPropagation();
    this.hidePassword.update(val => !val);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.snackBar.open('¡Sesión iniciada con éxito!', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        this.router.navigate(['/videos']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Usuario o contraseña incorrectos.');
      }
    });
  }
}
