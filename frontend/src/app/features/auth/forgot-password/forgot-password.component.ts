import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header class="auth-header">
          <mat-card-title>Recuperar Contraseña</mat-card-title>
          <mat-card-subtitle>Ingresa tu correo electrónico para enviarte un enlace de recuperación</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (successMessage()) {
            <div class="success-container">
              <mat-icon class="success-icon">check_circle</mat-icon>
              <p class="success-text">{{ successMessage() }}</p>
              
              @if (devLink()) {
                <div class="dev-box">
                  <p class="dev-title">DEVELOPER MODE LINK:</p>
                  <a [href]="devLink()" class="dev-link">{{ devLink() }}</a>
                </div>
              }
              
              <a routerLink="/auth/login" mat-flat-button color="primary" class="back-btn">Volver al login</a>
            </div>
          } @else {
            <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="auth-form">
              <mat-form-field appearance="fill">
                <mat-label>Correo electrónico</mat-label>
                <mat-icon matPrefix>email</mat-icon>
                <input matInput type="email" formControlName="email" required />
                @if (forgotForm.get('email')?.hasError('required')) {
                  <mat-error>El correo es requerido</mat-error>
                }
                @if (forgotForm.get('email')?.hasError('email')) {
                  <mat-error>Ingrese un correo válido</mat-error>
                }
              </mat-form-field>

              @if (errorMessage()) {
                <div class="error-banner">
                  {{ errorMessage() }}
                </div>
              }

              <div class="button-row">
                <a routerLink="/auth/login" mat-button>Cancelar</a>
                <button 
                  mat-flat-button 
                  color="primary" 
                  type="submit" 
                  [disabled]="forgotForm.invalid || loading()"
                >
                  {{ loading() ? 'Enviando...' : 'Enviar Enlace' }}
                </button>
              </div>
            </form>
          }
        </mat-card-content>
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
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .button-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }
    .error-banner {
      background-color: rgba(239, 68, 68, 0.15);
      border: 1px solid var(--color-danger);
      color: #fca5a5;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      text-align: center;
    }
    .success-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px 0;
    }
    .success-icon {
      color: var(--color-success);
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    .success-text {
      font-size: 15px;
      color: var(--text-primary);
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .back-btn {
      width: 100%;
      height: 44px;
    }
    .dev-box {
      background-color: rgba(245, 158, 11, 0.1);
      border: 1px dashed var(--color-warning);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 24px;
      width: 100%;
      box-sizing: border-box;
      word-break: break-all;
    }
    .dev-title {
      font-size: 12px;
      font-weight: bold;
      color: var(--color-warning);
      margin: 0 0 8px 0;
    }
    .dev-link {
      font-size: 13px;
      color: var(--text-primary);
      text-decoration: underline;
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  forgotForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  devLink = signal('');

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message || 'Se ha enviado un enlace de recuperación si la cuenta existe.');
        if (res.developmentLink) {
          this.devLink.set(res.developmentLink);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Ocurrió un error al enviar el enlace.');
      }
    });
  }
}
