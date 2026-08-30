import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, CheckCircle2, Circle, Eye, Play } from 'lucide-react';
import { getTVSeasonDetails, type TVSeason, IMG } from '@/lib/tmdb';
import { toggleWatchedEpisode, getWatchedEpisodes, markPreviousEpisodesWatched } from '@/app/actions/history';
import { useSettings } from '@/contexts/SettingsContext';
import styles from './TVSeasons.module.css';

export default function TVSeasons({ tmdbId, seasons, accentColor }: { tmdbId: string, seasons: any[], accentColor: string }) {
  const router = useRouter();
  const { settings } = useSettings();
  const validSeasons = seasons.filter(s => s.season_number > 0);
  const [activeSeason, setActiveSeason] = useState<number>(validSeasons[0]?.season_number || 1);
  const [seasonData, setSeasonData] = useState<Record<number, TVSeason>>({});
  const [watchedEps, setWatchedEps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [inlineLogEp, setInlineLogEp] = useState<{sNum: number, eNum: number, date: string, time: string} | null>(null);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  useEffect(() => {
    getWatchedEpisodes(tmdbId).then(res => {
      if (res.success && res.episodes) {
        const set = new Set<string>();
        res.episodes.forEach((e: any) => set.add(`${e.seasonNumber}-${e.episodeNumber}`));
        setWatchedEps(set);
      }
    });
  }, [tmdbId]);

  useEffect(() => {
    if (!seasonData[activeSeason]) {
      setLoading(true);
      getTVSeasonDetails(tmdbId, activeSeason)
        .then(data => { if (data) setSeasonData(prev => ({ ...prev, [activeSeason]: data })) })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [activeSeason, tmdbId, seasonData]);

  const handleToggleEp = async (sNum: number, eNum: number) => {
    const key = `${sNum}-${eNum}`;
    const newSet = new Set(watchedEps);
    const isWatchedNow = !newSet.has(key);
    
    if (isWatchedNow) {
      newSet.add(key);
      if (settings?.autoMarkEpisode) {
        // Optimistically add all previous episodes
        for (let s = 1; s <= sNum; s++) {
          const maxE = s === sNum ? eNum - 1 : (seasonData[s]?.episodes?.length || 0); // we might not have length if un-fetched, but it's okay for optimistic UI, we'll refresh on reload
          for (let e = 1; e <= maxE; e++) {
            newSet.add(`${s}-${e}`);
          }
        }
      }
    } else {
      newSet.delete(key);
    }
    setWatchedEps(newSet);

    const res = await toggleWatchedEpisode(tmdbId, sNum, eNum);
    if (res.error) {
      showError(res.error);
      const revertSet = new Set(watchedEps);
      setWatchedEps(revertSet);
    } else if (isWatchedNow && settings?.autoMarkEpisode) {
      await markPreviousEpisodesWatched(tmdbId, sNum, eNum);
    }
  };

  const handleSaveEpLogWithDate = async () => {
    if (!inlineLogEp) return;
    const { sNum, eNum, date, time } = inlineLogEp;
    const dateStr = `${date}T${time}:00`;
    
    // Optimistic UI update
    const key = `${sNum}-${eNum}`;
    const newSet = new Set(watchedEps);
    newSet.add(key); 
    
    if (settings?.autoMarkEpisode) {
      for (let s = 1; s <= sNum; s++) {
        const maxE = s === sNum ? eNum - 1 : (seasonData[s]?.episodes?.length || 0);
        for (let e = 1; e <= maxE; e++) {
          newSet.add(`${s}-${e}`);
        }
      }
    }
    
    setWatchedEps(newSet);

    const res = await toggleWatchedEpisode(tmdbId, sNum, eNum, dateStr);
    if (res.error) {
      showError(res.error);
    } else if (settings?.autoMarkEpisode) {
      await markPreviousEpisodesWatched(tmdbId, sNum, eNum);
    }
    setInlineLogEp(null);
  };

  if (!seasons || seasons.length === 0) return null;

  const episodes = seasonData[activeSeason]?.episodes || [];
  const visibleEpisodes = showAll ? episodes : episodes.slice(0, 8);

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>EPISODES</h3>
      
      <div className={styles.controlsRow}>
        <div className={styles.pillTabs}>
          {validSeasons.map(season => (
            <button 
              key={season.id}
              className={`${styles.pill} ${activeSeason === season.season_number ? styles.pillActive : ''}`}
              style={activeSeason === season.season_number ? { backgroundColor: accentColor } : {}}
              onClick={() => {
                setActiveSeason(season.season_number);
                setShowAll(false);
              }}
            >
              S{season.season_number}
            </button>
          ))}
        </div>
        
        <div className={styles.seasonSelect}>
          Season {activeSeason} <ChevronDown size={16} />
        </div>
      </div>

      <div className={styles.episodesList}>
        {loading ? (
          <div className={styles.loading}>Loading episodes...</div>
        ) : (
          visibleEpisodes.map((ep, idx) => {
            const isWatched = watchedEps.has(`${activeSeason}-${ep.episode_number}`);
            
            // "Next up" episode logic: the first unwatched episode gets the prominent "Continue" button
            // But since the mockup shows it just as a style, let's highlight the first unwatched one if user has started
            const isNextUp = !isWatched && watchedEps.has(`${activeSeason}-${ep.episode_number - 1}`);

            return (
              <div key={ep.id}>
                <div 
                  className={styles.episodeRow}
                  style={isNextUp ? { backgroundColor: 'rgba(255, 215, 0, 0.05)', cursor: 'pointer' } : { cursor: 'pointer' }}
                  onClick={() => router.push(`/tv/${tmdbId}/season/${activeSeason}/episode/${ep.episode_number}`)}
                >
                  <div className={styles.epNumCol}>{ep.episode_number}</div>
                  
                  <div className={styles.epThumbWrapper}>
                    {ep.still_path ? (
                      <img src={IMG.backdrop(ep.still_path, "w300")!} alt={ep.name} className={styles.epThumb} />
                    ) : null}
                  </div>
                  
                  <div className={styles.epContent}>
                    <h4 className={styles.epTitle}>{ep.name}</h4>
                    <p className={styles.epDesc}>{ep.overview || "No overview available."}</p>
                  </div>
                  
                  <div className={styles.epMeta}>
                    <div className={styles.epRuntime}>
                      <Eye size={14} /> {ep.runtime ? `${ep.runtime}m` : '-'}
                    </div>
                    
                    {isNextUp ? (
                      <button 
                        className={styles.playContinueBtn}
                        style={{ backgroundColor: accentColor, color: '#fff' }}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setInlineLogEp({ 
                            sNum: activeSeason, 
                            eNum: ep.episode_number,
                            date: new Date().toISOString().split('T')[0],
                            time: new Date().toTimeString().slice(0,5)
                          }); 
                        }}
                      >
                        <Play size={14} fill="currentColor" />
                        Continue
                      </button>
                    ) : (
                      <button 
                        className={styles.checkBtn} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (!isWatched) setInlineLogEp({ 
                            sNum: activeSeason, 
                            eNum: ep.episode_number,
                            date: new Date().toISOString().split('T')[0],
                            time: new Date().toTimeString().slice(0,5)
                          });
                          else handleToggleEp(activeSeason, ep.episode_number);
                        }}
                        style={{ color: isWatched ? accentColor : '' }}
                      >
                        {isWatched ? <CheckCircle2 size={24} fill="currentColor" /> : <Circle size={24} />}
                      </button>
                    )}
                  </div>
                </div>

                {inlineLogEp && inlineLogEp.sNum === activeSeason && inlineLogEp.eNum === ep.episode_number && (
                  <div style={{ padding: '16px 24px', background: '#F9FAFB', borderBottom: '1px solid #eaeaea', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#6B7280' }}>DATE</label>
                      <input 
                        type="date" 
                        value={inlineLogEp.date} 
                        onChange={e => setInlineLogEp({...inlineLogEp, date: e.target.value})}
                        style={{ padding: '8px 12px', borderRadius: '6px', background: '#fff', color: '#111827', border: '1px solid #E5E7EB', outline: 'none', fontFamily: 'Manrope, sans-serif' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#6B7280' }}>TIME</label>
                      <input 
                        type="time" 
                        value={inlineLogEp.time} 
                        onChange={e => setInlineLogEp({...inlineLogEp, time: e.target.value})}
                        style={{ padding: '8px 12px', borderRadius: '6px', background: '#fff', color: '#111827', border: '1px solid #E5E7EB', outline: 'none', fontFamily: 'Manrope, sans-serif' }}
                      />
                    </div>
                    <button 
                      onClick={handleSaveEpLogWithDate}
                      style={{ marginTop: '18px', padding: '10px 20px', background: '#111827', color: '#fff', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                    >
                      Save Log
                    </button>
                    <button 
                      onClick={() => setInlineLogEp(null)}
                      style={{ marginTop: '18px', padding: '10px 16px', background: '#E5E7EB', color: '#4B5563', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {episodes.length > 8 && !showAll && (
        <button className={styles.viewAllBtn} onClick={() => setShowAll(true)}>
          View All Episodes <ChevronDown size={16} />
        </button>
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
    </div>
  );
}
