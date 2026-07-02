import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Video } from '../models/models';

export interface PlaybackHistoryItem {
  _id?: string;
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  channelTitle?: string;
  publishedAt?: string;
  playCount: number;
  lastTimePosition: number;
  watchTime: number;
  category: string;
  lastWatched: string;
}

export interface CategoryStat {
  category: string;
  watchTime: number;
  playCount: number;
  videoCount: number;
}

export interface StatsSummary {
  totalVideosWatched: number;
  totalPlays: number;
  totalWatchTime: number;
  favoritesCount: number;
  mostPlayedVideos: Array<{
    videoId: string;
    title: string;
    thumbnailUrl: string;
    playCount: number;
    watchTime: number;
  }>;
  categoryBreakdown: CategoryStat[];
  recentActivity: Array<{
    videoId: string;
    title: string;
    thumbnailUrl: string;
    lastWatched: string;
    lastTimePosition: number;
  }>;
}

export interface StatsSummaryResponse {
  success: boolean;
  summary: StatsSummary;
}

export interface PlaybackHistoryResponse {
  success: boolean;
  count: number;
  history: PlaybackHistoryItem[];
}

export interface ProgressResponse {
  success: boolean;
  progress: {
    lastTimePosition: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/stats';

  // Registrar reproducción de un video
  recordPlay(payload: {
    video: Video;
    lastTimePosition: number;
    watchTimeIncrement: number;
    category?: string;
    isNewSession?: boolean;
  }): Observable<{ success: boolean; history: PlaybackHistoryItem }> {
    const body = {
      videoId: payload.video.videoId,
      title: payload.video.title,
      description: payload.video.description,
      thumbnailUrl: payload.video.thumbnailUrl,
      channelTitle: payload.video.channelTitle,
      publishedAt: payload.video.publishedAt,
      lastTimePosition: payload.lastTimePosition,
      watchTimeIncrement: payload.watchTimeIncrement,
      category: payload.category,
      isNewSession: payload.isNewSession
    };
    return this.http.post<{ success: boolean; history: PlaybackHistoryItem }>(`${this.apiUrl}/history`, body);
  }

  // Obtener historial del usuario
  getHistory(limit?: number): Observable<PlaybackHistoryResponse> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get<PlaybackHistoryResponse>(`${this.apiUrl}/history`, { params });
  }

  // Obtener posición guardada de un video
  getProgress(videoId: string): Observable<ProgressResponse> {
    return this.http.get<ProgressResponse>(`${this.apiUrl}/progress/${videoId}`);
  }

  // Obtener resumen de estadísticas
  getSummary(): Observable<StatsSummaryResponse> {
    return this.http.get<StatsSummaryResponse>(`${this.apiUrl}/summary`);
  }
}
