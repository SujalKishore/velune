"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Film, User, LogOut, ChevronDown, ArrowRight, Bell, Star, TrendingUp, Settings, ChevronRight, Camera, Compass } from "lucide-react";
import { searchMulti, IMG, type SearchResult } from "@/lib/tmdb";
import Logo from "@/components/Logo";
import { logoutUser } from "@/app/actions/auth";
import { useTranslation } from "@/hooks/useTranslation";
import styles from "./Navbar.module.css";

function getInitials(name: string) {
  if (!name) return "U";
  return name.charAt(0).toUpperCase();
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userAvatar, setUserAvatar] = useState("");
  const [userStats, setUserStats] = useState({ totalScore: 0, topPercent: 30 });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setIsLoggedIn(true);
          setUserName(d.user.name || "User");
          setUserAvatar(d.user.avatarUrl || "");
          if (d.stats) setUserStats(d.stats);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchMulti(val);
        // ensure results is an array since searchMulti returns SearchResult[]
        const safeResults = Array.isArray(results) ? results : (results as any).results || [];
        setSearchResults(safeResults.slice(0, 1)); // Only keep the top 1 result for the dropdown
        setSearchOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/";
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>
        <button className={styles.menuPill} onClick={() => setMobileMenuOpen(prev => !prev)}>
          <div className={styles.hamburger}>
            <span />
            <span />
            <span />
          </div>
          Menu
          <div className={styles.menuDot} />
        </button>
        <div className={`${styles.navLinks} ${mobileMenuOpen ? styles.navLinksMobileOpen : ''}`}>
          <span className={`${styles.navLink} ${pathname === '/' ? styles.navLinkActive : ''}`} onClick={() => { router.push('/'); setMobileMenuOpen(false); }}>{t('nav.home')}</span>
          <span className={`${styles.navLink} ${pathname === '/trending' ? styles.navLinkActive : ''}`} onClick={() => { router.push('/trending'); setMobileMenuOpen(false); }}>{t('nav.trending')}</span>
          <span className={`${styles.navLink} ${pathname === '/movies' ? styles.navLinkActive : ''}`} onClick={() => { router.push('/movies'); setMobileMenuOpen(false); }}>{t('nav.movies')}</span>
          <span className={`${styles.navLink} ${pathname === '/tv' ? styles.navLinkActive : ''}`} onClick={() => { router.push('/tv'); setMobileMenuOpen(false); }}>{t('nav.tv_shows')}</span>
          <span className={`${styles.navLink} ${pathname?.startsWith('/collections') ? styles.navLinkActive : ''}`} onClick={() => { router.push('/collections'); setMobileMenuOpen(false); }}>{t('profile.collections')}</span>
          
          {!isLoggedIn && (
            <div className={styles.mobileAuthLinks}>
              <span className={styles.navLink} onClick={() => { router.push('/login'); setMobileMenuOpen(false); }}>{t('nav.log_in')}</span>
              <span className={styles.navLink} onClick={() => { router.push('/login?mode=register'); setMobileMenuOpen(false); }}>Sign Up</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.navCenter}>
        <h1 className={styles.logoText} onClick={() => router.push('/')}>
          <Logo size={20} />
        </h1>
      </div>

      <div className={styles.navRight}>
        {/* Search Dropdown */}
        <div className={styles.searchWrapper} ref={searchRef}>
          <div className={styles.searchBar}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('nav.search_placeholder')}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { if (searchResults.length > 0 || query) setSearchOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                  setSearchOpen(false);
                }
              }}
            />
            {query && (
              <button className={styles.searchClear} onClick={() => { setQuery(""); setSearchResults([]); setSearchOpen(false); }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            )}
          </div>

          {searchOpen && (
            <div className={styles.searchDropdown}>
              {searching && <div className={styles.searchLoading}>{t('common.loading')}</div>}
              {!searching && searchResults.length > 0 && searchResults.map((r) => {
                const imgPath = r.poster_path || r.profile_path;
                const label = r.title || r.name || "Unknown";
                const year = (r.release_date || r.first_air_date || "").slice(0, 4);
                return (
                  <div key={`${r.media_type}-${r.id}`} className={styles.searchResult} onClick={() => { 
                    if (r.media_type === "universe") {
                      router.push(`/universes/${r.id}`);
                    } else {
                      router.push(`/${r.media_type}/${r.id}`); 
                    }
                    setSearchOpen(false);
                    setQuery("");
                  }}>
                    {imgPath ? <img src={IMG.poster(imgPath, "w300") ?? undefined} alt={label} className={styles.searchThumb} /> : <div className={styles.searchThumbFallback}><Film size={16} /></div>}
                    <div className={styles.searchInfo}>
                      <span className={styles.searchTitle}>{label}</span>
                      <span className={styles.searchMeta}>Top Result • {r.media_type === "universe" ? "Universe" : r.media_type === "tv" ? "TV Show" : r.media_type === "person" ? "Person" : "Movie"}{year ? ` • ${year}` : ""}</span>
                    </div>
                  </div>
                );
              })}
              
              {!searching && searchResults.length > 0 && query && (
                <div 
                  className={styles.viewAllBtn} 
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                    setSearchOpen(false);
                  }}
                >
                  {t('search.results_for')} "{query}" <ArrowRight size={14} style={{marginLeft: 6}} />
                </div>
              )}

              {!searching && searchResults.length === 0 && query && (
                <div className={styles.searchLoading}>{t('search.no_results')} "{query}"</div>
              )}
            </div>
          )}
        </div>

        {/* Profile / Auth */}
        {isLoggedIn ? (
          <div className={styles.authContainer} ref={dropdownRef}>
            <div className={styles.profileWrapper}>
              <div className={styles.profile} onClick={() => setDropdownOpen((v) => !v)}>
                {/* Always show a profile picture */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={userAvatar || "https://i.pravatar.cc/150?u=cinephile123"} alt="Profile" className={styles.profileAvatarImg} referrerPolicy="no-referrer" />
                <div className={styles.profileTriggerText}>
                  <span className={styles.profileName}>{userName}</span>
                  <span className={styles.profileRoleTrigger}>Cinephile</span>
                </div>
                <ChevronDown size={14} className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ""}`} />
              </div>
              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownAvatarContainer}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={userAvatar || "https://i.pravatar.cc/150?u=cinephile123"} alt="Profile" className={styles.dropdownAvatarImgLarge} referrerPolicy="no-referrer" />
                      <div className={styles.cameraIconBadge}>
                        <Camera size={14} />
                      </div>
                    </div>
                    <div className={styles.dropdownHeaderText}>
                      <div className={styles.dropdownNameLarge}>{userName}</div>
                      <div className={styles.dropdownRoleLarge}>Cinephile</div>
                    </div>
                  </div>
                  
                  <div className={styles.dropdownDivider} />
                  
                  <div className={styles.statsContainer}>
                    <div className={styles.statBlock}>
                      <div className={styles.statIconWrapperStar}>
                        <Star size={20} className={styles.statIconStar} />
                      </div>
                      <div className={styles.statTextGroup}>
                        <div className={styles.statValue}>{userStats.totalScore.toLocaleString()}</div>
                        <div className={styles.statLabel}>Achievement Score</div>
                      </div>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statBlock}>
                      <div className={styles.statIconWrapperTrend}>
                        <TrendingUp size={20} className={styles.statIconTrend} />
                      </div>
                      <div className={styles.statTextGroup}>
                        <div className={styles.statValue}>Top {userStats.topPercent}%</div>
                        <div className={styles.statLabel}>Of Velune users</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.dropdownDivider} />
                  
                  <div className={styles.dropdownSection}>
                    <button className={styles.dropdownItem} onClick={() => router.push("/profile")}>
                      <div className={styles.dropdownItemLeft}>
                        <User size={18} className={styles.dropdownItemIcon} />
                        {t('nav.profile')}
                      </div>
                      <ChevronRight size={16} className={styles.chevronRight} />
                    </button>

                    <button className={styles.dropdownItem} onClick={() => router.push("/settings")}>
                      <div className={styles.dropdownItemLeft}>
                        <Settings size={18} className={styles.dropdownItemIcon} />
                        {t('nav.settings')}
                      </div>
                      <ChevronRight size={16} className={styles.chevronRight} />
                    </button>
                  </div>
                  
                  <div className={styles.dropdownDivider} />
                  
                  <div className={styles.dropdownSection}>
                    <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={handleLogout}>
                      <div className={styles.dropdownItemLeft}>
                        <LogOut size={18} className={styles.dropdownLogoutIcon} />
                        {t('profile.log_out')}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.authBtnsDesktop}>
            <button className={styles.loginBtn} onClick={() => router.push("/login")}>{t('nav.log_in')}</button>
            <button className={styles.signupBtn} onClick={() => router.push("/login?mode=register")}>Sign Up</button>
          </div>
        )}
      </div>
    </nav>
  );
}
