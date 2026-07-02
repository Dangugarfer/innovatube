import { Component, Inject, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StatsService } from '../../../core/services/stats.service';
import { Video } from '../../../core/models/models';

export interface VideoPlayerDialogData {
  video: Video;
  startSeconds?: number;
  category?: string;
}

@Component({
  selector: 'app-video-player-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="video-dialog-container">
      <!-- Cabecera del Dialog -->
      <div class="dialog-header">
        <h2 class="video-title" [title]="data.video.title">{{ data.video.title }}</h2>
        <button mat-icon-button (click)="close()" class="close-btn" title="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Contenedor del Reproductor -->
      <div class="video-player-wrapper">
        <div id="youtube-player-iframe"></div>

        <!-- Banner premium de "Continuar viendo" -->
        @if (showResumeBanner()) {
          <div class="resume-banner-overlay">
            <div class="resume-banner-content">
              <mat-icon class="resume-icon">info</mat-icon>
              <span>Reanudado desde <strong>{{ formatTime(data.startSeconds || 0) }}</strong></span>
              <button mat-flat-button color="accent" class="restart-btn" (click)="restartVideo()">
                <mat-icon>replay</mat-icon>
                <span>Volver al inicio</span>
              </button>
              <button mat-icon-button (click)="showResumeBanner.set(false)" class="dismiss-btn" title="Descartar">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Pie del Dialog con datos de la sesión -->
      <div class="dialog-footer">
        <div class="session-info">
          <mat-icon>alarm</mat-icon>
          <span>Sesión actual: <strong>{{ formatTime(sessionSeconds()) }}</strong></span>
        </div>
        <div class="channel-info">
          <mat-icon>subscriptions</mat-icon>
          <span>{{ data.video.channelTitle }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .video-dialog-container {
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      background-color: rgba(255, 255, 255, 0.01);
      flex-shrink: 0;
    }
    .video-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      font-family: var(--font-family-title);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 85%;
    }
    .close-btn {
      color: var(--text-secondary);
      transition: var(--transition-smooth);
    }
    .close-btn:hover {
      color: var(--color-accent);
      background-color: rgba(255, 255, 255, 0.05);
    }
    .video-player-wrapper {
      position: relative;
      width: 100%;
      flex: 1 1 auto;
      background-color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    #youtube-player-iframe,
    .video-player-wrapper iframe {
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      aspect-ratio: 16 / 9 !important;
      border: none !important;
    }
    .resume-banner-overlay {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      z-index: 10;
      animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .resume-banner-content {
      background: rgba(19, 27, 46, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid var(--color-primary);
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
    .resume-icon {
      color: var(--color-primary);
    }
    .restart-btn {
      margin-left: auto !important;
      border-radius: 20px !important;
      height: 36px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .dismiss-btn {
      color: var(--text-muted);
    }
    .dismiss-btn:hover {
      color: var(--text-primary);
    }
    .dialog-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background-color: rgba(255, 255, 255, 0.01);
      border-top: 1px solid var(--border-color);
      font-size: 13px;
      color: var(--text-secondary);
      flex-shrink: 0;
    }
    .session-info, .channel-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .session-info mat-icon, .channel-info mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--text-muted);
    }
    
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @media (max-width: 600px) {
      .resume-banner-content {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
      }
      .restart-btn {
        margin-left: 0 !important;
      }
    }
  `]
})
export class VideoPlayerDialogComponent implements OnInit, OnDestroy {
  private statsService = inject(StatsService);
  private dialogRef = inject(MatDialogRef<VideoPlayerDialogComponent>);
  
  player: any;
  sessionSeconds = signal<number>(0);
  showResumeBanner = signal<boolean>(false);
  
  private timerId: any;
  private syncIntervalId: any;
  private lastSavedTime: number = 0;

  constructor(@Inject(MAT_DIALOG_DATA) public data: VideoPlayerDialogData) {}

  ngOnInit(): void {
    if (this.data.startSeconds && this.data.startSeconds > 5) {
      this.showResumeBanner.set(true);
      // Ocultar banner automáticamente tras 8 segundos
      setTimeout(() => {
        this.showResumeBanner.set(false);
      }, 8000);
    }

    this.initYoutubePlayer();

    // Contador de tiempo de la sesión actual
    this.timerId = setInterval(() => {
      this.sessionSeconds.update(s => s + 1);
    }, 1000);

    // Guardado periódico cada 5 segundos
    this.syncIntervalId = setInterval(() => {
      this.saveProgress();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
    if (this.syncIntervalId) clearInterval(this.syncIntervalId);
    this.saveProgress(true); // Guardado final
  }

  initYoutubePlayer(): void {
    // Si la API de YouTube no se ha cargado en la ventana
    if (!(window as any)['YT']) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      // Callback global de YouTube
      (window as any)['onYouTubeIframeAPIReady'] = () => {
        this.createPlayer();
      };
    } else {
      // Si la API ya existe, crear directamente
      setTimeout(() => {
        this.createPlayer();
      }, 100);
    }
  }

  createPlayer(): void {
    const startSec = this.data.startSeconds || 0;
    try {
      this.player = new (window as any)['YT'].Player('youtube-player-iframe', {
        videoId: this.data.video.videoId,
        playerVars: {
          autoplay: 1,
          start: startSec,
          origin: window.location.origin,
          rel: 0,
          modestbranding: 1
        },
        events: {
          'onReady': (event: any) => {
            // Indicar al backend que es una nueva sesión de reproducción al iniciar
            this.sendPlaybackIncrement(0, startSec, true);
          }
        }
      });
    } catch (err) {
      console.error('Error al instanciar el reproductor de YouTube API:', err);
    }
  }

  restartVideo(): void {
    if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(0);
      this.showResumeBanner.set(false);
      this.saveProgress(false);
    }
  }

  saveProgress(isFinal: boolean = false): void {
    if (!this.player || typeof this.player.getCurrentTime !== 'function' || typeof this.player.getPlayerState !== 'function') {
      return;
    }

    try {
      const currentTime = Math.floor(this.player.getCurrentTime());
      const state = this.player.getPlayerState();

      // El estado 1 representa reproducción (PLAYING)
      const isPlaying = state === 1;

      // Calcular el incremento de watchTime desde la última sincronización
      let watchIncrement = 0;
      if (isPlaying) {
        // Si es reproducción normal, el incremento es la diferencia real o el intervalo de 5s
        const diff = currentTime - this.lastSavedTime;
        watchIncrement = (diff > 0 && diff <= 10) ? diff : 5;
      }
      
      this.lastSavedTime = currentTime;

      if (watchIncrement > 0 || isFinal) {
        this.sendPlaybackIncrement(watchIncrement, currentTime, false);
      }
    } catch (e) {
      console.error('Error al calcular el progreso de reproducción:', e);
    }
  }

  sendPlaybackIncrement(watchIncrement: number, currentPosition: number, isNewSession: boolean = false): void {
    this.statsService.recordPlay({
      video: this.data.video,
      lastTimePosition: currentPosition,
      watchTimeIncrement: watchIncrement,
      category: this.data.category || 'General',
      isNewSession
    }).subscribe({
      next: (res) => {
        // Éxito al sincronizar
      },
      error: (err) => {
        console.error('Error al enviar estadísticas de reproducción:', err);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  formatTime(seconds: number): string {
    if (!seconds) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
