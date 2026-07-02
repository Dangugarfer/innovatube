export interface User {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
}

export interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  isFavorite?: boolean; // campo dinámico en el frontend
  category?: string;    // categoría organizadora
}

export interface Favorite {
  _id?: string;
  userId: string;
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  channelTitle?: string;
  publishedAt?: string;
  category?: string;    // categoría del favorito
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  developmentLink?: string;
}

export interface SearchResponse {
  success: boolean;
  source?: string;
  message?: string;
  videos: Video[];
  nextPageToken?: string;
  prevPageToken?: string;
}

export interface FavoriteResponse {
  success: boolean;
  message?: string;
  favorite?: Favorite;
  favorites?: Favorite[];
}
