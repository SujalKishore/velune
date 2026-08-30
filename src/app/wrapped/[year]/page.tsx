"use client";

import { use, useEffect, useState } from "react";
import styles from "./page.module.css";
import { getWrappedStats, getAvailableWrappedYears } from "@/app/actions/wrapped";
import { Share2, Star, Target, Disc, Heart, RefreshCcw, Sparkles, ArrowLeft, Brain, Rocket, CloudRain, Coffee, Smile, Ghost, Eye, Search, PartyPopper } from "lucide-react";
import CustomDropdown from "@/components/CustomDropdown";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import { useDialog } from "@/contexts/DialogContext";

export default function WrappedPage({ params }: { params: Promise<{ year: string }> }) {
  const unwrappedParams = use(params);
  const year = parseInt(unwrappedParams.year);
  const router = useRouter();
  const { showAlert } = useDialog();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([year]);

  useEffect(() => {
    getAvailableWrappedYears().then(years => {
      if (years.length > 0) setAvailableYears(years);
    });
    getWrappedStats(year).then(res => {
      setData(res);
      setLoading(false);
    });
  }, [year]);

  if (loading) {
    return <div className={styles.container} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <h2 style={{fontFamily: 'Sora', fontSize: 32}}>Generating your {year} Wrapped...</h2>
    </div>;
  }

  if (!data || !data.stats) {
    return <div className={styles.container}>
      <h2>No data found for {year}.</h2>
    </div>;
  }

  const getYearTheme = (y: number) => {
    switch (y % 4) {
      case 0: return { primary: "#00E5C5", bg1: "rgba(0, 229, 197, 0.05)", bg2: "rgba(10, 25, 49, 0.8)", cal: "rgba(0, 229, 197", colors: ["var(--primary-accent)", "#FBBF24", "#E94560", "#8B5CF6", "#A0AEC0"] }; // Teal
      case 1: return { primary: "#F59E0B", bg1: "rgba(245, 158, 11, 0.05)", bg2: "rgba(69, 26, 3, 0.8)", cal: "rgba(245, 158, 11", colors: ["var(--primary-accent)", "#00E5C5", "#E94560", "#8B5CF6", "#A0AEC0"] }; // Amber
      case 2: return { primary: "#EC4899", bg1: "rgba(236, 72, 153, 0.05)", bg2: "rgba(67, 20, 39, 0.8)", cal: "rgba(236, 72, 153", colors: ["var(--primary-accent)", "#FBBF24", "#00E5C5", "#8B5CF6", "#A0AEC0"] }; // Pink
      case 3: return { primary: "#8B5CF6", bg1: "rgba(139, 92, 246, 0.05)", bg2: "rgba(30, 20, 60, 0.8)", cal: "rgba(139, 92, 246", colors: ["var(--primary-accent)", "#FBBF24", "#E94560", "#00E5C5", "#A0AEC0"] }; // Purple
      default: return { primary: "#00E5C5", bg1: "rgba(0, 229, 197, 0.05)", bg2: "rgba(10, 25, 49, 0.8)", cal: "rgba(0, 229, 197", colors: ["var(--primary-accent)", "#FBBF24", "#E94560", "#8B5CF6", "#A0AEC0"] };
    }
  };
  const theme = getYearTheme(year);

  // Helper for calendar
  const today = new Date();
  const isCurrentYear = today.getFullYear() === year;
  const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
  
  const firstDayOfWeek = new Date(year, 0, 1).getDay();
  const emptyBoxes = Array.from({length: firstDayOfWeek}).map((_, i) => <div key={`empty-${i}`} className={styles.calDay} style={{background: 'transparent'}} />);

  const calendarBoxes = Array.from({length: daysInYear}).map((_, i) => {
    const d = new Date(year, 0, i + 1);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const count = data.calendar[dateStr] || 0;
    
    let color = "rgba(255,255,255,0.05)";
    if (count === 1) color = `${theme.cal}, 0.3)`;
    if (count === 2) color = `${theme.cal}, 0.6)`;
    if (count >= 3) color = `${theme.cal}, 1)`;
    return <div key={i} className={styles.calDay} style={{ background: color }} title={`${dateStr}: ${count} logs`} />;
  });

  const allCalendarBoxes = [...emptyBoxes, ...calendarBoxes];

  // Helper for Genre Donut
  const colors = theme.colors;
  let strokeOffset = 0;
  
  const copyLink = async () => {
    navigator.clipboard.writeText(window.location.href);
    await showAlert("Wrapped link copied to clipboard!");
  };

  const getYearHero = (y: number) => {
    if (y === 2024) return "/wrapped_hero_2024.png";
    if (y === 2025) return "/wrapped_hero_2025.png";
    if (y === 2026) return "/wrapped_hero_2026.png";
    return "/cinematic_login_hero.png";
  };
  const heroImg = getYearHero(year);

  return (
    <div className={styles.container} style={{
      '--primary-accent': theme.primary,
      '--primary-accent-10': `${theme.cal}, 0.1)`,
      '--primary-accent-20': `${theme.cal}, 0.2)`,
      '--primary-accent-30': `${theme.cal}, 0.3)`,
      '--primary-accent-40': `${theme.cal}, 0.4)`
    } as React.CSSProperties}>
      <div className={styles.pageBg} style={{ backgroundImage: `url(${heroImg})` }} />
      <div style={{marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <button onClick={() => router.push('/profile')} style={{background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 700}}>
          <ArrowLeft size={16} /> Back to Profile
        </button>
        {availableYears.length > 1 && (
          <div style={{ width: 120 }}>
            <CustomDropdown 
              theme="dark"
              value={year.toString()}
              onChange={(val: string) => router.push(`/wrapped/${val}`)}
              options={availableYears.map(y => ({ value: y.toString(), label: y.toString() }))}
            />
          </div>
        )}
      </div>
      <div className={styles.grid}>
        
        {/* HERO CARD */}
        <div className={`${styles.card} ${styles.heroCard}`}>
          <div className={styles.heroBg} style={{ backgroundImage: `url(${heroImg})` }} />
          <div className={styles.heroContent}>
            <div className={styles.heroSubtitle}>MOVIE TRACKER</div>
            <h1 className={styles.heroYear}>{year}</h1>
            <h2 className={styles.heroTitle}>Your Cinema Year</h2>
            <p className={styles.heroDesc}>A year of stories. Moments. Emotions. Memories.</p>
            <button className={styles.shareBtn} onClick={copyLink}>
              <Share2 size={16}/> Share Your Wrap <Sparkles size={16}/>
            </button>
          </div>
          <div className={styles.heroStatsRow}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{data.stats.moviesWatched}</span>
              <span className={styles.heroStatLabel}>Movies Watched</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{data.stats.tvShowsWatched}</span>
              <span className={styles.heroStatLabel}>TV Shows</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{data.stats.hoursWatched}</span>
              <span className={styles.heroStatLabel}>Hours Watched</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{data.stats.reviewsWritten}</span>
              <span className={styles.heroStatLabel}>Reviews Written</span>
            </div>
          </div>
        </div>

        {/* FAVORITE MOVIE */}
        <div className={`${styles.card} ${styles.favoriteCard}`}>
          {data.favorite?.backdrop && (
             <div className={styles.favoriteBg} style={{backgroundImage: `url(https://image.tmdb.org/t/p/w1280${data.favorite.backdrop})`}} />
          )}
          <div style={{zIndex: 2, display: 'flex', flexDirection: 'column'}}>
            <h3 className={styles.cardHeader}>YOUR FAVORITE MOVIE</h3>
            <h2 className={styles.favoriteTitle}>{data.favorite?.title || "None yet"}</h2>
            {data.favorite && (
              <>
                <div className={styles.stars}>
                  <StarRating rating={data.favorite.rating || 0} size={16} />
                </div>
                <p className={styles.favoriteQuote}>"{data.favorite.review || "A masterpiece that left me speechless."}"</p>
                <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)'}}>
                    <RefreshCcw size={12}/> Watched {data.favorite.rewatchCount} times
                  </div>
                  <div style={{fontSize: 11, color: 'rgba(255,255,255,0.5)'}}>
                    First Watch<br/>{data.favorite.firstWatch}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* YEAR IN GENRES */}
        <div className={`${styles.card} ${styles.genresCard}`}>
          <h3 className={styles.cardHeader}>YOUR YEAR IN GENRES</h3>
          <div className={styles.genresContent}>
            <div className={styles.donutWrapper}>
              <svg width="120" height="120" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                {data.genres.map((g: any, i: number) => {
                  const dash = (g.percentage / 100) * 100;
                  const offset = strokeOffset;
                  strokeOffset += dash;
                  return (
                    <circle key={i} cx="18" cy="18" r="16" fill="transparent" stroke={colors[i%colors.length]} strokeWidth="4"
                      strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={-offset} />
                  );
                })}
              </svg>
              <div className={styles.donutCenter}>
                <div className={styles.donutValue}>{data.stats.moviesWatched}</div>
                <div className={styles.donutLabel}>Movies</div>
              </div>
            </div>
            <div className={styles.genreLegend}>
              {data.genres.map((g: any, i: number) => (
                <div key={i} className={styles.legendItem}>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <div className={styles.legendDot} style={{background: colors[i%colors.length]}} />
                    <span>{g.name}</span>
                  </div>
                  <span className={styles.legendPercent}>{g.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HIGHEST RATED (1 col) */}
        <div className={`${styles.card} ${styles.thirdCard}`}>
          {data.highestRated?.backdrop && (
            <div className={styles.backdropBg} style={{backgroundImage: `url(https://image.tmdb.org/t/p/w780${data.highestRated.backdrop})`}} />
          )}
          <h3 className={styles.cardHeader} style={{position: 'relative', zIndex: 2}}>HIGHEST RATED</h3>
          <h2 className={styles.favoriteTitle} style={{fontSize: 24, marginTop: 'auto', position: 'relative', zIndex: 2}}>
            {data.highestRated?.title || "None"}
          </h2>
          {data.highestRated && (
             <div className={styles.stars}>
               <StarRating rating={data.highestRated.rating || 0} size={14} />
             </div>
          )}
        </div>

        {/* MOST REWATCHED / MEMORABLE (1 col) */}
        <div className={`${styles.card} ${styles.thirdCard}`}>
          {data.favorite?.backdrop && (
            <div className={styles.backdropBg} style={{backgroundImage: `url(https://image.tmdb.org/t/p/w780${data.favorite.backdrop})`}} />
          )}
          <h3 className={styles.cardHeader} style={{position: 'relative', zIndex: 2}}>MOST MEMORABLE</h3>
          <h2 className={styles.favoriteTitle} style={{fontSize: 24, marginTop: 'auto', position: 'relative', zIndex: 2}}>
            {data.favorite?.title || "None"}
          </h2>
          <div style={{color: 'var(--primary-accent)', fontSize: 14, zIndex: 2, position: 'relative', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4}}>
            <Target size={14}/> Top 1% favorite
          </div>
        </div>

        {/* DISCOVERY OF THE YEAR (2 cols) */}
        <div className={`${styles.card} ${styles.thirdCard}`} style={{gridColumn: 'span 2'}}>
          {data.discovery?.backdrop && (
            <div className={styles.backdropBg} style={{backgroundImage: `url(https://image.tmdb.org/t/p/w1280${data.discovery.backdrop})`, maskImage: 'linear-gradient(to right, black 40%, transparent)'}} />
          )}
          <div style={{position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%'}}>
            <h3 className={styles.cardHeader}>DISCOVERY OF THE YEAR</h3>
            <h2 className={styles.favoriteTitle} style={{fontSize: 32, marginBottom: 8}}>{data.discovery?.title || "None"}</h2>
            {data.discovery && (
               <div className={styles.stars}>
                 <StarRating rating={data.discovery.rating || 0} size={14} />
               </div>
            )}
            <div style={{marginTop: 'auto', fontSize: 13, color: 'rgba(255,255,255,0.7)'}}>
              You watched it on {data.discovery?.watchDate || "a special day"}
            </div>
            <div style={{fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8}}>
              Only <span style={{color: 'var(--primary-accent)', fontWeight: 600}}>12%</span> of tracker users discovered it.
            </div>
          </div>
        </div>

        {/* CALENDAR (2 cols) */}
        <div className={`${styles.card} ${styles.calendarCard}`}>
          <h3 className={styles.cardHeader}>YOUR CINEMA CALENDAR</h3>
          <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Space Grotesk', marginBottom: 4, marginTop: 16, paddingRight: 10}}>
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => <span key={m}>{m}</span>)}
          </div>
          <div className={styles.calendarGrid} style={{marginTop: 0}}>
            {allCalendarBoxes}
          </div>
        </div>

        {/* TIME WELL SPENT (2 cols) */}
        <div className={`${styles.card} ${styles.calendarCard}`} style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
           <div>
             <h3 className={styles.cardHeader}>TIME WELL SPENT</h3>
             <div style={{fontFamily: 'Sora', fontSize: 64, fontWeight: 700}}>{data.stats.hoursWatched}</div>
             <div style={{fontFamily: 'Space Grotesk', fontSize: 20, color: 'var(--primary-accent)', marginTop: -10}}>Hours</div>
             <div style={{display: 'flex', gap: 24, marginTop: 16}}>
               <div>
                 <div style={{fontFamily: 'Sora', fontSize: 24}}>{Math.round(data.stats.hoursWatched / 24)}</div>
                 <div style={{fontSize: 12, color: 'rgba(255,255,255,0.5)'}}>Days</div>
               </div>
               <div>
                 <div style={{fontFamily: 'Sora', fontSize: 24}}>{((data.stats.hoursWatched / (daysInYear * 24)) * 100).toFixed(1)}%</div>
                 <div style={{fontSize: 12, color: 'rgba(255,255,255,0.5)'}}>of your year</div>
               </div>
             </div>
           </div>
           <div style={{maxWidth: 200, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, textAlign: 'right'}}>
             That's like watching the entire Lord of the Rings trilogy <strong style={{color: 'var(--primary-accent)'}}>{Math.round(data.stats.hoursWatched / 11)} times!</strong>
           </div>
        </div>

        {/* TOP DIRECTORS (2 cols, except for 2026) */}
        {year !== 2026 && (
          <div className={`${styles.card} ${styles.directorsCard}`}>
            <h3 className={styles.cardHeader}>TOP DIRECTORS</h3>
            <div className={styles.directorsRow}>
              {data.directors.map((d: any, i: number) => (
                <div key={i} className={styles.directorItem}>
                  <img src={d.profile_path ? `https://image.tmdb.org/t/p/w200${d.profile_path}` : '/default_avatar.png'} className={styles.dirAvatar} alt=""/>
                  <div className={styles.dirName}>
                    <strong>{d.name}</strong><br/>
                    <span style={{color: 'rgba(255,255,255,0.6)', fontSize: 11}}>{d.count} movies</span>
                  </div>
                </div>
              ))}
              {data.directors.length === 0 && <span style={{color: 'rgba(255,255,255,0.5)'}}>Not enough data</span>}
            </div>
          </div>
        )}

        {/* 2026 EXCLUSIVE: HALL OF FAME & ACTOR SPOTLIGHT */}
        {year === 2026 && data.mostCompletedDirectors && data.newDirectors && data.topActors && (
          <>
            <div className={`${styles.card} ${styles.hallOfFameCard}`}>
              <h3 className={styles.cardHeader} style={{fontSize: 16, color: 'white', textTransform: 'none', letterSpacing: 'normal'}}>Director Hall of Fame</h3>
              <div className={styles.hofSections} style={{marginTop: 20}}>
                
                <div className={styles.hofSection}>
                  <div className={styles.hofHeader} style={{color: '#60A5FA'}}>Most Watched Directors</div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12}}>
                    {data.directors.slice(0,3).map((d: any, i: number) => (
                      <div key={i} className={styles.hofItem}>
                        <span className={styles.hofRank} style={{width: 16, fontSize: 13, color: 'rgba(255,255,255,0.9)'}}>{i+1}</span>
                        <div style={{position: 'relative', width: 44, height: 44, borderRadius: '50%', padding: 2, background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))'}}>
                          <img src={d.profile_path ? `https://image.tmdb.org/t/p/w200${d.profile_path}` : '/default_avatar.png'} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} alt=""/>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
                          <span style={{fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.9)'}}>{d.name}</span>
                          <span style={{fontSize: 11, color: 'rgba(255,255,255,0.5)'}}>{d.count} movies</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.directors.length === 0 && <span style={{color: 'rgba(255,255,255,0.5)'}}>Not enough data</span>}
                </div>

                <div className={styles.hofSection} style={{borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: 24}}>
                  <div className={styles.hofHeader} style={{color: '#C084FC'}}>Most Completed Filmographies</div>
                  <div style={{display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center'}}>
                    {data.mostCompletedDirectors.map((d: any, i: number) => {
                      const colors = ['#38BDF8', '#C084FC', '#FBBF24'];
                      return (
                        <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1}}>
                          <div style={{position: 'relative', width: 72, height: 72, borderRadius: '50%', padding: 2, background: `linear-gradient(to bottom right, ${colors[i]}, transparent)`, boxShadow: `0 0 20px ${colors[i]}30`}}>
                            <div style={{position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: '#0B111A', border: `1.5px solid ${colors[i]}`, color: colors[i], borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, zIndex: 2, boxShadow: `0 0 10px ${colors[i]}80`}}>
                              {i+1}
                            </div>
                            <img src={d.profile_path ? `https://image.tmdb.org/t/p/w200${d.profile_path}` : '/default_avatar.png'} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: '#0B111A'}} alt=""/>
                          </div>
                          <div style={{textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2}}>
                            <span style={{fontWeight: 600, fontSize: 12, lineHeight: 1.2, color: 'rgba(255,255,255,0.9)'}}>{d.name}</span>
                            <span style={{fontSize: 11, color: 'rgba(255,255,255,0.5)'}}>{d.watchedAllTime} / {d.totalDirected}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {data.mostCompletedDirectors.length === 0 && <span style={{color: 'rgba(255,255,255,0.5)'}}>Not enough data</span>}
                </div>

                <div className={styles.hofSection} style={{borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: 24}}>
                  <div className={styles.hofHeader} style={{color: '#F43F5E'}}>New Directors Discovered</div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12}}>
                    {data.newDirectors.map((d: any, i: number) => (
                      <div key={i} className={styles.hofItem} style={{justifyContent: 'space-between', paddingRight: 8}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                          <div style={{width: 36, height: 36, borderRadius: '50%', padding: 1, background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.4), transparent)'}}>
                            <img src={d.profile_path ? `https://image.tmdb.org/t/p/w200${d.profile_path}` : '/default_avatar.png'} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} alt=""/>
                          </div>
                          <span style={{fontWeight: 500, fontSize: 13, color: 'rgba(255,255,255,0.8)'}}>{d.name}</span>
                        </div>
                        <div style={{background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#F43F5E', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12}}>
                          New
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.newDirectors.length === 0 && <span style={{color: 'rgba(255,255,255,0.5)'}}>Not enough data</span>}
                </div>

              </div>
            </div>

            <div className={`${styles.card} ${styles.actorCard}`}>
              <h3 className={styles.cardHeader} style={{fontSize: 16, color: 'white', textTransform: 'none', letterSpacing: 'normal'}}>Actor Spotlight</h3>
              <div className={styles.hofHeader} style={{color: '#60A5FA', marginTop: 16}}>Most Watched Actors</div>
              <div style={{display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 24}}>
                {data.topActors.map((a: any, i: number) => {
                  const colors = ['#38BDF8', '#C084FC', '#F43F5E', '#FBBF24'];
                  return (
                    <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flex: 1}}>
                       <div style={{position: 'relative', width: 64, height: 64, borderRadius: '50%', padding: 2, background: `linear-gradient(to bottom right, ${colors[i%colors.length]}, transparent)`, boxShadow: `0 0 15px ${colors[i%colors.length]}30`}}>
                         <img src={a.profile_path ? `https://image.tmdb.org/t/p/w200${a.profile_path}` : '/default_avatar.png'} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: '#0B111A'}} alt=""/>
                       </div>
                       <div style={{textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2}}>
                         <span style={{fontWeight: 600, fontSize: 12, lineHeight: 1.2, color: 'rgba(255,255,255,0.9)'}}>{a.name}</span>
                         <span style={{fontSize: 11, color: 'rgba(255,255,255,0.5)'}}>{a.count} movies</span>
                       </div>
                    </div>
                  );
                })}
              </div>
              {data.topActors.length === 0 && <span style={{color: 'rgba(255,255,255,0.5)'}}>Not enough data</span>}
            </div>
          </>
        )}

        {/* MOOD BREAKDOWN (2 cols) */}
        <div className={`${styles.card} ${styles.moodCard}`}>
          <h3 className={styles.cardHeader}>YOUR MOOD BREAKDOWN</h3>
          <div className={styles.moodsRow}>
            {data.moods.map((m: any, i: number) => {
              const IconComp = {
                Brain, Rocket, CloudRain, Coffee, Smile, Ghost, Eye, Sparkles, Search, PartyPopper
              }[m.icon as "Brain"|"Rocket"|"CloudRain"|"Coffee"|"Smile"|"Ghost"|"Eye"|"Sparkles"|"Search"|"PartyPopper"] || Star;
              
              return (
                <div key={i} className={styles.moodItem}>
                  <div className={styles.moodIcon}><IconComp size={40} strokeWidth={1.5} color="var(--primary-accent)" /></div>
                  <div className={styles.moodLabel}>{m.mood}</div>
                  <div className={styles.moodPct}>{m.percent}%</div>
                </div>
              );
            })}
            {data.moods.length === 0 && <span style={{color: 'rgba(255,255,255,0.5)'}}>Not enough data</span>}
          </div>
        </div>

        {/* LONGEST / SHORTEST / STREAK (1 col container) */}
        <div style={{gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: 24}}>
           {/* LONGEST */}
           <div className={styles.card} style={{flex: 1}}>
             {data.longest.poster && <div className={styles.backdropBg} style={{backgroundImage: `url(https://image.tmdb.org/t/p/w500${data.longest.poster})`}} />}
             <h3 className={styles.cardHeader} style={{position: 'relative', zIndex: 2}}>LONGEST MOVIE</h3>
             <h4 style={{position: 'relative', zIndex: 2, fontSize: 16, marginTop: 'auto'}}>{data.longest.title || "None"}</h4>
             <span style={{position: 'relative', zIndex: 2, fontSize: 12, color: 'var(--primary-accent)'}}>{Math.floor(data.longest.runtime/60)}h {data.longest.runtime%60}m</span>
           </div>
           {/* SHORTEST */}
           <div className={styles.card} style={{flex: 1}}>
             {data.shortest.poster && <div className={styles.backdropBg} style={{backgroundImage: `url(https://image.tmdb.org/t/p/w500${data.shortest.poster})`}} />}
             <h3 className={styles.cardHeader} style={{position: 'relative', zIndex: 2}}>SHORTEST MOVIE</h3>
             <h4 style={{position: 'relative', zIndex: 2, fontSize: 16, marginTop: 'auto'}}>{data.shortest.title || "None"}</h4>
             <span style={{position: 'relative', zIndex: 2, fontSize: 12, color: 'var(--primary-accent)'}}>{Math.floor(data.shortest.runtime/60)}h {data.shortest.runtime%60}m</span>
           </div>
        </div>

        {/* STREAK MASTER (1 col) */}
        <div className={styles.card} style={{gridColumn: 'span 1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
           <h3 className={styles.cardHeader} style={{alignSelf: 'flex-start', position: 'absolute', top: 24, left: 24}}>STREAK MASTER</h3>
           <div style={{fontFamily: 'Sora', fontSize: 64, fontWeight: 700}}>{data.streak}</div>
           <div style={{fontFamily: 'Space Grotesk', fontSize: 18, color: 'var(--primary-accent)', marginTop: -5}}>days</div>
           <div style={{fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 16, display: 'flex', alignItems: 'center', gap: 6}}>
             <Disc size={14} color="var(--primary-accent)" /> Your longest watch streak
           </div>
        </div>

        {/* TOP 5 MOVIES (2 cols) */}
        <div className={`${styles.card} ${styles.top5Card}`}>
          <h3 className={styles.cardHeader}>YOUR TOP 5 MOVIES</h3>
          <div className={styles.top5Row}>
            {data.top5.map((m: any, i: number) => (
              <div key={i} className={styles.top5Item}>
                <div style={{position: 'relative', width: '100%'}}>
                  <div style={{position: 'absolute', top: -10, left: -10, width: 24, height: 24, background: '#0B111A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, border: '1px solid var(--primary-accent)', zIndex: 3}}>
                    {i+1}
                  </div>
                  <img src={m.poster ? `https://image.tmdb.org/t/p/w300${m.poster}` : '/default_poster.png'} className={styles.top5Poster} alt={m.title} />
                </div>
                <span style={{fontSize: 11, textAlign: 'center', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{m.title}</span>
                <div style={{display: 'flex', gap: 2}}>
                   <StarRating rating={m.rating || 0} size={8} />
                </div>
              </div>
            ))}
            {data.top5.length === 0 && <span style={{color: 'rgba(255,255,255,0.5)'}}>Not enough data</span>}
          </div>
        </div>

      </div>
    </div>
  );
}
