import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { VideoCardComponent } from '../../videos/video-card/video-card.component';
import { FavoriteService } from '../../../core/services/favorite.service';
import { Video } from '../../../core/models/models';
import { StatisticsComponent } from '../statistics/statistics.component';
import { HistoryListComponent } from '../history-list/history-list.component';

type ActiveTab = 'favorites' | 'stats' | 'history';

@Component({
  selector: 'app-favorite-list',
  standalone: true,
  imports: [
    CommonModule,
    SearchBarComponent,
    VideoCardComponent,
    StatisticsComponent,
    HistoryListComponent,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="favorites-layout">
      <!-- Panel Principal -->
      <div class="main-panel">
        
        <!-- Vista: Mis Favoritos -->
        @if (activeTab() === 'favorites') {
          <div class="favorite-list-container">
            <div class="list-header">
              <h1>Mis Favoritos</h1>
              <p class="subtitle">Gestiona, busca y organiza tus videos favoritos por categorías</p>
            </div>

            <!-- Category Pills Filter -->
            <div class="category-filters">
              @for (cat of categories; track cat) {
                <button 
                  class="filter-pill" 
                  [class.active]="selectedCategory() === cat"
                  (click)="selectCategory(cat)"
                >
                  <mat-icon class="pill-icon">folder</mat-icon>
                  <span>{{ cat }}</span>
                </button>
              }
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
              @if (filteredVideos().length === 0) {
                <div class="empty-state">
                  <mat-icon class="empty-icon">favorite_border</mat-icon>
                  <h3>No se encontraron favoritos</h3>
                  <p>
                    {{ videos().length === 0 ? 
                      'Ve a la sección de búsqueda y marca algunos videos con el corazón.' : 
                      'No hay videos en esta categoría o que coincidan con la búsqueda.' }}
                  </p>
                </div>
              } @else {
                <!-- Grid displaying favorited videos -->
                <div class="video-grid">
                  @for (video of filteredVideos(); track video.videoId) {
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
        }

        <!-- Vista: Estadísticas -->
        @if (activeTab() === 'stats') {
          <div class="stats-header">
            <h1>Estadísticas de Uso</h1>
            <p class="subtitle">Descubre tus hábitos de reproducción y medallas desbloqueadas</p>
          </div>
          <app-statistics></app-statistics>
        }

        <!-- Vista: Historial de Reproducción -->
        @if (activeTab() === 'history') {
          <div class="history-header">
            <h1>Historial de Reproducción</h1>
            <p class="subtitle">Tus videos reproducidos recientemente y progreso guardado</p>
          </div>
          <app-history-list></app-history-list>
        }
      </div>

      <!-- Menú Lateral Derecho (Sidebar) -->
      <aside class="sidebar-right">
        <div class="sidebar-section">
          <h3 class="sidebar-title">Mi Biblioteca</h3>
          <nav class="sidebar-nav">
            <button 
              class="nav-btn" 
              [class.active]="activeTab() === 'favorites'"
              (click)="setActiveTab('favorites')"
            >
              <mat-icon>favorite</mat-icon>
              <span>Mis Favoritos</span>
              @if (videos().length > 0) {
                <span class="badge-count">
                  {{ videos().length }}
                </span>
              }
            </button>

            <button 
              class="nav-btn" 
              [class.active]="activeTab() === 'stats'"
              (click)="setActiveTab('stats')"
            >
              <mat-icon>bar_chart</mat-icon>
              <span>Estadísticas</span>
            </button>

            <button 
              class="nav-btn" 
              [class.active]="activeTab() === 'history'"
              (click)="setActiveTab('history')"
            >
              <mat-icon>history</mat-icon>
              <span>Historial</span>
            </button>
          </nav>
        </div>

        <div class="sidebar-footer-info">
          <mat-icon class="info-icon">help_outline</mat-icon>
          <p>Tus estadísticas se actualizan automáticamente al reproducir videos dentro de la aplicación.</p>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .favorites-layout {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 32px;
      width: 100%;
    }
    .main-panel {
      min-width: 0;
    }
    .favorite-list-container, .stats-header, .history-header {
      margin-bottom: 24px;
    }
    .main-panel h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .subtitle {
      color: var(--text-secondary);
      margin: 0;
    }
    
    /* Category Filters Row */
    .category-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 20px;
      margin-top: 8px;
    }
    .filter-pill {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .filter-pill:hover {
      background: rgba(255,255,255,0.05);
      color: var(--text-primary);
    }
    .filter-pill.active {
      background: rgba(99, 102, 241, 0.15);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    .pill-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
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
    
    /* Menú Lateral Derecho (Sidebar) */
    .sidebar-right {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      height: fit-content;
      position: sticky;
      top: 94px;
    }
    .sidebar-title {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .nav-btn {
      width: 100%;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      padding: 12px 16px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      transition: var(--transition-smooth);
    }
    .nav-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .nav-btn:hover {
      background-color: var(--bg-surface-elevated);
      color: var(--text-primary);
    }
    .nav-btn.active {
      background-color: rgba(99, 102, 241, 0.1);
      color: var(--color-primary);
    }
    .badge-count {
      margin-left: auto;
      background: var(--color-accent);
      color: white;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
      font-weight: 700;
    }
    .sidebar-footer-info {
      border-top: 1px solid var(--border-color);
      padding-top: 20px;
      display: flex;
      gap: 8px;
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .info-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .sidebar-footer-info p {
      margin: 0;
    }

    @media (max-width: 850px) {
      .favorites-layout {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      .sidebar-right {
        position: static;
        order: -1; /* Sidebar goes on top on mobile screens */
      }
    }
  `]
})
export class FavoriteListComponent implements OnInit {
  private favoriteService = inject(FavoriteService);
  private snackBar = inject(MatSnackBar);

  // Tab activa actual
  activeTab = signal<ActiveTab>('favorites');

  videos = signal<Video[]>([]);
  loading = signal<boolean>(false);
  currentQuery = signal<string>('');

  // Filtros de categoría
  categories = ['Todos', 'General', 'Tecnología', 'Música', 'Educación', 'Entretenimiento', 'Deportes'];
  selectedCategory = signal<string>('Todos');

  // Filtrado reactivo computado
  filteredVideos = computed(() => {
    let list = this.videos();
    
    // Filtrar por categoría
    const cat = this.selectedCategory();
    if (cat !== 'Todos') {
      list = list.filter(v => (v.category || 'General') === cat);
    }

    // Filtrar por título (búsqueda de texto)
    const q = this.currentQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(v => v.title.toLowerCase().includes(q));
    }

    return list;
  });

  ngOnInit(): void {
    this.fetchFavorites();
  }

  setActiveTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'favorites') {
      this.fetchFavorites();
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
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
            publishedAt: f.publishedAt || '',
            category: f.category || 'General'
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
    // Realizamos la búsqueda local mediante la señal computada filteredVideos
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
