"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getTrendingAll, 
  getDetails, 
  getPersonDetails, 
  getDiscoverMovies,
  IMG, 
  type Movie, 
  type TVShow,
  type PersonDetails,
  type DetailedMedia
} from "@/lib/tmdb";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";
import { Star, Play, Plus, Loader2, Bookmark, BarChart2, MessageSquare, Quote, Globe, Check } from "lucide-react";

type MediaItem = (Movie | TVShow) & { media_type: "movie" | "tv" };

export default function TrendingPage() {
  const router = useRouter();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year" | "all">("week");
  
  // Extra data for specialized sections
  const [directorData, setDirectorData] = useState<{ person: PersonDetails, movies: any[] } | null>(null);
  const [editorialPicks, setEditorialPicks] = useState<Movie[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        let trendingItems: MediaItem[] = [];

        if (timeframe === "week") {
          const trendingRes = await getTrendingAll(1);
          trendingItems = trendingRes.results || [];
        } else {
          const now = new Date();
          let gteDate = "";
          
          if (timeframe === "month") {
            const d = new Date(); d.setMonth(d.getMonth() - 1);
            gteDate = d.toISOString().split('T')[0];
          } else if (timeframe === "year") {
            const d = new Date(); d.setFullYear(d.getFullYear() - 1);
            gteDate = d.toISOString().split('T')[0];
          }

          const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
          
          const [moviesRes, tvRes] = await Promise.all([
            fetch(`https://api.tmdb.org/3/discover/movie?api_key=${apiKey}&sort_by=popularity.desc${gteDate ? `&primary_release_date.gte=${gteDate}&primary_release_date.lte=${now.toISOString().split('T')[0]}` : ''}`).then(r => r.json()),
            fetch(`https://api.tmdb.org/3/discover/tv?api_key=${apiKey}&sort_by=popularity.desc${gteDate ? `&first_air_date.gte=${gteDate}&first_air_date.lte=${now.toISOString().split('T')[0]}` : ''}`).then(r => r.json())
          ]);

          const movies = (moviesRes.results || []).map((m: any) => ({...m, media_type: "movie"}));
          const tv = (tvRes.results || []).map((t: any) => ({...t, media_type: "tv"}));
          
          trendingItems = [...movies, ...tv].sort((a, b) => b.popularity - a.popularity).slice(0, 20);
        }

        // Filter out unreleased items
        const currentDate = new Date();
        const releasedItems = trendingItems.filter(item => {
          const dateStr = (item as Movie).release_date || (item as TVShow).first_air_date;
          if (!dateStr) return false;
          return new Date(dateStr) <= currentDate;
        });

        setItems(releasedItems);

        // 2. Fetch Director of the week based on #1 trending
        if (releasedItems.length > 0) {
          const topItem = releasedItems[0];
          const details = await getDetails(topItem.media_type, topItem.id.toString());
          let personId: number | null = null;
          
          if (details) {
            if (topItem.media_type === "movie" && details.credits?.crew) {
              const director = details.credits.crew.find(c => c.job === "Director");
              if (director) personId = director.id;
            } else if (topItem.media_type === "tv" && details.created_by && details.created_by.length > 0) {
              personId = details.created_by[0].id;
            }
          }

          if (personId) {
            const personDetails = await getPersonDetails(personId.toString());
            if (personDetails) {
              const credits = personDetails.combined_credits?.crew?.filter(c => c.job === "Director") || 
                              personDetails.combined_credits?.cast || [];
              
              // Sort by popularity to get top known works
              const topWorks = credits.sort((a, b) => b.popularity - a.popularity).slice(0, 3);
              setDirectorData({ person: personDetails, movies: topWorks });
            }
          }
        }

        // 3. Fetch Editorial Picks (Sci-Fi movies, genre id 878)
        const sciFiRes = await getDiscoverMovies(1, "878");
        setEditorialPicks(sciFiRes.results?.slice(0, 4) || []);

      } catch (error) {
        console.error("Failed to fetch trending page data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [timeframe]);

  if (loading) {
    return (
      <main className={styles.pageWrapper}>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      </main>
    );
  }

  // Safely assign items to different UI cards
  const heroItem = items[0];
  const stack1 = items[1];
  const stack2 = items[2];
  
  const grid1 = items[3];
  const grid2 = items[4];
  const grid4 = items[5];
  const grid5 = items[6];
  const grid6 = items[7];
  const grid7 = items[8];
  
  // Find a hidden gem (high rating, lower popularity)
  const hiddenGem = items.slice(9).find(item => item.vote_average > 7.5) || items[9];

  const getTitle = (item: any) => item ? (item.title || item.name) : "";
  const getYear = (item: any) => {
    if (!item) return "";
    const date = item.release_date || item.first_air_date;
    return date ? date.slice(0, 4) : "";
  };

  // Helper to simulate mock stats like "24k logs", "+18%"
  const getTrendPercentage = (popularity: number) => {
    return Math.floor((popularity % 30) + 5); 
  };
  const getSimulatedLogs = (voteCount: number) => {
    return (voteCount / 100).toFixed(1) + "K";
  };

  return (
    <main className={styles.pageWrapper}>
      <Navbar />
      
      <div className={styles.container}>
        
        {/* HERO SECTION */}
        {heroItem && (
          <div className={styles.heroSection}>
            <div className={styles.heroLeft}>
              <div className={styles.nowTrending}>
                <div className={styles.nowTrendingDot} /> NOW TRENDING
              </div>
              <h1 className={styles.heroTitle}>{getTitle(heroItem)}</h1>
              
              <div className={styles.heroMeta}>
                <span>{heroItem.media_type === 'movie' ? 'Movie' : 'TV Show'}</span>
                <span>•</span>
                <span>{getYear(heroItem)}</span>
                <span>•</span>
                <span className={styles.heroRating}>
                  <Star fill="currentColor" size={14} />
                  {heroItem.vote_average.toFixed(1)}
                </span>
                <span>•</span>
                <span className={styles.heroTrend}>↑ {getTrendPercentage(heroItem.popularity)}% this week</span>
              </div>
              
              <p className={styles.heroDesc}>{heroItem.overview}</p>
              
              <div 
                className={styles.exploreBtn}
                onClick={() => router.push(`/${heroItem.media_type}/${heroItem.id}`)}
              >
                Explore &rarr;
              </div>
            </div>

            <div className={styles.heroRight}>
               {/* Rank 3 */}
               {stack2 && (
                <div 
                  className={`${styles.stackedCard} ${styles.stack3}`}
                  onClick={() => router.push(`/${stack2.media_type}/${stack2.id}`)}
                >
                  <img src={IMG.backdrop(stack2.backdrop_path, "w780") || undefined} alt={getTitle(stack2)} />
                  <div className={styles.stackedCardContent}>
                    <span className={styles.stackedRank}>#3</span>
                    <span className={styles.stackedTitle}>{getTitle(stack2)}</span>
                    <span className={styles.stackedTrend}>↑ {getTrendPercentage(stack2.popularity)}%</span>
                  </div>
                </div>
              )}
              {/* Rank 2 */}
              {stack1 && (
                <div 
                  className={`${styles.stackedCard} ${styles.stack2}`}
                  onClick={() => router.push(`/${stack1.media_type}/${stack1.id}`)}
                >
                  <img src={IMG.backdrop(stack1.backdrop_path, "w780") || undefined} alt={getTitle(stack1)} />
                  <div className={styles.stackedCardContent}>
                    <span className={styles.stackedRank}>#2</span>
                    <span className={styles.stackedTitle}>{getTitle(stack1)}</span>
                    <span className={styles.stackedTrend}>↑ {getTrendPercentage(stack1.popularity)}%</span>
                  </div>
                </div>
              )}
              {/* Rank 1 */}
              <div 
                className={`${styles.stackedCard} ${styles.stack1}`}
                onClick={() => router.push(`/${heroItem.media_type}/${heroItem.id}`)}
              >
                <img src={IMG.backdrop(heroItem.backdrop_path, "w1280") || undefined} alt={getTitle(heroItem)} />
              </div>
            </div>
          </div>
        )}

        {/* PULSE OF CINEMA SECTION */}
        <div>
          <div className={styles.pulseHeaderWrap}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>THE PULSE OF CINEMA</h2>
              <div className={styles.sectionSub}>What everyone's talking about.</div>
            </div>
            <div className={styles.pulseFilters}>
              <span className={`${styles.filterItem} ${timeframe === 'week' ? styles.filterActive : ''}`} onClick={() => setTimeframe('week')}>This Week</span>
              <span className={`${styles.filterItem} ${timeframe === 'month' ? styles.filterActive : ''}`} onClick={() => setTimeframe('month')}>This Month</span>
              <span className={`${styles.filterItem} ${timeframe === 'year' ? styles.filterActive : ''}`} onClick={() => setTimeframe('year')}>This Year</span>
              <span className={`${styles.filterItem} ${timeframe === 'all' ? styles.filterActive : ''}`} onClick={() => setTimeframe('all')}>All Time</span>
            </div>
          </div>

          <div className={styles.bentoGrid}>
            
            {/* Grid Card 1 */}
            {grid1 && (
              <div 
                className={`${styles.bentoCard} ${styles.gridCard1}`}
                onClick={() => router.push(`/${grid1.media_type}/${grid1.id}`)}
              >
                <img src={IMG.poster(grid1.poster_path, "w500") || undefined} alt={getTitle(grid1)} className={styles.cardImg} />
                <div className={styles.cardGradient} />
                <div className={styles.rankBadge}>01</div>
                <div className={styles.cardContent}>
                  <div style={{ position: 'absolute', top: 20, right: 20 }}><Bookmark size={24} fill="currentColor" color="rgba(255,255,255,0.8)" /></div>
                  <h3 className={styles.cardTitle}>{getTitle(grid1)}</h3>
                  <div className={styles.cardMetaRow}>
                    <span className={styles.cardRating}><Star size={12} fill="currentColor"/> {grid1.vote_average.toFixed(1)}</span>
                    <span className={styles.cardTrend}>↑ {getTrendPercentage(grid1.popularity)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Grid Card 2 */}
            {grid2 && (
              <div 
                className={`${styles.bentoCard} ${styles.gridCard2}`}
                onClick={() => router.push(`/${grid2.media_type}/${grid2.id}`)}
              >
                <img src={IMG.backdrop(grid2.backdrop_path, "w780") || undefined} alt={getTitle(grid2)} className={styles.cardImg} />
                <div className={styles.cardGradient} />
                <div className={styles.rankBadge}>02</div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{getTitle(grid2)}</h3>
                  <div className={styles.cardMetaRow}>
                    <span className={styles.cardRating}><Star size={12} fill="currentColor"/> {grid2.vote_average.toFixed(1)}</span>
                    <span className={styles.cardTrend}>↑ {getTrendPercentage(grid2.popularity)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Most Watched */}
            {heroItem && (
              <div className={`${styles.bentoCard} ${styles.gridMostWatched}`}>
                <div className={styles.mostWatchedLabel}>MOST WATCHED</div>
                <h3 className={styles.mostWatchedTitle}>{getTitle(heroItem)}</h3>
                <div className={styles.faces}>
                   <div className={styles.face}></div>
                   <div className={styles.face}></div>
                   <div className={styles.face}></div>
                   <div className={styles.faceCount}>+{getSimulatedLogs(heroItem.vote_count)}</div>
                </div>
                <div>
                  <div className={styles.bigNumber}>{Math.floor(heroItem.popularity)}K</div>
                  <div className={styles.numberLabel}>logs today</div>
                </div>
              </div>
            )}

            {/* Quote Card */}
            {stack1 && (
              <div className={`${styles.bentoCard} ${styles.gridQuote}`}>
                <Quote className={styles.quoteIcon} fill="currentColor" />
                <div className={styles.quoteText}>"Cinema is best experienced together."</div>
                <div className={styles.quoteStats}>
                  <div className={styles.quoteCurrently}>Currently</div>
                  <div className={styles.quoteBigNum}>{Math.floor(stack1.popularity * 10)}K</div>
                  <div className={styles.quoteDesc}>people are watching<br/>{getTitle(stack1)}</div>
                </div>
              </div>
            )}

            {/* Grid Card 4 */}
            {grid4 && (
              <div 
                className={`${styles.bentoCard} ${styles.gridCard4}`}
                onClick={() => router.push(`/${grid4.media_type}/${grid4.id}`)}
              >
                <img src={IMG.backdrop(grid4.backdrop_path, "w300") || undefined} alt={getTitle(grid4)} className={styles.cardImg} />
                <div className={styles.cardGradient} />
                <div className={styles.rankBadge}>04</div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle} style={{fontSize: 14}}>{getTitle(grid4)}</h3>
                  <div className={styles.cardMetaRow}>
                    <span className={styles.cardRating}><Star size={10} fill="currentColor"/> {grid4.vote_average.toFixed(1)}</span>
                    <span className={styles.cardTrend}>↑ {getTrendPercentage(grid4.popularity)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Grid Card 5 (Light BG) */}
            {grid5 && (
              <div 
                className={`${styles.bentoCard} ${styles.gridCard5}`}
                onClick={() => router.push(`/${grid5.media_type}/${grid5.id}`)}
              >
                <div className={styles.rankBadge}>05</div>
                <div className={styles.cardContent} style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <h3 className={styles.cardTitle} style={{color: '#111', fontSize: 16, marginBottom: 4}}>{getTitle(grid5)}</h3>
                  <span className={styles.cardTrend} style={{fontSize: 12}}>↑ {getTrendPercentage(grid5.popularity)}%</span>
                  {grid5.poster_path && (
                    <img src={IMG.poster(grid5.poster_path, "w185") || undefined} alt="poster" style={{width: 60, marginTop: 10, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'}} />
                  )}
                </div>
              </div>
            )}

            {/* Trending Genres */}
            <div className={`${styles.bentoCard} ${styles.gridGenres}`}>
              <div className={styles.mostWatchedLabel} style={{color: 'var(--primary-accent)'}}>TRENDING GENRES</div>
              <div className={styles.genreIcon}><Globe size={24} /></div>
              <div className={styles.genreTitle}>Sci-Fi</div>
              <span className={styles.cardTrend} style={{fontSize: 12}}>↑ 21%</span>
              <div style={{color: '#8892B0', fontSize: 12}}>more popular this week</div>
            </div>

            {/* Community Vote */}
            <div className={`${styles.bentoCard} ${styles.gridCommunity}`}>
              <div className={styles.commLabel}>COMMUNITY VOTE</div>
              <div className={styles.commText}>Which movie blew your mind this week?</div>
              <div className={styles.faces} style={{marginBottom: 16}}>
                <div className={styles.face}></div>
                <div className={styles.face}></div>
                <div className={styles.faceCount}>8.7K votes</div>
              </div>
              <a href="#" className={styles.voteBtn}>Vote Now &rarr;</a>
              <div className={styles.graphIcon}><BarChart2 size={24} /></div>
            </div>

            {/* Grid Card 6 */}
            {grid6 && (
              <div 
                className={`${styles.bentoCard} ${styles.gridCard6}`}
                onClick={() => router.push(`/${grid6.media_type}/${grid6.id}`)}
              >
                <img src={IMG.backdrop(grid6.backdrop_path, "w780") || undefined} alt={getTitle(grid6)} className={styles.cardImg} />
                <div className={styles.cardGradient} />
                <div className={styles.rankBadge}>06</div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle} style={{fontSize: 14}}>{getTitle(grid6)}</h3>
                  <div className={styles.cardMetaRow}>
                    <span className={styles.cardRating}><Star size={10} fill="currentColor"/> {grid6.vote_average.toFixed(1)}</span>
                    <span className={styles.cardTrend}>↑ {getTrendPercentage(grid6.popularity)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Grid Card 7 */}
            {grid7 && (
              <div 
                className={`${styles.bentoCard} ${styles.gridCard7}`}
                onClick={() => router.push(`/${grid7.media_type}/${grid7.id}`)}
              >
                <img src={IMG.backdrop(grid7.backdrop_path, "w780") || undefined} alt={getTitle(grid7)} className={styles.cardImg} />
                <div className={styles.cardGradient} />
                <div className={styles.rankBadge}>07</div>
                <div className={styles.cardContent}>
                  <div style={{ position: 'absolute', top: 10, right: 10 }}><Bookmark size={16} fill="currentColor" color="rgba(255,255,255,0.8)" /></div>
                  <h3 className={styles.cardTitle} style={{fontSize: 14}}>{getTitle(grid7)}</h3>
                  <div className={styles.cardMetaRow}>
                    <span className={styles.cardRating}><Star size={10} fill="currentColor"/> {grid7.vote_average.toFixed(1)}</span>
                    <span className={styles.cardTrend}>↑ {getTrendPercentage(grid7.popularity)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Global Buzz */}
            <div className={`${styles.bentoCard} ${styles.gridGlobalBuzz}`}>
              <Globe className={styles.mapBg} size={150} />
              <div className={styles.buzzLabel}>GLOBAL BUZZ</div>
              <div className={styles.buzzText}>Most talked about in <span style={{color:'var(--primary-accent)', fontWeight:700}}>87 countries</span></div>
              <div className={styles.faces}>
                <div className={styles.face}></div>
                <div className={styles.face}></div>
                <div className={styles.face}></div>
                <div className={styles.faceCount}>+2.1K</div>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM SECTIONS */}
        
        {/* Editorial Pick */}
        {editorialPicks.length > 0 && (
          <div className={styles.editorialSection}>
            <div className={styles.edLeft}>
              <div className={styles.edLabel}>EDITORIAL PICK</div>
              <h2 className={styles.edTitle}>SCI-FI IS HAVING A MOMENT</h2>
              <p className={styles.edDesc}>Explore the most talked about sci-fi movies right now.</p>
              <a href="#" className={styles.edLink}>View Collection &rarr;</a>
            </div>
            <div className={styles.edRight}>
              {editorialPicks.map((m, i) => (
                <div key={m.id} className={styles.edPoster} onClick={() => router.push(`/movie/${m.id}`)} style={{cursor: 'pointer'}}>
                  <img src={IMG.poster(m.poster_path, "w300") || undefined} alt={m.title} />
                  <div className={styles.edPosterInfo}>
                    <div className={styles.edPosterTitle}>{m.title}</div>
                    <div className={styles.edPosterRating}><Star size={10} fill="currentColor" /> {m.vote_average.toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Director of the Week & Hidden Gem */}
        <div className={styles.threeColGrid}>
          {directorData && (
            <div className={styles.directorSection} style={{gridColumn: 'span 2'}}>
              <div className={styles.dirLeft}>
                <img src={IMG.poster(directorData.person.profile_path, "w500") || undefined} alt={directorData.person.name} />
                <div className={styles.dirGradient} />
              </div>
              <div className={styles.dirRight}>
                <div className={styles.edLabel}>DIRECTOR OF THE WEEK</div>
                <h2 className={styles.edTitle} style={{fontSize: 28, textTransform: 'uppercase'}}>{directorData.person.name}</h2>
                <div style={{fontSize: 13, color: '#8892B0', marginBottom: 8}}>Trending movies this week</div>
                
                <div className={styles.dirMovies}>
                  {directorData.movies.map((m) => (
                    <div key={m.id} className={styles.dirMovie} onClick={() => router.push(`/${m.media_type || 'movie'}/${m.id}`)} style={{cursor: 'pointer'}}>
                       <img src={IMG.backdrop(m.backdrop_path || m.poster_path, "w300") || undefined} alt={getTitle(m)} />
                       <div className={styles.dirMovieInfo}>
                         <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase'}}>{getTitle(m)}</div>
                         <div style={{fontSize: 9, color: '#FFB800', marginTop: 2, display: 'flex', alignItems: 'center', gap: 2}}><Star size={8} fill="currentColor" /> {m.vote_average.toFixed(1)} <span style={{color: 'var(--primary-accent)', marginLeft: 4}}>↑ {getTrendPercentage(m.popularity)}%</span></div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hiddenGem && (
            <div className={styles.hiddenGemSection} style={{gridColumn: 'span 1'}}>
              <div className={styles.gemLeft}>
                <div className={styles.gemLabel} style={{display: 'flex', alignItems: 'center', gap: 6}}>HIDDEN GEM <Check size={14} color="var(--primary-accent)"/></div>
                <h2 className={styles.gemTitle} style={{textTransform: 'uppercase'}}>{getTitle(hiddenGem)}</h2>
                <div className={styles.gemDesc}>Only 8% of users watched this.</div>
                <div className={styles.gemScore}>{Math.floor(hiddenGem.vote_average * 10)}%</div>
                <div className={styles.gemScoreDesc}>recommended it.</div>
                <a href="#" className={styles.edLink} onClick={() => router.push(`/${hiddenGem.media_type}/${hiddenGem.id}`)}>Watch Now &rarr;</a>
              </div>
              <div className={styles.gemRight}>
                <img src={IMG.poster(hiddenGem.poster_path, "w300") || undefined} alt={getTitle(hiddenGem)} />
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
