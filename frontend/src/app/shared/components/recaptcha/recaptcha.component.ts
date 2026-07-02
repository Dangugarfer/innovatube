import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const grecaptcha: any;

@Component({
  selector: 'app-recaptcha',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="recaptcha-wrapper">
      <div #recaptchaContainer class="recaptcha-element"></div>
      @if (loadError) {
        <div class="fallback-recaptcha">
          <p class="error-text">reCAPTCHA failed to load. (Developer fallback enabled)</p>
          <button type="button" (click)="simulateVerification()" class="verify-btn">
            Simulate reCAPTCHA Check
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .recaptcha-wrapper {
      margin: 16px 0;
      display: flex;
      justify-content: center;
      min-height: 78px;
    }
    .fallback-recaptcha {
      text-align: center;
      padding: 12px;
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px dashed var(--color-danger);
      border-radius: 8px;
      width: 100%;
    }
    .error-text {
      font-size: 13px;
      color: var(--color-danger);
      margin-bottom: 8px;
    }
    .verify-btn {
      background-color: var(--color-primary);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-family: var(--font-family-sans);
      font-weight: 500;
      transition: var(--transition-smooth);
    }
    .verify-btn:hover {
      background-color: var(--color-primary-hover);
    }
  `]
})
export class RecaptchaComponent implements OnInit, AfterViewInit, OnDestroy {
  // Clave de sitio de prueba oficial de Google reCAPTCHA v2 (siempre tiene éxito y permite validaciones de prueba) o clave personalizada
  private siteKey = '6LdAlj8tAAAAABdxXf6tQA8RoDFnO-6KyFfR-wKI';
  private widgetId: number | null = null;
  private checkInterval: any;

  @ViewChild('recaptchaContainer') recaptchaContainer!: ElementRef;
  @Output() resolved = new EventEmitter<string>();

  loadError = false;

  ngOnInit(): void {
    // Comprobar si grecaptcha está disponible; de lo contrario, establecer una alternativa por tiempo de espera
    this.checkInterval = setInterval(() => {
      if (typeof grecaptcha !== 'undefined') {
        clearInterval(this.checkInterval);
        this.renderWidget();
      }
    }, 500);

    // Cancelar la carga por tiempo de espera después de 5 segundos
    setTimeout(() => {
      if (typeof grecaptcha === 'undefined') {
        clearInterval(this.checkInterval);
        this.loadError = true;
      }
    }, 5000);
  }

  ngAfterViewInit(): void {
    if (typeof grecaptcha !== 'undefined') {
      clearInterval(this.checkInterval);
      this.renderWidget();
    }
  }

  private renderWidget(): void {
    if (!this.recaptchaContainer || this.widgetId !== null) return;

    try {
      this.widgetId = grecaptcha.render(this.recaptchaContainer.nativeElement, {
        sitekey: this.siteKey,
        callback: (token: string) => {
          this.resolved.emit(token);
        },
        'expired-callback': () => {
          this.resolved.emit('');
        },
        'error-callback': () => {
          this.loadError = true;
        },
        theme: 'dark'
      });
    } catch (error) {
      this.loadError = true;
    }
  }

  simulateVerification(): void {
    // Emite un token simulado para desarrollo cuando se está sin conexión o el script falla al cargar
    this.resolved.emit('MOCK_RECAPTCHA_TOKEN_FOR_DEVELOPMENT');
  }

  reset(): void {
    if (this.widgetId !== null && typeof grecaptcha !== 'undefined') {
      grecaptcha.reset(this.widgetId);
    }
    this.resolved.emit('');
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}
