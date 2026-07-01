import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
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
          <mat-card-title>Restablecer Contraseña</mat-card-title>
          <mat-card-subtitle>Ingresa tu nueva contraseña para tu cuenta</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (passwordResetSuccess()) {
            <div class="success-container">
              <mat-icon class="success-icon">check_circle</mat-icon>
              <p class="success-text">Tu contraseña ha sido restablecida exitosamente.</p>
              <a routerLink="/auth/login" mat-flat-button color="primary" class="back-btn">Iniciar Sesión</a>
            </div>
          } @else {
            <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="auth-form">
              
              <mat-form-field appearance="fill">
                <mat-label>Nueva Contraseña</mat-label>
                <mat-icon matPrefix>lock</mat-icon>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" required />
                <button mat-icon-button matSuffix (click)="togglePassword($event)" type="button">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (resetForm.get('password')?.hasError('required')) {
                  <mat-error>La contraseña es requerida</mat-error>
                }
                @if (resetForm.get('password')?.hasError('minlength')) {
                  <mat-error>Debe tener al menos 6 caracteres</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Confirmar nueva contraseña</mat-label>
                <mat-icon matPrefix>lock_outline</mat-icon>
                <input matInput [type]="hideConfirmPassword() ? 'password' : 'text'" formControlName="confirmPassword" required />
                <button mat-icon-button matSuffix (click)="toggleConfirmPassword($event)" type="button">
                  <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (resetForm.get('confirmPassword')?.hasError('required')) {
                  <mat-error>Confirma tu contraseña</mat-error>
                }
                @if (resetForm.hasError('mismatch')) {
                  <mat-error>Las contraseñas no coinciden</mat-error>
                }
              </mat-form-field>

              @if (errorMessage()) {
                <div class="error-banner">
                  {{ errorMessage() }}
                </div>
              }

              <button 
                mat-flat-button 
                color="primary" 
                type="submit" 
                [disabled]="resetForm.invalid || loading()"
                class="submit-btn"
              >
                {{ loading() ? 'Restableciendo...' : 'Restablecer Contraseña' }}
              </button>
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
      gap: 8px;
    }
    .submit-btn {
      height: 48px;
      margin-top: 16px;
      font-size: 16px;
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
    }
    .back-btn {
      width: 100%;
      height: 44px;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  resetForm: FormGroup;
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  loading = signal(false);
  errorMessage = signal('');
  passwordResetSuccess = signal(false);

  private token = '';
  private email = '';

  constructor() {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Parse query parameters from route
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';

      if (!this.token || !this.email) {
        this.errorMessage.set('Faltan parámetros válidos de restablecimiento. Compruebe el enlace recibido.');
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  togglePassword(event: MouseEvent): void {
    event.stopPropagation();
    this.hidePassword.update(val => !val);
  }

  toggleConfirmPassword(event: MouseEvent): void {
    event.stopPropagation();
    this.hideConfirmPassword.update(val => !val);
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token || !this.email) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const resetData = {
      email: this.email,
      token: this.token,
      password: this.resetForm.value.password
    };

    this.authService.resetPassword(resetData).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.passwordResetSuccess.set(true);
        this.snackBar.open('¡Contraseña actualizada con éxito!', 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Error al restablecer la contraseña. El token puede haber expirado.');
      }
    });
  }
}
