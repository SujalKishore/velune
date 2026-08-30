"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { searchMulti, getDetails, getRecommendations, IMG, type SearchResult, type DetailedMedia } from "@/lib/tmdb";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { Play, Plus, Heart, MoreHorizontal, Filter, ArrowRight, User, Star, ChevronDown, Check } from "lucide-react";
import { getUserInteractions, toggleWatchlist, toggleFavorite } from "@/app/actions/history";
import { searchUsers } from "@/app/actions/user";
import { useSettings } from "@/contexts/SettingsContext";

import { getSpellcheckSuggestion } from "@/app/actions/spellcheck";

const FILTERS = ["All", "Movies", "TV Shows", "People", "Universes", "Users"];

function HorizontalCarousel({ title, count, children }: { title: string, count: number, children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className={styles.carouselSection}>
      <div className={styles.carouselHeader}>
        <h3 className={styles.carouselTitle}>{title}</h3>
        <span className={styles.viewAllLink}>View all ({count}) <ArrowRight size={12} style={{marginLeft: 4}} /></span>
      </div>
      <div className={styles.carouselWrapper}>
        <div className={styles.carouselTrack} ref={scrollRef}>
          {children}
        </div>
        <button className={styles.scrollBtn} onClick={() => {
          if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }}>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const mode = searchParams.get("mode");
  const mediaType = searchParams.get("media_type") as "movie" | "tv";
  const mediaId = searchParams.get("media_id");
  const referenceTitle = searchParams.get("title") || "";
  const router = useRouter();
  const { settings } = useSettings();
  const ratingMode = settings?.ratingSystem || "10";

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [topResultDetail, setTopResultDetail] = useState<DetailedMedia | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("Most Relevant");
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  useEffect(() => {
    if (mode === "recommendations" && mediaType && mediaId) {
      setLoading(true);
      setCorrectedQuery(null);
      getRecommendations(mediaType, mediaId)
        .then((recs) => {
          const formatted = recs.map((r: any) => ({
            ...r,
            media_type: mediaType
          })) as SearchResult[];
          setResults(formatted);
          setUserResults([]);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
      return;
    }

    if (!query.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setCorrectedQuery(null);
    Promise.all([
      searchMulti(query),
      searchUsers(query)
    ])
      .then(async ([res, userRes]) => {
        let safeResults = Array.isArray(res) ? res : (res as any).results || [];
        let safeUserResults = userRes.success ? (userRes.users || []) : [];
        let finalQueryCorrection: string | null = null;

        if (safeResults.length === 0 && safeUserResults.length === 0) {
          const suggestion = await getSpellcheckSuggestion(query);
          if (suggestion && suggestion.toLowerCase() !== query.toLowerCase()) {
            finalQueryCorrection = suggestion;
            const [corrRes, corrUserRes] = await Promise.all([
              searchMulti(suggestion),
              searchUsers(suggestion)
            ]);
            safeResults = Array.isArray(corrRes) ? corrRes : (corrRes as any).results || [];
            safeUserResults = corrUserRes.success ? (corrUserRes.users || []) : [];
          }
        }

        setResults(safeResults);
        setUserResults(safeUserResults);
        setCorrectedQuery(finalQueryCorrection);
        
        if (safeResults.length > 0) {
          const top = safeResults[0];
          if (top.media_type === "movie" || top.media_type === "tv") {
            try {
              const details = await getDetails(top.media_type, top.id.toString());
              setTopResultDetail(details);
              
              const interactions = await getUserInteractions(top.id.toString(), top.media_type);
              setIsWatchlist(interactions.watchlist || false);
              setIsFavorite(interactions.favorite || false);
            } catch (err) {
              console.error(err);
            }
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [query, mode, mediaType, mediaId]);

  if (loading) {
    return (
      <main className={styles.pageWrapper}>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Searching universe...</p>
        </div>
      </main>
    );
  }

  const topResult = results.length > 0 ? results[0] : null;
  let movies = results.filter(r => r.media_type === "movie");
  let tvShows = results.filter(r => r.media_type === "tv");
  let people = results.filter(r => r.media_type === "person");
  let universes = results.filter(r => r.media_type === "universe");

  if (sortBy === "Highest Rated") {
    movies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    tvShows.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  } else if (sortBy === "Newest First") {
    movies.sort((a, b) => new Date(b.release_date || "1900-01-01").getTime() - new Date(a.release_date || "1900-01-01").getTime());
    tvShows.sort((a, b) => new Date(b.first_air_date || "1900-01-01").getTime() - new Date(a.first_air_date || "1900-01-01").getTime());
  }

  // Top Result Display Logic
  const isTopMovieOrTV = topResult && (topResult.media_type === "movie" || topResult.media_type === "tv");
  const topTitle = topResult?.title || topResult?.name;
  const topYear = (topResult?.release_date || topResult?.first_air_date || "").slice(0, 4);
  const topRating = topResult?.vote_average ? (ratingMode === "5" ? (topResult.vote_average / 2).toFixed(1) : topResult.vote_average.toFixed(1)) : "N/A";
  
  // Details logic
  const runtime = topResultDetail?.runtime ? `${Math.floor(topResultDetail.runtime / 60)}h ${topResultDetail.runtime % 60}m` : null;
  const cert = topResultDetail?.adult ? "R" : "PG-13"; // mock cert
  const genres = topResultDetail?.genres?.slice(0, 3).map(g => g.name) || [];
  const overview = topResultDetail?.overview || (topResult as any)?.overview || "";
  
  // Watch providers logic
  const providers = topResultDetail?.["watch/providers"]?.results?.US?.flatrate || [];

  const handleToggleWatchlist = async () => {
    if (!topResultDetail || !topResult) return;
    const title = topResult.title || topResult.name || "";
    const res = await toggleWatchlist(topResult.id.toString(), topResult.media_type as "movie" | "tv", title, topResult.poster_path ?? null);
    if (res.error) showError(res.error);
    else if (res.watchlist !== undefined) setIsWatchlist(res.watchlist);
  };

  const handleToggleFavorite = async () => {
    if (!topResultDetail || !topResult) return;
    const title = topResult.title || topResult.name || "";
    const res = await toggleFavorite(topResult.id.toString(), topResult.media_type as "movie" | "tv", title, topResult.poster_path ?? null);
    if (res.error) showError(res.error);
    else if (res.favorite !== undefined) setIsFavorite(res.favorite);
  };

  return (
    <main className={styles.pageWrapper}>
      <Navbar />
      
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>
            {mode === "recommendations" ? (
              <>More like <span className={styles.queryHighlight}>"{referenceTitle}"</span></>
            ) : (
              <>Search results for <span className={styles.queryHighlight}>"{correctedQuery || query}"</span></>
            )}
          </h1>
          {correctedQuery && mode !== "recommendations" && (
            <p className={styles.correctionText} style={{ marginTop: 8, marginBottom: 24, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              Showing results for <span className={styles.queryHighlight} style={{ color: 'white' }}>"{correctedQuery}"</span> instead of "{query}".
            </p>
          )}
          
          <div className={styles.filtersRow}>
            <div className={styles.pills}>
              {FILTERS.map(f => (
                <button 
                  key={f} 
                  className={`${styles.pill} ${activeFilter === f ? styles.pillActive : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            
            <div className={styles.rightFilters}>
              <div className={styles.sortDropdown}>
                <span>Sort by:</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <select className={styles.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="Most Relevant">Most Relevant</option>
                    <option value="Newest First">Newest First</option>
                    <option value="Highest Rated">Highest Rated</option>
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
                </div>
              </div>
              <button className={styles.advancedFiltersBtn}>
                <Filter size={14} style={{marginRight: 6}} /> Filters
              </button>
            </div>
          </div>
        </div>

        {/* TOP RESULT */}
        {topResult && isTopMovieOrTV && (activeFilter === "All" || activeFilter === (topResult.media_type === "movie" ? "Movies" : "TV Shows")) && (() => {
          const director = topResultDetail?.credits?.crew?.find(c => c.job === "Director")?.name || "Unknown";
          const writers = topResultDetail?.credits?.crew?.filter(c => c.department === "Writing").slice(0, 2).map(c => c.name).join(", ") || "Unknown";
          const stars = topResultDetail?.credits?.cast?.slice(0, 3).map(c => c.name).join(", ") || "Unknown";
          
          return (
            <div className={styles.topResultSection}>
              <div 
                className={styles.topResultCard} 
                style={{ backgroundImage: `url(${IMG.backdrop(topResultDetail?.backdrop_path || (topResult as any).backdrop_path, "original")})` }}
              >
                <div className={styles.topResultOverlay} />
                
                <div className={styles.topResultContent}>
                  <div className={styles.topResultLeft}>
                    <div className={styles.topPosterWrap} onClick={() => router.push(`/${topResult.media_type}/${topResult.id}`)}>
                      {topResult.poster_path ? (
                        <img src={IMG.poster(topResult.poster_path, "w500") ?? undefined} alt={topTitle} className={styles.topPoster} />
                      ) : (
                        <div className={styles.topPosterFallback}>No Image</div>
                      )}
                    </div>
                    
                    <div className={styles.topInfo}>
                      <span className={styles.topResultLabel}><Star size={10} fill="currentColor" /> TOP RESULT</span>
                      <h2 className={styles.topTitle}>{topTitle}</h2>
                      
                      <div className={styles.topMeta}>
                        <span>{topYear}</span>
                        {runtime && <><span className={styles.dot}>•</span><span>{runtime}</span></>}
                        <><span className={styles.dot}>•</span><span>{cert}</span></>
                        <><span className={styles.dot}>•</span><span className={styles.topRating}><Star size={12} fill="var(--primary-accent)" color="var(--primary-accent)" style={{marginRight: 4}} /> {topRating}/{ratingMode === "5" ? "5" : "10"}</span> <span className={styles.imdbBox}>IMDb</span></>
                      </div>
                      
                      {genres.length > 0 && (
                        <div className={styles.genreTags}>
                          {genres.map(g => <span key={g} className={styles.genreTag}>{g}</span>)}
                        </div>
                      )}

                      <p className={styles.topOverview}>{overview}</p>
                      
                      <div className={styles.topCredits}>
                        <div className={styles.creditRow}>
                          <span className={styles.creditLabel}>Director</span>
                          <span className={styles.creditValue}>{director}</span>
                        </div>
                        <div className={styles.creditRow}>
                          <span className={styles.creditLabel}>Writer</span>
                          <span className={styles.creditValue}>{writers}</span>
                        </div>
                        <div className={styles.creditRow}>
                          <span className={styles.creditLabel}>Stars</span>
                          <span className={styles.creditValue}>{stars}</span>
                        </div>
                      </div>
                      
                      <div className={styles.topActions}>
                        <button className={styles.watchNowBtn} onClick={() => router.push(`/${topResult.media_type}/${topResult.id}`)}>
                          <Play size={16} fill="currentColor" /> Watch Now
                        </button>
                        <button className={styles.actionBtn} onClick={handleToggleWatchlist}>
                          {isWatchlist ? <Check size={16} /> : <Plus size={16} />} Watchlist
                        </button>
                        <button className={styles.actionBtn} onClick={handleToggleFavorite}>
                          <Heart size={16} fill={isFavorite ? "#E94560" : "none"} color={isFavorite ? "#E94560" : "currentColor"} /> Favorite
                        </button>
                        <button className={styles.iconBtn}><MoreHorizontal size={16} /></button>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.topResultRight}>
                    <div className={styles.whereToWatch}>
                      <h4 className={styles.wtwTitle}>WHERE TO WATCH</h4>
                      {providers.length > 0 ? (
                        <>
                          <div className={styles.providersList}>
                            {providers.slice(0, 4).map((p: any) => (
                              <img key={p.provider_id} src={`https://image.tmdb.org/t/p/w200${p.logo_path}`} alt={p.provider_name} className={styles.providerIcon} />
                            ))}
                            {providers.length > 4 && (
                              <div className={styles.providerArrow}><ArrowRight size={14} /></div>
                            )}
                          </div>
                          {providers.length > 4 && <span className={styles.andMore}>and {providers.length - 4} more platforms <ArrowRight size={10} style={{marginLeft: 4}} /></span>}
                        </>
                      ) : (
                        <p className={styles.noProviders}>Not currently streaming</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MOVIES */}
        {movies.length > 0 && (activeFilter === "All" || activeFilter === "Movies") && (
          <HorizontalCarousel title="Movies" count={movies.length}>
            {movies.map(m => (
              <div key={m.id} className={styles.mediaCard} onClick={() => router.push(`/movie/${m.id}`)}>
                <div className={styles.posterWrap}>
                  {m.poster_path ? (
                    <img src={IMG.poster(m.poster_path, "w300") ?? undefined} alt={m.title} className={styles.poster} />
                  ) : (
                    <div className={styles.posterFallback}>No Image</div>
                  )}
                  {m.vote_average ? (
                    <div className={styles.ratingBadge}>{ratingMode === "5" ? (m.vote_average / 2).toFixed(1) : m.vote_average.toFixed(1)}</div>
                  ) : null}
                </div>
                <h4 className={styles.cardTitle}>{m.title}</h4>
                <p className={styles.cardYear}>{m.release_date?.slice(0, 4) || "Unknown"}</p>
              </div>
            ))}
          </HorizontalCarousel>
        )}

        {/* TV SHOWS */}
        {tvShows.length > 0 && (activeFilter === "All" || activeFilter === "TV Shows") && (
          <HorizontalCarousel title="TV Shows" count={tvShows.length}>
            {tvShows.map(tv => (
              <div key={tv.id} className={styles.mediaCard} onClick={() => router.push(`/tv/${tv.id}`)}>
                <div className={styles.posterWrap}>
                  {tv.poster_path ? (
                    <img src={IMG.poster(tv.poster_path, "w300") ?? undefined} alt={tv.name} className={styles.poster} />
                  ) : (
                    <div className={styles.posterFallback}>No Image</div>
                  )}
                  {tv.vote_average ? (
                    <div className={styles.ratingBadge}>{ratingMode === "5" ? (tv.vote_average / 2).toFixed(1) : tv.vote_average.toFixed(1)}</div>
                  ) : null}
                </div>
                <h4 className={styles.cardTitle}>{tv.name}</h4>
                <p className={styles.cardYear}>{tv.first_air_date?.slice(0, 4) || "Unknown"}</p>
              </div>
            ))}
          </HorizontalCarousel>
        )}

        {/* UNIVERSES */}
        {universes.length > 0 && (activeFilter === "All" || activeFilter === "Universes") && (
          <HorizontalCarousel title="Universes" count={universes.length}>
            {universes.map(u => (
              <div key={u.id} className={styles.mediaCard} onClick={() => router.push(`/universes/${u.id}`)}>
                <div className={styles.posterWrap}>
                  {u.poster_path ? (
                    <img src={IMG.poster(u.poster_path, "w300") ?? undefined} alt={u.name} className={styles.poster} />
                  ) : (
                    <div className={styles.posterFallback}>No Image</div>
                  )}
                </div>
                <h4 className={styles.cardTitle}>{u.name}</h4>
                <p className={styles.cardYear}>Universe Hub</p>
              </div>
            ))}
          </HorizontalCarousel>
        )}

        {/* PEOPLE */}
        {people.length > 0 && (activeFilter === "All" || activeFilter === "People") && (
          <HorizontalCarousel title="People" count={people.length}>
            {people.map(p => (
              <div key={p.id} className={styles.mediaCard} onClick={() => router.push(`/person/${p.id}`)}>
                <div className={styles.posterWrap}>
                  {p.profile_path ? (
                    <img src={IMG.poster(p.profile_path, "w300") ?? undefined} alt={p.name} className={styles.poster} />
                  ) : (
                    <div className={styles.posterFallback}><User size={24} /></div>
                  )}
                </div>
                <h4 className={styles.cardTitle}>{p.name}</h4>
                <p className={styles.cardYear}>Known for {(p as any).known_for_department || "Acting"}</p>
              </div>
            ))}
          </HorizontalCarousel>
        )}



        {/* USERS */}
        {userResults.length > 0 && (activeFilter === "All" || activeFilter === "Users") && (
          <HorizontalCarousel title="Users" count={userResults.length}>
            {userResults.map(u => (
              <div key={u.id} className={styles.mediaCard} onClick={() => router.push(`/profile/${u.username || u.id}`)}>
                <div className={styles.posterWrap} style={{ borderRadius: '50%', overflow: 'hidden', aspectRatio: '1/1', height: '160px' }}>
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.name} className={styles.poster} style={{ objectFit: 'cover' }} referrerPolicy="no-referrer" />
                  ) : (
                    <div className={styles.posterFallback} style={{ borderRadius: '50%' }}><User size={32} /></div>
                  )}
                </div>
                <h4 className={styles.cardTitle} style={{ textAlign: 'center', marginTop: '12px' }}>{u.name}</h4>
                <p className={styles.cardYear} style={{ textAlign: 'center' }}>@{u.username || u.id.slice(0, 8)}</p>
              </div>
            ))}
          </HorizontalCarousel>
        )}

        {results.length === 0 && userResults.length === 0 && !loading && (
          <div className={styles.emptyState}>
            {mode === "recommendations" ? (
              <>
                <h2>No recommendations found for "{referenceTitle}"</h2>
                <p>We couldn't find any similar titles at this time.</p>
              </>
            ) : (
              <>
                <h2>No results found for "{correctedQuery || query}"</h2>
                <p>Try searching for a different movie, show, person, or user.</p>
              </>
            )}
          </div>
        )}
      </div>

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
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className={styles.loadingContainer}><div className={styles.spinner}></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
