import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Video } from '../../../core/models/models';

@Component({
  selector: 'app-video-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-card class="video-card">
      <!-- Thumbnail with Overlay Play Icon -->
      <div class="thumbnail-wrapper" (click)="openVideo()">
        <img mat-card-image [src]="video.thumbnailUrl" [alt]="video.title" class="thumbnail" />
        <div class="play-overlay">
          <mat-icon class="play-icon">play_arrow</mat-icon>
        </div>
      </div>

      <mat-card-content class="card-content">
        <!-- Channel and Date Header -->
        <div class="meta-header">
          <span class="channel-title">{{ video.channelTitle }}</span>
          <span class="publish-date">{{ video.publishedAt | date:'shortDate' }}</span>
        </div>

        <!-- Video Title -->
        <h3 class="video-title" (click)="openVideo()" [title]="video.title">
          {{ video.title }}
        </h3>

        <!-- Description -->
        <p class="video-description">
          {{ video.description || 'Sin descripción' }}
        </p>
      </mat-card-content>

      <mat-card-actions class="card-actions">
        <!-- Toggle Favorite Button -->
        <button mat-icon-button (click)="onFavoriteClick()" [class.favorited]="isFavorite" title="Favorito">
          <mat-icon>{{ isFavorite ? 'favorite' : 'favorite_border' }}</mat-icon>
        </button>

        <button mat-button color="primary" (click)="openVideo()" class="watch-btn">
          <mat-icon>play_circle</mat-icon>
          <span>Ver</span>
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .video-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .video-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 20px rgba(0, 0, 0, 0.4) !important;
    }
    .thumbnail-wrapper {
      position: relative;
      width: 100%;
      padding-top: 56.25%; /* 16:9 Aspect Ratio */
      overflow: hidden;
      cursor: pointer;
    }
    .thumbnail {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .thumbnail-wrapper:hover .thumbnail {
      transform: scale(1.05);
    }
    .play-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .thumbnail-wrapper:hover .play-overlay {
      opacity: 1;
    }
    .play-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: white;
    }
    .card-content {
      padding: 16px;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
    }
    .meta-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .channel-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 60%;
    }
    .video-title {
      margin: 0 0 8px 0;
      font-size: 15px;
      line-height: 1.4;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 42px; /* Fix height for alignment */
    }
    .video-title:hover {
      color: var(--color-primary);
    }
    .video-description {
      margin: 0;
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 38px; /* Fix height for alignment */
    }
    .card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px 16px 16px !important;
      border-top: 1px solid var(--border-color);
      background-color: rgba(255, 255, 255, 0.01);
    }
    .favorited {
      color: var(--color-accent) !important;
    }
    .watch-btn {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  `]
})
export class VideoCardComponent {
  @Input({ required: true }) video!: Video;
  @Input() isFavorite: boolean = false;
  @Output() toggleFavorite = new EventEmitter<Video>();

  onFavoriteClick(): void {
    this.toggleFavorite.emit(this.video);
  }

  openVideo(): void {
    // Open video in new tab
    const url = `https://www.youtube.com/watch?v=${this.video.videoId}`;
    window.open(url, '_blank');
  }
}
