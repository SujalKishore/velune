"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import { Moon, MapPin, Calendar, Film, Star, Clock, Heart, Tv, CalendarDays, CheckCircle2, PlayCircle, ShieldCheck, ChevronDown, Bell, Play, Monitor, Trophy, MonitorPlay, MoreHorizontal, LayoutGrid, List as ListIcon } from "lucide-react";
import { IMG } from '@/lib/tmdb';
import { useCustomPosters } from "@/contexts/CustomPosterContext";
import Navbar from "@/components/Navbar";
import tvStyles from "../tvProgress.module.css";
import { useEffect } from "react";
import { getWatchHistory, getWatchlist, getFavorites, getUserTVProgress, getUserCollections, createCollection, getUserAchievements } from "@/app/actions/history";
import { getPublicProfile } from "@/app/actions/user";
import { Edit2, User, Sparkles, Archive, Clock as ClockIcon, History, ArrowRight, ChevronRight } from "lucide-react";
import MovieDNA from "@/components/MovieDNA";
import SeasonalCollections from "@/components/SeasonalCollections";
import CustomDropdown from "@/components/CustomDropdown";
import StatsTab from "@/components/profile/StatsTab";
import { getAchievement } from "@/lib/achievements/data";
import * as Icons from "lucide-react";
import StarRating from "@/components/StarRating";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useDialog } from "@/contexts/DialogContext";

export default function ProfilePage() {
  const router = useRouter();
  const { username: targetUsername } = require('next/navigation').useParams() as { username: string };
  const { settings } = useSettings();
  const { t } = useTranslation();
  const ratingMode = settings?.ratingSystem || "10";
  const [activeTab, setActiveTab] = useState("History");
  const [historyPage, setHistoryPage] = useState(1);
  const { customPosters } = useCustomPosters();
  const { showAlert } = useDialog();

  const [history, setHistory] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [tvProgress, setTvProgress] = useState<any[]>([]);
  const [tvStats, setTvStats] = useState<any>(null);
  const [tvViewMode, setTvViewMode] = useState<"list" | "grid">("list");
  const [tvSortMode, setTvSortMode] = useState("most_recent");
  const [recentSortMode, setRecentSortMode] = useState("most_recent");
  const [loading, setLoading] = useState(true);

  // User details from auth
  const [userName, setUserName] = useState("User");
  const [userJoined, setUserJoined] = useState(new Date().getFullYear().toString());
  const [userBio, setUserBio] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [userBanner, setUserBanner] = useState("");
  const [userBannerMode, setUserBannerMode] = useState("dynamic");
  const [profileSettings, setProfileSettings] = useState({
    showWatchlist: true, showFavorites: true, showWatchHistory: true, showRatings: true,
    showTVProgress: true, showAchievements: true, showFollowedPeople: true, showJoinDate: true,
    showLocation: true, showSocialLinks: true
  });

  const [userCollections, setUserCollections] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [editData, setEditData] = useState({ bio: "", avatarUrl: "", bannerUrl: "", bannerMode: "dynamic" });
  const [collectionData, setCollectionData] = useState({ name: "", description: "" });

  const [dynamicHero, setDynamicHero] = useState<string | null>(null);

  useEffect(() => {
    getPublicProfile(targetUsername)
      .then(d => {
        if (d.user) {
          setUserName(d.user.name || d.user.username || targetUsername || "User");
          setUserBio(d.user.bio || "");
          setUserAvatar(d.user.avatarUrl || "");
          setUserBanner(d.user.bannerUrl || "");
          setUserBannerMode(d.user.bannerMode || "dynamic");
          setProfileSettings({
            showWatchlist: d.user.showWatchlist ?? true,
            showFavorites: d.user.showFavorites ?? true,
            showWatchHistory: d.user.showWatchHistory ?? true,
            showRatings: d.user.showRatings ?? true,
            showTVProgress: d.user.showTVProgress ?? true,
            showAchievements: d.user.showAchievements ?? true,
            showFollowedPeople: d.user.showFollowedPeople ?? true,
            showJoinDate: d.user.showJoinDate ?? true,
            showLocation: d.user.showLocation ?? true,
            showSocialLinks: d.user.showSocialLinks ?? true,
          });
        }
      }).catch(() => {});

    Promise.all([
      getWatchHistory(targetUsername), 
      getWatchlist(targetUsername), 
      getFavorites(targetUsername), 
      getUserTVProgress(targetUsername), 
      getUserCollections(targetUsername), 
      getUserAchievements(targetUsername)
    ]).then(([h, w, f, p, c, a]) => {
      setHistory(h.success && h.history ? h.history : []);
      setWatchlist(w.success && w.watchlist ? w.watchlist : []);
      setFavorites(f.success && f.favorites ? f.favorites : []);
      setUserCollections(c.success && c.collections ? c.collections : []);
      setUserAchievements(a.success && a.achievements ? a.achievements : []);

      let latestTvTimestamp = 0;
      let tvBgImage = null;

      if (p.success && p.progress) {
        setTvProgress(p.progress);
        setTvStats(p.stats);
        
        if (p.progress.length > 0) {
          let mostRecentShow = p.progress[0];
          let maxTvTimestamp = 0;
          for (const show of p.progress) {
            if (show.mostRecent && show.mostRecent.timestamp > maxTvTimestamp) {
              maxTvTimestamp = show.mostRecent.timestamp;
              mostRecentShow = show;
            }
          }
          if (mostRecentShow && mostRecentShow.mostRecent) {
            latestTvTimestamp = maxTvTimestamp;
            tvBgImage = mostRecentShow.bgImage;
          }
        }
      }

      let latestMovieTimestamp = 0;
      let latestMovieId = null;
      let latestMediaType: "movie" | "tv" | null = null;

      if (h.success && h.history && h.history.length > 0) {
        latestMovieTimestamp = new Date(h.history[0].watchedAt).getTime();
        latestMovieId = h.history[0].tmdbId;
        latestMediaType = h.history[0].mediaType as "movie" | "tv";
      }

      if (latestMovieTimestamp > latestTvTimestamp && latestMovieId) {
        import("@/lib/tmdb").then(({ getDetails }) => {
          getDetails(latestMediaType || "movie", latestMovieId).then((d: any) => {
            if (d.backdrop_path) {
              setDynamicHero(`https://image.tmdb.org/t/p/w1280${d.backdrop_path}`);
            } else if (tvBgImage) {
              setDynamicHero(`https://image.tmdb.org/t/p/w1280${tvBgImage}`);
            }
          }).catch(() => {
             if (tvBgImage) setDynamicHero(`https://image.tmdb.org/t/p/w1280${tvBgImage}`);
          });
        });
      } else if (tvBgImage) {
        setDynamicHero(`https://image.tmdb.org/t/p/w1280${tvBgImage}`);
      }

      setLoading(false);
    });
  }, [targetUsername]);



  const handleCreateCollection = async () => {
    if (!collectionData.name) return;
    const res = await createCollection(collectionData.name, collectionData.description);
    if (res.success && res.collection) {
      setUserCollections([{ ...res.collection, items: [], _count: { items: 0 } }, ...userCollections]);
      setIsCreateCollectionOpen(false);
      setCollectionData({ name: "", description: "" });
    } else {
      await showAlert(res.error || "Failed to create collection");
    }
  };

  // Calculate dynamic stats
  const moviesWatched = history.length;
  const tvShows = history.filter(h => h.mediaType === 'tv').length;
  
  // Watch Time: Sum up exact runtime, falling back to estimates if missing
  const watchTimeMins = history.reduce((acc, curr) => acc + (curr.runtime || (curr.mediaType === 'tv' ? 45 : 120)), 0);
  const watchDays = Math.floor(watchTimeMins / (24 * 60));
  const watchHours = Math.floor((watchTimeMins % (24 * 60)) / 60);

  // Average Rating
  const ratedItems = history.filter(h => h.rating && h.rating > 0);
  const rawAvg = ratedItems.length > 0 
    ? (ratedItems.reduce((acc, curr) => acc + curr.rating, 0) / ratedItems.length)
    : 0;
  const avgRating = ratingMode === "5" ? (rawAvg / 2).toFixed(1) : rawAvg.toFixed(1);
  const maxRatingLabel = ratingMode === "5" ? "Out of 5.0" : "Out of 10.0";
  
  // Favorites
  const favoritesCount = favorites.length;

  // Days Watched
  const uniqueDays = new Set(history.map(h => new Date(h.watchedAt).toDateString())).size;

  // Posters for the collage
  const collagePosters = history
    .filter(h => h.poster && h.mediaType === 'movie')
    .slice(0, 4)
    .map(h => h.poster);

  // Recent Activity Feed based on Active Tab
  let recentActivity: any[] = [];
  
  if (activeTab === "History") {
    recentActivity = history.map(h => ({
      id: `h_${h.id}`,
      title: h.title,
      date: new Date(h.watchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      timestamp: new Date(h.watchedAt).getTime(),
      rating: h.rating,
      review: h.review,
      img: customPosters[`${h.mediaType}-${h.tmdbId}`] ? `https://image.tmdb.org/t/p/w780${customPosters[`${h.mediaType}-${h.tmdbId}`]}` : (h.poster ? `https://image.tmdb.org/t/p/w780${h.poster}` : ""),
      action: "watched",
      mediaType: h.mediaType,
      tmdbId: h.tmdbId,
      runtime: h.runtime
    }));
  } else if (activeTab === "Watchlist") {
    recentActivity = watchlist.map(w => ({
      id: `w_${w.id}`,
      title: w.title,
      date: new Date(w.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      timestamp: new Date(w.addedAt).getTime(),
      rating: 0,
      review: "",
      img: customPosters[`${w.mediaType}-${w.tmdbId}`] ? `https://image.tmdb.org/t/p/w780${customPosters[`${w.mediaType}-${w.tmdbId}`]}` : (w.poster ? `https://image.tmdb.org/t/p/w780${w.poster}` : ""),
      action: "watchlist",
      mediaType: w.mediaType,
      tmdbId: w.tmdbId,
      runtime: w.runtime
    }));
  } else if (activeTab === "Favorites") {
    recentActivity = favorites.map(f => ({
      id: `f_${f.id}`,
      title: f.title,
      date: new Date(f.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      timestamp: new Date(f.addedAt).getTime(),
      rating: 0, 
      review: "",
      img: customPosters[`${f.mediaType}-${f.tmdbId}`] ? `https://image.tmdb.org/t/p/w780${customPosters[`${f.mediaType}-${f.tmdbId}`]}` : (f.poster ? `https://image.tmdb.org/t/p/w780${f.poster}` : ""),
      action: "favorites",
      mediaType: f.mediaType,
      tmdbId: f.tmdbId,
      runtime: f.runtime
    }));
  } else if (activeTab === "Reviews") {
    recentActivity = history.filter(h => h.review && h.review.trim() !== "").map(h => ({
      id: `r_${h.id}`,
      title: h.title,
      date: new Date(h.watchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      timestamp: new Date(h.watchedAt).getTime(),
      rating: h.rating,
      review: h.review,
      img: customPosters[`${h.mediaType}-${h.tmdbId}`] ? `https://image.tmdb.org/t/p/w780${customPosters[`${h.mediaType}-${h.tmdbId}`]}` : (h.poster ? `https://image.tmdb.org/t/p/w780${h.poster}` : ""),
      action: "rating",
      mediaType: h.mediaType,
      tmdbId: h.tmdbId,
      runtime: h.runtime
    }));
  } else if (activeTab === "Collections") {
    recentActivity = []; // Placeholder for Collections
  }

  if (activeTab === "Watchlist" || activeTab === "Favorites" || activeTab === "Collections") {
    if (settings.contentOrder === "alpha") {
      recentActivity.sort((a, b) => a.title.localeCompare(b.title));
    } else if (settings.contentOrder === "rating") {
      recentActivity.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      recentActivity.sort((a, b) => b.timestamp - a.timestamp);
    }
  } else {
    // Timeline view (History, Reviews) must be chronological
    recentActivity.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Grouping for Timeline (History & Reviews)
  let timelineGroups: { dateStr: string, dayStr: string, items: any[], stats: any }[] = [];
  if (activeTab === "History" || activeTab === "Reviews") {
    const combinedActivity = [...recentActivity].sort((a, b) => b.timestamp - a.timestamp);
    const groupsMap = new Map<string, any[]>();
    
    combinedActivity.forEach(item => {
      const dateObj = new Date(item.timestamp);
      const groupDateStr = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
      if (!groupsMap.has(groupDateStr)) groupsMap.set(groupDateStr, []);
      groupsMap.get(groupDateStr)!.push(item);
    });

    groupsMap.forEach((items, dateStr) => {
      const watchItems = items.filter(i => i.action === "watched" || i.action === "rating");
      const numMovies = watchItems.filter(i => i.mediaType === "movie").length;
      const numShows = watchItems.filter(i => i.mediaType === "tv").length;
      const totalWatchMins = watchItems.reduce((acc, curr) => acc + (curr.runtime || (curr.mediaType === 'tv' ? 45 : 120)), 0);
      const watchHours = Math.floor(totalWatchMins / 60);
      const watchMins = totalWatchMins % 60;
      const watchTimeStr = watchHours > 0 ? `${watchHours}h ${watchMins}m` : `${watchMins}m`;
      
      const ratedItems = watchItems.filter(i => i.rating && i.rating > 0);
      const avgRating = ratedItems.length > 0 ? (ratedItems.reduce((acc, curr) => acc + curr.rating, 0) / ratedItems.length).toFixed(1) : null;
      
      let topMovie = null;
      if (watchItems.length > 0) {
        const sortedByRating = [...watchItems].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        topMovie = { title: sortedByRating[0].title, poster: sortedByRating[0].img };
      }

      const dayStr = new Date(items[0].timestamp).toLocaleDateString("en-US", { weekday: "long" });

      timelineGroups.push({
        dateStr,
        dayStr,
        items,
        stats: {
          countStr: numMovies + numShows > 0 ? `${numMovies + numShows} Item${numMovies + numShows > 1 ? 's' : ''}` : null,
          watchTimeStr: totalWatchMins > 0 ? watchTimeStr : null,
          avgRating,
          topMovie
        }
      });
    });
  }

  const itemsPerPage = 5;
  const totalPages = Math.ceil(timelineGroups.length / itemsPerPage);
  const paginatedGroups = timelineGroups.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);

  // Progress metrics
  const progressTarget = 100;
  const progressPct = Math.min(100, Math.round((moviesWatched / progressTarget) * 100));
  const dashOffset = 251 - (251 * progressPct) / 100;

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingDots}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
        </div>
        <div className={styles.loadingText}>LOADING...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.profileContainer}>
      {/* TOP DARK HERO SECTION */}
      <section className={styles.heroSection}>
        {/* GLOBAL NAVBAR */}
        <Navbar />

        <div 
          className={styles.heroBackground} 
          style={{ backgroundImage: `url('${userBannerMode === "dynamic" ? (dynamicHero || userBanner || "/cinematic_login_hero.png") : (userBanner || dynamicHero || "/cinematic_login_hero.png")}')` }} 
        />
        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <div className={styles.userInfoBlock}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatarInner}>
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} referrerPolicy="no-referrer" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <div className={styles.userDetails}>
              <h1 className={styles.userName}>{userName}</h1>
              {profileSettings.showJoinDate && <p className={styles.userMeta}>Joined {userJoined}</p>}
              
              <div className={styles.bioContainer}>
                {userBio ? (
                  <p className={styles.userBio}>{userBio}</p>
                ) : (
                  <p className={styles.userBio}>Add a bio to tell others about yourself.</p>
                )}
                {profileSettings.showAchievements && (
                  <div className={styles.achievementsContainer}>
                    {userAchievements.slice(0, 3).map(ach => {
                      const def = getAchievement(ach.achievementId);
                      if (!def) return null;
                      const LucideIcon = (Icons as any)[def.icon] || Icons.Trophy;
                      return (
                        <div key={ach.id} className={styles.achievementBadge} title={def.description}>
                          <LucideIcon size={10} color={def.color}/> {def.name}
                        </div>
                      );
                    })}
                    {userAchievements.length > 3 && (
                      <div 
                        className={styles.achievementBadgeMore} 
                        onClick={() => router.push(`/profile/${targetUsername}/achievements`)}
                      >
                        +{userAchievements.length - 3} more
                      </div>
                    )}
                    {userAchievements.length === 0 && (
                      <div className={styles.achievementBadgeMore} onClick={() => router.push('/profile/achievements')}>
                        View Achievements <ChevronRight size={10} />
                      </div>
                    )}
                  </div>
                )}
              </div>


            </div>
          </div>


        </div>

        {/* The Sweeping Curve SVG */}
        <div className={styles.curveWrapper}>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className={styles.curveSvg}>
            <path d="M0,120 L1440,120 L1440,30 C1200,100 800,120 720,120 C640,120 240,100 0,30 Z" fill="#F6FAFD" />
          </svg>
        </div>
      </section>

      {/* BOTTOM LIGHT SECTION */}
      <section className={styles.bodySection}>
        
        {/* STATS ROW */}
        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <Film size={20} className={styles.statIcon} />
            </div>
            <p className={styles.statLabel}>{t('profile.movies_watched')}</p>
            <h2 className={styles.statNumber}>{moviesWatched}</h2>
            <p className={styles.statSub}>{t('profile.all_time')}</p>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <Star size={20} className={styles.statIcon} />
            </div>
            <p className={styles.statLabel}>{t('profile.avg_rating')}</p>
            <h2 className={styles.statNumber}>{avgRating}</h2>
            <p className={styles.statSub}>{maxRatingLabel}</p>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <Clock size={20} className={styles.statIcon} />
            </div>
            <p className={styles.statLabel}>{t('profile.watch_days')}</p>
            <h2 className={styles.statNumber}>{watchDays}</h2>
            <p className={styles.statSub}>{t('profile.consecutive')}</p>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <Heart size={20} className={styles.statIcon} />
            </div>
            <p className={styles.statLabel}>{t('profile.favorites')}</p>
            <h2 className={styles.statNumber}>{favoritesCount}</h2>
            <p className={styles.statSub}>Curated list</p>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <Tv size={20} className={styles.statIcon} />
            </div>
            <p className={styles.statLabel}>{t('nav.tv_shows')}</p>
            <h2 className={styles.statNumber}>{tvShows}</h2>
            <p className={styles.statSub}>{t('profile.episodes_logged')}</p>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <CalendarDays size={20} className={styles.statIcon} />
            </div>
            <p className={styles.statLabel}>Unique Days</p>
            <h2 className={styles.statNumber}>{uniqueDays}</h2>
            <p className={styles.statSub}>Spent watching</p>
          </div>
        </div>

        {/* TABS */}
        <div className={styles.tabsRow}>
          {["History", "Watchlist", "Favorites", "Reviews", "Progress", "Collections", "Stats"]
            .filter(tItem => {
               if (tItem === "History" && !profileSettings.showWatchHistory) return false;
               if (tItem === "Reviews" && (!profileSettings.showWatchHistory || !profileSettings.showRatings)) return false;
               if (tItem === "Watchlist" && !profileSettings.showWatchlist) return false;
               if (tItem === "Favorites" && !profileSettings.showFavorites) return false;
               if (tItem === "Progress" && !profileSettings.showTVProgress) return false;
               return true;
            })
            .map(tItem => (
            <div 
              key={tItem}
              className={`${styles.tab} ${activeTab === tItem ? styles.tabActive : ""}`}
              onClick={() => { setActiveTab(tItem); setHistoryPage(1); }}
            >
              {tItem === 'History' && t('profile.history')}
              {tItem === 'Watchlist' && t('profile.watchlist')}
              {tItem === 'Favorites' && t('profile.favorites')}
              {tItem === 'Reviews' && t('profile.reviews')}
              {tItem === 'Progress' && "Progress"}
              {tItem === 'Collections' && t('profile.collections')}
              {tItem === 'Stats' && t('profile.stats')}
            </div>
          ))}
          <div className={styles.tabLine} />
        </div>

        {/* MAIN TWO-COLUMN CONTENT */}
        <div className={styles.mainGrid}>
          
          {/* LEFT CONTENT: RECENT ACTIVITY */}
          <div className={styles.leftColumn}>
            {(activeTab !== "Watchlist" && activeTab !== "Favorites") && (
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>RECENT ACTIVITY</h3>
                <CustomDropdown 
                  theme="light"
                  value={recentSortMode} 
                  onChange={setRecentSortMode} 
                  options={[{ value: 'most_recent', label: 'Most Recent' }, { value: 'oldest', label: 'Oldest' }]} 
                />
              </div>
            )}

            <div>
              {activeTab === "Progress" ? (
                <div>
                  {/* TOP STATS BAR */}
                  {tvStats && (
                    <div className={tvStyles.topStatsBar}>
                      <div className={tvStyles.statBlock}>
                        <div className={tvStyles.progressCircularWrap}>
                          <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                            <circle cx="50" cy="50" r="40" stroke="#00E5C5" strokeWidth="8" fill="none" strokeDasharray="251" strokeDashoffset={251 - (251 * tvStats.overallProgress) / 100} strokeLinecap="round" />
                          </svg>
                          <div className={tvStyles.progressValue}>{tvStats.overallProgress}%</div>
                        </div>
                        <span className={tvStyles.statSub}>Overall Progress</span>
                      </div>
                      <div className={tvStyles.statBlock}>
                        <div className={`${tvStyles.statIconWrap} ${tvStyles.play}`}><Play size={18} fill="currentColor" /></div>
                        <h3 className={tvStyles.statValue}>{tvStats.tvShowsWatching}</h3>
                        <span className={tvStyles.statLabel}>TV Shows</span>
                        <span className={tvStyles.statSub}>Watching</span>
                      </div>
                      <div className={tvStyles.statBlock}>
                        <div className={`${tvStyles.statIconWrap} ${tvStyles.tv}`}><Monitor size={18} /></div>
                        <h3 className={tvStyles.statValue}>{tvStats.episodesWatched}</h3>
                        <span className={tvStyles.statLabel}>Episodes</span>
                        <span className={tvStyles.statSub}>Watched</span>
                      </div>
                      <div className={tvStyles.statBlock}>
                        <div className={`${tvStyles.statIconWrap} ${tvStyles.calendar}`}><CalendarDays size={18} /></div>
                        <h3 className={tvStyles.statValue}>{tvStats.watchTimeThisMonth}</h3>
                        <span className={tvStyles.statLabel}>Watch Time</span>
                        <span className={tvStyles.statSub}>This Month</span>
                      </div>
                      <div className={tvStyles.statBlock}>
                        <div className={`${tvStyles.statIconWrap} ${tvStyles.trophy}`}><Trophy size={18} /></div>
                        <h3 className={tvStyles.statValue}>{tvStats.showsCompleted}</h3>
                        <span className={tvStyles.statLabel}>Shows</span>
                        <span className={tvStyles.statSub}>Completed</span>
                      </div>
                      <div className={tvStyles.statBlock}>
                        <div className={`${tvStyles.statIconWrap} ${tvStyles.monitor}`}><MonitorPlay size={18} /></div>
                        <h3 className={tvStyles.statValue}>{tvStats.episodesThisMonth}</h3>
                        <span className={tvStyles.statLabel}>Episodes</span>
                        <span className={tvStyles.statSub}>This Month</span>
                      </div>
                    </div>
                  )}

                  {/* TV SHOWS LIST */}
                  <div className={tvStyles.listContainer} style={{ marginTop: '24px' }}>
                    <div className={tvStyles.listHeader}>
                      <h4 className={tvStyles.listTitle}>YOUR TV SHOWS</h4>
                      <div className={tvStyles.listControls}>
                        <div className={tvStyles.sortBy}>
                          Sort by: 
                          <CustomDropdown 
                            theme="light"
                            value={tvSortMode} 
                            onChange={setTvSortMode} 
                            options={[
                              { value: 'most_recent', label: 'Most Recent' }, 
                              { value: 'progress', label: 'Progress' }, 
                              { value: 'alphabetical', label: 'Alphabetical' }
                            ]} 
                          />
                        </div>
                        <div className={tvStyles.viewToggles}>
                          <button className={`${tvStyles.viewBtn} ${tvViewMode === 'grid' ? tvStyles.active : ''}`} onClick={() => setTvViewMode('grid')}>
                            <LayoutGrid size={16} />
                          </button>
                          <button className={`${tvStyles.viewBtn} ${tvViewMode === 'list' ? tvStyles.active : ''}`} onClick={() => setTvViewMode('list')}>
                            <ListIcon size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {tvProgress.length > 0 ? (
                      tvViewMode === 'list' ? (
                        tvProgress.map(p => {
                          const pct = p.totalEpisodes > 0 ? Math.round((p.watchedCount / p.totalEpisodes) * 100) : 0;
                          return (
                            <div key={p.tmdbId} className={tvStyles.listRow} onClick={() => router.push(`/tv/${p.tmdbId}`)} style={{ backgroundImage: p.bgImage ? `url(https://image.tmdb.org/t/p/w1280${p.bgImage})` : 'none' }}>
                              {/* Col 1: Identity */}
                              <div className={tvStyles.showIdentity}>
                                <img src={customPosters[`tv-${p.tmdbId}`] ? `https://image.tmdb.org/t/p/w200${customPosters[`tv-${p.tmdbId}`]}` : (p.poster ? `https://image.tmdb.org/t/p/w200${p.poster}` : '')} alt={p.title} className={tvStyles.showPoster} />
                                <div>
                                  <h4 className={tvStyles.showTitle}>{p.title}</h4>
                                  <p className={tvStyles.showSeason}>Season {p.mostRecent.season}</p>
                                </div>
                              </div>

                              {/* Col 2: Progress */}
                              <div className={tvStyles.showProgressCol}>
                                <div className={tvStyles.progressHeader}>
                                  <span>{p.watchedCount} / {p.totalEpisodes} episodes</span>
                                  <span className={tvStyles.progressPct}>{pct}%</span>
                                </div>
                                <div className={tvStyles.progressBarWrap}>
                                  <div className={tvStyles.progressBar} style={{width: `${pct}%`}}></div>
                                </div>
                              </div>

                              {/* Col 3: Most Recent */}
                              <div className={tvStyles.epStatsCol}>
                                <span className={tvStyles.epLabel}>Most Recent</span>
                                <div className={tvStyles.epRow}>
                                  <span className={tvStyles.epIdentifier}>S{p.mostRecent.season} E{p.mostRecent.episode}</span>
                                  <span className={tvStyles.epTitle}>{p.mostRecent.title}</span>
                                  <span className={tvStyles.epTime}>{p.mostRecent.timeAgo}</span>
                                </div>
                              </div>

                              {/* Col 4: Next Episode */}
                              <div className={tvStyles.epStatsCol}>
                                <span className={tvStyles.epLabel}>Next Episode</span>
                                {p.isCompleted ? (
                                  <span className={tvStyles.completedTag}>Completed <CheckCircle2 size={12} style={{display: 'inline', marginLeft: 4}} /></span>
                                ) : (
                                  <div className={tvStyles.epRow}>
                                    <span className={tvStyles.epIdentifier}>S{p.nextEpisode.season} E{p.nextEpisode.episode}</span>
                                    <span className={tvStyles.epTitle}>{p.nextEpisode.title}</span>
                                  </div>
                                )}
                              </div>

                              {/* Col 5: Menu */}
                              <div className={tvStyles.menuCol}>
                                <MoreHorizontal size={20} />
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className={tvStyles.gridView}>
                          {tvProgress.map(p => {
                            const pct = p.totalEpisodes > 0 ? Math.round((p.watchedCount / p.totalEpisodes) * 100) : 0;
                            return (
                              <div key={p.tmdbId} className={tvStyles.gridCard} onClick={() => router.push(`/tv/${p.tmdbId}`)} style={{ backgroundImage: p.bgImage ? `url(https://image.tmdb.org/t/p/w1280${p.bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                                {/* Dark overlay for grid card bg */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(11,25,44,0.95) 0%, rgba(11,25,44,0.7) 100%)', zIndex: 0 }}></div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div className={tvStyles.gridPosterWrap}>
                                  <img src={customPosters[`tv-${p.tmdbId}`] ? `https://image.tmdb.org/t/p/w300${customPosters[`tv-${p.tmdbId}`]}` : (p.poster ? `https://image.tmdb.org/t/p/w300${p.poster}` : '')} alt={p.title} className={tvStyles.gridPoster} />
                                  <div className={tvStyles.gridProgressRing}></div>
                                  <span className={tvStyles.gridSeason}>Season {p.mostRecent.season}</span>
                                </div>
                                <div className={tvStyles.gridContent}>
                                  <h4 className={tvStyles.gridTitle}>{p.title}</h4>
                                  
                                  <div className={tvStyles.gridProgressCol}>
                                    <div className={tvStyles.progressHeader}>
                                      <span>{p.watchedCount} / {p.totalEpisodes}</span>
                                      <span className={tvStyles.progressPct}>{pct}%</span>
                                    </div>
                                    <div className={tvStyles.progressBarWrap}>
                                      <div className={tvStyles.progressBar} style={{width: `${pct}%`}}></div>
                                    </div>
                                  </div>

                                  <div className={tvStyles.gridEpStats} style={{marginBottom: 12}}>
                                    <span className={tvStyles.epLabel}>Most Recent</span>
                                    <div className={tvStyles.epRow}>
                                      <span className={tvStyles.epIdentifier}>S{p.mostRecent.season} E{p.mostRecent.episode}</span>
                                      <span className={tvStyles.epTitle}>{p.mostRecent.title}</span>
                                    </div>
                                  </div>

                                  <div className={tvStyles.gridEpStats}>
                                    <span className={tvStyles.epLabel}>Next Episode</span>
                                    {p.isCompleted ? (
                                      <span className={tvStyles.completedTag}>Completed <CheckCircle2 size={12} style={{display: 'inline', marginLeft: 4}} /></span>
                                    ) : (
                                      <div className={tvStyles.epRow}>
                                        <span className={tvStyles.epIdentifier}>S{p.nextEpisode.season} E{p.nextEpisode.episode}</span>
                                        <span className={tvStyles.epTitle}>{p.nextEpisode.title}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <p style={{ color: 'var(--text-light)', padding: '20px', textAlign: 'center' }}>No TV shows in progress. Start watching!</p>
                    )}
                  </div>
                </div>
              ) : activeTab === "Collections" ? (
                <div className={styles.tabContent}>
                
                <h3 style={{fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <ListIcon size={16} /> Your Collections
                  <div style={{flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)'}} />
                </h3>

                <div className={styles.listsContainer}>
                  <button 
                    className={styles.createListCard}
                    onClick={() => setIsCreateCollectionOpen(true)}>
                    <div style={{ marginBottom: 12 }}><ListIcon size={32} /></div>
                    <h4 style={{ fontSize: 16, fontWeight: 600 }}>Create New Collection</h4>
                  </button>
                  
                  {userCollections.map(collection => (
                    <div key={collection.id} className={styles.listCard} onClick={() => router.push(`/collections/${collection.id}`)}>
                      <h3 className={styles.listTitle}>{collection.name}</h3>
                      {collection.description && <p className={styles.listDesc}>{collection.description}</p>}
                      
                      <div className={styles.listPosters}>
                        {collection.items.map((item: any) => (
                          <img 
                            key={item.id} 
                            src={item.poster ? `https://image.tmdb.org/t/p/w200${item.poster}` : '/cinematic_login_hero.png'} 
                            className={styles.listPosterMini}
                            alt=""
                          />
                        ))}
                      </div>

                      <div className={styles.listMeta}>
                        <span>{collection._count?.items || 0} items</span>
                        <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              ) : activeTab === "Stats" ? (
                <StatsTab 
                  history={history}
                  watchlist={watchlist}
                  favorites={favorites}
                  tvProgress={tvProgress}
                  userCollections={userCollections}
                  userAchievements={userAchievements}
                  userJoined={userJoined}
                  ratingMode={ratingMode}
                />
              ) : activeTab === "Reviews" ? (
                <div className={styles.reviewsTimelineWrapper}>
                  <div className={styles.reviewsTimelineTrack} />
                  {paginatedGroups.length > 0 ? paginatedGroups.map((group, gIdx) => {
                    const diffDays = Math.floor((Date.now() - group.items[0].timestamp) / (1000 * 60 * 60 * 24));
                    let timeAgoStr = "TODAY";
                    if (diffDays === 1) timeAgoStr = "YESTERDAY";
                    else if (diffDays > 1 && diffDays < 7) timeAgoStr = `${diffDays} DAYS AGO`;
                    else if (diffDays >= 7 && diffDays < 14) timeAgoStr = "1 WEEK AGO";
                    else if (diffDays >= 14 && diffDays < 21) timeAgoStr = "2 WEEKS AGO";
                    else if (diffDays >= 21 && diffDays < 30) timeAgoStr = "3 WEEKS AGO";
                    else if (diffDays >= 30) timeAgoStr = `${Math.floor(diffDays / 30)} MONTHS AGO`;

                    return (
                      <div key={group.dateStr} className={styles.reviewGroup}>
                        <div className={styles.reviewGroupDate}>
                          <div className={styles.reviewTimeAgo}>{timeAgoStr}</div>
                          <div className={styles.reviewExactDate}>
                            {new Date(group.items[0].timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
                          </div>
                        </div>
                        <div className={styles.reviewDot} />
                        
                        <div className={styles.reviewCardsList}>
                          {group.items.map((item: any) => (
                            <div key={item.id} className={styles.reviewCardFull} onClick={() => router.push(`/${item.mediaType}/${item.tmdbId}`)} style={{ cursor: "pointer" }}>
                              <img src={item.img} className={styles.reviewCardPoster} alt={item.title} />
                              <div className={styles.reviewCardContent}>
                                <div className={styles.reviewCardHeader}>
                                  <div className={styles.reviewUserInfo}>
                                    <div className={styles.reviewAvatar}>{userName.charAt(0).toUpperCase()}</div>
                                    <div>
                                      <div className={styles.reviewUserName}>{userName}</div>
                                      <div className={styles.reviewDateStr}>
                                        {new Date(item.timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
                                        <span style={{ margin: "0 8px", opacity: 0.5 }}>•</span>
                                        <span style={{ fontWeight: 600, color: "var(--dynamic-accent, #00E5C5)" }}>{item.title}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {item.rating > 0 && (
                                    <div className={styles.reviewCardStars}>
                                    {profileSettings.showRatings && <StarRating rating={item.rating} size={14} />}
                                    </div>
                                  )}
                                </div>
                                <div className={styles.reviewTextFull}>
                                  {item.review}
                                </div>
                                <div className={styles.reviewCardFooter}>
                                  <span className={styles.reviewWatchedPill}>Watched</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }) : (
                    <p style={{ color: 'rgba(255,255,255,0.5)', padding: '20px' }}>No reviews available. Start writing some!</p>
                  )}
                  {totalPages > 1 && (
                    <div className={styles.paginationControls}>
                      <button className={styles.pageBtn} disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)}>Prev</button>
                      <span className={styles.pageInfo}>Page {historyPage} of {totalPages}</span>
                      <button className={styles.pageBtn} disabled={historyPage === totalPages} onClick={() => setHistoryPage(p => p + 1)}>Next</button>
                    </div>
                  )}
                </div>
              ) : activeTab === "History" ? (
                <div className={styles.timelineWrapper}>
                  {paginatedGroups.length > 0 ? paginatedGroups.map((group, gIdx) => (
                    <div key={group.dateStr} className={styles.timelineGroup}>
                      <div className={styles.timelineTrack} />
                      <div className={styles.timelineMarker} />
                      
                      <div className={styles.timelineHeader}>
                        <div className={styles.timelineDateCol}>
                          <span className={styles.timelineDate}>{group.dateStr}</span>
                          <span className={styles.timelineDay}>{group.dayStr}</span>
                        </div>
                        
                        {(group.stats.countStr || group.stats.watchTimeStr || group.stats.avgRating) && (
                          <div className={styles.timelineStats}>
                            {group.stats.countStr && <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><CalendarDays size={12} /> {group.stats.countStr}</span>}
                            {group.stats.watchTimeStr && <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Clock size={12} /> {group.stats.watchTimeStr} <strong>Watch Time</strong></span>}
                            {group.stats.avgRating && <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Star size={12} /> {group.stats.avgRating} <strong>Avg Rating</strong></span>}
                          </div>
                        )}

                        {group.stats.topMovie && (
                          <div className={styles.timelineTopMovie}>
                            <span className={styles.timelineTopMovieLabel}>Top Movie</span>
                            <div className={styles.timelineTopMovieValue}>
                              {group.stats.topMovie.title}
                              <img src={group.stats.topMovie.poster} className={styles.timelineTopMovieImg} alt="" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={styles.timelineCardsRow}>
                        {group.items.map((item: any) => {
                          const timeStr = new Date(item.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                          return (
                            <div key={item.id} className={styles.timelineCard} onClick={() => router.push(item.mediaType === 'collection' ? `/collections/${item.tmdbId}` : `/${item.mediaType}/${item.tmdbId}`)} style={{ cursor: "pointer" }}>
                              <img src={item.img} className={styles.timelineCardPoster} alt={item.title} />
                              <div className={styles.timelineCardContent}>
                                <div className={styles.timelineCardTop}>
                                  <span className={styles.timelineCardTime}>{timeStr}</span>
                                  <MoreHorizontal size={14} className={styles.timelineCardMenu} />
                                </div>
                                <h4 className={styles.timelineCardTitle}>{item.title}</h4>
                                {item.rating > 0 && (
                                  <div className={styles.timelineCardStars}>
                                    {profileSettings.showRatings && <StarRating rating={item.rating} size={10} />}
                                  </div>
                                )}
                                
                                <div className={styles.timelineCardBottom}>
                                  <div className={styles.timelineCardTags}>
                                    <span className={styles.timelineTag}>{item.mediaType === 'movie' ? 'Film' : 'TV'}</span>
                                    {item.rating === 5 && <span className={styles.timelineTag}>Masterpiece</span>}
                                  </div>
                                  <Heart size={14} className={styles.timelineCardHeart} onClick={(e) => { e.stopPropagation(); /* handle fav */ }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )) : (
                    <p style={{ color: 'rgba(255,255,255,0.5)', padding: '20px' }}>No history available. Start logging movies!</p>
                  )}

                  {totalPages > 1 && (
                    <div className={styles.paginationControls}>
                      <button className={styles.pageBtn} disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)}>Prev</button>
                      <span className={styles.pageInfo}>Page {historyPage} of {totalPages}</span>
                      <button className={styles.pageBtn} disabled={historyPage === totalPages} onClick={() => setHistoryPage(p => p + 1)}>Next</button>
                    </div>
                  )}
                </div>
              ) : (activeTab === "Watchlist" || activeTab === "Favorites") ? (
                <div className={styles.watchlistContainer}>
                  <div className={styles.watchlistHeader}>
                    <div className={styles.watchlistHeaderLeft}>
                      <div className={styles.watchlistHeaderIcon}>
                        {activeTab === "Watchlist" ? <Icons.Bookmark size={24} fill="currentColor" /> : <Icons.Heart size={24} fill="currentColor" />}
                      </div>
                      <div className={styles.watchlistHeaderTitles}>
                        <h2>{recentActivity.length} titles</h2>
                        <p>{activeTab === "Watchlist" ? "Movies and TV shows you want to watch" : "Your favorite movies, shows, and collections"}</p>
                      </div>
                    </div>
                    <div className={styles.watchlistControls}>
                      <div className={styles.watchlistSearch}>
                        <Icons.Search size={16} className={styles.watchlistSearchIcon} />
                        <input type="text" placeholder="Search watchlist..." />
                      </div>
                      <button className={styles.watchlistFilterBtn}>
                        <Icons.Filter size={16} /> Filter
                      </button>
                      <button className={styles.watchlistSortBtn}>
                        Most Recent <Icons.ChevronDown size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.watchlistGrid}>
                    {recentActivity.map((item, index) => {
                      const isMovie = item.mediaType === "movie";
                      const isCollection = item.mediaType === "collection";
                      const cardClass = isCollection ? `${styles.watchlistCard} ${styles.watchlistCardCollection}` : styles.watchlistCard;
                      
                      return (
                        <div key={item.id} className={cardClass} onClick={() => router.push(item.mediaType === 'collection' ? `/collections/${item.tmdbId}` : `/${item.mediaType}/${item.tmdbId}`)}>
                          <div className={styles.watchlistCardImageWrap}>
                            <img src={item.img} alt={item.title} className={styles.watchlistCardImage} />
                            <div className={styles.watchlistCardOverlay}></div>
                            <div className={styles.watchlistCardPill}>
                              {isCollection ? "Collection" : (isMovie ? "Movie" : "TV Show")}
                            </div>
                            <div className={styles.watchlistCardMenu} onClick={(e) => { e.stopPropagation(); /* handle menu */ }}>
                              <Icons.MoreVertical size={16} />
                            </div>
                          </div>
                          
                          <div className={styles.watchlistCardContent}>
                            <div className={styles.watchlistCardTitle} title={item.title}>{item.title}</div>
                            <div className={styles.watchlistCardSubtitle}>
                              {new Date(item.timestamp).getFullYear()} • {isCollection ? "Movie Series" : (isMovie ? "2h 15m" : "Multiple Seasons")}
                            </div>
                            
                            <div className={styles.watchlistCardBottom}>
                              <div className={styles.watchlistCardRating}>
                                {!isCollection && (
                                  <>
                                    <Icons.Star size={12} fill="currentColor" /> 
                                    {(4.0 + Math.random()).toFixed(1)}
                                  </>
                                )}
                              </div>
                              <div className={styles.watchlistCardBookmark} onClick={(e) => { e.stopPropagation(); /* toggle bookmark */ }}>
                                {activeTab === "Favorites" ? <Icons.Heart size={14} fill="currentColor" /> : <Icons.Bookmark size={14} />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {recentActivity.length > 0 && (
                    <div className={styles.watchlistFooter}>
                      {activeTab === "Watchlist" ? <Icons.Bookmark size={32} className={styles.watchlistFooterIcon} /> : <Icons.Heart size={32} fill="currentColor" className={styles.watchlistFooterIcon} />}
                      <div className={styles.watchlistFooterTitle}>End of your {activeTab.toLowerCase()}</div>
                      <div className={styles.watchlistFooterDesc}>Add more movies, shows, and collections you love.</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.activityGrid}>
                  {recentActivity.length > 0 ? recentActivity.map(item => (
                    <div key={item.id} className={styles.activityCard} onClick={() => router.push(item.mediaType === 'collection' ? `/collections/${item.tmdbId}` : `/${item.mediaType}/${item.tmdbId}`)} style={{ cursor: "pointer" }}>
                      <img src={item.img} alt={item.title} className={styles.activityImg} />
                      <div className={styles.activityOverlay} />
                      
                      <div className={styles.activityContent}>
                        <div className={styles.activityTop}>
                          <span className={styles.activityDate}>{item.date}</span>
                          {item.action === "watchlist" && <span className={styles.actionTag}><Heart size={10} /> Added to Watchlist</span>}
                          {item.action === "watched" && <span className={styles.actionTag}><CheckCircle2 size={10} /> Watched</span>}
                          {item.action === "favorites" && <span className={styles.actionTag}><Heart size={10} fill="currentColor" /> Added to Favorites</span>}
                          {item.action === "rating" && (
                            <div className={styles.activityStars}>
                              {profileSettings.showRatings && <StarRating rating={item.rating || 0} size={10} emptyColor="rgba(255,255,255,0.3)" />}
                            </div>
                          )}
                          {item.action === "rated" && (
                            <div className={styles.activityStars}>
                              {profileSettings.showRatings && <StarRating rating={item.rating || 0} size={10} emptyColor="rgba(255,255,255,0.3)" />}
                            </div>
                          )}
                        </div>
                        
                        <div className={styles.activityBottom}>
                          <h4 className={styles.activityMovieTitle}>{item.title}</h4>
                          {item.review && <p className={styles.activityReview}>{item.review}</p>}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p style={{ color: 'rgba(255,255,255,0.5)', padding: '20px' }}>No recent activity. Start logging movies!</p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Prisoner Quote Block */}
            <div className={styles.bottomQuoteBlock} style={{ marginTop: '48px' }}>
              <div className={styles.quoteBlockInfo}>
                <div className={styles.quoteBlockHeader}>
                  <span className={styles.quoteDate}>May 2, 2025</span>
                  <span className={styles.quoteAction}>Review added</span>
                </div>
                <h4 className={styles.quoteMovie}>Prisoners</h4>
                <div className={styles.quoteStars}>★★★★☆</div>
              </div>
              <div className={styles.quoteBlockContent}>
                <span className={styles.quoteBlockMark}>“</span>
                <p>Hugh Jackman delivers one of his best performances. Dark, tense and unforgettable till the last frame.</p>
              </div>
            </div>

            <div className={styles.footerQuote}>
              <span className={styles.footerQuoteMark}>“</span>
              <p>Movies are not just stories.<br/>They are pieces of us.</p>
            </div>
          </div>

          {/* RIGHT COLUMN: SIDEBAR */}
          <div className={styles.rightColumn}>
            
            {/* PROGRESS CARD */}
            <div className={styles.progressCard}>
              <h4 className={styles.sidebarTitleDark}>YOUR PROGRESS</h4>
              
              <div className={styles.circularProgress}>
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                  <circle cx="50" cy="50" r="40" stroke="#00E5C5" strokeWidth="8" fill="none" strokeDasharray="251" strokeDashoffset={dashOffset} strokeLinecap="round" />
                </svg>
                <div className={styles.circularValue}>{progressPct}%</div>
              </div>

              <h3 className={styles.progressTitle}>Cinema Explorer</h3>
              <p className={styles.progressDesc}>Watch {Math.max(0, progressTarget - moviesWatched)} more movies to reach <span className={styles.progressHighlight}>Cinephile</span></p>

              <div className={styles.milestones}>
                <h5 className={styles.milestoneTitle}>MILESTONES</h5>
                
                <div className={styles.milestoneItem}>
                  <CheckCircle2 size={16} color={moviesWatched > 0 ? "#00E5C5" : "rgba(255,255,255,0.2)"} />
                  <div className={styles.milestoneBarWrap}>
                    <div className={styles.milestoneHeader}>
                      <span>First Watch</span>
                      <span>{moviesWatched > 0 ? "Complete" : "0 / 1"}</span>
                    </div>
                    <div className={styles.milestoneBar}><div className={styles.milestoneFill} style={{width: moviesWatched > 0 ? '100%' : '0%'}}></div></div>
                  </div>
                </div>

                <div className={styles.milestoneItem}>
                  <Star size={16} color="#4A7FA7" />
                  <div className={styles.milestoneBarWrap}>
                    <div className={styles.milestoneHeader}>
                      <span>{ratedItems.length} / 50 Rated</span>
                    </div>
                    <div className={styles.milestoneBar}><div className={styles.milestoneFill} style={{width: `${Math.min(100, (ratedItems.length / 50) * 100)}%`}}></div></div>
                  </div>
                </div>

                <div className={styles.milestoneItem}>
                  <Calendar size={16} color="#4A7FA7" />
                  <div className={styles.milestoneBarWrap}>
                    <div className={styles.milestoneHeader}>
                      <span>{uniqueDays} / 365 Days</span>
                    </div>
                    <div className={styles.milestoneBar}><div className={styles.milestoneFill} style={{width: `${Math.min(100, (uniqueDays / 365) * 100)}%`}}></div></div>
                  </div>
                </div>
              </div>
            </div>

            {/* THIS MONTH STATS */}
            <div className={styles.monthCard}>
              <h4 className={styles.sidebarTitleLight}>THIS MONTH</h4>
              <div className={styles.monthGrid}>
                <div className={styles.monthStat}>
                  <PlayCircle size={20} color="#4A7FA7" />
                  <h3>{moviesWatched}</h3>
                  <p>Movies watched</p>
                </div>
                <div className={styles.monthStat}>
                  <ShieldCheck size={20} color="#00E5C5" />
                  <h3>Sci-Fi</h3>
                  <p>Top genre</p>
                </div>
                <div className={styles.monthStat}>
                  <Clock size={20} color="#4A7FA7" />
                  <h3>{tvShows}</h3>
                  <p>TV Shows</p>
                </div>
                <div className={styles.monthStat}>
                  <Star size={20} color="#00E5C5" />
                  <h3>{avgRating}</h3>
                  <p>Avg rating</p>
                </div>
              </div>
            </div>

            {/* MOVIE DNA */}
            <MovieDNA history={history} />

          </div>
        </div>
      </section>
      </div>

      {/* CREATE COLLECTION MODAL */}
      {isCreateCollectionOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateCollectionOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Create New Collection</h2>
            
            <div className={styles.formGroup}>
              <label>Collection Name</label>
              <input 
                type="text" 
                className={styles.formInput} 
                value={collectionData.name} 
                onChange={e => setCollectionData({...collectionData, name: e.target.value})}
                placeholder="e.g. My Favorite Sci-Fi Movies"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description (Optional)</label>
              <textarea 
                className={styles.formTextarea} 
                value={collectionData.description} 
                onChange={e => setCollectionData({...collectionData, description: e.target.value})}
                placeholder="What is this collection about?"
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setIsCreateCollectionOpen(false)}>Cancel</button>
              <button className={styles.btnSave} onClick={handleCreateCollection}>Create Collection</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
