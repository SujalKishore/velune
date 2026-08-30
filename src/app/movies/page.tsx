"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDiscoverMovies, getMovieGenres, getNowPlaying, getTopRated, getUpcomingMovies, IMG, type Movie, type Genre } from "@/lib/tmdb";
import Navbar from "@/components/Navbar";
import MediaCarousel from "@/components/MediaCarousel";
import styles from "./page.module.css";
import { Star, Loader2, Play } from "lucide-react";
import { getWatchedTmdbIds } from "@/app/actions/history";
import { useSettings } from "@/contexts/SettingsContext";

export default function MoviesPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const [items, setItems] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>("");
  const [filterIds, setFilterIds] = useState<Set<string>>(new Set());
  
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Carousel Data
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);

  // Fetch static carousels and genres once
  useEffect(() => {
    Promise.all([
      getMovieGenres(),
      getNowPlaying(),
      getTopRated(),
      getUpcomingMovies(),
      settings.hideWatched ? getWatchedTmdbIds() : Promise.resolve({ success: false, ids: [] as string[] })
    ])
      .then(([g, np, tr, up, watchedRes]) => {
        let fIds = new Set<string>();
        if (watchedRes && watchedRes.success && watchedRes.ids) {
          fIds = new Set(watchedRes.ids);
          setFilterIds(fIds);
        }
        
        setGenres(g);
        
        const filterFunc = (m: Movie) => !fIds.has(m.id.toString());
        setNowPlaying(np.filter(filterFunc));
        setTopRated(tr.filter(filterFunc));
        setUpcoming(up.filter(filterFunc));
      })
      .catch(console.error);
  }, [settings.hideWatched]);

  const fetchMovies = async (pageNum: number, genreId: string) => {
    try {
      const res = await getDiscoverMovies(pageNum, genreId || undefined);
      let newItems = res.results;
      if (settings.hideWatched && filterIds.size > 0) {
        newItems = newItems.filter((m: Movie) => !filterIds.has(m.id.toString()));
      }
      
      if (pageNum === 1) {
        setItems(newItems);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }
      setTotalPages(res.total_pages);
    } catch (error) {
      console.error(error);
    }
  };

  // Initial fetch and fetch on genre change
  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchMovies(1, activeGenre).finally(() => setLoading(false));
  }, [activeGenre]);

  const handleLoadMore = async () => {
    if (page >= totalPages || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchMovies(nextPage, activeGenre);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const heroMovie = nowPlaying[0];

  return (
    <main className={styles.pageWrapper}>
      <Navbar />
      
      <div className={styles.container}>
        
        {heroMovie && (
          <div 
            className={styles.heroSection}
            onClick={() => router.push(`/movie/${heroMovie.id}`)}
          >
            {heroMovie.backdrop_path && (
              <img 
                src={IMG.backdrop(heroMovie.backdrop_path, "original") ?? undefined} 
                alt={heroMovie.title} 
                className={styles.heroBackdrop} 
              />
            )}
            <div className={styles.heroGradient} />
            <div className={styles.heroContent}>
              <div className={styles.trendingBadge}>
                Now Playing
              </div>
              <h1 className={styles.heroTitle}>
                {heroMovie.title}
              </h1>
              <div className={styles.heroMeta}>
                <span className={styles.heroRating}>
                  <Star fill="currentColor" size={16} />
                  {heroMovie.vote_average?.toFixed(1)}
                </span>
                <span>
                  {heroMovie.release_date?.slice(0, 4)}
                </span>
                <span style={{ textTransform: 'uppercase' }}>
                  Movie
                </span>
              </div>
              <p className={styles.heroOverview}>{heroMovie.overview}</p>
            </div>
          </div>
        )}

        <MediaCarousel title="Now Playing in Theaters" items={nowPlaying.slice(1)} mediaType="movie" />
        <MediaCarousel title="Top Rated Movies" items={topRated} mediaType="movie" />
        <MediaCarousel title="Upcoming Releases" items={upcoming} mediaType="movie" />

        <h2 className={styles.exploreHeader}>Explore By Genre</h2>
        
        <div className={styles.genreFilterWrap}>
            <div className={styles.genreTrack}>
              <button 
                className={`${styles.genrePill} ${activeGenre === "" ? styles.genrePillActive : ""}`}
                onClick={() => setActiveGenre("")}
              >
                All Genres
              </button>
              {genres.map(g => (
                <button 
                  key={g.id}
                  className={`${styles.genrePill} ${activeGenre === g.id.toString() ? styles.genrePillActive : ""}`}
                  onClick={() => setActiveGenre(g.id.toString())}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

        {loading && items.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {items.map((item, idx) => (
                <div 
                  key={`${item.id}-${idx}`} 
                  className={styles.mediaCard}
                  onClick={() => router.push(`/movie/${item.id}`)}
                >
                  <div className={styles.posterWrap}>
                    {item.poster_path ? (
                      <img src={IMG.poster(item.poster_path, "w500") ?? undefined} alt={item.title} className={styles.poster} />
                    ) : (
                      <div className={styles.posterFallback}>No Image</div>
                    )}
                    {item.vote_average ? (
                      <div className={styles.ratingBadge}>
                        <Star size={12} fill="currentColor" /> {item.vote_average.toFixed(1)}
                      </div>
                    ) : null}
                  </div>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardYear}>{item.release_date?.slice(0, 4) || "Unknown"}</p>
                  </div>
                </div>
              ))}
            </div>

            {page < totalPages && (
              <div className={styles.loadMoreWrap}>
                <button 
                  className={styles.loadMoreBtn} 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? <><Loader2 size={18} className={styles.spinnerIcon} /> Loading...</> : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
