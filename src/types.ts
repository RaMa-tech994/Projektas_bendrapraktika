export type Movie = {
  id: number; title: string; original_title?: string; overview: string; poster_path: string | null;
  backdrop_path: string | null; release_date?: string; vote_average: number; vote_count?: number;
  genre_ids?: number[]; genres?: { id: number; name: string }[]; runtime?: number;
};
export type MovieStatus = 'planned' | 'watching' | 'watched';
export type UserMovie = { id: string; user_id: string; tmdb_movie_id: number; status: MovieStatus; rating: number | null; review: string | null; is_public: boolean; watched_at: string | null; created_at: string; movie?: Movie };
export type Watchlist = { id: string; user_id: string; title: string; description: string | null; is_public: boolean; created_at: string; updated_at: string; profiles?: { username: string; display_name: string | null; avatar_url: string | null } };
export type WatchlistMovie = { id: string; watchlist_id: string; tmdb_movie_id: number; position: number; movie?: Movie };
