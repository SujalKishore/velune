"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { X, Share2, ChevronDown } from "lucide-react";
import { getWatchHistory } from "@/app/actions/history";
import { useDialog } from "@/contexts/DialogContext";

function AnimatedSection({ children, bgClass, image }: { children: React.ReactNode, bgClass: string, image?: string | null }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={`${styles.section} ${bgClass}`}>
      {image && <div className={styles.sectionImageBg} style={{ backgroundImage: `url(${image})` }} />}
      <div className={styles.sectionOverlay} />
      <div className={`${styles.contentWrapper} ${isVisible ? styles.visible : ''}`}>
        {children}
      </div>
      <div className={styles.scrollIndicator}>
        <ChevronDown size={32} />
      </div>
    </section>
  );
}

export default function WrappedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const { showAlert } = useDialog();

  useEffect(() => {
    async function loadData() {
      const res = await getWatchHistory();
      if (res.success && res.history) {
        const history = res.history;
        
        const moviesWatched = history.length;
        const watchHours = Math.floor(moviesWatched * 2); 

        const months = history.map(h => new Date(h.watchedAt).toLocaleString('default', { month: 'long' }));
        const monthCounts = months.reduce((acc, month) => { acc[month] = (acc[month] || 0) + 1; return acc; }, {} as Record<string, number>);
        let mostActiveMonth = "N/A";
        let maxCount = 0;
        for (const [month, count] of Object.entries(monthCounts)) {
          if (count > maxCount) { maxCount = count; mostActiveMonth = month; }
        }

        const rated = history.filter(h => h.rating && h.rating > 0).sort((a, b) => (b.rating!) - (a.rating!));
        const topRated = rated.length > 0 ? rated[0] : (history.length > 0 ? history[0] : null);
        
        const avgRating = rated.length > 0 ? (rated.reduce((acc, h) => acc + h.rating!, 0) / rated.length).toFixed(1) : "N/A";

        const sortedOldest = [...history].sort((a, b) => new Date(a.watchedAt).getTime() - new Date(b.watchedAt).getTime());
        const firstMovie = sortedOldest.length > 0 ? sortedOldest[0] : null;
        
        const movieCount = history.filter(h => h.mediaType === 'movie').length;
        const tvCount = history.filter(h => h.mediaType === 'tv').length;
        
        // Calculate Streak
        const dates = [...new Set(history.map(h => new Date(h.watchedAt).toISOString().split('T')[0]))].sort();
        let longestStreak = dates.length > 0 ? 1 : 0;
        let currentStreak = dates.length > 0 ? 1 : 0;
        
        for (let i = 1; i < dates.length; i++) {
          const d1 = new Date(dates[i - 1]);
          const d2 = new Date(dates[i]);
          const diffTime = Math.abs(d2.getTime() - d1.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
        }

        setStats({
          moviesWatched,
          watchHours,
          mostActiveMonth,
          topRated,
          firstMovie,
          movieCount,
          tvCount,
          avgRating,
          longestStreak
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div className={styles.wrappedContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading your year...</div>;
  if (!stats || stats.moviesWatched === 0) return <div className={styles.wrappedContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>You haven't logged any movies this year!</div>;

  return (
    <div className={styles.wrappedContainer}>
      <button className={styles.closeBtn} onClick={() => router.push('/profile')}>
        <X size={32} />
      </button>

      <AnimatedSection bgClass={styles.bgGradient1}>
        <h4 className={styles.eyebrow}>2026 IN CINEMA</h4>
        <h2 className={styles.statValue}>{stats.moviesWatched}</h2>
        <p className={styles.statLabel}>Titles Logged</p>
        <p className={styles.subtitle}>You explored new worlds, cried at tragedies, and laughed at comedies. This was your cinematic journey.</p>
      </AnimatedSection>

      <AnimatedSection 
        bgClass={styles.bgImage} 
        image={stats.topRated?.poster ? `https://image.tmdb.org/t/p/w1280${stats.topRated.poster}` : "/cinematic_login_hero.png"}
      >
        <h4 className={styles.eyebrow}>TOP RATED</h4>
        <h2 className={styles.statValue} style={{ fontSize: stats.topRated?.title.length > 15 ? 'clamp(50px, 8vw, 90px)' : undefined }}>
          {stats.topRated ? stats.topRated.title : "None"}
        </h2>
        <p className={styles.statLabel}>A Masterpiece</p>
        <p className={styles.subtitle}>Out of everything you watched, this one left the deepest impression on you.</p>
      </AnimatedSection>

      <AnimatedSection bgClass={styles.bgGradient2}>
        <h4 className={styles.eyebrow}>THE SPLIT</h4>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', marginBottom: '40px' }}>
          <div>
            <h2 className={styles.statValue}>{stats.movieCount}</h2>
            <p className={styles.statLabel}>Movies</p>
          </div>
          <div>
            <h2 className={styles.statValue}>{stats.tvCount}</h2>
            <p className={styles.statLabel}>TV Shows</p>
          </div>
        </div>
        <p className={styles.subtitle}>Whether it was a 2-hour epic or a 10-season binge, you were hooked.</p>
      </AnimatedSection>

      <AnimatedSection bgClass={styles.bgGradient5}>
        <h4 className={styles.eyebrow}>THE DEEP DIVE</h4>
        <div className={styles.gridStats}>
          <div className={styles.gridStatCard}>
            <div className={styles.gridStatValue}>{stats.longestStreak}</div>
            <div className={styles.gridStatLabel}>Day Streak</div>
          </div>
          <div className={styles.gridStatCard}>
            <div className={styles.gridStatValue}>{stats.avgRating}</div>
            <div className={styles.gridStatLabel}>Avg Rating</div>
          </div>
          <div className={styles.gridStatCard}>
            <div className={styles.gridStatValue}>{stats.mostActiveMonth}</div>
            <div className={styles.gridStatLabel}>Busiest Month</div>
          </div>
          <div className={styles.gridStatCard}>
            <div className={styles.gridStatValue}>{stats.watchHours}</div>
            <div className={styles.gridStatLabel}>Est. Hours</div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection 
        bgClass={styles.bgGradient3}
        image={stats.firstMovie?.poster ? `https://image.tmdb.org/t/p/w1280${stats.firstMovie.poster}` : null}
      >
        <h4 className={styles.eyebrow}>WHERE IT STARTED</h4>
        <h2 className={styles.statValue}>{stats.firstMovie ? stats.firstMovie.title : "None"}</h2>
        <p className={styles.statLabel}>First Log of the Year</p>
        <p className={styles.subtitle}>Every journey begins with a single step, and yours began here.</p>
      </AnimatedSection>

      <section className={`${styles.section} ${styles.bgGradient4}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 className={styles.statValue} style={{ fontSize: '60px', marginBottom: '10px' }}>That's a Wrap.</h2>
        <p className={styles.subtitle} style={{ marginBottom: '60px' }}>See you next year.</p>
        <button className={styles.shareBtn} onClick={async () => await showAlert("Copied link to share!")}>
          <Share2 size={24} /> Share Your Year
        </button>
      </section>
    </div>
  );
}
