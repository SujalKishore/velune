import React, { useMemo } from 'react';
import styles from './StatsTab.module.css';
import { Film, Tv, Clock, Calendar, CheckCircle2, Star, MessageSquare, Award, Flame, TrendingUp, Compass, Heart, Library, PlayCircle, FolderOpen, Target, Zap, Hash } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";

interface StatsTabProps {
  history: any[];
  watchlist: any[];
  favorites: any[];
  tvProgress: any[];
  userCollections: any[];
  userAchievements: any[];
  userJoined: string;
  ratingMode?: string;
}

export default function StatsTab({ 
  history, 
  watchlist, 
  favorites, 
  tvProgress, 
  userCollections, 
  userAchievements,
  userJoined,
  ratingMode = "10"
}: StatsTabProps) {
  const { t } = useTranslation();
  
  const stats = useMemo(() => {
    // 1. Volume
    const moviesWatched = history.filter(h => h.mediaType === 'movie').length;
    const tvShowsStarted = history.filter(h => h.mediaType === 'tv').length;
    const totalEpisodes = tvProgress.reduce((sum, tv) => sum + (tv.episodesWatched || 0), 0);
    const watchlistCount = watchlist.length;
    
    // 2. Time Estimates (Use exact runtime if available, fallback to 110m per movie, 45m per episode)
    const exactMovieMins = history.filter(h => h.mediaType === 'movie').reduce((sum, h) => sum + (h.runtime || 110), 0);
    const movieHours = exactMovieMins / 60;
    
    // For TV progress, we don't have individual episode runtime injected here yet, so fallback to 45m or we could pass tvStats up.
    // Assuming 45m for episodes since tvProgress only tracks count, not individual watched records with runtime.
    const tvHours = (totalEpisodes * 45) / 60;
    const totalHours = Math.round(movieHours + tvHours);
    const totalDays = (totalHours / 24).toFixed(1);

    // 3. Ratings & Reviews
    const ratedItems = history.filter(h => h.rating && h.rating > 0);
    const totalRatings = ratedItems.length;
    const rawAvg = totalRatings > 0 
      ? (ratedItems.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings)
      : 0;
    const avgRating = ratingMode === "5" ? (rawAvg / 2).toFixed(1) : rawAvg.toFixed(1);
    
    const reviewedItems = history.filter(h => h.review && h.review.trim() !== "");
    const totalReviews = reviewedItems.length;
    const avgReviewWords = totalReviews > 0
      ? Math.round(reviewedItems.reduce((acc, curr) => acc + curr.review.split(' ').length, 0) / totalReviews)
      : 0;

    let highestRated = "N/A";
    let highestRatedPoster = "";
    let lowestRated = "N/A";
    
    if (ratedItems.length > 0) {
      const sortedByRating = [...ratedItems].sort((a, b) => b.rating - a.rating);
      highestRated = sortedByRating[0].title;
      highestRatedPoster = sortedByRating[0].poster || "";
      lowestRated = sortedByRating[sortedByRating.length - 1].title;
    }

    const raterTag = rawAvg > 8 ? "Generous Rater" : (rawAvg < 5 && rawAvg > 0 ? "Harsh Critic" : "Balanced Rater");

    // 4. Habits & Streaks
    // Sort history by date to find streaks
    const historyDates = history.map(h => new Date(h.watchedAt).toISOString().split('T')[0]).sort();
    const uniqueDates = Array.from(new Set(historyDates));
    
    let currentStreak = 0;
    let longestStreak = 0;
    let streakCounter = 0;
    let lastDate: Date | null = null;

    const daysMap: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    const monthMap: Record<number, number> = {};
    const yearMap: Record<number, number> = {};

    for (const dateStr of uniqueDates) {
      const d = new Date(dateStr);
      // Weekday map
      daysMap[d.getDay()]++;
      // Month map
      monthMap[d.getMonth()] = (monthMap[d.getMonth()] || 0) + 1;
      // Year map
      yearMap[d.getFullYear()] = (yearMap[d.getFullYear()] || 0) + 1;

      // Streak logic
      if (!lastDate) {
        streakCounter = 1;
      } else {
        const diffTime = Math.abs(d.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays === 1) {
          streakCounter++;
        } else {
          streakCounter = 1;
        }
      }
      if (streakCounter > longestStreak) longestStreak = streakCounter;
      lastDate = d;
    }

    // Determine current streak (is today or yesterday part of the streak?)
    if (lastDate) {
      const diffToToday = Math.ceil(Math.abs(new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffToToday <= 1) {
        currentStreak = streakCounter;
      }
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let mostActiveDay = "N/A";
    let maxDayCount = 0;
    for (let i = 0; i < 7; i++) {
      if (daysMap[i] > maxDayCount) {
        maxDayCount = daysMap[i];
        mostActiveDay = dayNames[i];
      }
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let mostActiveMonth = "N/A";
    let maxMonthCount = 0;
    Object.entries(monthMap).forEach(([m, count]) => {
      if (count > maxMonthCount) {
        maxMonthCount = count;
        mostActiveMonth = monthNames[parseInt(m)];
      }
    });

    let mostActiveYear = "N/A";
    let maxYearCount = 0;
    Object.entries(yearMap).forEach(([y, count]) => {
      if (count > maxYearCount) {
        maxYearCount = count;
        mostActiveYear = y;
      }
    });

    let firstMovie = "N/A";
    let firstMoviePoster = "";
    let recentMovie = "N/A";
    let recentMoviePoster = "";
    if (history.length > 0) {
      const sortedHistory = [...history].sort((a, b) => new Date(a.watchedAt).getTime() - new Date(b.watchedAt).getTime());
      firstMovie = sortedHistory[0].title;
      firstMoviePoster = sortedHistory[0].poster || "";
      recentMovie = sortedHistory[sortedHistory.length - 1].title;
      recentMoviePoster = sortedHistory[sortedHistory.length - 1].poster || "";
    }

    // 5. Completion & Platform
    const totalWatchedItems = history.length;
    const completionRate = totalWatchedItems + watchlistCount > 0 
      ? Math.round((totalWatchedItems / (totalWatchedItems + watchlistCount)) * 100) 
      : 0;

    const favRatio = totalWatchedItems > 0 ? Math.round((favorites.length / totalWatchedItems) * 100) : 0;
    const moviesPct = totalWatchedItems > 0 ? Math.round((moviesWatched / totalWatchedItems) * 100) : 0;

    const accountJoinedDate = new Date(userJoined || new Date().getFullYear().toString());
    const accountAgeDays = Math.max(1, Math.floor((new Date().getTime() - accountJoinedDate.getTime()) / (1000 * 60 * 60 * 24)));

    const collectionCount = userCollections.length;
    const collectionItems = userCollections.reduce((sum, c) => sum + (c._count?.items || 0), 0);
    const achievementsCount = userAchievements.length;

    // Rarest Achievement (mock logic: just take the one with highest id length or first one)
    const rarestAchievement = userAchievements.length > 0 ? userAchievements[userAchievements.length - 1].achievementId : "N/A";

    return {
      moviesWatched, tvShowsStarted, totalEpisodes, totalHours, totalDays, moviesPct, completionRate, accountAgeDays,
      totalRatings, avgRating, totalReviews, avgReviewWords, highestRated, lowestRated, raterTag, favRatio,
      longestStreak, currentStreak, mostActiveDay, mostActiveMonth, mostActiveYear, firstMovie, firstMoviePoster, recentMovie, recentMoviePoster,
      collectionCount, collectionItems, achievementsCount, rarestAchievement, totalWatchedItems, highestRatedPoster
    };
  }, [history, watchlist, favorites, tvProgress, userCollections, userAchievements, userJoined]);

  return (
    <div className={styles.statsContainer}>
      
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><Clock size={18} /> {t('profile.volume_time')}</h2>
        <div className={styles.grid}>
          {/* Highlight Card for Total Watch Time */}
          <div className={`${styles.cardBase} ${styles.cardHighlight}`}>
            <div className={styles.decoCircle} />
            <div className={styles.cardHeader}>
              <div className={styles.cardData}>
                <span className={styles.label}>{t('profile.total_watch_time')}</span>
                <span className={styles.value}>{stats.totalHours} <span style={{fontSize: 16}}>{t('profile.hours')}</span></span>
              </div>
              <div className={styles.iconBox}><Clock size={24} /></div>
            </div>
          </div>

          <div className={`${styles.cardBase} ${styles.cardSmall}`}>
            <div className={styles.iconBox}><Film size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.value}>{stats.moviesWatched}</span>
              <span className={styles.label}>{t('profile.movies_watched')}</span>
            </div>
          </div>

          <div className={`${styles.cardBase} ${styles.cardSmall}`}>
            <div className={styles.iconBox}><Tv size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.value}>{stats.totalEpisodes}</span>
              <span className={styles.label}>{t('profile.episodes_logged')}</span>
            </div>
          </div>

          <div className={`${styles.cardBase} ${styles.cardSmall}`}>
            <div className={styles.iconBox}><Calendar size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.value}>{stats.totalDays}</span>
              <span className={styles.label}>{t('profile.days_spent')}</span>
            </div>
          </div>

          {/* Progress Card for Watchlist */}
          <div className={`${styles.cardBase} ${styles.cardProgress}`}>
            <div className={styles.cardHeader}>
              <div className={styles.iconBox}><Target size={20} /></div>
              <div className={styles.cardData} style={{alignItems: 'flex-end'}}>
                <span className={styles.valueMedium}>{stats.completionRate}%</span>
                <span className={styles.label}>{t('profile.watchlist_completed')}</span>
              </div>
            </div>
            <div className={styles.progressBarWrap}>
              <div className={styles.progressBar} style={{width: `${stats.completionRate}%`}} />
            </div>
          </div>

          <div className={`${styles.cardBase} ${styles.cardSmall}`}>
            <div className={styles.iconBox}><Hash size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.value}>{stats.moviesPct}%</span>
              <span className={styles.label}>{t('profile.movies_tv_ratio')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><Star size={18} /> {t('profile.ratings_reviews')}</h2>
        <div className={styles.grid}>
          {/* Large Dark Card for Highest Rated */}
          <div 
            className={`${styles.cardBase} ${styles.cardLarge} ${stats.highestRatedPoster ? styles.cardPosterBg : ''}`}
            style={stats.highestRatedPoster ? { backgroundImage: `url(https://image.tmdb.org/t/p/w500${stats.highestRatedPoster})` } : {}}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconBox} style={{background: 'rgba(255,255,255,0.1)', color: '#FFD700'}}><Star size={20} /></div>
              <span className={styles.label}>{t('profile.highest_rated')}</span>
            </div>
            <div className={styles.cardData}>
              <span className={styles.valueText} style={{fontSize: 24}}>{stats.highestRated}</span>
              <span className={styles.label} style={{color: 'var(--primary-accent)', textTransform: 'none'}}>{t('profile.your_absolute_favorite')}</span>
            </div>
          </div>

          <div className={`${styles.cardBase} ${styles.cardSmall}`}>
            <div className={styles.iconBox}><TrendingUp size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.value}>{stats.avgRating} <span style={{fontSize: 14}}>/ {ratingMode === "5" ? "5" : "10"}</span></span>
              <span className={styles.label}>{t('profile.avg_rating')}</span>
            </div>
          </div>

          <div className={`${styles.cardBase} ${styles.cardSmall}`}>
            <div className={`${styles.iconBox} ${styles.iconBoxAlt}`}><Flame size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.valueText}>{stats.raterTag}</span>
              <span className={styles.label}>{t('profile.rater_profile')}</span>
            </div>
          </div>

          <div className={`${styles.cardBase} ${styles.cardSmall}`}>
            <div className={styles.iconBox}><MessageSquare size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.value}>{stats.totalReviews}</span>
              <span className={styles.label}>{t('profile.reviews_written')}</span>
            </div>
          </div>

          <div className={`${styles.cardBase} ${styles.cardSmall}`}>
            <div className={`${styles.iconBox} ${styles.iconBoxAlt}`}><Heart size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.value}>{stats.favRatio}%</span>
              <span className={styles.label}>{t('profile.favs_ratio')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><Flame size={18} /> {t('profile.habits_streaks')}</h2>
        <div className={styles.grid}>
          <div className={`${styles.cardBase} ${styles.cardHighlight}`}>
            <div className={styles.decoCircle} />
            <div className={styles.cardHeader}>
              <div className={styles.cardData}>
                <span className={styles.label}>{t('profile.longest_streak')}</span>
                <span className={styles.value}>{stats.longestStreak} <span style={{fontSize: 16}}>{t('profile.days')}</span></span>
              </div>
              <div className={styles.iconBox}><Flame size={24} /></div>
            </div>
          </div>

          <div className={`${styles.cardBase} ${styles.cardMedium}`}>
            <div className={styles.iconBox}><Zap size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.valueMedium}>{stats.currentStreak}</span>
              <span className={styles.label}>{t('profile.current_streak')}</span>
            </div>
          </div>

          <div className={`${styles.cardBase} ${styles.cardMedium}`}>
            <div className={styles.iconBox}><Calendar size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.valueMedium}>{stats.mostActiveDay}</span>
              <span className={styles.label}>{t('profile.most_active_day')}</span>
            </div>
          </div>

          {/* Large Card for First vs Recent */}
          <div 
            className={`${styles.cardBase} ${styles.cardProgress} ${styles.cardLarge} ${stats.recentMoviePoster ? styles.cardPosterBg : ''}`}
            style={stats.recentMoviePoster ? { backgroundImage: `url(https://image.tmdb.org/t/p/w500${stats.recentMoviePoster})` } : {}}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconBox}><PlayCircle size={20} /></div>
              <div className={styles.cardData} style={{alignItems: 'flex-end', textAlign: 'right'}}>
                <span className={styles.valueText}>{stats.firstMovie}</span>
                <span className={styles.label}>{t('profile.first_movie_logged')}</span>
              </div>
            </div>
            <div className={styles.progressBarWrap} style={{height: 1}} />
            <div className={styles.cardHeader} style={{marginTop: 12}}>
              <div className={styles.cardData}>
                <span className={styles.label}>{t('profile.most_recent_watch')}</span>
                <span className={styles.valueText}>{stats.recentMovie}</span>
              </div>
              <div className={styles.iconBox}><CheckCircle2 size={20} /></div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><Award size={18} /> {t('profile.platform_engagement')}</h2>
        <div className={styles.grid}>
          <div className={`${styles.cardBase} ${styles.cardMedium}`}>
            <div className={styles.iconBox}><FolderOpen size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.valueMedium}>{stats.collectionCount}</span>
              <span className={styles.label}>{t('profile.collections')}</span>
            </div>
          </div>

          <div className={`${styles.cardBase} ${styles.cardMedium}`}>
            <div className={styles.iconBox}><Award size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.valueMedium}>{stats.achievementsCount}</span>
              <span className={styles.label}>{t('profile.achievements')}</span>
            </div>
          </div>

          <div className={`${styles.cardBase} ${styles.cardMedium}`}>
            <div className={`${styles.iconBox} ${styles.iconBoxAlt}`}><Award size={20} /></div>
            <div className={styles.cardData}>
              <span className={styles.valueText} style={{textTransform: 'capitalize'}}>{stats.rarestAchievement.replace(/_/g, ' ')}</span>
              <span className={styles.label}>{t('profile.rarest_achievement')}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
