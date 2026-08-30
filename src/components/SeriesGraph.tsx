import React, { useState, useEffect } from 'react';
import { getTVSeasonDetails, type TVSeason, IMG } from '@/lib/tmdb';
import styles from './SeriesGraph.module.css';
import { Library, Star, TrendingDown, TrendingUp, ShieldCheck, Activity, Film } from 'lucide-react';

export default function SeriesGraph({ tmdbId, seasons }: { tmdbId: string, seasons: any[] }) {
  const [seasonData, setSeasonData] = useState<Record<number, TVSeason>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');

  const validSeasons = seasons.filter(s => s.season_number > 0);
  
  useEffect(() => {
    let isMounted = true;
    const fetchAllSeasons = async () => {
      setLoading(true);
      setError(false);
      try {
        const results: Record<number, TVSeason> = {};
        for (let i = 0; i < validSeasons.length; i += 5) {
          const chunk = validSeasons.slice(i, i + 5);
          const chunkRes = await Promise.all(
            chunk.map(s => getTVSeasonDetails(tmdbId, s.season_number))
          );
          chunk.forEach((s, idx) => {
            if (chunkRes[idx]) {
              results[s.season_number] = chunkRes[idx] as TVSeason;
            }
          });
        }
        if (isMounted) setSeasonData(results);
      } catch (err) {
        console.error(err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (validSeasons.length > 0) {
      fetchAllSeasons();
    }
    return () => { isMounted = false; };
  }, [tmdbId, validSeasons.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (validSeasons.length === 0) return null;

  const getColor = (rating: number) => {
    if (rating === 0) return '#52525b';
    if (rating >= 8.5) return '#16a34a'; // Awesome (darker green)
    if (rating >= 7.5) return '#4ade80'; // Great
    if (rating >= 6.5) return '#eab308'; // Good
    if (rating >= 5.0) return '#f97316'; // Regular
    if (rating >= 3.0) return '#ef4444'; // Bad
    return '#dc2626';
  };

  const getEvaluation = (rating: number, prevRating: number | null) => {
    if (rating === 0) return "N/A";
    if (prevRating !== null) {
      if (rating >= prevRating + 0.5) return "Better Than Before";
      if (rating <= prevRating - 1.0) return "Disappointing";
    }
    if (rating >= 8.8) return "Fan Favorite";
    if (rating >= 8.0) return "Strong Start";
    if (rating >= 7.5) return "Great";
    if (rating >= 7.0) return "Good";
    if (rating >= 6.0) return "Average";
    return "Disappointing";
  };

  if (loading) return <div className={styles.loading}>Loading Season Shelf...</div>;
  if (error) return <div className={styles.loading}>Failed to load Season Shelf.</div>;
  if (Object.keys(seasonData).length === 0) return null;

  // Calculations for Compact View
  const seasonStats = validSeasons.map((s, idx) => {
    const sData = seasonData[s.season_number];
    const episodes = sData?.episodes?.filter(e => e.vote_average && e.vote_average > 0) || [];
    let avg = 0;
    if (episodes.length > 0) {
      avg = episodes.reduce((acc, ep) => acc + ep.vote_average, 0) / episodes.length;
    }
    return {
      season_number: s.season_number,
      poster_path: s.poster_path,
      avg: avg,
      episodeCount: sData?.episodes?.length || 0,
      prevAvg: null as number | null
    };
  });
  for (let i = 1; i < seasonStats.length; i++) {
    seasonStats[i].prevAvg = seasonStats[i-1].avg > 0 ? seasonStats[i-1].avg : null;
  }

  // Analytics for Detailed View
  const flattenedEpisodes: any[] = [];
  let maxEpisodes = 0;
  let overallSum = 0;
  let overallCount = 0;
  let maxRating = -1;
  let minRating = 11;
  let highestEp: any = null;
  let lowestEp: any = null;

  validSeasons.forEach(s => {
    const sData = seasonData[s.season_number];
    if (sData?.episodes) {
      if (sData.episodes.length > maxEpisodes) maxEpisodes = sData.episodes.length;
      sData.episodes.forEach(ep => {
        if (ep.vote_average && ep.vote_average > 0) {
          overallSum += ep.vote_average;
          overallCount++;
          flattenedEpisodes.push({ ...ep, season_poster: s.poster_path });

          if (ep.vote_average > maxRating) {
            maxRating = ep.vote_average;
            highestEp = ep;
          }
          if (ep.vote_average < minRating) {
            minRating = ep.vote_average;
            lowestEp = ep;
          }
        }
      });
    }
  });

  const overallAvg = overallCount > 0 ? (overallSum / overallCount).toFixed(2) : "0.00";

  // Consistency & Improvements
  let mostConsistent: any = null;
  let lowestVariance = Infinity;
  let biggestImprovement: any = null;
  let maxInc = -Infinity;
  let biggestDrop: any = null;
  let maxDec = Infinity;

  seasonStats.forEach((stat, idx) => {
    const sData = seasonData[stat.season_number];
    const eps = sData?.episodes?.filter(e => e.vote_average && e.vote_average > 0) || [];
    if (eps.length > 1) {
      const avg = stat.avg;
      const variance = eps.reduce((acc, ep) => acc + Math.pow(ep.vote_average - avg, 2), 0) / eps.length;
      if (variance < lowestVariance) {
        lowestVariance = variance;
        mostConsistent = { season: stat.season_number, variance, avg };
      }
    }
    
    if (idx > 0 && seasonStats[idx-1].avg > 0 && stat.avg > 0) {
      const diff = stat.avg - seasonStats[idx-1].avg;
      if (diff > maxInc) {
        maxInc = diff;
        biggestImprovement = { from: seasonStats[idx-1].season_number, to: stat.season_number, diff };
      }
      if (diff < maxDec) {
        maxDec = diff;
        biggestDrop = { from: seasonStats[idx-1].season_number, to: stat.season_number, diff };
      }
    }
  });

  return (
    <div className={viewMode === 'detailed' ? styles.dashboard : styles.container}>
      {/* Header section adjusts based on mode */}
      <div className={viewMode === 'detailed' ? styles.dashHeader : styles.header}>
        <div className={viewMode === 'detailed' ? styles.dashTitleBlock : styles.titleContainer}>
          {viewMode === 'detailed' ? (
            <>
              <h4><Activity size={20}/> SERIES JOURNEY</h4>
              <p>All episodes across every season.</p>
            </>
          ) : (
            <>
              <h3 className={styles.title}><Library size={20} /> SEASON SHELF</h3>
              <p className={styles.subtitle}>Every season's journey at a glance.</p>
            </>
          )}
        </div>
        <div className={styles.viewToggles}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'compact' ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('compact')}
          >
            Compact
          </button>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'detailed' ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('detailed')}
          >
            Detailed
          </button>
        </div>
      </div>
      
      {viewMode === 'compact' ? (
        <div className={styles.shelfScroll}>
          {seasonStats.map((stat) => {
            const color = getColor(stat.avg);
            const evaluation = getEvaluation(stat.avg, stat.prevAvg);
            const bgImage = IMG.poster(stat.poster_path, "w300");

            return (
              <div key={`shelf-s${stat.season_number}`} className={styles.seasonCard}>
                {bgImage && (
                  <div className={styles.cardBg} style={{ backgroundImage: `url(${bgImage})` }} />
                )}
                <div className={styles.cardOverlay} />
                <div className={styles.cardContent}>
                  <span className={styles.seasonText}>SEASON</span>
                  <span className={styles.seasonNumber}>{stat.season_number}</span>
                  <div className={styles.ratingBadge} style={{ color: color }}>
                    {stat.avg > 0 ? stat.avg.toFixed(2) : '-'}
                  </div>
                  <span className={styles.episodeCount}>{stat.episodeCount} Episodes</span>
                  <span className={styles.evaluationText} style={{ color: color }}>
                    {stat.avg > 0 ? evaluation : 'Upcoming'}
                  </span>
                </div>
                <div className={styles.bottomGlow} style={{ backgroundColor: color, boxShadow: `0 -2px 10px ${color}` }} />
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Detailed View - Top Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div className={styles.dashLegend}>
              <div className={styles.legendCol}>
                <div className={styles.legendTop}><div className={styles.legendDot} style={{background: '#16a34a'}}/>Awesome</div>
                <div className={styles.legendBot}>9+</div>
              </div>
              <div className={styles.legendCol}>
                <div className={styles.legendTop}><div className={styles.legendDot} style={{background: '#4ade80'}}/>Great</div>
                <div className={styles.legendBot}>8 - 8.9</div>
              </div>
              <div className={styles.legendCol}>
                <div className={styles.legendTop}><div className={styles.legendDot} style={{background: '#eab308'}}/>Good</div>
                <div className={styles.legendBot}>7 - 7.9</div>
              </div>
              <div className={styles.legendCol}>
                <div className={styles.legendTop}><div className={styles.legendDot} style={{background: '#f97316'}}/>Regular</div>
                <div className={styles.legendBot}>6 - 6.9</div>
              </div>
              <div className={styles.legendCol}>
                <div className={styles.legendTop}><div className={styles.legendDot} style={{background: '#ef4444'}}/>Bad</div>
                <div className={styles.legendBot}>&lt; 6</div>
              </div>
            </div>

            <div className={styles.topStats}>
              <div className={styles.topStatBox}>
                <div className={styles.topStatLabel} style={{color: '#fbbf24'}}><Star size={24}/></div>
                <div>
                  <div className={styles.topStatValue}>{overallAvg}</div>
                  <div className={styles.topStatLabel}>Overall Average</div>
                </div>
              </div>
              <div className={styles.topStatBox}>
                <div className={styles.topStatLabel} style={{color: '#8b949e'}}><Film size={24}/></div>
                <div>
                  <div className={styles.topStatValue}>{overallCount}</div>
                  <div className={styles.topStatLabel}>Total Episodes</div>
                </div>
              </div>
              <div className={styles.topStatBox}>
                <div className={styles.topStatLabel} style={{color: '#8b949e'}}><Activity size={24}/></div>
                <div>
                  <div className={styles.topStatValue}>{validSeasons.length}</div>
                  <div className={styles.topStatLabel}>Seasons</div>
                </div>
              </div>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className={styles.matrixWrapper}>
            <div className={styles.matrix}>
              <div className={styles.matrixRow}>
                <div className={styles.matrixCorner}>SEASON / EPISODE</div>
                {Array.from({ length: maxEpisodes }).map((_, epIndex) => (
                  <div key={`col-${epIndex}`} className={styles.matrixColHeader}>E{epIndex + 1}</div>
                ))}
              </div>
              
              {validSeasons.map(s => {
                const sData = seasonData[s.season_number];
                return (
                  <div key={`row-${s.season_number}`} className={styles.matrixRow}>
                    <div className={styles.seasonRowHeader}>
                      {s.poster_path ? (
                        <img src={IMG.poster(s.poster_path, "w185") ?? undefined} alt={`S${s.season_number}`} className={styles.seasonRowImg} />
                      ) : <div className={styles.seasonRowImg} style={{background: '#1e293b'}}/>}
                      <div className={styles.seasonRowText}>
                        <span className={styles.seasonRowTitle}>Season {s.season_number}</span>
                        <span className={styles.seasonRowEps}>{sData?.episodes?.length || 0} episodes</span>
                      </div>
                    </div>

                    {Array.from({ length: maxEpisodes }).map((_, epIndex) => {
                      const epNum = epIndex + 1;
                      const ep = sData?.episodes?.find(e => e.episode_number === epNum);
                      if (!ep) {
                        return <div key={`empty-${s.season_number}-${epNum}`} className={styles.matrixCellEmpty}>-</div>;
                      }

                      const rating = ep.vote_average || 0;
                      const color = getColor(rating);
                      const isAbsoluteHighest = rating > 0 && rating === maxRating;

                      return (
                        <div 
                          key={`cell-${s.season_number}-${epNum}`} 
                          className={styles.matrixCell} 
                          style={{ 
                            backgroundColor: rating > 0 ? color : 'rgba(255,255,255,0.02)',
                            color: rating === 0 ? 'rgba(255,255,255,0.1)' : (rating >= 6.5 && rating < 7.5 ? '#111827' : '#fff')
                          }}
                          title={`S${s.season_number}E${epNum}: ${ep.name} - ${rating > 0 ? rating.toFixed(1) : 'No Rating'}`}
                        >
                          {rating > 0 ? rating.toFixed(1) : '-'}
                          {isAbsoluteHighest && <Star size={10} fill="currentColor" className={styles.starIcon} />}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Episode Quality Flow Chart */}
          <div className={styles.flowSection}>
            <div className={styles.flowHeader}>
              <h5>EPISODE QUALITY FLOW</h5>
              <p>A visual journey of the entire series.</p>
            </div>
            <div className={styles.flowChart}>
              <div className={styles.yAxis}>
                <span>10</span>
                <span>5</span>
                <span>0</span>
              </div>
              {flattenedEpisodes.map((ep, idx) => {
                const rating = ep.vote_average || 0;
                const heightPct = rating > 0 ? (rating / 10) * 100 : 0;
                const color = getColor(rating);
                // Mark start of season
                const isSeasonStart = idx === 0 || flattenedEpisodes[idx-1].season_number !== ep.season_number;
                
                return (
                  <div key={`bar-${idx}`} className={styles.flowBarWrapper}>
                    <div className={styles.flowBarHover}>
                      S{ep.season_number}E{ep.episode_number}: {rating.toFixed(1)}
                    </div>
                    <div 
                      className={styles.flowBar} 
                      style={{ height: `${heightPct}%`, backgroundColor: color }}
                    />
                  </div>
                );
              })}
              
              <div className={styles.xAxisMarkers}>
                {flattenedEpisodes.map((ep, idx) => {
                  const isSeasonStart = idx === 0 || flattenedEpisodes[idx-1].season_number !== ep.season_number;
                  if (!isSeasonStart) return null;
                  
                  // Calculate left position percentage based on index
                  const leftPct = (idx / flattenedEpisodes.length) * 100;
                  
                  return (
                    <div key={`marker-${idx}`} className={styles.seasonMarker} style={{ left: `${leftPct}%` }}>
                      <span>S{ep.season_number}</span>
                      {ep.season_poster && <img src={IMG.poster(ep.season_poster, "w185") ?? undefined} className={styles.seasonMarkerImg} alt={`S${ep.season_number}`} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}><Star size={14} color="#fbbf24"/> HIGHEST RATED EPISODE</div>
              {highestEp ? (
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <div className={styles.summaryContent} style={{flex: 1}}>
                    <span className={styles.summarySub}>S{highestEp.season_number} • E{highestEp.episode_number}</span>
                    <span className={styles.summaryTitle} title={highestEp.name}>{highestEp.name}</span>
                    <span className={styles.summaryValue} style={{color: getColor(maxRating)}}>{maxRating.toFixed(1)}</span>
                  </div>
                  {highestEp.still_path && <img src={IMG.backdrop(highestEp.still_path, "w300") ?? undefined} className={styles.summaryImg} alt="Highest"/>}
                </div>
              ) : <span className={styles.summarySub}>N/A</span>}
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}><TrendingDown size={14} color="#ef4444"/> LOWEST RATED EPISODE</div>
              {lowestEp && minRating < 11 ? (
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <div className={styles.summaryContent} style={{flex: 1}}>
                    <span className={styles.summarySub}>S{lowestEp.season_number} • E{lowestEp.episode_number}</span>
                    <span className={styles.summaryTitle} title={lowestEp.name}>{lowestEp.name}</span>
                    <span className={styles.summaryValue} style={{color: getColor(minRating)}}>{minRating.toFixed(1)}</span>
                  </div>
                  {lowestEp.still_path && <img src={IMG.backdrop(lowestEp.still_path, "w300") ?? undefined} className={styles.summaryImg} alt="Lowest"/>}
                </div>
              ) : <span className={styles.summarySub}>N/A</span>}
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}><ShieldCheck size={14} color="#22c55e"/> MOST CONSISTENT SEASON</div>
              {mostConsistent ? (
                <div className={styles.summaryContent}>
                  <span className={styles.summarySub}>Season {mostConsistent.season}</span>
                  <span className={styles.summaryTitle}>Lowest Deviation</span>
                  <span className={styles.summaryValue} style={{color: getColor(mostConsistent.avg)}}>{mostConsistent.avg.toFixed(2)}</span>
                </div>
              ) : <span className={styles.summarySub}>N/A</span>}
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}><TrendingUp size={14} color="#4ade80"/> BIGGEST IMPROVEMENT</div>
              {biggestImprovement ? (
                <div className={styles.summaryContent}>
                  <span className={styles.summarySub}>Season {biggestImprovement.from} → Season {biggestImprovement.to}</span>
                  <span className={styles.summaryTitle}>Average Increase</span>
                  <span className={styles.summaryValue} style={{color: '#4ade80'}}>+{biggestImprovement.diff.toFixed(2)}</span>
                </div>
              ) : <span className={styles.summarySub}>N/A</span>}
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}><TrendingDown size={14} color="#ef4444"/> BIGGEST DROP</div>
              {biggestDrop && maxDec < 0 ? (
                <div className={styles.summaryContent}>
                  <span className={styles.summarySub}>Season {biggestDrop.from} → Season {biggestDrop.to}</span>
                  <span className={styles.summaryTitle}>Average Decrease</span>
                  <span className={styles.summaryValue} style={{color: '#ef4444'}}>{biggestDrop.diff.toFixed(2)}</span>
                </div>
              ) : <span className={styles.summarySub}>N/A</span>}
            </div>
          </div>

        </>
      )}
    </div>
  );
}
