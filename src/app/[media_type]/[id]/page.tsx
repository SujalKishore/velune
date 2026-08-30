"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDetails, getRecommendations, searchMulti, IMG, type DetailedMedia, type Movie, type TVShow, type SearchResult } from "@/lib/tmdb";
import { getUserInteractions, saveLog, toggleWatchlist, toggleFavorite, getWatchedEpisodes, getUserCollections, addToCollection, createCollection } from "@/app/actions/history";
import { ArrowLeft, Star, Clock, Film, CheckCircle2, Check, Bookmark, BookmarkCheck, Eye, User, Share2, Play, Heart, ListPlus, X, Copy, ChevronUp, ChevronDown, MessageSquare, Palette, BarChart2 } from "lucide-react";
import { FastAverageColor } from "fast-average-color";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import TVSeasons from "@/components/TVSeasons";
import SeriesGraph from "@/components/SeriesGraph";
import WatchProviders from "@/components/WatchProviders";
import RatingPicker from '@/components/RatingPicker';
import StarRating from '@/components/StarRating';
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
import CustomPosterModal from "@/components/CustomPosterModal";
import { useCustomPosters } from "@/contexts/CustomPosterContext";

export default function DetailsPage() {
  const params = useParams();
  const router = useRouter();
  const mediaType = params.media_type as "movie" | "tv";
  const id = params.id as string;
  
  if (mediaType !== "movie" && mediaType !== "tv") {
    if (params.media_type === "universe") {
      router.replace(`/universes/${id}`);
    } else {
      router.replace("/");
    }
    return null;
  }
  const { settings } = useSettings();
  const { t } = useTranslation();
  const ratingMode = settings?.ratingSystem || "10";

  const [data, setData] = useState<DetailedMedia | null>(null);
  const [recommendations, setRecommendations] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interaction State
  const [isWatched, setIsWatched] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState<string>("");
  const [reviewDate, setReviewDate] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<any[]>([]);
  const [showTrailer, setShowTrailer] = useState(false);
  
  // Collections
  const [userCollections, setUserCollections] = useState<any[]>([]);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [makePublic, setMakePublic] = useState<boolean>(false);
  
  // Custom Log Date
  const [inlineLog, setInlineLog] = useState<{date: string, time: string} | null>(null);
  
  // Custom Error Toast
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom Posters
  const { customPosters } = useCustomPosters();
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  // Series Graph
  // (State removed since it's now always visible)

  // Recommendations Fallback State
  const [recsError, setRecsError] = useState(false);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };
  
  // Dynamic Color
  const [accentColor, setAccentColor] = useState<string>("#E94560"); // default

  useEffect(() => {
    if (!id || !mediaType) return;
    const controller = new AbortController();
    setLoading(true);
    setRecsError(false);

    Promise.all([
      getDetails(mediaType, id),
      getRecommendations(mediaType, id, controller.signal).catch(e => {
        if (e.name !== 'AbortError') setRecsError(true);
        return [];
      }),
      getUserInteractions(id, mediaType),
      mediaType === "tv" ? getWatchedEpisodes(id) : Promise.resolve({ success: true, episodes: [] }),
      getUserCollections()
    ]).then(([mediaData, recs, interactions, epRes, collectionsRes]) => {
      if (controller.signal.aborted) return;
      setData(mediaData);
      setRecommendations(recs);
      
      setIsWatched(interactions.watched);
      setIsWatchlist(interactions.watchlist);
      setIsFavorite(interactions.favorite || false);
      setRating(interactions.rating);
      setReview(interactions.review || "");
      setReviewDate(interactions.reviewDate || null);
      if (interactions.review) setIsReviewOpen(true);

      if (mediaType === "tv" && epRes.success && epRes.episodes) {
        setWatchedEpisodes(epRes.episodes);
      }
      if (collectionsRes.success && collectionsRes.collections) {
        setUserCollections(collectionsRes.collections);
      }
    }).catch(err => {
      if (!controller.signal.aborted) {
        console.error(err);
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, [mediaType, id]);

  useEffect(() => {
    if (data?.poster_path) {
      const fac = new FastAverageColor();
      const imageUrl = IMG.poster(data.poster_path, "w500");
      if (imageUrl) {
        const proxyUrl = `/_next/image?url=${encodeURIComponent(imageUrl)}&w=256&q=75`;
        fac.getColorAsync(proxyUrl, { algorithm: 'dominant' })
          .then(color => {
            setAccentColor(color.hex);
          })
          .catch(e => console.error("Error extracting color:", e));
      }
    }
  }, [data?.poster_path]);

  const handleToggleWatched = async () => {
    if (!data) return;
    const title = "title" in data ? data.title : data.name;
    const newWatched = !isWatched;
    setIsWatched(newWatched);
    const res = await saveLog(id, mediaType, title, data.poster_path, newWatched, rating, review);
    if (res.error) {
      showError(res.error);
      setIsWatched(!newWatched); // revert
    }
  };

  const handleSaveLogWithDate = async () => {
    if (!data || !inlineLog) return;
    const title = "title" in data ? data.title : data.name;
    const dateStr = `${inlineLog.date}T${inlineLog.time}:00`;
    const newWatched = true;
    setIsWatched(true);
    const res = await saveLog(id, mediaType, title, data.poster_path, newWatched, rating, review, dateStr);
    if (res.error) {
      showError(res.error);
      if (!isWatched) setIsWatched(false);
    } else {
      showError("Logged with date successfully!");
    }
    setInlineLog(null);
  };

  const handleSaveReview = async () => {
    if (!data) return;
    const title = "title" in data ? data.title : data.name;
    const oldWatched = isWatched;
    
    const newWatched = true; // Reviewing implies watched
    setIsWatched(newWatched);
    
    const res = await saveLog(id, mediaType, title, data.poster_path, newWatched, rating, review);
    if (res.error) {
      showError(res.error);
      setIsWatched(oldWatched);
    } else {
      showError("Review saved!");
    }
  };

  const handleRate = async (newRating: number | null) => {
    if (!data) return;
    const title = "title" in data ? data.title : data.name;
    const oldRating = rating;
    const oldWatched = isWatched;
    
    const newWatched = true; // Auto-watch when rating
    setRating(newRating);
    setIsWatched(newWatched);
    
    const res = await saveLog(id, mediaType, title, data.poster_path, newWatched, newRating, review);
    if (res.error) {
      showError(res.error);
      setRating(oldRating);
      setIsWatched(oldWatched);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!data) return;
    const title = "title" in data ? data.title : data.name;
    const res = await toggleWatchlist(id, mediaType, title, data.poster_path);
    if (res.error) showError(res.error);
    else if (res.watchlist !== undefined) setIsWatchlist(res.watchlist);
  };

  const handleToggleFavorite = async () => {
    if (!data) return;
    const title = "title" in data ? data.title : data.name;
    const res = await toggleFavorite(id, mediaType, title, data.poster_path);
    if (res.error) showError(res.error);
    else if (res.favorite !== undefined) setIsFavorite(res.favorite);
  };

  const handleAddToCollection = async (collectionId: string) => {
    if (!data) return;
    const title = "title" in data ? data.title : data.name;
    const res = await addToCollection(collectionId, id, mediaType, title, data.poster_path);
    if (res.error) {
      showError(res.error);
    } else {
      showError("Added to collection!"); // Quick success feedback
      setIsCollectionModalOpen(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    setIsCreatingCollection(true);
    const res = await createCollection(newCollectionName.trim());
    if (res.success && res.collection) {
      setUserCollections(prev => [res.collection, ...prev]);
      setNewCollectionName("");
      // Auto-add to the newly created collection
      await handleAddToCollection(res.collection.id);
    } else {
      showError(res.error || "Failed to create collection");
    }
    setIsCreatingCollection(false);
  };

  if (loading) {
    return (
      <main className={styles.loaderContainer}>
        <div className={styles.loaderSpinner}></div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className={styles.pageWrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', maxWidth: '400px' }}>
          <Film size={48} style={{ color: 'var(--dynamic-accent)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Media Unavailable</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            We're having trouble fetching this content from TMDB right now. Please try again later.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--dynamic-accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Refresh Page
          </button>
        </div>
      </main>
    );
  }

  const title = "title" in data ? data.title : data.name;
  const date = "release_date" in data ? data.release_date : data.first_air_date;
  const runtime = data.runtime || (data.episode_run_time && data.episode_run_time[0]) || 0;
  const backdrop = IMG.backdrop(data.backdrop_path, "original");
  const customPosterUrl = customPosters[`${mediaType}-${id}`];
  const poster = customPosterUrl ? IMG.poster(customPosterUrl, "w500") : IMG.poster(data.poster_path, "w500");

  const trailer = data.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer");
  const cast = (data.credits?.cast || []).slice(0, 5);
  const crew = (data.credits?.crew || []);
  
  const director = crew.find(c => c.job === "Director");
  const writer = crew.find(c => c.department === "Writing");
  const cinematographer = crew.find(c => c.job === "Director of Photography");
  const music = crew.find(c => c.job === "Original Music Composer");
  
  const creator = "created_by" in data && data.created_by && data.created_by.length > 0 ? data.created_by[0] : null;

  const crewList = [
    director,
    writer,
    cinematographer,
    music
  ].filter(Boolean);

  const tmdbReviews = data.reviews?.results || [];
  const allReviews = [];
  if (review) {
    allReviews.push({
      id: "user-review",
      author: "You",
      created_at: reviewDate || new Date().toISOString(),
      content: review,
      author_details: { rating: rating }
    });
  }
  allReviews.push(...tmdbReviews);
  const displayReviews = allReviews.slice(0, 5);

  const budget = data.budget ?? 0;
  const revenue = data.revenue ?? 0;
  const spokenLanguage = data.spoken_languages?.[0]?.english_name;

  // Fallback Movie Layout
  return (
    <main className={styles.pageWrapper} style={{ '--dynamic-accent': accentColor } as React.CSSProperties}>
      
      {/* Dark Theme Hero Section */}
      <div className={styles.heroSection}>
        {backdrop && (
          <div
            className={styles.backdropImage}
            style={{ backgroundImage: `url(${backdrop})` }}
          />
        )}
        <div className={styles.backdropGradient} />

        <div className={styles.heroContentWrapper}>
          <Navbar />
          
          <div className={styles.heroMain}>
            <button className={styles.backBtn} onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </button>
            
            <div className={styles.heroGrid}>
              
              {/* Left Side: Movie Info */}
              <div className={styles.heroLeftContainer}>
                {poster && (
                  <div className={styles.heroPosterWrapper} style={{ position: 'relative' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={poster} alt={title} className={styles.heroPoster} />
                    <button 
                      className={styles.changePosterBtn} 
                      onClick={() => setIsPosterModalOpen(true)}
                      title="Change Custom Poster"
                    >
                      <Palette size={16} />
                    </button>
                  </div>
                )}
                <div className={styles.heroLeft}>
                <p className={styles.directedBy}>
                  {mediaType === 'movie' 
                    ? (director ? `A FILM BY ${director.name.toUpperCase()}` : 'A FILM') 
                    : (creator ? `A SERIES BY ${creator.name.toUpperCase()}` : 'A TV SERIES')}
                </p>
                <h1 className={styles.title}>{title}</h1>
                
                <div className={styles.metaRow}>
                  {[
                    date ? <span key="date" className={styles.year}>{date.slice(0, 4)}</span> : null,
                    runtime > 0 ? <span key="runtime" className={styles.runtime}>{Math.floor(runtime/60)}h {runtime%60}m</span> : null,
                    data.adult !== undefined ? <span key="cert" className={styles.certification}>{data.adult ? "R" : "PG-13"}</span> : null,
                    data.vote_average > 0 ? (
                      <span key="rating" className={styles.rating}>
                        <Star size={16} fill="var(--dynamic-accent)" color="var(--dynamic-accent)" />
                        {ratingMode === "5" ? (data.vote_average / 2).toFixed(1) : data.vote_average.toFixed(1)}/{ratingMode === "5" ? "5" : "10"}
                      </span>
                    ) : null
                  ]
                  .filter(Boolean)
                  .flatMap((item, index, arr) => 
                    index < arr.length - 1 
                      ? [item, <span key={`dot-${index}`} className={styles.metaDot}>•</span>] 
                      : [item]
                  )}
                </div>

                <div className={styles.genresList}>
                  {data.genres?.map((g) => (
                    <span key={g.id} className={styles.genrePill}>{g.name.toUpperCase()}</span>
                  ))}
                </div>

                {data.tagline && (
                  <div className={styles.taglineBlock}>
                    <p className={styles.tagline}>&ldquo;{data.tagline}&rdquo;</p>
                  </div>
                )}

                <p className={styles.overviewText}>{data.overview}</p>

                <div className={styles.heroActions}>
                  {trailer && (
                    <button className={styles.watchTrailerBtn} onClick={() => setShowTrailer(true)}>
                      <Play size={16} fill="currentColor" />
                      {t('media.trailer')}
                    </button>
                  )}
                  <button className={styles.addWatchlistBtnHero} onClick={handleToggleWatchlist}>
                    {isWatchlist ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    {isWatchlist ? 'In Watchlist' : t('media.add_watchlist')}
                  </button>
                  <button className={styles.shareBtnHero} onClick={() => setShowShareModal(true)}>
                    <Share2 size={16} />
                    {t('media.share')}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right Side: Action Cards */}
            <div className={styles.heroRight}>
                
                <div className={styles.actionCard}>
                  <p className={styles.cardEyebrow}>YOUR PROGRESS</p>
                  <div className={styles.progressRow}>
                    <div className={styles.progressText}>
                      <p className={styles.progressTitle}>
                        {mediaType === "tv"
                          ? `Watched ${watchedEpisodes.length} of ${data.number_of_episodes || 0} episodes`
                          : (isWatched ? 'You have watched this' : 'You haven\'t watched this yet')}
                      </p>
                      <p className={styles.progressSub}>
                        {mediaType === "tv"
                          ? (watchedEpisodes.length > 0 ? 'Resume your journey.' : 'Start your journey and keep track of your experience.')
                          : (isWatched ? 'Log it again to update your review.' : 'Start your journey and keep track of your experience.')}
                      </p>
                    </div>
                    <div className={styles.progressRing}>
                      <span className={styles.progressPercentage}>
                        {mediaType === "tv" 
                          ? `${data.number_of_episodes ? Math.round((watchedEpisodes.length / data.number_of_episodes) * 100) : 0}%` 
                          : (isWatched ? '100%' : '0%')}
                      </span>
                      <svg className={styles.ringSvg} viewBox="0 0 36 36">
                        <path className={styles.ringBg} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className={styles.ringFill} 
                          strokeDasharray={`${mediaType === "tv" ? (data.number_of_episodes ? Math.round((watchedEpisodes.length / data.number_of_episodes) * 100) : 0) : (isWatched ? '100' : '0')}, 100`} 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                    </div>
                  </div>
                  <button 
                    className={styles.markWatchedBtn}
                    style={inlineLog ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}}
                    onClick={() => {
                      if (!isWatched) setInlineLog({
                        date: new Date().toISOString().split('T')[0],
                        time: new Date().toTimeString().slice(0,5)
                      });
                      else handleToggleWatched();
                    }}
                  >
                    {mediaType === "tv"
                      ? (watchedEpisodes.length > 0 ? <><Play size={16} /> Resume</> : <><Play size={16} /> Watch Now</>)
                      : (isWatched ? <><Check size={18} strokeWidth={3} /> Watched</> : <><Check size={18} strokeWidth={3} /> Mark as Watched</>)}
                    
                    {mediaType === "movie" && (
                      inlineLog ? <ChevronUp size={18} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={18} style={{ marginLeft: 'auto' }} />
                    )}
                  </button>

                  {inlineLog && (
                    <>
                      <div className={styles.inlineLogContainer} style={inlineLog ? { borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 } : {}}>
                        <div className={styles.inlineLogInputs}>
                          <div className={styles.inlineLogField}>
                            <label>DATE</label>
                            <input 
                              type="date" 
                              value={inlineLog.date} 
                              onChange={e => setInlineLog({...inlineLog, date: e.target.value})}
                            />
                          </div>
                          <div className={styles.inlineLogField}>
                            <label>TIME</label>
                            <input 
                              type="time" 
                              value={inlineLog.time} 
                              onChange={e => setInlineLog({...inlineLog, time: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className={styles.inlineLogActions}>
                          <button className={styles.saveLogBtn} onClick={handleSaveLogWithDate}>Save Log</button>
                          <button className={styles.cancelLogBtn} onClick={() => setInlineLog(null)}>Cancel</button>
                        </div>
                      </div>
                      <div className={styles.inlineLogFooter}>
                        <Clock size={14} /> This will be added to your watch history and statistics.
                      </div>
                    </>
                  )}
                </div>

                <div className={styles.actionCard}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <p className={styles.cardEyebrow}>RATE & REVIEW</p>
                    {!isReviewOpen && (
                      <button 
                        className={styles.openReviewBtn} 
                        onClick={() => setIsReviewOpen(true)}
                      >
                        <MessageSquare size={14} /> Write Review
                      </button>
                    )}
                  </div>
                  <div className={styles.rateRow}>
                    <div className={styles.tenStars}>
                      <RatingPicker 
                        rating={rating} 
                        onChange={(r) => handleRate(r)} 
                        size={24} 
                        emptyColor="rgba(0,0,0,0.2)"
                      />
                    </div>
                    <span className={styles.ratingScore}>{rating ? (ratingMode === "5" ? rating / 2 : rating) : '0'}/{ratingMode === "5" ? "5" : "10"}</span>
                  </div>
                  
                  {isReviewOpen && (
                    <div className={styles.reviewInputContainer}>
                      <textarea 
                        className={styles.reviewTextarea}
                        placeholder={`What did you think of this ${mediaType}?`}
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={3}
                      />
                      <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px'}}>
                        <button 
                          className={styles.cancelReviewBtn}
                          onClick={() => setIsReviewOpen(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          className={styles.saveReviewBtn}
                          onClick={handleSaveReview}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.actionCard}>
                  <p className={styles.cardEyebrow}>ADD TO</p>
                  <div className={styles.addToRow}>
                    <button className={styles.addToBtn} onClick={handleToggleWatchlist}>
                      {isWatchlist ? <CheckCircle2 size={16} /> : <Bookmark size={16} />}
                      Watchlist
                    </button>
                    <button className={styles.addToBtn} onClick={handleToggleFavorite}>
                      {isFavorite ? <Heart size={16} fill="currentColor" /> : <Heart size={16} />}
                      Favorites
                    </button>
                    <button className={styles.addToBtn} onClick={() => setIsCollectionModalOpen(true)}>
                      <ListPlus size={16} />
                      Collections
                    </button>
                  </div>
                </div>

                <WatchProviders watchData={data["watch/providers"]} />
              </div>
            </div>
            
            {/* Quick stats at bottom of hero */}
            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <Film size={20} />
                <div>
                  <p className={styles.statValue}>{ratingMode === "5" ? (data.vote_average / 2).toFixed(1) : data.vote_average.toFixed(1)}/{ratingMode === "5" ? "5" : "10"}</p>
                  <p className={styles.statLabel}>TMDB Rating</p>
                </div>
              </div>
              <div className={styles.statItem}>
                <Eye size={20} />
                <div>
                  <p className={styles.statValue}>{data.vote_count}</p>
                  <p className={styles.statLabel}>Votes</p>
                </div>
              </div>
              {(revenue ?? 0) > 0 && (
                <div className={styles.statItem}>
                  <Star size={20} />
                  <div>
                    <p className={styles.statValue}>${(revenue! / 1000000).toFixed(0)}M</p>
                    <p className={styles.statLabel}>Box Office</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Light Theme Body Section */}
      <div className={styles.lightSection}>
        <div className={styles.lightContainer}>
          
          {mediaType === "tv" && data.seasons && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
              <SeriesGraph tmdbId={id} seasons={data.seasons} />
              <TVSeasons tmdbId={id} seasons={data.seasons} accentColor={accentColor} />
            </div>
          )}

          <div className={styles.lightTopGrid}>
            <div className={styles.castCrewCol}>
              <div className={styles.sectionHeaderRow}>
                <h3 className={styles.lightHeading}>CAST & CREW</h3>
                <button className={styles.seeAllBtn} style={{ color: 'var(--dynamic-accent)' }}>See all &rarr;</button>
              </div>
              <div className={styles.castCrewGrid}>
                {[...(data.credits?.cast || []).slice(0, 10), ...(data.credits?.crew || []).slice(0, 5)].map((member, idx) => (
                  <div key={`${member?.id}-${idx}`} className={styles.crewMember} onClick={() => router.push(`/person/${member.id}`)}>
                    {member?.profile_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={IMG.poster(member.profile_path, "w185") ?? undefined} alt={member?.name} className={styles.crewPhoto} />
                    ) : (
                      <div className={styles.crewFallback}><User size={24} /></div>
                    )}
                    <div className={styles.crewInfo}>
                      <p className={styles.crewName} title={member?.name}>{member?.name}</p>
                      <p className={styles.crewJob} title={('character' in member) ? member.character : (member.job || member.department)}>
                        {('character' in member) ? member.character : (member.job || member.department)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.lightBottomGrid}>
            
            <div className={styles.reviewsCol}>
              <div className={styles.sectionHeaderRow}>
                <h3 className={styles.lightHeading}>REVIEWS</h3>
                <button className={styles.seeAllBtn} style={{ color: 'var(--dynamic-accent)' }}>See all &rarr;</button>
              </div>
              <div className={styles.reviewsList}>
                {displayReviews.length > 0 ? displayReviews.slice(0, 2).map((rev) => (
                  <div key={rev.id} className={styles.lightReviewCard}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewerAvatar}>
                        {rev.author[0].toUpperCase()}
                      </div>
                      <div className={styles.reviewerInfo}>
                        <p className={styles.reviewerNameLight}>{rev.author}</p>
                        <p className={styles.reviewDate}>{new Date(rev.created_at).toLocaleDateString()}</p>
                      </div>
                      {rev.author_details?.rating && (
                        <StarRating rating={rev.author_details.rating} size={12} fillColor="var(--dynamic-accent)" emptyColor="transparent" />
                      )}
                    </div>
                    <p className={styles.reviewBodyLight}>
                      {rev.content.length > 150 ? rev.content.slice(0, 150) + "..." : rev.content}
                    </p>
                    <div className={styles.reviewFooter}>
                      <span className={styles.watchedTag}>Watched</span>
                    </div>
                  </div>
                )) : (
                  <p style={{ color: '#888', fontSize: '14px', fontStyle: 'italic' }}>No reviews yet.</p>
                )}
              </div>
            </div>

            <div className={styles.recommendationsCol}>
              <div className={styles.sectionHeaderRow}>
                <h3 className={styles.lightHeading}>YOU MAY ALSO LIKE</h3>
                {recommendations.length > 5 && (
                  <button 
                    className={styles.seeAllBtn} 
                    style={{ color: 'var(--dynamic-accent)' }}
                    onClick={() => router.push(`/search?mode=recommendations&media_type=${mediaType}&media_id=${id}&title=${encodeURIComponent(title)}`)}
                  >
                    See all &rarr;
                  </button>
                )}
              </div>
              <div className={styles.recGridLight}>
                {recsError ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '16px' }}>Recommendations unavailable</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>We couldn't load similar titles right now.</p>
                    <button 
                      onClick={() => {
                        setRecsError(false);
                        getRecommendations(mediaType as "movie" | "tv", id).then(setRecommendations).catch(() => setRecsError(true));
                      }}
                      style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: 'var(--dynamic-accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: 'fit-content', fontWeight: 'bold' }}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  recommendations.slice(0, 5).map(rec => {
                    const recTitle = "title" in rec ? rec.title : rec.name;
                    const recYear = ("release_date" in rec ? rec.release_date : rec.first_air_date || "").slice(0, 4);
                    return (
                      <div key={rec.id} className={styles.recCardLight} onClick={() => router.push(`/${mediaType}/${rec.id}`)}>
                        {rec.backdrop_path ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={IMG.backdrop(rec.backdrop_path, "w300") ?? undefined} alt={recTitle} className={styles.recImgLight} />
                        ) : <div className={styles.recFallback}><Film size={20}/></div>}
                        <div className={styles.recOverlayLight}>
                          <span className={styles.recCardTitleLight}>{recTitle}</span>
                          <span className={styles.recCardYearLight}>{recYear}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

          </div>
          
          <div className={styles.lightBottomGrid} style={{ marginTop: '3rem' }}>
            {data.videos && data.videos.results.length > 0 && (
              <div style={{ gridColumn: '1 / -1', marginBottom: '1rem', minWidth: 0 }}>
                <div className={styles.sectionHeaderRow}>
                  <h3 className={styles.lightHeading}>VIDEOS & TRAILERS</h3>
                </div>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.2) transparent' }}>
                  {data.videos.results.slice(0, 10).map((vid: any) => (
                    <div key={vid.id} style={{ minWidth: '280px', maxWidth: '280px', cursor: 'pointer', flexShrink: 0 }} onClick={() => {
                        window.open(`https://www.youtube.com/watch?v=${vid.key}`, '_blank');
                    }}>
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <img src={`https://img.youtube.com/vi/${vid.key}/hqdefault.jpg`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} alt={vid.name} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          <Play size={24} color="white" fill="white" />
                        </div>
                      </div>
                      <p style={{ marginTop: '12px', fontSize: '14px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vid.name}</p>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>{vid.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', gridColumn: '1 / -1', padding: '1rem 0', minWidth: 0 }}>
              <div style={{ flex: '1 1 300px', backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', minWidth: 0 }}>
                 <div className={styles.sectionHeaderRow} style={{ marginBottom: '16px' }}>
                    <h3 className={styles.lightHeading}>DETAILS</h3>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
                   {data.status && (
                     <div>
                       <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px' }}>STATUS</p>
                       <p style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500 }}>{data.status}</p>
                     </div>
                   )}
                   {budget > 0 && (
                     <div>
                       <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px' }}>BUDGET</p>
                       <p style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500 }}>${(budget / 1000000).toFixed(1)}M</p>
                     </div>
                   )}
                   {revenue > 0 && (
                     <div>
                       <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px' }}>REVENUE</p>
                       <p style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500 }}>${(revenue / 1000000).toFixed(1)}M</p>
                     </div>
                   )}
                   {spokenLanguage && (
                     <div>
                       <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px' }}>LANGUAGE</p>
                       <p style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500 }}>{spokenLanguage}</p>
                     </div>
                   )}
                   {data.production_companies && data.production_companies.length > 0 && (
                     <div style={{ gridColumn: '1 / -1' }}>
                       <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px' }}>PRODUCTION</p>
                       <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                         {data.production_companies.slice(0,4).map((pc: any) => (
                           <span key={pc.id} style={{ fontSize: '13px', padding: '6px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px', color: '#334155', fontWeight: 500 }}>
                             {pc.name}
                           </span>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
              </div>
              
              {(data as any).belongs_to_collection && (
                <div style={{ flex: '1 1 300px', backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                   <div className={styles.sectionHeaderRow} style={{ marginBottom: '16px' }}>
                      <h3 className={styles.lightHeading}>PART OF COLLECTION</h3>
                   </div>
                   <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                     {(data as any).belongs_to_collection.poster_path ? (
                       <img src={`https://image.tmdb.org/t/p/w200${(data as any).belongs_to_collection.poster_path}`} style={{ width: '80px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} alt="" />
                     ) : (
                       <div style={{ width: '80px', height: '120px', backgroundColor: '#cbd5e1', borderRadius: '8px' }} />
                     )}
                     <div>
                       <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{(data as any).belongs_to_collection.name}</p>
                       <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Explore the complete series.</p>
                       <button style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: 'var(--dynamic-accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }} onClick={() => router.push(`/collections/${(data as any).belongs_to_collection.id}`)}>
                         View Collection
                       </button>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showTrailer && trailer && (
        <div className={styles.trailerModalOverlay} onClick={() => setShowTrailer(false)}>
          <button className={styles.closeTrailerBtn} onClick={() => setShowTrailer(false)}>
            <X size={24} />
          </button>
          <div className={styles.trailerModalContent} onClick={e => e.stopPropagation()}>
            <iframe 
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=${settings.autoplayTrailers ? "1" : "0"}${settings.muteTrailersByDefault ? "&mute=1" : ""}`} 
              allow="autoplay; encrypted-media" 
              allowFullScreen 
              className={styles.trailerIframe}
            />
          </div>
        </div>
      )}


      {/* ADD TO COLLECTION MODAL */}
      {isCollectionModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCollectionModalOpen(false)}>
          <div className={styles.addCollectionModal} onClick={e => e.stopPropagation()}>
            <div className={styles.addCollectionHeader}>
              <h2 className={styles.addCollectionTitle}>Add to Collection</h2>
              <button className={styles.addCollectionCloseBtn} onClick={() => setIsCollectionModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {data && (
              <div className={styles.addCollectionMediaCard}>
                <img src={data.poster_path ? `https://image.tmdb.org/t/p/w200${data.poster_path}` : '/cinematic_login_hero.png'} alt="" className={styles.addCollectionMediaPoster} />
                <div className={styles.addCollectionMediaInfo}>
                  <h3 className={styles.addCollectionMediaTitle}>{"title" in data ? data.title : data.name}</h3>
                  <div className={styles.addCollectionMediaMeta}>
                    <span>{("release_date" in data ? data.release_date : data.first_air_date)?.slice(0, 4)}</span>
                    <span className={styles.metaDot}>•</span>
                    {("runtime" in data && typeof (data as any).runtime === 'number' && (data as any).runtime > 0) && (
                      <>
                        <span>{Math.floor((data as any).runtime/60)}h {(data as any).runtime%60}m</span>
                        <span className={styles.metaDot}>•</span>
                      </>
                    )}
                    <span style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#00E5C5'}}><Star size={12} fill="currentColor" /> {data.vote_average.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.addCollectionSection}>
              <p className={styles.addCollectionEyebrow}>ADD TO EXISTING COLLECTION</p>
              
              <div className={styles.addCollectionList}>
                {userCollections.length > 0 ? (
                  userCollections.map(collection => (
                    <div 
                      key={collection.id} 
                      className={styles.addCollectionListItem}
                      onClick={() => setSelectedCollectionId(collection.id)}
                    >
                      <div className={styles.addCollectionListPosterContainer}>
                        {collection.items && collection.items.length > 0 ? (
                          <img 
                            src={collection.items[0].poster ? `https://image.tmdb.org/t/p/w200${collection.items[0].poster}` : '/cinematic_login_hero.png'}
                            className={styles.addCollectionListPoster}
                            alt=""
                          />
                        ) : (
                          <div className={styles.addCollectionListEmpty}>
                            <ListPlus size={16} />
                          </div>
                        )}
                      </div>
                      <div className={styles.addCollectionListInfo}>
                        <span className={styles.addCollectionListName}>{collection.name}</span>
                        <span className={styles.addCollectionListCount}>{collection._count?.items || 0} movies</span>
                      </div>
                      <div className={`${styles.addCollectionRadio} ${selectedCollectionId === collection.id ? styles.radioSelected : ''}`}>
                        {selectedCollectionId === collection.id && <div className={styles.radioInner} />}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontStyle: 'italic', padding: '8px 0' }}>No collections yet.</p>
                )}
              </div>
            </div>

            <div className={styles.addCollectionSection}>
              <p className={styles.addCollectionEyebrow}>CREATE NEW COLLECTION</p>
              <form onSubmit={handleCreateCollection} className={styles.addCollectionForm}>
                <input 
                  type="text" 
                  placeholder="New collection name..." 
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  className={styles.addCollectionInput}
                />
                <button 
                  type="submit" 
                  disabled={isCreatingCollection || !newCollectionName.trim()}
                  className={styles.addCollectionCreateBtn}
                >
                  Create
                </button>
              </form>
            </div>

            <div className={styles.addCollectionFooter}>
              <label className={styles.addCollectionPublicToggle}>
                <div className={`${styles.checkbox} ${makePublic ? styles.checkboxChecked : ''}`} onClick={() => setMakePublic(!makePublic)}>
                  {makePublic && <CheckCircle2 size={12} strokeWidth={4} color="#0B111A" />}
                </div>
                <span>Make this collection public</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}><Eye size={14} /></span>
              </label>
              
              <button 
                className={styles.addCollectionSubmitBtn}
                onClick={() => selectedCollectionId && handleAddToCollection(selectedCollectionId)}
                disabled={!selectedCollectionId}
              >
                Add to Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR TOAST */}
      {errorMsg && (
        <div style={{
          position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
          backgroundColor: "#E94560", color: "white", padding: "12px 24px",
          borderRadius: "8px", zIndex: 9999, fontWeight: "bold",
          boxShadow: "0 10px 25px rgba(233,69,96,0.4)",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          {errorMsg}
        </div>
      )}
      {showShareModal && (
        <div className={styles.shareModalOverlay} onClick={() => setShowShareModal(false)}>
          <div className={styles.shareModalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeShareBtn} onClick={() => setShowShareModal(false)}>
              <X size={20} />
            </button>
            <h3 className={styles.shareModalTitle}>Share this {mediaType === "movie" ? "Movie" : "Show"}</h3>
            <div className={styles.shareOptions}>
              <button className={styles.shareOption} onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showError("Link copied to clipboard!");
                setShowShareModal(false);
              }}>
                <div className={styles.shareIconWrapper} style={{ backgroundColor: '#4A7FA7' }}><Copy size={20} color="white" /></div>
                <span>Copy Link</span>
              </button>
              <a className={styles.shareOption} href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out ${title} on Velune!`)}`} target="_blank" rel="noopener noreferrer">
                <div className={styles.shareIconWrapper} style={{ backgroundColor: '#1DA1F2' }}><span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>𝕏</span></div>
                <span>Twitter</span>
              </a>
              <a className={styles.shareOption} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer">
                <div className={styles.shareIconWrapper} style={{ backgroundColor: '#4267B2' }}><span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>f</span></div>
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Custom Poster Modal */}
      <CustomPosterModal 
        isOpen={isPosterModalOpen}
        onClose={() => setIsPosterModalOpen(false)}
        tmdbId={id}
        mediaType={mediaType}
      />
    </main>
  );
}
