import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { VideoCardComponent } from '../video-card/video-card.component';
import { VideoService } from '../../../core/services/video.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { Video } from '../../../core/models/models';

@Component({
  selector: 'app-video-list',
  standalone: true,
  imports: [
    CommonModule,
    SearchBarComponent,
    VideoCardComponent,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="video-list-container">
      <div class="list-header">
        <h1>Buscar Videos</h1>
        <p class="subtitle">Explora videos de YouTube y guarda tus favoritos</p>
      </div>

      <!-- Search Bar Component -->
      <app-search-bar 
        [placeholder]="'Busca videos por palabra clave...'" 
        (search)="onSearch($event)"
      ></app-search-bar>

      @if (loading() && videos().length === 0) {
        <div class="loading-container">
          <mat-spinner diameter="50" color="primary"></mat-spinner>
          <p>Buscando videos en YouTube...</p>
        </div>
      } @else {
        
        @if (videos().length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">search_off</mat-icon>
            <h3>No se encontraron videos</h3>
            <p>Intenta buscar algo diferente o revisa tu conexión.</p>
          </div>
        } @else {
          <!-- Video Grid -->
          <div class="video-grid">
            @for (video of videos(); track video.videoId) {
              <app-video-card 
                [video]="video" 
                [isFavorite]="isFavorited(video.videoId)"
                (toggleFavorite)="onToggleFavorite($event)"
              ></app-video-card>
            }
          </div>

          <!-- Pagination Button -->
          @if (nextPageToken()) {
            <div class="pagination-container">
              <button 
                mat-stroked-button 
                color="primary" 
                (click)="loadMore()" 
                [disabled]="loading()"
                class="load-more-btn"
              >
                @if (loading()) {
                  <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
                  <span>Cargando más...</span>
                } @else {
                  <ng-container>
                    <mat-icon>expand_more</mat-icon>
                    <span>Cargar más</span>
                  </ng-container>
                }
              </button>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .video-list-container {
      width: 100%;
    }
    .list-header {
      margin-bottom: 24px;
    }
    .list-header h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .subtitle {
      color: var(--text-secondary);
      margin: 0;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
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
    .pagination-container {
      display: flex;
      justify-content: center;
      margin-top: 32px;
      margin-bottom: 48px;
    }
    .load-more-btn {
      height: 48px;
      padding: 0 32px !important;
      border-radius: 24px !important;
      font-size: 15px !important;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class VideoListComponent implements OnInit {
  private videoService = inject(VideoService);
  private favoriteService = inject(FavoriteService);
  private snackBar = inject(MatSnackBar);

  videos = signal<Video[]>([]);
  nextPageToken = signal<string>('');
  currentQuery = signal<string>('Tecnologia'); // Búsqueda por defecto
  loading = signal<boolean>(false);
  
  // Set para rastrear rápidamente los IDs de los videos marcados como favoritos
  favoriteIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadFavorites();
    this.fetchVideos(this.currentQuery());
  }

  loadFavorites(): void {
    this.favoriteService.getFavorites().subscribe({
      next: (res) => {
        if (res.success && res.favorites) {
          const ids = new Set(res.favorites.map(f => f.videoId));
          this.favoriteIds.set(ids);
        }
      },
      error: (err) => {
        console.error('Error fetching favorites for map init:', err);
      }
    });
  }

  mapQueryToCategory(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('tecnol') || q.includes('code') || q.includes('react') || q.includes('angular') || q.includes('javascript') || q.includes('program') || q.includes('web') || q.includes('dev')) {
      return 'Tecnología';
    }
    if (q.includes('music') || q.includes('song') || q.includes('fonsi') || q.includes('astley') || q.includes('style') || q.includes('sing') || q.includes('band') || q.includes('sonido')) {
      return 'Música';
    }
    if (q.includes('tutorial') || q.includes('learn') || q.includes('educa') || q.includes('how to') || q.includes('clase') || q.includes('curso') || q.includes('aprende')) {
      return 'Educación';
    }
    if (q.includes('fun') || q.includes('entertain') || q.includes('movie') || q.includes('game') || q.includes('play') || q.includes('humor') || q.includes('zoo') || q.includes('mountain') || q.includes('cine') || q.includes('viaje')) {
      return 'Entretenimiento';
    }
    if (q.includes('sport') || q.includes('deport') || q.includes('soccer') || q.includes('futbol') || q.includes('run') || q.includes('gym') || q.includes('ejercicio') || q.includes('entren')) {
      return 'Deportes';
    }
    return 'General';
  }

  fetchVideos(query: string, pageToken?: string): void {
    this.loading.set(true);
    this.videoService.search(query, pageToken).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          // Asignar categoría basada en la búsqueda actual
          const mappedVideos = res.videos.map(v => ({
            ...v,
            category: this.mapQueryToCategory(query)
          }));

          if (pageToken) {
            // Añadir al final (paginación)
            this.videos.update(curr => [...curr, ...mappedVideos]);
          } else {
            // Sobrescribir (nueva búsqueda)
            this.videos.set(mappedVideos);
          }
          this.nextPageToken.set(res.nextPageToken || '');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open('Error al obtener videos. Intente nuevamente.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSearch(query: string): void {
    const q = query.trim() || 'Tecnologia';
    this.currentQuery.set(q);
    this.videos.set([]); // Clear results immediately
    this.nextPageToken.set('');
    this.fetchVideos(q);
  }

  loadMore(): void {
    if (this.nextPageToken()) {
      this.fetchVideos(this.currentQuery(), this.nextPageToken());
    }
  }

  isFavorited(videoId: string): boolean {
    return this.favoriteIds().has(videoId);
  }

  onToggleFavorite(video: Video): void {
    const videoId = video.videoId;
    const isFav = this.isFavorited(videoId);

    if (isFav) {
      // Eliminar de favoritos
      this.favoriteService.removeFavorite(videoId).subscribe({
        next: (res) => {
          if (res.success) {
            this.favoriteIds.update(set => {
              const newSet = new Set(set);
              newSet.delete(videoId);
              return newSet;
            });
            this.snackBar.open('Video eliminado de favoritos.', 'Cerrar', { duration: 2000 });
          }
        },
        error: (err) => {
          this.snackBar.open('Error al quitar de favoritos.', 'Cerrar', { duration: 2000 });
        }
      });
    } else {
      // Añadir a favoritos
      this.favoriteService.addFavorite(video).subscribe({
        next: (res) => {
          if (res.success) {
            this.favoriteIds.update(set => {
              const newSet = new Set(set);
              newSet.add(videoId);
              return newSet;
            });
            this.snackBar.open('Video agregado a favoritos.', 'Cerrar', { duration: 2000 });
          }
        },
        error: (err) => {
          this.snackBar.open('Error al agregar a favoritos.', 'Cerrar', { duration: 2000 });
        }
      });
    }
  }
}
