import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { StatsService, StatsSummary } from '../../../core/services/stats.service';
import { Video } from '../../../core/models/models';
import { MatDialog } from '@angular/material/dialog';
import { VideoPlayerDialogComponent } from '../../videos/video-player-dialog/video-player-dialog.component';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule
  ],
  template: `
    <div class="stats-container">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="50" color="primary"></mat-spinner>
          <p>Cargando tus estadísticas...</p>
        </div>
      } @else if (summary()) {
        <!-- Tarjetas de Resumen General -->
        <div class="summary-cards">
          <!-- Tarjeta: Tiempo Reproducido -->
          <mat-card class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon-wrapper time-icon">
                <mat-icon>schedule</mat-icon>
              </div>
              <div class="stat-data">
                <span class="stat-label">Tiempo Total</span>
                <span class="stat-value">{{ formatWatchTime(summary()!.totalWatchTime) }}</span>
              </div>
            </div>
          </mat-card>

          <!-- Tarjeta: Videos Vistos -->
          <mat-card class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon-wrapper play-icon">
                <mat-icon>play_circle</mat-icon>
              </div>
              <div class="stat-data">
                <span class="stat-label">Reproducciones</span>
                <span class="stat-value">{{ summary()!.totalPlays }} veces</span>
              </div>
            </div>
          </mat-card>

          <!-- Tarjeta: Videos Únicos -->
          <mat-card class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon-wrapper video-icon">
                <mat-icon>video_library</mat-icon>
              </div>
              <div class="stat-data">
                <span class="stat-label">Videos Vistos</span>
                <span class="stat-value">{{ summary()!.totalVideosWatched }} distintos</span>
              </div>
            </div>
          </mat-card>

          <!-- Tarjeta: Favoritos Guardados -->
          <mat-card class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon-wrapper fav-icon">
                <mat-icon>favorite</mat-icon>
              </div>
              <div class="stat-data">
                <span class="stat-label">Mis Favoritos</span>
                <span class="stat-value">{{ summary()!.favoritesCount }} videos</span>
              </div>
            </div>
          </mat-card>
        </div>

        <div class="stats-grid">
          <!-- Sección Izquierda: Gráficas y Logros -->
          <div class="main-stats-panel">
            <!-- Categorías más consumidas (Bar Chart en SVG/CSS) -->
            <mat-card class="chart-card">
              <h3 class="panel-title">
                <mat-icon>pie_chart</mat-icon> Categorías más Consumidas
              </h3>
              
              @if (summary()!.categoryBreakdown.length === 0) {
                <div class="no-data-msg">
                  <p>Aún no hay categorías registradas en tu historial. ¡Empieza a reproducir videos!</p>
                </div>
              } @else {
                <div class="category-list">
                  @for (cat of summary()!.categoryBreakdown; track cat.category) {
                    <div class="category-row">
                      <div class="category-info">
                        <span class="category-name">{{ cat.category }}</span>
                        <span class="category-details">
                          {{ formatWatchTime(cat.watchTime) }} ({{ cat.playCount }} repr.)
                        </span>
                      </div>
                      <div class="progress-bar-container">
                        <div 
                          class="progress-bar-fill" 
                          [style.width.%]="getCategoryPercentage(cat.watchTime)"
                          [style.background]="getCategoryColor(cat.category)"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card>


          </div>

          <!-- Sección Derecha: Videos más Vistos y Recomendados -->
          <div class="sidebar-stats-panel">
            <!-- Videos más reproducidos -->
            <mat-card class="list-card">
              <h3 class="panel-title">
                <mat-icon>trending_up</mat-icon> Videos más Reproducidos
              </h3>
              
              @if (summary()!.mostPlayedVideos.length === 0) {
                <div class="no-data-msg">
                  <p>No tienes suficientes datos de reproducción para generar esta lista.</p>
                </div>
              } @else {
                <div class="rank-list">
                  @for (vid of summary()!.mostPlayedVideos; track vid.videoId; let idx = $index) {
                    <div class="rank-item" (click)="playVideo(vid)">
                      <span class="rank-number">#{{ idx + 1 }}</span>
                      <img [src]="vid.thumbnailUrl" [alt]="vid.title" class="rank-thumb" />
                      <div class="rank-details">
                        <span class="rank-title" [title]="vid.title">{{ vid.title }}</span>
                        <span class="rank-count">
                          <strong>{{ vid.playCount }}</strong> reproducciones • {{ formatWatchTime(vid.watchTime) }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card>

            <!-- Videos recomendados en base al historial -->
            <mat-card class="list-card">
              <h3 class="panel-title">
                <mat-icon>auto_awesome</mat-icon> Recomendados para ti
              </h3>
              <p class="panel-desc">Basado en tu categoría favorita: <strong>{{ getFavoriteCategory() }}</strong></p>
              
              <div class="recommended-list">
                @for (rec of recommendedVideos; track rec.videoId) {
                  <div class="rec-item" (click)="playVideo(rec)">
                    <img [src]="rec.thumbnailUrl" [alt]="rec.title" class="rec-thumb" />
                    <div class="rec-details">
                      <span class="rec-title" [title]="rec.title">{{ rec.title }}</span>
                      <span class="rec-channel">{{ rec.channelTitle }}</span>
                    </div>
                  </div>
                }
              </div>
            </mat-card>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .stats-container {
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
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .stat-card {
      padding: 16px 20px !important;
      border: 1px solid var(--border-color);
      border-radius: 16px;
    }
    .stat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-icon-wrapper mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .time-icon {
      background-color: rgba(99, 102, 241, 0.1);
      color: var(--color-primary);
    }
    .play-icon {
      background-color: rgba(16, 185, 129, 0.1);
      color: var(--color-success);
    }
    .video-icon {
      background-color: rgba(245, 158, 11, 0.1);
      color: var(--color-warning);
    }
    .fav-icon {
      background-color: rgba(236, 72, 153, 0.1);
      color: var(--color-accent);
    }
    .stat-data {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      margin-top: 4px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 24px;
    }
    .panel-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
      color: var(--text-primary);
    }
    .panel-title mat-icon {
      color: var(--color-primary);
    }
    .panel-desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: -12px;
      margin-bottom: 16px;
    }
    .no-data-msg {
      text-align: center;
      padding: 40px 0;
      color: var(--text-secondary);
      font-size: 14px;
    }
    .chart-card, .list-card {
      padding: 24px !important;
      margin-bottom: 24px;
    }
    .category-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .category-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .category-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .category-name {
      font-weight: 600;
      color: var(--text-primary);
    }
    .category-details {
      color: var(--text-secondary);
    }
    .progress-bar-container {
      width: 100%;
      height: 8px;
      background-color: var(--bg-surface-elevated);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 1s ease-in-out;
    }

    
    /* Listas de Ránking y Recomendaciones */
    .rank-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .rank-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: 12px;
      cursor: pointer;
      transition: var(--transition-smooth);
      background-color: rgba(255,255,255,0.01);
      border: 1px solid transparent;
    }
    .rank-item:hover {
      background-color: var(--bg-surface-elevated);
      border-color: var(--border-color);
    }
    .rank-number {
      font-size: 18px;
      font-weight: 800;
      font-family: var(--font-family-title);
      color: var(--color-primary);
      width: 28px;
      text-align: center;
    }
    .rank-thumb {
      width: 70px;
      height: 42px;
      border-radius: 6px;
      object-fit: cover;
    }
    .rank-details {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }
    .rank-title {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary);
    }
    .rank-count {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 2px;
    }
    
    .recommended-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .rec-item {
      display: flex;
      gap: 12px;
      padding: 8px;
      border-radius: 12px;
      cursor: pointer;
      transition: var(--transition-smooth);
      background-color: rgba(255,255,255,0.01);
      border: 1px solid transparent;
    }
    .rec-item:hover {
      background-color: var(--bg-surface-elevated);
      border-color: var(--border-color);
    }
    .rec-thumb {
      width: 90px;
      height: 50px;
      border-radius: 8px;
      object-fit: cover;
    }
    .rec-details {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex: 1;
      overflow: hidden;
    }
    .rec-title {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary);
    }
    .rec-channel {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @media (max-width: 960px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StatisticsComponent implements OnInit {
  private statsService = inject(StatsService);
  private dialog = inject(MatDialog);
  
  loading = signal<boolean>(true);
  summary = signal<StatsSummary | null>(null);
  recommendedVideos: Video[] = [];

  // Datos mockeados de recomendación estructurados por categoría para un acabado premium
  private recommendationCatalog: Record<string, Video[]> = {
    'Tecnología': [
      {
        videoId: 'W6NZfCO5SIk',
        title: 'JavaScript Avanzado: Dominando el Asincronismo y Event Loop',
        description: 'Aprende los conceptos avanzados de JavaScript.',
        thumbnailUrl: 'https://img.youtube.com/vi/W6NZfCO5SIk/0.jpg',
        channelTitle: 'TechAcademy España',
        publishedAt: '2026-02-10T00:00:00Z'
      },
      {
        videoId: 'ScMzIvxBSi4',
        title: 'Arquitectura Limpia en Aplicaciones Angular Standalone',
        description: 'Aprende buenas prácticas de estructuración.',
        thumbnailUrl: 'https://img.youtube.com/vi/ScMzIvxBSi4/0.jpg',
        channelTitle: 'CodeCraft',
        publishedAt: '2026-03-05T00:00:00Z'
      },
      {
        videoId: 'k1Z258YtP28',
        title: '¿Qué hay de nuevo en Angular 19? El futuro del Frontend',
        description: 'Un repaso rápido de novedades.',
        thumbnailUrl: 'https://img.youtube.com/vi/k1Z258YtP28/0.jpg',
        channelTitle: 'DevWars',
        publishedAt: '2026-01-20T00:00:00Z'
      }
    ],
    'Música': [
      {
        videoId: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
        description: 'Un clásico eterno de la música pop de los 80.',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
        channelTitle: 'Rick Astley',
        publishedAt: '2009-10-25T00:00:00Z'
      },
      {
        videoId: '9bZkp7q19f0',
        title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
        description: 'El éxito de K-Pop que rompió récords globales.',
        thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/0.jpg',
        channelTitle: 'officialpsy',
        publishedAt: '2012-07-15T00:00:00Z'
      },
      {
        videoId: 'kJQP7kiw5Fk',
        title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
        description: 'La canción en español más reproducida de la historia.',
        thumbnailUrl: 'https://img.youtube.com/vi/kJQP7kiw5Fk/0.jpg',
        channelTitle: 'LuisFonsiVEVO',
        publishedAt: '2017-01-13T00:00:00Z'
      }
    ],
    'Educación': [
      {
        videoId: 'fRh_dkD7XXc',
        title: 'Cómo funciona la Inteligencia Artificial (Redes Neuronales desde Cero)',
        description: 'Explicación sencilla y práctica de IA.',
        thumbnailUrl: 'https://img.youtube.com/vi/fRh_dkD7XXc/0.jpg',
        channelTitle: 'EduTech Latino',
        publishedAt: '2025-11-05T00:00:00Z'
      },
      {
        videoId: 'ScMzIvxBSi4',
        title: 'Principios SOLID explicados con ejemplos del mundo real',
        description: 'Mejora la calidad de tu código.',
        thumbnailUrl: 'https://img.youtube.com/vi/ScMzIvxBSi4/0.jpg',
        channelTitle: 'EduCode',
        publishedAt: '2026-04-12T00:00:00Z'
      }
    ],
    'Entretenimiento': [
      {
        videoId: 'jNQXAC9IVRw',
        title: 'Me at the zoo - El primer video de YouTube',
        description: 'Un hito histórico de la internet moderna.',
        thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/0.jpg',
        channelTitle: 'jawed',
        publishedAt: '2005-04-23T00:00:00Z'
      },
      {
        videoId: 'y6120QOlsfU',
        title: 'The Mountain - Impresionante Timelapse en Calidad 4K',
        description: 'Un viaje astronómico de luces y naturaleza en El Teide.',
        thumbnailUrl: 'https://img.youtube.com/vi/y6120QOlsfU/0.jpg',
        channelTitle: 'TSO Photography',
        publishedAt: '2011-04-14T00:00:00Z'
      }
    ]
  };

  ngOnInit(): void {
    this.fetchSummary();
  }

  fetchSummary(): void {
    this.loading.set(true);
    this.statsService.getSummary().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.summary) {
          this.summary.set(res.summary);
          this.generateRecommendations(this.getFavoriteCategory());
        }
      },
      error: (err) => {
        console.error('Error al recuperar las estadísticas:', err);
        this.loading.set(false);
      }
    });
  }

  getFavoriteCategory(): string {
    const breakdown = this.summary()?.categoryBreakdown;
    if (breakdown && breakdown.length > 0) {
      return breakdown[0].category;
    }
    return 'General';
  }

  generateRecommendations(favoriteCat: string): void {
    const list = this.recommendationCatalog[favoriteCat] || this.recommendationCatalog['Tecnología'];
    this.recommendedVideos = list.slice(0, 3);
  }

  getCategoryPercentage(watchTime: number): number {
    const total = this.summary()?.totalWatchTime || 1;
    return Math.min(100, Math.round((watchTime / total) * 100));
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Tecnología': 'linear-gradient(90deg, #6366f1, #8b5cf6)',
      'Música': 'linear-gradient(90deg, #ec4899, #f43f5e)',
      'Educación': 'linear-gradient(90deg, #10b981, #059669)',
      'Entretenimiento': 'linear-gradient(90deg, #f59e0b, #d97706)',
      'Deportes': 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
      'General': 'linear-gradient(90deg, #94a3b8, #64748b)'
    };
    return colors[category] || colors['General'];
  }

  formatWatchTime(seconds: number): string {
    if (!seconds) return '0 seg';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}h y ${m}m`;
    }
    if (m > 0) {
      return `${m}m y ${s}s`;
    }
    return `${seconds} seg`;
  }

  playVideo(videoItem: any): void {
    // Mapeamos a objeto Video
    const video: Video = {
      videoId: videoItem.videoId,
      title: videoItem.title,
      description: videoItem.description || '',
      thumbnailUrl: videoItem.thumbnailUrl,
      channelTitle: videoItem.channelTitle || '',
      publishedAt: videoItem.publishedAt || new Date().toISOString(),
      category: this.getFavoriteCategory()
    };

    this.statsService.getProgress(video.videoId).subscribe({
      next: (res) => {
        const startSec = res.success ? (res.progress?.lastTimePosition || 0) : 0;
        this.dialog.open(VideoPlayerDialogComponent, {
          data: {
            video,
            startSeconds: startSec,
            category: video.category
          },
          maxWidth: '900px',
          width: '90vw',
          panelClass: 'custom-dialog-container',
          autoFocus: false
        }).afterClosed().subscribe(() => {
          // Recargar estadísticas después de reproducir para actualizar contadores
          this.fetchSummary();
        });
      }
    });
  }
}
