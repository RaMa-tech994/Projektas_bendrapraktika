import type { Movie } from '../types';

const API = 'https://api.themoviedb.org/3';
const TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
export type Page<T> = { page: number; results: T[]; total_pages: number; total_results: number };
export type Genre = { id: number; name: string };

export class TmdbError extends Error { constructor(message: string, public status?: number) { super(message); this.name = 'TmdbError'; } }
const cache = new Map<string, { until: number; data: unknown }>();

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!TOKEN) throw new TmdbError('TMDB prieigos raktas nesukonfigūruotas. Įrašykite VITE_TMDB_ACCESS_TOKEN į .env.local.');
  const url = `${API}${path}`;
  const cached = cache.get(url);
  if (cached && cached.until > Date.now()) return cached.data as T;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 12000);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) {
      if (response.status === 401) throw new TmdbError('TMDB raktas neteisingas arba neaktyvus.', 401);
      if (response.status === 429) throw new TmdbError('TMDB užklausų limitas pasiektas. Bandykite netrukus.', 429);
      throw new TmdbError(`TMDB užklausa nepavyko (${response.status}).`, response.status);
    }
    const data = await response.json() as T;
    cache.set(url, { until: Date.now() + 5 * 60_000, data });
    return data;
  } catch (error) {
    if (error instanceof TmdbError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new TmdbError('Nepavyko susisiekti su TMDB. Patikrinkite interneto ryšį.');
  } finally { window.clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}

export const tmdb = {
  popular: (page = 1) => request<Page<Movie>>(`/movie/popular?language=lt-LT&page=${page}`),
  topRated: (page = 1) => request<Page<Movie>>(`/movie/top_rated?language=lt-LT&page=${page}`),
  nowPlaying: (page = 1) => request<Page<Movie>>(`/movie/now_playing?language=lt-LT&page=${page}`),
  search: (query: string, page = 1, signal?: AbortSignal) => request<Page<Movie>>(`/search/movie?language=lt-LT&include_adult=false&page=${page}&query=${encodeURIComponent(query)}`, signal),
  discover: (params: { page?: number; genre?: string; year?: string; sort?: string; query?: string }, signal?: AbortSignal) => {
    if (params.query?.trim()) return tmdb.search(params.query.trim(), params.page, signal);
    const q = new URLSearchParams({ language: 'lt-LT', page: String(params.page || 1), sort_by: params.sort || 'popularity.desc' });
    if (params.genre) q.set('with_genres', params.genre);
    if (params.year) q.set('primary_release_year', params.year);
    return request<Page<Movie>>(`/discover/movie?${q}`, signal);
  },
  movie: (id: number, signal?: AbortSignal) => request<Movie>(`/movie/${id}?language=lt-LT`, signal),
  genres: () => request<{ genres: Genre[] }>('/genre/movie/list?language=lt-LT'),
};

export function imageUrl(path: string | null | undefined, size = 'w500'): string | null {
  if (!path || !/^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(path)) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
