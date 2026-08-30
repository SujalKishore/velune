"use client";

import React from "react";
import styles from "./Universe.module.css";
import { Universe } from "@/data/universes";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toggleWatchlist } from "@/app/actions/history";

interface UniverseProgressProps {
  universe: Universe;
  watchedIds: Set<string>;
}

export default function UniverseProgress({ universe, watchedIds }: UniverseProgressProps) {
  const router = useRouter();
  
  const allItems = universe.sagas.flatMap(s => s.phases.flatMap(p => p.items));
  const movies = allItems.filter(i => i.mediaType === "movie");
  const shows = allItems.filter(i => i.mediaType === "tv");
  
  const watchedMovies = movies.filter(i => watchedIds.has(i.tmdbId)).length;
  const watchedShows = shows.filter(i => watchedIds.has(i.tmdbId)).length;
  const totalWatched = watchedMovies + watchedShows;
  const totalItems = movies.length + shows.length;
  const overallPercent = Math.round((totalWatched / (totalItems || 1)) * 100);

  const missingItems = allItems
    .filter(i => !watchedIds.has(i.tmdbId))
    .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());

  const handleAddWatchlist = async (tmdbId: string, mediaType: "movie" | "tv", title: string, poster: string) => {
    await toggleWatchlist(tmdbId, mediaType, title, poster.replace("https://image.tmdb.org/t/p/w500", ""));
    // Ideally this updates local state or triggers a re-fetch, but for now it works server-side
  };

  return (
    <div className={styles.contentContainer}>
      <div className={styles.progressGrid}>
        
        {/* Overall Progress */}
        <div className={styles.progressCard}>
          <h2 className={styles.cardHeader}>Universe Completion</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" 
                  stroke="var(--primary-accent)" strokeWidth="10" 
                  strokeDasharray={`${overallPercent * 2.827} 282.7`} 
                  strokeLinecap="round" 
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {overallPercent}%
              </div>
            </div>
            
            <div style={{ flexGrow: 1 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                  <span>Movies</span>
                  <span style={{ color: 'var(--primary-accent)' }}>{watchedMovies} / {movies.length}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(watchedMovies / (movies.length || 1)) * 100}%`, height: '100%', background: 'var(--primary-accent)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                  <span>TV Shows</span>
                  <span style={{ color: 'var(--primary-accent)' }}>{watchedShows} / {shows.length}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(watchedShows / (shows.length || 1)) * 100}%`, height: '100%', background: 'var(--primary-accent)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Missing Titles */}
        <div className={styles.progressCard}>
          <h2 className={styles.cardHeader}>Continue Your Journey</h2>
          {missingItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {missingItems.slice(0, 3).map(item => (
                <div key={item.tmdbId} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px' }}>
                  <img src={item.poster} alt={item.title} style={{ width: 40, height: 60, borderRadius: 6, objectFit: 'cover' }} />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{item.releaseDate.slice(0, 4)}</div>
                  </div>
                  <button 
                    onClick={() => handleAddWatchlist(item.tmdbId, item.mediaType, item.title, item.poster)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.6)' }}>
              You are completely caught up!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
