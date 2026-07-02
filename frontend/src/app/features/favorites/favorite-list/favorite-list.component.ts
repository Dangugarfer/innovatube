import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { VideoCardComponent } from '../../videos/video-card/video-card.component';
import { FavoriteService } from '../../../core/services/favorite.service';
import { Video, Favorite } from '../../../core/models/models';

@Component({
  selector: 'app-favorite-list',
  standalone: true,
  imports: [
    CommonModule,
    SearchBarComponent,
    VideoCardComponent,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="favorite-list-container">
      <div class="list-header">
        <h1>Mis Favoritos</h1>
        <p class="subtitle">Gestiona y busca entre tus videos guardados</p>
      </div>

      <!-- Search Bar to filter favorites -->
      <app-search-bar 
        [placeholder]="'Filtrar favoritos por título...'" 
        (search)="onSearch($event)"
      ></app-search-bar>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="50" color="primary"></mat-spinner>
          <p>Cargando favoritos...</p>
        </div>
      } @else {
        
        @if (videos().length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">favorite_border</mat-icon>
            <h3>No tienes favoritos guardados</h3>
            <p>Ve a la sección de búsqueda y marca algunos videos con el corazón.</p>
          </div>
        } @else {
          <!-- Grid displaying favorited videos -->
          <div class="video-grid">
            @for (video of videos(); track video.videoId) {
              <app-video-card 
                [video]="video" 
                [isFavorite]="true"
                (toggleFavorite)="onRemoveFavorite($event)"
              ></app-video-card>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .favorite-list-container {
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
  `]
})
export class FavoriteListComponent implements OnInit {
  private favoriteService = inject(FavoriteService);
  private snackBar = inject(MatSnackBar);

  // Convertimos el modelo Favorite al formato Video para reutilizar componentes
  videos = signal<Video[]>([]);
  loading = signal<boolean>(false);
  currentQuery = signal<string>('');

  ngOnInit(): void {
    this.fetchFavorites();
  }

  fetchFavorites(query?: string): void {
    this.loading.set(true);
    this.favoriteService.getFavorites(query).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.favorites) {
          const mappedVideos: Video[] = res.favorites.map(f => ({
            videoId: f.videoId,
            title: f.title,
            description: f.description || '',
            thumbnailUrl: f.thumbnailUrl,
            channelTitle: f.channelTitle || '',
            publishedAt: f.publishedAt || ''
          }));
          this.videos.set(mappedVideos);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open('Error al obtener favoritos.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSearch(query: string): void {
    this.currentQuery.set(query);
    this.fetchFavorites(query);
  }

  onRemoveFavorite(video: Video): void {
    this.favoriteService.removeFavorite(video.videoId).subscribe({
      next: (res) => {
        if (res.success) {
          // Eliminar de la lista local
          this.videos.update(list => list.filter(v => v.videoId !== video.videoId));
          this.snackBar.open('Video eliminado de favoritos.', 'Cerrar', { duration: 2000 });
        }
      },
      error: (err) => {
        this.snackBar.open('Error al quitar de favoritos.', 'Cerrar', { duration: 2000 });
      }
    });
  }
}
