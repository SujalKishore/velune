"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDiscoverTV, getTVGenres, getPopularTV, getTopRatedTV, IMG, type TVShow, type Genre } from "@/lib/tmdb";
import Navbar from "@/components/Navbar";
import MediaCarousel from "@/components/MediaCarousel";
import styles from "./page.module.css";
import { Star, Loader2, Play } from "lucide-react";
import { getWatchedTmdbIds } from "@/app/actions/history";
import { useSettings } from "@/contexts/SettingsContext";

export default function TVShowsPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const [items, setItems] = useState<TVShow[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>("");
  const [filterIds, setFilterIds] = useState<Set<string>>(new Set());
  
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Carousel Data
  const [popular, setPopular] = useState<TVShow[]>([]);
  const [topRated, setTopRated] = useState<TVShow[]>([]);

  // Fetch static carousels and genres once
  useEffect(() => {
    Promise.all([
      getTVGenres(),
      getPopularTV(),
      getTopRatedTV(),
      settings.hideWatched ? getWatchedTmdbIds() : Promise.resolve({ success: false, ids: [] as string[] })
    ])
      .then(([g, pop, tr, watchedRes]) => {
        let fIds = new Set<string>();
        if (watchedRes && watchedRes.success && watchedRes.ids) {
          fIds = new Set(watchedRes.ids);
          setFilterIds(fIds);
        }
        
        setGenres(g);
        
        const filterFunc = (m: TVShow) => !fIds.has(m.id.toString());
        setPopular(pop.filter(filterFunc));
        setTopRated(tr.filter(filterFunc));
      })
      .catch(console.error);
  }, [settings.hideWatched]);

  const fetchTVShows = async (pageNum: number, genreId: string) => {
    try {
      const res = await getDiscoverTV(pageNum, genreId || undefined);
      let newItems = res.results;
      if (settings.hideWatched && filterIds.size > 0) {
        newItems = newItems.filter((m: TVShow) => !filterIds.has(m.id.toString()));
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
    fetchTVShows(1, activeGenre).finally(() => setLoading(false));
  }, [activeGenre]);

  const handleLoadMore = async () => {
    if (page >= totalPages || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchTVShows(nextPage, activeGenre);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const heroShow = popular[0];

  return (
    <main className={styles.pageWrapper}>
      <Navbar />
      
      <div className={styles.container}>
        
        {heroShow && (
          <div 
            className={styles.heroSection}
            onClick={() => router.push(`/tv/${heroShow.id}`)}
          >
            {heroShow.backdrop_path && (
              <img 
                src={IMG.backdrop(heroShow.backdrop_path, "original") ?? undefined} 
                alt={heroShow.name} 
                className={styles.heroBackdrop} 
              />
            )}
            <div className={styles.heroGradient} />
            <div className={styles.heroContent}>
              <div className={styles.trendingBadge}>
                Popular Right Now
              </div>
              <h1 className={styles.heroTitle}>
                {heroShow.name}
              </h1>
              <div className={styles.heroMeta}>
                <span className={styles.heroRating}>
                  <Star fill="currentColor" size={16} />
                  {heroShow.vote_average?.toFixed(1)}
                </span>
                <span>
                  {heroShow.first_air_date?.slice(0, 4)}
                </span>
                <span style={{ textTransform: 'uppercase' }}>
                  TV Show
                </span>
              </div>
              <p className={styles.heroOverview}>{heroShow.overview}</p>
            </div>
          </div>
        )}

        <MediaCarousel title="Popular TV Shows" items={popular.slice(1)} mediaType="tv" />
        <MediaCarousel title="Top Rated TV Shows" items={topRated} mediaType="tv" />

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
                  onClick={() => router.push(`/tv/${item.id}`)}
                >
                  <div className={styles.posterWrap}>
                    {item.poster_path ? (
                      <img src={IMG.poster(item.poster_path, "w500") ?? undefined} alt={item.name} className={styles.poster} />
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
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                    <p className={styles.cardYear}>{item.first_air_date?.slice(0, 4) || "Unknown"}</p>
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
