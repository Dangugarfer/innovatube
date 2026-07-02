import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { StatsService, PlaybackHistoryItem } from '../../../core/services/stats.service';
import { Video } from '../../../core/models/models';
import { MatDialog } from '@angular/material/dialog';
import { VideoPlayerDialogComponent } from '../../videos/video-player-dialog/video-player-dialog.component';

@Component({
  selector: 'app-history-list',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule
  ],
  template: `
    <div class="history-container">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="50" color="primary"></mat-spinner>
          <p>Cargando tu historial de reproducción...</p>
        </div>
      } @else {
        @if (historyItems().length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">history</mat-icon>
            <h3>No tienes historial de reproducción</h3>
            <p>Empieza a explorar y reproducir videos desde la sección de búsqueda.</p>
          </div>
        } @else {
          <div class="history-list">
            @for (item of historyItems(); track item.videoId) {
              <mat-card class="history-card" (click)="playVideo(item)">
                <div class="card-content">
                  <!-- Thumbnail wrapper -->
                  <div class="thumb-wrapper">
                    <img [src]="item.thumbnailUrl" [alt]="item.title" class="thumb" />
                    <div class="play-overlay">
                      <mat-icon>play_arrow</mat-icon>
                    </div>
                  </div>

                  <!-- Details -->
                  <div class="details">
                    <h3 class="title" [title]="item.title">{{ item.title }}</h3>
                    <span class="channel">{{ item.channelTitle }}</span>
                    <p class="description">{{ item.description || 'Sin descripción' }}</p>

                    <!-- Meta indicators -->
                    <div class="meta-row">
                      <span class="category-badge">{{ item.category }}</span>
                      
                      @if (item.lastTimePosition > 0) {
                        <span class="progress-indicator">
                          <mat-icon>bookmark</mat-icon>
                          Reanudar en {{ formatTime(item.lastTimePosition) }}
                        </span>
                      }
                      
                      <span class="time-spent">
                        <mat-icon>timer</mat-icon>
                        Visto por {{ formatWatchTime(item.watchTime) }} ({{ item.playCount }} repr.)
                      </span>
                    </div>

                    <span class="last-watched">
                      Visto por última vez: {{ item.lastWatched | date:'medium' }}
                    </span>
                  </div>
                </div>
              </mat-card>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .history-container {
      width: 100%;
      animation: fadeIn 0.4s ease;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 0;
      color: var(--text-secondary);
      gap: 16px;
    }
    .empty-state {
      text-align: center;
      padding: 80px 24px;
      background: var(--bg-surface);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      margin-top: 16px;
    }
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    .empty-state h3 {
      font-size: 20px;
      margin-bottom: 8px;
    }
    .empty-state p {
      color: var(--text-secondary);
      margin: 0;
    }
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }
    .history-card {
      cursor: pointer;
      transition: var(--transition-smooth);
      border: 1px solid var(--border-color);
    }
    .history-card:hover {
      transform: translateX(4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4) !important;
      border-color: rgba(255,255,255,0.15);
    }
    .card-content {
      display: flex;
      gap: 16px;
      padding: 16px;
    }
    .thumb-wrapper {
      position: relative;
      width: 180px;
      height: 101px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background-color: #000;
    }
    .thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .thumb-wrapper:hover .thumb {
      transform: scale(1.05);
    }
    .play-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .thumb-wrapper:hover .play-overlay {
      opacity: 1;
    }
    .play-overlay mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
    }
    .details {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }
    .title {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      font-family: var(--font-family-title);
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .channel {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
      margin-top: 4px;
    }
    .description {
      font-size: 13px;
      color: var(--text-muted);
      margin: 8px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
      height: 36px;
    }
    .meta-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 11px;
      margin-top: auto;
    }
    .category-badge {
      background: rgba(99, 102, 241, 0.1);
      color: var(--color-primary);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .progress-indicator {
      display: flex;
      align-items: center;
      gap: 3px;
      color: var(--color-accent);
      font-weight: 600;
    }
    .progress-indicator mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .time-spent {
      display: flex;
      align-items: center;
      gap: 3px;
      color: var(--text-secondary);
    }
    .time-spent mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .last-watched {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 8px;
      text-align: right;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 600px) {
      .card-content {
        flex-direction: column;
      }
      .thumb-wrapper {
        width: 100%;
        height: auto;
        padding-top: 56.25%; /* 16:9 Aspect Ratio */
      }
      .thumb {
        position: absolute;
        top: 0;
        left: 0;
      }
      .last-watched {
        text-align: left;
        margin-top: 12px;
      }
    }
  `]
})
export class HistoryListComponent implements OnInit {
  private statsService = inject(StatsService);
  private dialog = inject(MatDialog);

  loading = signal<boolean>(true);
  historyItems = signal<PlaybackHistoryItem[]>([]);

  ngOnInit(): void {
    this.fetchHistory();
  }

  fetchHistory(): void {
    this.loading.set(true);
    this.statsService.getHistory().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.history) {
          this.historyItems.set(res.history);
        }
      },
      error: (err) => {
        console.error('Error al recuperar el historial:', err);
        this.loading.set(false);
      }
    });
  }

  playVideo(item: PlaybackHistoryItem): void {
    // Convertimos PlaybackHistoryItem a Video
    const video: Video = {
      videoId: item.videoId,
      title: item.title,
      description: item.description || '',
      thumbnailUrl: item.thumbnailUrl,
      channelTitle: item.channelTitle || '',
      publishedAt: item.publishedAt || new Date().toISOString(),
      category: item.category
    };

    // Reanudamos en la posición guardada
    this.dialog.open(VideoPlayerDialogComponent, {
      data: {
        video,
        startSeconds: item.lastTimePosition,
        category: item.category
      },
      maxWidth: '900px',
      width: '90vw',
      panelClass: 'custom-dialog-container',
      autoFocus: false
    }).afterClosed().subscribe(() => {
      // Recargar la lista después de reproducir para actualizar posiciones
      this.fetchHistory();
    });
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

  formatWatchTime(seconds: number): string {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}h y ${m}m`;
    }
    if (m > 0) {
      return `${m}m y ${s}s`;
    }
    return `${seconds}s`;
  }
}
