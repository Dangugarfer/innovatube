import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'InnovaTube';
  currentTheme = signal<'light' | 'dark' | 'system'>('system');

  ngOnInit(): void {
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
    this.currentTheme.set(savedTheme);
    this.applyTheme(savedTheme);

    // Escuchar cambios del sistema si está en modo automático
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.currentTheme() === 'system') {
        this.applyTheme('system');
      }
    });
  }

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    localStorage.setItem('theme', theme);
    this.currentTheme.set(theme);
    this.applyTheme(theme);
  }

  getThemeIcon(): string {
    const theme = this.currentTheme();
    if (theme === 'light') return 'light_mode';
    if (theme === 'dark') return 'dark_mode';
    return 'settings_brightness';
  }

  private applyTheme(theme: 'light' | 'dark' | 'system'): void {
    const root = document.documentElement;
    root.classList.remove('light-theme', 'dark-theme');
    
    let resolvedTheme: 'light' | 'dark' = 'dark';
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedTheme = prefersDark ? 'dark' : 'light';
    } else {
      resolvedTheme = theme;
    }
    
    if (resolvedTheme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.add('dark-theme');
    }
  }
}
