import { Component, inject, signal, ViewChild } from '@angular/core';
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
import { RecaptchaComponent } from '../../../shared/components/recaptcha/recaptcha.component';

@Component({
  selector: 'app-register',
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
    MatSnackBarModule,
    RecaptchaComponent
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header class="auth-header">
          <div class="brand">
            <mat-icon class="brand-icon">play_circle_filled</mat-icon>
            <span class="brand-text">InnovaTube</span>
          </div>
          <mat-card-title>Crear Cuenta</mat-card-title>
          <mat-card-subtitle>Comienza a buscar y guardar tus favoritos</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
            
            <div class="row">
              <mat-form-field appearance="fill">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="firstName" required />
                @if (registerForm.get('firstName')?.hasError('required')) {
                  <mat-error>El nombre es requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Apellido</mat-label>
                <input matInput formControlName="lastName" required />
                @if (registerForm.get('lastName')?.hasError('required')) {
                  <mat-error>El apellido es requerido</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="fill">
              <mat-label>Nombre de usuario</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput formControlName="username" required />
              @if (registerForm.get('username')?.hasError('required')) {
                <mat-error>El nombre de usuario es requerido</mat-error>
              }
              @if (registerForm.get('username')?.hasError('minlength')) {
                <mat-error>Debe tener al menos 3 caracteres</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Correo electrónico</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="email" required />
              @if (registerForm.get('email')?.hasError('required')) {
                <mat-error>El correo es requerido</mat-error>
              }
              @if (registerForm.get('email')?.hasError('email')) {
                <mat-error>Ingrese un correo válido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Contraseña</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" required />
              <button mat-icon-button matSuffix (click)="togglePassword($event)" type="button">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('password')?.hasError('required')) {
                <mat-error>La contraseña es requerida</mat-error>
              }
              @if (registerForm.get('password')?.hasError('minlength')) {
                <mat-error>Debe tener al menos 6 caracteres</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Confirmar contraseña</mat-label>
              <mat-icon matPrefix>lock_outline</mat-icon>
              <input matInput [type]="hideConfirmPassword() ? 'password' : 'text'" formControlName="confirmPassword" required />
              <button mat-icon-button matSuffix (click)="toggleConfirmPassword($event)" type="button">
                <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('confirmPassword')?.hasError('required')) {
                <mat-error>Confirma tu contraseña</mat-error>
              }
              @if (registerForm.hasError('mismatch')) {
                <mat-error>Las contraseñas no coinciden</mat-error>
              }
            </mat-form-field>

            <!-- Contenedor de Google reCAPTCHA -->
            <app-recaptcha #recaptcha (resolved)="onRecaptchaResolved($event)"></app-recaptcha>

            @if (errorMessage()) {
              <div class="error-banner">
                {{ errorMessage() }}
              </div>
            }

            <button 
              mat-flat-button 
              color="primary" 
              type="submit" 
              [disabled]="registerForm.invalid || !recaptchaToken() || loading()"
              class="submit-btn"
            >
              {{ loading() ? 'Creando cuenta...' : 'Registrarse' }}
            </button>
          </form>
        </mat-card-content>

        <mat-card-footer class="auth-footer">
          <p>¿Ya tienes una cuenta? <a routerLink="/auth/login" class="link">Inicia sesión</a></p>
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
      max-width: 480px;
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
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 480px) {
      .row {
        grid-template-columns: 1fr;
        gap: 0;
      }
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  @ViewChild('recaptcha') recaptchaComponent!: RecaptchaComponent;

  registerForm: FormGroup;
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  loading = signal(false);
  recaptchaToken = signal('');
  errorMessage = signal('');

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
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

  onRecaptchaResolved(token: string): void {
    this.recaptchaToken.set(token);
  }

  onSubmit(): void {
    if (this.registerForm.invalid || !this.recaptchaToken()) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const signupData = {
      ...this.registerForm.value,
      recaptchaToken: this.recaptchaToken()
    };

    this.authService.register(signupData).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.snackBar.open('¡Registro exitoso! Bienvenido a InnovaTube.', 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        this.router.navigate(['/videos']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Error al registrar el usuario.');
        this.recaptchaComponent.reset();
      }
    });
  }
}
