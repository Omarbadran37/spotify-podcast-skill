// Spotify API Response Types

export interface SpotifyImage {
  url: string;
  height?: number | null;
  width?: number | null;
}

export interface SpotifyExternalUrls {
  spotify?: string;
}

export interface SpotifyShow {
  available_markets?: string[];
  copyrights?: unknown[] | null;
  description?: string | null;
  html_description?: string | null;
  explicit: boolean;
  external_urls: SpotifyExternalUrls;
  href: string;
  id?: string | null;
  images: SpotifyImage[];
  is_externally_hosted?: boolean | null;
  languages?: (string | null)[];
  media_type?: string | null;
  name?: string | null;
  publisher?: string | null;
  type: string;
  uri?: string | null;
  total_episodes?: number | null;
}

export interface SpotifyResumePoint {
  fully_played: boolean;
  resume_position_ms?: number | null;
}

export interface SpotifyEpisode {
  audio_preview_url?: string | null;
  description?: string | null;
  html_description?: string | null;
  duration_ms?: number | null;
  explicit: boolean;
  external_urls: SpotifyExternalUrls;
  href: string;
  id?: string | null;
  images: SpotifyImage[];
  is_externally_hosted?: boolean | null;
  is_playable?: boolean;
  language?: string | null;
  languages?: (string | null)[];
  name?: string | null;
  release_date?: string;
  release_date_precision?: string;
  resume_point: SpotifyResumePoint;
  type: string;
  uri?: string | null;
  show: SpotifyShow;
}

export interface SavedEpisodeObject {
  added_at: string;
  episode: SpotifyEpisode;
}

export interface PaginatedResponse<T> {
  href: string;
  limit: number;
  next?: string | null;
  offset: number;
  previous?: string | null;
  total: number;
  items: T[];
}

export interface EpisodeSearchResult {
  total: number;
  count: number;
  offset: number;
  episodes: EpisodeInfo[];
  has_more: boolean;
  next_offset?: number;
}

export interface EpisodeInfo {
  id: string;
  name: string;
  show: string;
  release_date: string;
  duration_ms: number;
  added_at: string;
  is_playable: boolean;
}

export interface ShowInfo {
  id: string;
  name: string;
  publisher: string;
  total_episodes: number;
  description: string;
}

// Search result types
export interface SimplifiedTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration_ms: number;
  explicit: boolean;
  uri: string;
}

export interface SimplifiedArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  uri: string;
}

export interface SimplifiedAlbum {
  id: string;
  name: string;
  artist: string;
  release_date: string;
  total_tracks: number;
  uri: string;
}

export interface SimplifiedPlaylist {
  id: string;
  name: string;
  owner: string;
  tracks: number;
  public: boolean;
  uri: string;
}

export interface SimplifiedShow {
  id: string;
  name: string;
  publisher: string;
  total_episodes: number;
  explicit: boolean;
  uri: string;
}

export interface SimplifiedEpisode {
  id: string;
  name: string;
  show: string;
  release_date: string;
  duration_ms: number;
  explicit: boolean;
  uri: string;
}

export interface SimplifiedAudiobook {
  id: string;
  name: string;
  author: string;
  total_chapters: number;
  explicit: boolean;
  uri: string;
}

export interface SearchResults {
  tracks?: {
    total: number;
    count: number;
    offset: number;
    items: SimplifiedTrack[];
    has_more: boolean;
  };
  artists?: {
    total: number;
    count: number;
    offset: number;
    items: SimplifiedArtist[];
    has_more: boolean;
  };
  albums?: {
    total: number;
    count: number;
    offset: number;
    items: SimplifiedAlbum[];
    has_more: boolean;
  };
  playlists?: {
    total: number;
    count: number;
    offset: number;
    items: SimplifiedPlaylist[];
    has_more: boolean;
  };
  shows?: {
    total: number;
    count: number;
    offset: number;
    items: SimplifiedShow[];
    has_more: boolean;
  };
  episodes?: {
    total: number;
    count: number;
    offset: number;
    items: SimplifiedEpisode[];
    has_more: boolean;
  };
  audiobooks?: {
    total: number;
    count: number;
    offset: number;
    items: SimplifiedAudiobook[];
    has_more: boolean;
  };
}
