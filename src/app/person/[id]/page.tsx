"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPersonDetails, getTrending, IMG, type PersonDetails, type Movie } from "@/lib/tmdb";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { Calendar, MapPin, Globe, Plus, Bookmark, Share2, ChevronDown, ChevronRight, Play, Check } from "lucide-react";
import { isFollowingPerson, toggleFollowPerson } from "@/app/actions/person";

// Mock Data
const MOCK_AWARDS = [
  { id: 1, title: "Academy Awards", wins: 1, noms: 6, icon: "🏆" },
  { id: 2, title: "BAFTA Awards", wins: 2, noms: 5, icon: "🛡️" },
  { id: 3, title: "Golden Globe Awards", wins: 3, noms: 8, icon: "🌎" },
];

function HorizontalCarousel({ title, count, children }: { title: string, count: number, children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className={styles.carouselSection}>
      <div className={styles.carouselHeader}>
        <h3 className={styles.carouselTitle}>{title}</h3>
        <span className={styles.viewAllLink}>View all ({count})</span>
      </div>
      <div className={styles.carouselWrapper}>
        <div className={styles.carouselTrack} ref={scrollRef}>
          {children}
        </div>
        <button className={styles.scrollBtn} onClick={() => {
          if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 600, behavior: "smooth" });
          }
        }}>
          <ChevronRight size={20} color="white" />
        </button>
      </div>
    </div>
  );
}

export default function PersonPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Most Popular");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getPersonDetails(id),
      getTrending(),
      isFollowingPerson(id)
    ]).then(([personData, trendingData, followingData]) => {
      setPerson(personData);
      setTrending(trendingData);
      setIsFollowing(followingData);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

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

  if (!person) {
    return (
      <main className={styles.pageWrapper}>
        <Navbar />
        <div className={styles.loadingContainer}>
          <h2>Person not found.</h2>
        </div>
      </main>
    );
  }

  const handleToggleFollow = async () => {
    if (!person) return;
    const res = await toggleFollowPerson(
      person.id.toString(),
      person.name,
      person.profile_path,
      person.known_for_department || "Director"
    );
    if (res.success && res.followed !== undefined) {
      setIsFollowing(res.followed);
    }
  };

  // Derived data
  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const ageDifMs = Date.now() - birth.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };
  const age = calculateAge(person.birthday);

  // Dynamic but consistent mock data for awards
  const mockAwards = person.id % 24;
  const mockNominations = (person.id % 60) + mockAwards + 5;

  const formattedBirthday = person.birthday ? new Date(person.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Unknown";

  const castCredits = person.combined_credits?.cast || [];
  const crewCredits = person.combined_credits?.crew || [];

  const hasActor = castCredits.length > 0;
  const hasDirector = crewCredits.some(c => c.department === "Directing" || c.job === "Director");
  const hasProducer = crewCredits.some(c => c.department === "Production" || c.job === "Producer");
  const hasWriter = crewCredits.some(c => c.department === "Writing" || c.job === "Writer");

  const filterOptions = ["All", "Movies", "TV Shows"];
  if (hasActor) filterOptions.push("As Actor");
  if (hasDirector) filterOptions.push("As Director");
  if (hasProducer) filterOptions.push("As Producer");
  if (hasWriter) filterOptions.push("As Writer");

  const sortOptions = ["Most Popular", "Newest", "Oldest", "Highest Rated"];

  const creditMap = new Map();

  castCredits.forEach(c => {
    if (!creditMap.has(c.id)) {
      creditMap.set(c.id, { ...c, roles: new Set(["Actor"]) });
    } else {
      creditMap.get(c.id).roles.add("Actor");
    }
  });

  crewCredits.forEach(c => {
    let role = null;
    if (c.department === "Directing" || c.job === "Director") role = "Director";
    else if (c.department === "Production" || c.job === "Producer") role = "Producer";
    else if (c.department === "Writing" || c.job === "Writer") role = "Writer";
    else role = "Crew";

    if (!creditMap.has(c.id)) {
      creditMap.set(c.id, { ...c, roles: new Set([role]) });
    } else {
      creditMap.get(c.id).roles.add(role);
    }
  });

  let filteredCredits = Array.from(creditMap.values());

  // Apply Filter
  if (filter === "Movies") {
    filteredCredits = filteredCredits.filter(c => c.media_type === "movie");
  } else if (filter === "TV Shows") {
    filteredCredits = filteredCredits.filter(c => c.media_type === "tv");
  } else if (filter === "As Actor") {
    filteredCredits = filteredCredits.filter(c => c.roles.has("Actor"));
  } else if (filter === "As Director") {
    filteredCredits = filteredCredits.filter(c => c.roles.has("Director"));
  } else if (filter === "As Producer") {
    filteredCredits = filteredCredits.filter(c => c.roles.has("Producer"));
  } else if (filter === "As Writer") {
    filteredCredits = filteredCredits.filter(c => c.roles.has("Writer"));
  }

  // Apply Sorting
  if (sortBy === "Most Popular") {
    filteredCredits.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  } else if (sortBy === "Newest") {
    filteredCredits.sort((a, b) => {
      const dateA = new Date(a.release_date || a.first_air_date || "1900-01-01").getTime();
      const dateB = new Date(b.release_date || b.first_air_date || "1900-01-01").getTime();
      return dateB - dateA;
    });
  } else if (sortBy === "Oldest") {
    filteredCredits.sort((a, b) => {
      const dateA = new Date(a.release_date || a.first_air_date || "2100-01-01").getTime();
      const dateB = new Date(b.release_date || b.first_air_date || "2100-01-01").getTime();
      return dateA - dateB;
    });
  } else if (sortBy === "Highest Rated") {
    filteredCredits.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  }

  const movies = filteredCredits.filter(c => c.media_type === "movie");
  const tvShows = filteredCredits.filter(c => c.media_type === "tv");

  // Format department tags
  const departments = Array.from(new Set([person.known_for_department, ...(person.combined_credits?.crew?.map(c => c.department) || [])])).slice(0, 3);

  // Top Known For
  const knownFor = Array.from(creditMap.values()).sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 3);

  return (
    <main className={styles.pageWrapper}>
      <Navbar />
      
      <div className={styles.container}>
        {/* LEFT COLUMN */}
        <div className={styles.mainContent}>
          
          <div className={styles.headerProfile}>
            <div className={styles.profileImageWrap}>
              {person.profile_path ? (
                <img src={IMG.poster(person.profile_path, "w500") ?? undefined} alt={person.name} className={styles.profileImage} />
              ) : (
                <div className={styles.profileFallback}>No Image</div>
              )}
              <div className={styles.profileGradient} />
            </div>

            <div className={styles.profileInfo}>
              <div className={styles.tags}>
                {departments.map((dep, idx) => (
                  <span key={idx}>{dep?.toUpperCase()}{idx < departments.length - 1 ? ' • ' : ''}</span>
                ))}
              </div>
              <h1 className={styles.name}>{person.name} <span className={styles.verifiedTick}>✔</span></h1>
              
              <div className={styles.metaRow}>
                {person.birthday && (
                  <span className={styles.metaItem}>
                    <Calendar size={14} /> {formattedBirthday} {age ? `(${age})` : ''}
                  </span>
                )}
                {person.place_of_birth && (
                  <span className={styles.metaItem}>
                    <MapPin size={14} /> {person.place_of_birth}
                  </span>
                )}
                {person.place_of_birth && (
                  <span className={styles.metaItem}>
                    <Globe size={14} /> {person.place_of_birth.split(',').pop()?.trim()}
                  </span>
                )}
              </div>

              <div className={styles.bioContainer}>
                <p className={styles.bio}>
                  {person.biography ? person.biography.slice(0, 200) + "..." : "No biography available."}
                </p>
                {person.biography && person.biography.length > 200 && (
                  <button className={styles.readMoreBtn}>Read more <ChevronDown size={14} /></button>
                )}
              </div>

              <div className={styles.actionButtons}>
                <button className={`${styles.followBtn} ${isFollowing ? styles.followingBtn : ""}`} onClick={handleToggleFollow}>
                  {isFollowing ? <Check size={16} /> : <Plus size={16} />} 
                  {isFollowing ? "Following" : (person.known_for_department === "Directing" ? "Follow Director" : "Follow")}
                </button>
                <button className={styles.listBtn}><Bookmark size={16} /> Add to List</button>
                <button className={styles.iconBtn}><Share2 size={16} /></button>
              </div>
            </div>
          </div>

          {/* FILMOGRAPHY SECTION */}
          <div className={styles.filmographySection}>
            <div className={styles.filmographyHeader}>
              <div className={styles.filmoLeft}>
                <h2 className={styles.filmoTitle}>Filmography</h2>
                <div className={styles.filterPills}>
                  {filterOptions.map(f => (
                    <button 
                      key={f} 
                      className={`${styles.pill} ${filter === f ? styles.pillActive : ""}`}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.sortDropdown} ref={sortMenuRef}>
                <span>Sort by:</span>
                <button className={styles.sortBtn} onClick={() => setShowSortMenu(!showSortMenu)}>
                  {sortBy} <ChevronDown size={14} />
                </button>
                {showSortMenu && (
                  <div className={styles.sortMenu}>
                    {sortOptions.map(opt => (
                      <button 
                        key={opt} 
                        className={`${styles.sortMenuBtn} ${sortBy === opt ? styles.sortMenuBtnActive : ""}`}
                        onClick={() => { setSortBy(opt); setShowSortMenu(false); }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {movies.length > 0 && (
              <div className={styles.mediaRowWrapper}>
                <HorizontalCarousel title="Movies" count={movies.length}>
                  {movies.map((m: any) => (
                    <div key={`m-${m.id}`} className={styles.mediaCard} onClick={() => router.push(`/movie/${m.id}`)}>
                      <div className={styles.posterWrap}>
                        {m.poster_path ? (
                          <img src={IMG.poster(m.poster_path, "w300") ?? undefined} alt={m.title} className={styles.poster} />
                        ) : (
                          <div className={styles.posterFallback}>No Image</div>
                        )}
                        {m.vote_average ? (
                          <div className={styles.ratingBadge}>{m.vote_average.toFixed(1)}</div>
                        ) : null}
                      </div>
                      <h4 className={styles.cardTitle}>{m.title}</h4>
                      <p className={styles.cardYear}>{m.release_date?.slice(0, 4) || "Unknown"}</p>
                    </div>
                  ))}
                </HorizontalCarousel>
              </div>
            )}

            {tvShows.length > 0 && (
              <div className={styles.mediaRowWrapper}>
                <HorizontalCarousel title="TV Shows" count={tvShows.length}>
                  {tvShows.map((tv: any) => (
                    <div key={`tv-${tv.id}`} className={styles.mediaCard} onClick={() => router.push(`/tv/${tv.id}`)}>
                      <div className={styles.posterWrap}>
                        {tv.poster_path ? (
                          <img src={IMG.poster(tv.poster_path, "w300") ?? undefined} alt={tv.name} className={styles.poster} />
                        ) : (
                          <div className={styles.posterFallback}>No Image</div>
                        )}
                        {tv.vote_average ? (
                          <div className={styles.ratingBadge}>{tv.vote_average.toFixed(1)}</div>
                        ) : null}
                      </div>
                      <h4 className={styles.cardTitle}>{tv.name}</h4>
                      <p className={styles.cardYear}>{tv.first_air_date?.slice(0, 4) || "Unknown"}</p>
                    </div>
                  ))}
                </HorizontalCarousel>
              </div>
            )}

          </div>

        </div>

        {/* RIGHT SIDEBAR */}
        <div className={styles.sidebar}>
          
          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{movies.length}</span>
              <span className={styles.statLabel}>Movies</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{tvShows.length}</span>
              <span className={styles.statLabel}>TV Shows</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{mockAwards}</span>
              <span className={styles.statLabel}>Awards</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{mockNominations}</span>
              <span className={styles.statLabel}>Nominations</span>
            </div>

            <div className={styles.divider} />
            
            <h4 className={styles.sidebarTitle}>Known For</h4>
            <div className={styles.knownForPills}>
              {knownFor.map(k => (
                <span key={k.id} className={styles.knownPill}>{(k as any).title || (k as any).name}</span>
              ))}
            </div>
          </div>

          <div className={styles.aboutCard}>
            <h3 className={styles.sidebarCardTitle}>About</h3>
            <div className={styles.aboutList}>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Full Name</span>
                <span className={styles.aboutValue}>{person.name}</span>
              </div>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Born</span>
                <span className={styles.aboutValue}>{formattedBirthday}</span>
              </div>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Place of Birth</span>
                <span className={styles.aboutValue}>{person.place_of_birth || "Unknown"}</span>
              </div>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Nationality</span>
                <span className={styles.aboutValue}>{person.place_of_birth?.split(',').pop()?.trim() || "Unknown"}</span>
              </div>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Occupation</span>
                <span className={styles.aboutValue}>{departments.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}</span>
              </div>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Years Active</span>
                <span className={styles.aboutValue}>Unknown – Present</span>
              </div>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Agent</span>
                <span className={styles.aboutValueHighlight}>APA Agency</span>
              </div>
            </div>
          </div>

          <div className={styles.awardsCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.sidebarCardTitle}>Awards & Nominations</h3>
            </div>
            <div className={styles.awardsFallback}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 12 }}>
                Detailed awards data is not provided by our media database.
              </p>
              {person.external_ids?.imdb_id && (
                <a 
                  href={`https://www.imdb.com/name/${person.external_ids.imdb_id}/awards`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: "var(--primary-accent)", fontSize: 13, textDecoration: "none", fontWeight: 600 }}
                >
                  View full awards on IMDb ↗
                </a>
              )}
            </div>
          </div>

          <div className={styles.trendingCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.sidebarCardTitle}>Trending On Velune</h3>
              <span className={styles.viewAll}>View all</span>
            </div>
            {trending.length > 0 && (
              <div className={styles.trendingItem} onClick={() => router.push(`/movie/${trending[0].id}`)}>
                <img src={IMG.backdrop(trending[0].backdrop_path, "w300") ?? undefined} alt={trending[0].title} className={styles.trendingThumb} />
                <div className={styles.trendingInfo}>
                  <p className={styles.trendingTitle}>{trending[0].title}</p>
                  <div className={styles.playIcon}><Play size={12} fill="currentColor" /></div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
