import { API_BASE } from '../constants/api';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = `${API_BASE}/videos`;

  constructor(private http: HttpClient) { }

  search(query: string, pageToken?: string): Observable<SearchResponse> {
    let params = new HttpParams().set('q', query);
    if (pageToken) {
      params = params.set('pageToken', pageToken);
    }
    return this.http.get<SearchResponse>(`${this.apiUrl}/search`, { params });
  }
}
