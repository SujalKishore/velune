// Client-side TMDB helpers — called directly from the browser, not from the server
// This avoids server-side network restrictions that may block api.themoviedb.org

const TMDB_BASE = "https://api.tmdb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// API key is safe to expose client-side for TMDB (read-only public key)
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "";

export const IMG = {
  poster: (path: string | null | undefined, size: "w185" | "w300" | "w500" | "original" = "w500") => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${TMDB_IMAGE_BASE}/${size}${path.startsWith('/') ? path : '/' + path}`;
  },
  backdrop: (path: string | null | undefined, size: "w300" | "w780" | "w1280" | "original" = "w1280") => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${TMDB_IMAGE_BASE}/${size}${path.startsWith('/') ? path : '/' + path}`;
  },
};

export class TMDBError extends Error {
  status: number;
  endpoint: string;

  constructor(status: number, endpoint: string, message: string) {
    super(message);
    this.name = "TMDBError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

async function tmdbFetch(endpoint: string, params: Record<string, string> = {}, signal?: AbortSignal) {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", API_KEY);
  
  let language = "en-US";
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("velune_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.language === "es") language = "es-ES";
        else if (parsed.language === "fr") language = "fr-FR";
      }
    } catch (e) {}
  }
  
  url.searchParams.set("language", language);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const urlString = url.toString();
  const cacheKey = urlString;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const RETRY_STATUSES = [500, 502, 503, 504];
  const MAX_RETRIES = 3;
  const DELAYS = [500, 1000, 2000];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`TMDB REQUEST\nGET ${endpoint}`);
      const res = await fetch(urlString, { signal });
      
      if (!res.ok) {
        if (RETRY_STATUSES.includes(res.status) && attempt < MAX_RETRIES) {
          console.warn(`FAILED ${res.status}\n${res.statusText || "Bad Gateway"}\nRetries left: ${MAX_RETRIES - attempt}`);
          await new Promise(r => setTimeout(r, DELAYS[attempt]));
          continue;
        }
        
        console.warn(`FAILED ${res.status}\n${res.statusText || "Error"}`);
        throw new TMDBError(res.status, endpoint, res.statusText || "TMDB Request Failed");
      }

      console.log(`SUCCESS 200`);
      const data = await res.json();
      
      cache.set(cacheKey, { data, expiry: Date.now() + CACHE_DURATION_MS });
      return data;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw error;
      }
      if (attempt === MAX_RETRIES) {
        throw error;
      }
    }
  }
}

export type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  release_date: string;
  genre_ids: number[];
  popularity: number;
};

export type TVShow = {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  first_air_date: string;
  genre_ids: number[];
};

export type SearchResult = {
  id: number | string;
  media_type: "movie" | "tv" | "person" | "universe";
  title?: string;
  name?: string;
  poster_path?: string;
  profile_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

export type Cast = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

export type Video = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
};

export type Review = {
  id: string;
  author: string;
  content: string;
  created_at: string;
  author_details: {
    rating: number | null;
  };
};

export type TVEpisode = {
  id: number;
  name: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  air_date: string;
  episode_number: number;
  season_number: number;
  runtime: number;
  still_path: string | null;
};

export type TVSeason = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
  episodes?: TVEpisode[];
};

export type DetailedMedia = (Movie | TVShow) & {
  runtime?: number;
  budget?: number;
  revenue?: number;
  adult?: boolean;
  number_of_episodes?: number;
  number_of_seasons?: number;
  status?: string;
  networks?: { id: number; name: string; logo_path: string | null }[];
  episode_run_time?: number[];
  tagline?: string;
  genres?: { id: number; name: string }[];
  spoken_languages?: { english_name: string }[];
  production_companies?: { id: number; name: string }[];
  created_by?: { id: number; name: string }[];
  credits?: { 
    cast: Cast[];
    crew?: { id: number; job?: string; department?: string; name: string; profile_path?: string | null }[];
  };
  videos?: { results: Video[] };
  reviews?: { results: Review[] };
  seasons?: TVSeason[];
  "watch/providers"?: {
    results: {
      US?: {
        link?: string;
        flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
        rent?: { provider_id: number; provider_name: string; logo_path: string }[];
        buy?: { provider_id: number; provider_name: string; logo_path: string }[];
      };
      [countryCode: string]: any;
    };
  };
};

export type PersonCombinedCredits = {
  cast: ((Movie | TVShow) & { media_type: "movie" | "tv"; character: string; popularity: number; vote_average: number; release_date?: string; first_air_date?: string })[];
  crew: ((Movie | TVShow) & { media_type: "movie" | "tv"; job: string; department: string; popularity: number; vote_average: number; release_date?: string; first_air_date?: string })[];
};

export type PersonDetails = {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  also_known_as: string[];
  gender: number;
  external_ids?: {
    imdb_id?: string | null;
  };
  combined_credits?: PersonCombinedCredits;
};

export type PaginatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type Genre = {
  id: number;
  name: string;
};

const FALLBACK_ITEMS: any[] = [{
  id: -1,
  title: "Try again later",
  name: "Try again later",
  poster_path: null,
  vote_average: null,
  overview: "TMDB is currently unavailable.",
  media_type: "movie"
}];

export async function getTrending(): Promise<Movie[]> {
  try {
    const d = await tmdbFetch("/trending/movie/week");
    return d.results ?? FALLBACK_ITEMS;
  } catch (e) {
    return FALLBACK_ITEMS;
  }
}

export async function getNowPlaying(): Promise<Movie[]> {
  try {
    const d = await tmdbFetch("/movie/now_playing");
    return d.results ?? FALLBACK_ITEMS;
  } catch (e) {
    return FALLBACK_ITEMS;
  }
}

export async function getTopRated(): Promise<Movie[]> {
  try {
    const d = await tmdbFetch("/movie/top_rated");
    return d.results ?? FALLBACK_ITEMS;
  } catch (e) {
    return FALLBACK_ITEMS;
  }
}

export async function getPopularTV(): Promise<TVShow[]> {
  try {
    const d = await tmdbFetch("/tv/popular");
    return d.results ?? FALLBACK_ITEMS;
  } catch (e) {
    return FALLBACK_ITEMS;
  }
}

export async function getTopRatedTV(): Promise<TVShow[]> {
  try {
    const d = await tmdbFetch("/tv/top_rated");
    return d.results ?? FALLBACK_ITEMS;
  } catch (e) {
    return FALLBACK_ITEMS;
  }
}

export async function getUpcomingMovies(): Promise<Movie[]> {
  try {
    const d = await tmdbFetch("/movie/upcoming");
    return d.results ?? FALLBACK_ITEMS;
  } catch (e) {
    return FALLBACK_ITEMS;
  }
}

export async function searchMulti(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  try {
    const d = await tmdbFetch("/search/multi", { query, include_adult: "false" });
    const tmdbResults = (d.results ?? []).slice(0, 8);
    
    // Search local universes
    const q = query.toLowerCase();
    const { UNIVERSES } = await import("@/data/universes");
    const universeMatches = UNIVERSES.filter(u => 
      u.name.toLowerCase().includes(q) || u.description.toLowerCase().includes(q)
    ).map(u => {
      // Ensure we just return the path part (e.g. "/RYMX2...jpg") so IMG.poster handles it normally
      const pathOnly = u.poster.includes("/w500") ? u.poster.split("/w500")[1] : 
                       u.poster.includes("original") ? u.poster.split("original")[1] : u.poster;
                       
      return {
        id: u.id,
        media_type: "universe" as const,
        name: u.name,
        poster_path: pathOnly,
        profile_path: null,
        release_date: u.started
      };
    });

    return [...universeMatches, ...tmdbResults].slice(0, 8);
  } catch (e) {
    return FALLBACK_ITEMS;
  }
}

export async function getMediaImages(mediaType: "movie" | "tv", id: string) {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/images`);
    return data;
  } catch (e) {
    return { posters: [] };
  }
}

export async function getDetails(type: "movie" | "tv", id: string): Promise<DetailedMedia | null> {
  try {
    return await tmdbFetch(`/${type}/${id}`, { append_to_response: "credits,videos,reviews,watch/providers" });
  } catch (e) {
    return null;
  }
}

export async function getBaseDetails(type: "movie" | "tv", id: string): Promise<DetailedMedia | null> {
  try {
    return await tmdbFetch(`/${type}/${id}`);
  } catch (e) {
    return null;
  }
}

export async function getPersonDetails(id: string): Promise<PersonDetails | null> {
  try {
    return await tmdbFetch(`/person/${id}`, { append_to_response: "combined_credits,external_ids" });
  } catch (e) {
    return null;
  }
}

export async function getRecommendations(type: "movie" | "tv", id: string | number, signal?: AbortSignal): Promise<(Movie | TVShow)[]> {
  if (!id || (typeof id !== "string" && typeof id !== "number") || (type !== "movie" && type !== "tv")) {
    console.warn(`Invalid recommendation request:\nmediaType=${type}\nid=${id}`);
    return [];
  }
  try {
    const d = await tmdbFetch(`/${type}/${id}/recommendations`, {}, signal);
    return (d.results ?? []).slice(0, 8);
  } catch (error: any) {
    if (error.name === "AbortError") throw error;
    console.warn(`Fallback: Returning empty recommendations for ${type} ${id}`);
    return [];
  }
}

export async function getTVSeasonDetails(tvId: string, seasonNumber: number): Promise<TVSeason | null> {
  try {
    return await tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
  } catch (e) {
    return null;
  }
}

export async function getTVEpisodeDetails(tvId: string, seasonNumber: number, episodeNumber: number): Promise<any | null> {
  try {
    return await tmdbFetch(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
  } catch (e) {
    return null;
  }
}

export async function getTrendingAll(page: number = 1): Promise<PaginatedResponse<(Movie | TVShow) & { media_type: "movie" | "tv" }>> {
  try {
    return await tmdbFetch("/trending/all/week", { page: page.toString() });
  } catch (e) {
    return { page: 1, results: FALLBACK_ITEMS, total_pages: 1, total_results: 1 };
  }
}

export async function getDiscoverMovies(page: number = 1, genreId?: string): Promise<PaginatedResponse<Movie>> {
  try {
    const params: Record<string, string> = { page: page.toString(), sort_by: "popularity.desc" };
    if (genreId) params.with_genres = genreId;
    return await tmdbFetch("/discover/movie", params);
  } catch (e) {
    return { page: 1, results: FALLBACK_ITEMS, total_pages: 1, total_results: 1 };
  }
}

export async function getMoviesByKeyword(keywordId: string): Promise<Movie[]> {
  try {
    const promises = [];
    for(let i=1; i<=3; i++) {
      promises.push(tmdbFetch("/discover/movie", { with_keywords: keywordId, sort_by: "revenue.desc", page: i.toString() }));
    }
    const results = await Promise.all(promises);
    const allMovies = results.flatMap(r => r.results || []);
    return allMovies;
  } catch (e) {
    return FALLBACK_ITEMS;
  }
}

export async function getDiscoverTV(page: number = 1, genreId?: string): Promise<PaginatedResponse<TVShow>> {
  try {
    const params: Record<string, string> = { page: page.toString(), sort_by: "popularity.desc" };
    if (genreId) params.with_genres = genreId;
    return await tmdbFetch("/discover/tv", params);
  } catch (e) {
    return { page: 1, results: FALLBACK_ITEMS, total_pages: 1, total_results: 1 };
  }
}

export async function getMovieGenres(): Promise<Genre[]> {
  try {
    const d = await tmdbFetch("/genre/movie/list");
    return d.genres || [];
  } catch (e) {
    return [];
  }
}

export async function getTVGenres(): Promise<Genre[]> {
  try {
    const d = await tmdbFetch("/genre/tv/list");
    return d.genres || [];
  } catch (e) {
    return [];
  }
}

export async function getOnThisDayMovie(): Promise<Movie | null> {
  const date = new Date();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  try {
    for(let i=0; i<5; i++) {
      const year = Math.floor(Math.random() * (2023 - 1980 + 1)) + 1980;
      const dateStr = `${year}-${month}-${day}`;
      const d = await tmdbFetch("/discover/movie", {
        "primary_release_date.gte": dateStr,
        "primary_release_date.lte": dateStr,
        "sort_by": "popularity.desc"
      });
      if (d.results && d.results.length > 0) {
        return d.results[0];
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

export async function getTop100Movies(): Promise<Movie[]> {
  try {
    const promises = [];
    for(let i=1; i<=5; i++) {
      promises.push(tmdbFetch("/movie/top_rated", { page: i.toString() }));
    }
    const results = await Promise.all(promises);
    const allMovies = results.flatMap(r => r.results || []);
    return allMovies.slice(0, 100);
  } catch (e) {
    return FALLBACK_ITEMS;
  }
}

export async function getCollectionStats(items: { tmdbId: string, mediaType: string }[]) {
  let totalRuntime = 0;
  let oldestDate = new Date();
  let oldestMovie = "N/A";
  let oldestYear = "";
  let totalRating = 0;
  let ratingCount = 0;
  const genreFreq: Record<string, number> = {};

  // Limit to 50 to avoid hitting limits immediately on huge collections
  const maxItems = items.slice(0, 50);

  const results = [];
  for (let i = 0; i < maxItems.length; i += 10) {
    const chunk = maxItems.slice(i, i + 10);
    const chunkResults = await Promise.all(
      chunk.map(item => tmdbFetch(`/${item.mediaType}/${item.tmdbId}`).catch(() => null))
    );
    results.push(...chunkResults);
    if (i + 10 < maxItems.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  for (const res of results) {
    if (!res) continue;
    if (res.runtime) totalRuntime += res.runtime;
    else if (res.episode_run_time && res.episode_run_time.length > 0) totalRuntime += res.episode_run_time[0];

    if (res.vote_average) {
      totalRating += res.vote_average;
      ratingCount++;
    }

    const releaseDate = res.release_date || res.first_air_date;
    if (releaseDate) {
      const d = new Date(releaseDate);
      if (d < oldestDate) {
        oldestDate = d;
        oldestMovie = res.title || res.name || "N/A";
        oldestYear = releaseDate.substring(0, 4);
      }
    }

    if (res.genres) {
      for (const g of res.genres) {
        genreFreq[g.name] = (genreFreq[g.name] || 0) + 1;
      }
    }
  }

  let topGenre = "Mixed";
  let maxFreq = 0;
  for (const [genre, freq] of Object.entries(genreFreq)) {
    if (freq > maxFreq) {
      maxFreq = freq;
      topGenre = genre;
    }
  }

  const hours = Math.floor(totalRuntime / 60);
  const minutes = totalRuntime % 60;
  const runtimeStr = hours > 0 ? `${hours}h ${minutes}m` : (minutes > 0 ? `${minutes}m` : "N/A");
  
  return {
    avgRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "N/A",
    oldestMovie: oldestMovie,
    oldestYear: oldestYear,
    totalRuntime: runtimeStr,
    topGenre: topGenre
  };
}
