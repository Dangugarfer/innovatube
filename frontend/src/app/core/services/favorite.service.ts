import { API_BASE } from '../constants/api';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FavoriteResponse, Video } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private apiUrl = `${API_BASE}/favorites`;

  constructor(private http: HttpClient) { }

  getFavorites(query?: string): Observable<FavoriteResponse> {
    let params = new HttpParams();
    if (query) {
      params = params.set('q', query);
    }
    return this.http.get<FavoriteResponse>(this.apiUrl, { params });
  }

  addFavorite(video: Video, category?: string): Observable<FavoriteResponse> {
    return this.http.post<FavoriteResponse>(this.apiUrl, {
      videoId: video.videoId,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      channelTitle: video.channelTitle,
      publishedAt: video.publishedAt,
      category: category || 'General'
    });
  }

  removeFavorite(videoId: string): Observable<FavoriteResponse> {
    return this.http.delete<FavoriteResponse>(`${this.apiUrl}/${videoId}`);
  }

  updateCategory(videoId: string, category: string): Observable<FavoriteResponse> {
    return this.http.put<FavoriteResponse>(`${this.apiUrl}/${videoId}/category`, { category });
  }
}
