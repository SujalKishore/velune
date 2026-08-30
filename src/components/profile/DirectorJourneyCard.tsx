"use client";

import React, { useEffect, useState } from "react";
import styles from "./DirectorJourneyCard.module.css";
import { getPersonDirectedMovies } from "@/app/actions/person";
import { ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { IMG } from "@/lib/tmdb";

export default function DirectorJourneyCard({ person, history }: { person: any, history: any[] }) {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getPersonDirectedMovies(person.tmdbId).then(data => {
      setMovies(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [person.tmdbId]);

  if (loading) {
    return (
      <div className={styles.cardLoading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (movies.length === 0) {
    return null;
  }

  // Calculate watched
  const watchedTmdbIds = new Set(history.map(h => h.tmdbId));
  const watchedMovies = movies.filter(m => watchedTmdbIds.has(m.id.toString()));
  const unwatchedMovies = movies.filter(m => !watchedTmdbIds.has(m.id.toString()));
  
  const total = movies.length;
  const watchedCount = watchedMovies.length;
  const percentage = total > 0 ? Math.round((watchedCount / total) * 100) : 0;
  
  const followedDate = new Date(person.followedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const recentlyWatchedList = watchedMovies.slice(0, 3);
  const upNextMovie = unwatchedMovies.length > 0 ? unwatchedMovies[unwatchedMovies.length - 1] : null;

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={styles.card}>
      
      {/* LEFT: Profile Image */}
      <div className={styles.profileSection} onClick={() => router.push(`/person/${person.tmdbId}`)}>
        {person.profilePath ? (
          <img src={IMG.poster(person.profilePath, "w300") || ""} alt={person.name} className={styles.profileImg} />
        ) : (
          <div className={styles.profileFallback}>{person.name.charAt(0)}</div>
        )}
      </div>

      {/* MIDDLE-LEFT: Stats */}
      <div className={styles.statsSection}>
        <h3 className={styles.name} onClick={() => router.push(`/person/${person.tmdbId}`)}>{person.name}</h3>
        <p className={styles.since}>Following since <span className={styles.sinceHighlight}>{followedDate}</span></p>
        
        <div className={styles.progressRow}>
          <div className={styles.donutWrapper}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r={radius} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              <circle cx="32" cy="32" r={radius} fill="transparent" stroke="#00E5C5" strokeWidth="4" 
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" 
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease-out' }} />
            </svg>
            <div className={styles.donutText}>{percentage}%</div>
          </div>

          <div className={styles.barProgressInfo}>
            <div className={styles.barLabelWrapper}>
              <span className={styles.barCount}>{watchedCount} <span style={{color: 'rgba(255,255,255,0.4)', fontWeight: 400}}>/ {total}</span></span>
              <span className={styles.barLabel}>Movies Watched</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        </div>
        <p className={styles.journeyLabel}>Journey Progress</p>
      </div>

      {/* MIDDLE-RIGHT: Recently Watched */}
      <div className={styles.recentSection}>
        <h4 className={styles.sectionHeading}>RECENTLY WATCHED</h4>
        <div className={styles.postersRow}>
          {recentlyWatchedList.map(m => (
            <div key={m.id} className={styles.posterItem} onClick={() => router.push(`/movie/${m.id}`)}>
              <div className={styles.posterImgWrap}>
                {m.poster_path ? (
                  <img src={IMG.poster(m.poster_path, "w185") || ""} alt={m.title} className={styles.posterImg} />
                ) : (
                  <div className={styles.posterFallback}>No Image</div>
                )}
                <div className={styles.checkBadge}><CheckCircle2 size={16} fill="#00E5C5" color="#0A1931" /></div>
              </div>
              <div className={styles.posterInfo}>
                <p className={styles.posterTitle}>{m.title}</p>
                <p className={styles.posterYear}>{m.release_date?.slice(0, 4) || ""}</p>
              </div>
            </div>
          ))}
          {recentlyWatchedList.length === 0 && (
            <div style={{color: 'rgba(255,255,255,0.3)', fontSize: 13, paddingTop: 20}}>None yet</div>
          )}
        </div>
      </div>

      {/* RIGHT: Up Next */}
      <div className={styles.nextSection}>
        <h4 className={styles.sectionHeading}>UP NEXT</h4>
        {upNextMovie ? (
          <div className={styles.posterItem} onClick={() => router.push(`/movie/${upNextMovie.id}`)}>
            <div className={styles.posterImgWrap}>
              {upNextMovie.poster_path ? (
                <img src={IMG.poster(upNextMovie.poster_path, "w185") || ""} alt={upNextMovie.title} className={styles.posterImg} />
              ) : (
                <div className={styles.posterFallback}>No Image</div>
              )}
              <div className={styles.emptyBadge}><Circle size={16} color="rgba(255,255,255,0.5)" /></div>
            </div>
            <div className={styles.posterInfo}>
              <p className={styles.posterTitle}>{upNextMovie.title}</p>
              <p className={styles.posterYear}>{upNextMovie.release_date?.slice(0, 4) || ""}</p>
            </div>
          </div>
        ) : (
          <div style={{color: 'rgba(255,255,255,0.3)', fontSize: 13, paddingTop: 20}}>Completed!</div>
        )}
      </div>

      <div className={styles.navAction}>
        <ChevronRight size={24} color="rgba(255,255,255,0.4)" />
      </div>

    </div>
  );
}
