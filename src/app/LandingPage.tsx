import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./LandingPage.module.css";
import { Play, ArrowRight, Video, FileText, Hexagon, Tv, Camera, Globe, Hash, Share2, X } from "lucide-react";
import { IMG, type Movie, getDetails } from "@/lib/tmdb";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettings } from "@/contexts/SettingsContext";
import { useDialog } from "@/contexts/DialogContext";

interface LandingPageProps {
  trending: Movie[];
  topRated: Movie[];
  onThisDay?: Movie | null;
  top100?: Movie[];
  isLoggedIn?: boolean;
}

export default function LandingPage({ trending, topRated, onThisDay, top100 = [], isLoggedIn }: LandingPageProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const ratingMode = settings?.ratingSystem || "10";
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const { showAlert } = useDialog();

  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(trending.length, 5));
    }, 10000);
    return () => clearInterval(interval);
  }, [trending]);

  // Primary hero movie
  const heroMovie = trending.length > 0 ? trending[heroIndex] : null;
  
  // Side list movies (next 3 in line)
  const sideMovies = trending.length > 0 
    ? [...trending.slice(heroIndex + 1, heroIndex + 4), ...trending.slice(0, 3)].slice(0, 3) 
    : [];

  // Bottom featured movies
  const hiddenGem = topRated[0];

  const handleWatchTrailer = async () => {
    if (!heroMovie) return;
    try {
      const details = await getDetails('movie', heroMovie.id.toString());
      if (!details) {
        await showAlert("Trailer not available.");
        return;
      }
      const trailer = details.videos?.results.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
      if (trailer) {
        setTrailerKey(trailer.key);
        setShowTrailer(true);
      } else {
        await showAlert("No trailer available.");
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleExplore = () => {
    if (heroMovie) {
      router.push(`/movie/${heroMovie.id}`);
    }
  };

  return (
    <main className={styles.pageWrapper}>
      <div className={styles.landingContainer}>
        
        {/* --- TOP DARK SECTION --- */}
      <section className={styles.topSection}>
        {heroMovie && (
          <div 
            key={heroMovie.id}
            className={styles.heroBackground} 
            style={{ backgroundImage: `url(${IMG.backdrop(heroMovie.backdrop_path, "original")})` }} 
          />
        )}
        <div className={styles.heroOverlay} />

        {/* Universal Navbar */}
        <Navbar />

        {/* Hero Content */}
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <span className={styles.featuredLabel}>FEATURED MOVIE</span>
            <h2 className={styles.heroTitle}>{heroMovie?.title || "INTERSTELLAR"}</h2>
            
            <div className={styles.heroMeta}>
              <span>{heroMovie?.release_date?.slice(0, 4) || "2014"}</span>
              <span className={styles.dot}>•</span>
              <span style={{ color: "#E94560", fontWeight: "bold" }}>
                ★ {heroMovie?.vote_average ? (ratingMode === "5" ? (heroMovie.vote_average / 2).toFixed(1) : heroMovie.vote_average.toFixed(1)) : "8.5"}/{ratingMode === "5" ? "5" : "10"}
              </span>
            </div>

            {/* <p className={styles.heroQuote}>
              <i>“Mankind was born on Earth.<br/>It was never meant to die here.”</i>
            </p> */}

            <p className={styles.heroDesc}>
              {heroMovie?.overview || "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival."}
            </p>

            <div className={styles.heroActions}>
              <button className={styles.watchBtn} onClick={handleWatchTrailer}>
                <Play size={16} /> {t('media.trailer')}
              </button>
              <button className={styles.exploreBtn} onClick={handleExplore}>
                Explore Movie <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.sideList}>
              {sideMovies.map((m) => (
                <div key={m.id} className={styles.sideCard} onClick={() => router.push(`/movie/${m.id}`)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={IMG.backdrop(m.backdrop_path, "w780") ?? undefined} alt={m.title} className={styles.sideImg} />
                  <div className={styles.sideInfo}>
                    <h4 className={styles.sideTitle}>{m.title.toUpperCase()}</h4>
                    <span className={styles.sideRating}>☆ {m.vote_average.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The Sweeping Curve SVG */}
        <div className={styles.curveWrapper}>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className={styles.curveSvg}>
            <path d="M0,120 L1440,120 L1440,30 C1200,80 800,100 720,100 C640,100 240,80 0,30 Z" style={{ fill: 'var(--card-bg)' }} />
          </svg>
        </div>

        {/* Central Floating Badge */}
        <div className={styles.centerBadge}>
          <div className={styles.badgeInner}>
            <span>TRACK</span>
            <span>RATE</span>
            <span>REMEMBER</span>
            <div className={styles.badgeArrow}>↓</div>
          </div>
        </div>

      </section>

      {/* --- BOTTOM LIGHT SECTION --- */}
      <section className={styles.bottomSection}>
        
        <div className={styles.bottomContent}>
          <div className={styles.bottomLeft}>
            <div className={styles.sectionLabelWrapper}>
              <span className={styles.sectionLabel}>YOUR CINEMA</span>
              <div className={styles.labelLine} />
            </div>
            
            <h2 className={styles.bottomTitle}>
              Track movies.<br/>
              Build watchlists.<br/>
              Remember stories.
            </h2>
            
            <p className={styles.bottomDesc}>
              Velune is your personal space<br/>
              for films that stay with you.
            </p>

            <button className={styles.startExploringBtn} onClick={() => router.push(isLoggedIn ? "/profile" : "/login")}>
              {isLoggedIn ? "Go to Profile" : "Start Exploring"} <ArrowRight size={16} />
            </button>
          </div>

          <div className={styles.bottomRight}>
            
            {/* Card 1: Tonight's Pick (On This Day) */}
            {(onThisDay || topRated[1]) && (
              <div className={styles.featureCard} onClick={() => router.push(`/movie/${onThisDay?.id || topRated[1]?.id}`)}>
                <img src={IMG.backdrop(onThisDay?.backdrop_path || topRated[1]?.backdrop_path, "w780") ?? undefined} alt={onThisDay?.title || topRated[1]?.title} className={styles.featureImg} />
                <div className={styles.featureOverlay}>
                  <span className={styles.featureTag}>TONIGHT'S PICK</span>
                  <h3 className={styles.featureTitle}>{onThisDay?.title || topRated[1]?.title}</h3>
                  <p className={styles.featureSubtitle}>{onThisDay ? `Released exactly on this day in ${onThisDay.release_date?.substring(0,4)}.` : "Some stories change the way you see the stars."}</p>
                  <div className={styles.featureAction}>
                    <div className={styles.circleArrow}><ArrowRight size={12} /></div>
                    <span>Explore</span>
                  </div>
                </div>
              </div>
            )}

            {/* Card 2: Top 100 Movies Collection */}
            {top100.length > 0 && (
              <div 
                className={styles.featureCard} 
                style={{ background: 'white', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} 
                onClick={() => router.push('/collections/top-100')}
              >
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#8A2BE2', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>CURATED COLLECTION</span>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', color: '#1A1A1A', fontFamily: "'Sora', sans-serif" }}>Top 100 IMDb Rated</h3>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>The ultimate cinema collection.</p>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    {top100.slice(0, 5).map((m: any) => (
                      <div key={m.id} style={{ position: 'relative', flex: 1, aspectRatio: '2/3' }}>
                        <img 
                          src={IMG.poster(m.poster_path, "w185") ?? undefined} 
                          style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                          alt=""
                        />
                        <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.7)', padding: '2px 4px', borderRadius: '4px', fontSize: '9px', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <span style={{ color: '#FFD700' }}>★</span> {m.vote_average.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#666', marginTop: 'auto', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex' }}>
                         <img src="/cinematic_login_hero.png" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} alt=""/>
                         <img src="/cinematic_login_hero.png" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', marginLeft: -10 }} alt=""/>
                         <img src="/cinematic_login_hero.png" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', marginLeft: -10 }} alt=""/>
                      </div>
                      <span>12K+ members</span>
                    </div>
                    <div style={{ color: '#8A2BE2', display: 'flex', alignItems: 'center', gap: '4px' }}>View Collection <ArrowRight size={14} /></div>
                  </div>
              </div>
            )}

            {/* Card 3: Surprise Me */}
            <div 
              className={styles.featureCard} 
              style={{ backgroundImage: 'url(/surprise_me_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', color: 'white' }} 
              onClick={() => {
                const randomMovie = topRated[Math.floor(Math.random() * topRated.length)];
                if (randomMovie) router.push(`/movie/${randomMovie.id}`);
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.9))' }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary-accent)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>WATCH NEXT</span>
                <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', fontFamily: "'Sora', sans-serif" }}>Feeling Lucky?</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '20px', maxWidth: '80%', lineHeight: 1.4 }}>Let Velune surprise you with something amazing.</p>
                
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid rgba(0, 229, 197, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 229, 197, 0.3)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="white"/><circle cx="15.5" cy="15.5" r="1.5" fill="white"/><circle cx="15.5" cy="8.5" r="1.5" fill="white"/><circle cx="8.5" cy="15.5" r="1.5" fill="white"/><circle cx="12" cy="12" r="1.5" fill="white"/></svg>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}>
                    Surprise Me <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Area */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <Logo className={styles.logoText} size={16} />
            <span className={styles.footerCopy}>© {new Date().getFullYear()}</span>
          </div>

          <div className={styles.footerLinks}>
            <span>About</span>
            <span>Privacy</span>
          </div>
        </div>
      </section>

      </div>

      {showTrailer && trailerKey && (
        <div className={styles.trailerModalOverlay} onClick={() => setShowTrailer(false)}>
          <button className={styles.closeTrailerBtn} onClick={() => setShowTrailer(false)}>
            <X size={24} />
          </button>
          <div className={styles.trailerModalContent} onClick={e => e.stopPropagation()}>
            <iframe 
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=${settings.autoplayTrailers ? "1" : "0"}${settings.muteTrailersByDefault ? "&mute=1" : ""}`} 
              allow="autoplay; encrypted-media" 
              allowFullScreen 
              className={styles.trailerIframe}
            />
          </div>
        </div>
      )}
    </main>
  );
}
