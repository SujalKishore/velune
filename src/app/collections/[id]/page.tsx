"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { ArrowLeft, Edit2, MoreHorizontal, Film, Users, CheckCircle2, Clock, Plus, Share2, Star, Calendar, Hash, Filter, Search, Bookmark, Trash2, X, Heart, Copy } from "lucide-react";
import { getTop100Movies, getTrending, getNowPlaying, getTopRated, getCollectionStats, IMG } from "@/lib/tmdb";
import { getCollectionById, getSessionUserId, getCollectionInteractions, updateCollection, deleteCollection, getCollectionFavoriteStats, toggleFavorite, cloneCollection } from "@/app/actions/history";
import Navbar from "@/components/Navbar";
import CustomDropdown from "@/components/CustomDropdown";
import { useSettings } from "@/contexts/SettingsContext";
import { useDialog } from "@/contexts/DialogContext";

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { settings } = useSettings();
  const { showAlert, showConfirm } = useDialog();

  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<any>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState("All Movies");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest(`.${styles.dropdownContainer}`)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleUpdate = async () => {
    if (!editName.trim()) return;
    const res = await updateCollection(id, editName, editDesc);
    if (res.success) {
      setCollection({ ...collection, name: editName, description: editDesc });
      setIsEditModalOpen(false);
    } else {
      await showAlert("Failed to update collection.");
    }
  };

  const handleDelete = async () => {
    if (await showConfirm("Are you sure you want to delete this collection?")) {
      const res = await deleteCollection(id);
      if (res.success) {
        router.push("/profile");
      } else {
        await showAlert("Failed to delete collection.");
      }
    }
  };

  const handleToggleFavorite = async () => {
    const res = await toggleFavorite(id, "collection", collection.name, movies[0]?.poster || null);
    if (res.success) {
      setIsFavorited(res.favorite);
      setFavoriteCount(prev => res.favorite ? prev + 1 : prev - 1);
    }
  };

  const handleClone = async () => {
    setIsCloning(true);
    const newName = `Clone of ${collection.name}`;
    const res = await cloneCollection(newName, collection.description || "", movies);
    setIsCloning(false);
    if (res.success) {
      await showAlert("Collection cloned successfully! You can view it in your Profile.");
    } else {
      await showAlert(res.error || "Failed to clone collection.");
    }
  };

  useEffect(() => {
    async function loadData() {
      const currentUserId = await getSessionUserId();
      
      if (id === "top-100") {
        const top100 = await getTop100Movies();
        setCollection({
          name: "Top 100 IMDb Rated",
          description: "A definitive list of the highest-rated movies on IMDb. Timeless stories. Unforgettable impact.",
          isCurated: true,
          members: "12.4K+",
          curator: "Velune Team",
          updatedAt: "May 18, 2026",
          stats: {
            avgRating: "8.71",
            oldestMovie: "The Godfather",
            oldestYear: "1972",
            totalRuntime: "272h 48m",
            topGenre: "Drama"
          }
        });
        
        const formattedMovies = top100.map(m => ({
          id: m.id,
          tmdbId: m.id.toString(),
          title: m.title,
          poster: m.poster_path,
          rating: m.vote_average,
          mediaType: 'movie',
          releaseDate: m.release_date || (m as any).first_air_date,
          popularity: m.popularity
        }));
        
        setMovies(formattedMovies);
        setIsOwner(false);
      } else if (["feel-everything", "beautiful-world", "late-night-watches", "hidden-masterpieces", "mcu", "dceu", "anime", "starwars", "cyberpunk", "lotr", "mindbending", "postapoc", "superhero"].includes(id)) {
        let moviesData: any[] = [];
        let name = "";
        let desc = "";

        if (id === "feel-everything") {
          name = "Feel Everything";
          desc = "Movies that stay with you long after the credits.";
          moviesData = await getTopRated();
        } else if (id === "beautiful-world") {
          name = "Beautiful World";
          desc = "Visually stunning. Emotionally unforgettable.";
          moviesData = await getNowPlaying();
        } else if (id === "late-night-watches") {
          name = "Late Night Watches";
          desc = "Perfect for when the world is asleep.";
          moviesData = await getTrending();
        } else if (id === "hidden-masterpieces") {
          name = "Hidden Masterpieces";
          desc = "Underrated gems you need to see.";
          const top = await getTop100Movies();
          moviesData = top.slice(50, 80);
        } else if (id === "mcu") {
          name = "Marvel Cinematic Universe";
          desc = "The Infinity Saga and beyond.";
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          moviesData = await getMoviesByKeyword("180547");
        } else if (id === "dceu") {
          name = "DC Extended Universe";
          desc = "Heroes of the DCEU.";
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          moviesData = await getMoviesByKeyword("193430");
        } else if (id === "anime") {
          name = "Anime Masterpieces";
          desc = "The best of Japanese animation.";
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          moviesData = await getMoviesByKeyword("210024");
        } else if (id === "starwars") {
          name = "Star Wars Saga";
          desc = "A long time ago in a galaxy far, far away...";
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          moviesData = await getMoviesByKeyword("4270");
        } else if (id === "cyberpunk") {
          name = "Cyberpunk Worlds";
          desc = "High tech, low life.";
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          moviesData = await getMoviesByKeyword("12190");
        } else if (id === "lotr") {
          name = "Middle-earth";
          desc = "One ring to rule them all.";
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          moviesData = await getMoviesByKeyword("6091");
        } else if (id === "mindbending") {
          name = "Mind-Bending Sci-Fi";
          desc = "Stories that challenge reality.";
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          moviesData = await getMoviesByKeyword("14544");
        } else if (id === "postapoc") {
          name = "Post-Apocalyptic";
          desc = "Survival in a fallen world.";
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          moviesData = await getMoviesByKeyword("10051");
        } else if (id === "superhero") {
          name = "Superhero Epics";
          desc = "Masks, capes, and origins.";
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          moviesData = await getMoviesByKeyword("9715");
        }

        setCollection({
          name,
          description: desc,
          isCurated: true,
          members: "8.5K+",
          curator: "Velune Team",
          updatedAt: "May 20, 2026",
          stats: {
            avgRating: "8.2",
            oldestMovie: "Various",
            oldestYear: "1990",
            totalRuntime: "150h 20m",
            topGenre: "Drama"
          }
        });

        const formattedMovies = moviesData.map(m => ({
          id: m.id,
          tmdbId: m.id.toString(),
          title: m.title || m.name,
          poster: m.poster_path,
          rating: m.vote_average,
          mediaType: m.title ? 'movie' : 'tv',
          releaseDate: m.release_date || m.first_air_date,
          popularity: m.popularity
        }));

        setMovies(formattedMovies);
        setIsOwner(false);
      } else {
        // Fetch from DB
        const dbCollection = await getCollectionById(id) as any;
        if (dbCollection) {
          const items = dbCollection.items;
          const stats = await getCollectionStats(items);
          
          setCollection({
            name: dbCollection.name,
            description: dbCollection.description || "No description provided.",
            isCurated: false,
            members: "Just you",
            curator: dbCollection.user.name,
            updatedAt: new Date(dbCollection.updatedAt).toLocaleDateString(),
            stats: stats
          });
          
          setMovies(items);
          setIsOwner(currentUserId === dbCollection.userId);
        }
      }

      // Fetch interactions for filters
      let allMovies: string[] = [];
      if (id === "top-100") {
        allMovies = (await getTop100Movies()).map(m => m.id.toString());
      } else if (["feel-everything", "beautiful-world", "late-night-watches", "hidden-masterpieces", "mcu", "dceu", "anime", "starwars", "cyberpunk", "lotr", "mindbending", "postapoc", "superhero"].includes(id)) {
        // use the TMDB fallback function calls again to get IDs for interactions
        if (id === "feel-everything") allMovies = (await getTopRated()).map(m => m.id.toString());
        if (id === "beautiful-world") allMovies = (await getNowPlaying()).map(m => m.id.toString());
        if (id === "late-night-watches") allMovies = (await getTrending()).map(m => m.id.toString());
        if (id === "hidden-masterpieces") allMovies = (await getTop100Movies()).slice(50, 80).map(m => m.id.toString());
        if (id === "mcu") {
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          allMovies = (await getMoviesByKeyword("180547")).map(m => m.id.toString());
        }
        if (id === "dceu") {
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          allMovies = (await getMoviesByKeyword("193430")).map(m => m.id.toString());
        }
        if (id === "anime") {
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          allMovies = (await getMoviesByKeyword("210024")).map(m => m.id.toString());
        }
        if (id === "starwars") {
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          allMovies = (await getMoviesByKeyword("4270")).map(m => m.id.toString());
        }
        if (id === "cyberpunk") {
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          allMovies = (await getMoviesByKeyword("12190")).map(m => m.id.toString());
        }
        if (id === "lotr") {
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          allMovies = (await getMoviesByKeyword("6091")).map(m => m.id.toString());
        }
        if (id === "mindbending") {
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          allMovies = (await getMoviesByKeyword("14544")).map(m => m.id.toString());
        }
        if (id === "postapoc") {
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          allMovies = (await getMoviesByKeyword("10051")).map(m => m.id.toString());
        }
        if (id === "superhero") {
          const { getMoviesByKeyword } = await import("@/lib/tmdb");
          allMovies = (await getMoviesByKeyword("9715")).map(m => m.id.toString());
        }
      } else {
        const dbCol = await getCollectionById(id) as any;
        if (dbCol) {
          allMovies = dbCol.items.map((i: any) => i.tmdbId.toString());
        }
      }

      if (allMovies.length > 0) {
         const interactions = await getCollectionInteractions(allMovies);
         setWatchedIds(new Set(interactions.watchedIds));
         setWatchlistIds(new Set(interactions.watchlistIds));
      }

      const favStats = await getCollectionFavoriteStats(id);
      if (favStats.success) {
        setFavoriteCount(favStats.count || 0);
        setIsFavorited(favStats.isFavorited || false);
      }

      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading) {
    return <div className={styles.pageWrapper}></div>;
  }

  if (!collection) {
    return <div className={styles.pageWrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>Collection not found</div>;
  }

  // Derived arrays based on active tab and search
  let displayMovies = [...movies].filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
  if (activeTab === "Watched") {
    displayMovies = displayMovies.filter(m => watchedIds.has(m.tmdbId.toString()));
  } else if (activeTab === "Want to Watch") {
    displayMovies = displayMovies.filter(m => watchlistIds.has(m.tmdbId.toString()));
  }

  // Apply Sorting
  if (sortBy === "default") {
    if (settings.contentOrder === "alpha") {
      displayMovies.sort((a, b) => a.title.localeCompare(b.title));
    } else if (settings.contentOrder === "rating") {
      displayMovies.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
  } else {
    displayMovies.sort((a, b) => {
      if (sortBy === "release_date_desc") {
        const da = new Date(a.releaseDate || 0).getTime();
        const db = new Date(b.releaseDate || 0).getTime();
        return db - da;
      }
      if (sortBy === "release_date_asc") {
        const da = new Date(a.releaseDate || 0).getTime();
        const db = new Date(b.releaseDate || 0).getTime();
        return da - db;
      }
      if (sortBy === "rating_desc") {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === "rating_asc") {
        return (a.rating || 0) - (b.rating || 0);
      }
      if (sortBy === "alpha_asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "alpha_desc") {
        return b.title.localeCompare(a.title);
      }
      if (sortBy === "popularity_desc") {
        return (b.popularity || 0) - (a.popularity || 0);
      }
      if (sortBy === "popularity_asc") {
        return (a.popularity || 0) - (b.popularity || 0);
      }
      return 0;
    });
  }

  const SORT_OPTIONS = [
    { label: "Default", value: "default" },
    { label: "Newest Release", value: "release_date_desc" },
    { label: "Oldest Release", value: "release_date_asc" },
    { label: "Highest Rated", value: "rating_desc" },
    { label: "Lowest Rated", value: "rating_asc" },
    { label: "Most Popular", value: "popularity_desc" },
    { label: "Least Popular", value: "popularity_asc" },
    { label: "A-Z", value: "alpha_asc" },
    { label: "Z-A", value: "alpha_desc" }
  ];

  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      <div className={styles.container}>
        
        {/* TOP NAV & BREADCRUMBS */}
        <div className={styles.topNav}>
          <div className={styles.breadcrumbs}>
            <button className={styles.backBtn} onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </button>
          </div>

          <div className={styles.topActions}>
            {isOwner && (
              <button 
                className={styles.btnSecondary} 
                onClick={() => {
                  setEditName(collection.name);
                  setEditDesc(collection.description);
                  setIsEditModalOpen(true);
                }}
              >
                <Edit2 size={14} /> Edit Collection
              </button>
            )}
            <div className={styles.dropdownContainer}>
              <button className={styles.btnIcon} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <MoreHorizontal size={16} />
              </button>
              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <button className={styles.dropdownItem} onClick={() => { setIsDropdownOpen(false); setShowShareModal(true); }}><Share2 size={14} /> Share</button>
                  {isOwner && (
                    <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={handleDelete}>
                      <Trash2 size={14} /> Delete Collection
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HERO BANNER */}
        <div className={styles.heroBanner}>
          <div className={styles.heroOverlay} />
          
          <div className={styles.heroContent}>
            {collection.isCurated && <div className={styles.badge}>CURATED COLLECTION</div>}
            
            <h1 className={styles.heroTitle}>{collection.name}</h1>
            <p className={styles.heroSubtitle}>The ultimate cinema collection.</p>

            <div className={styles.heroStatsRow}>
              <div className={styles.heroStat}>
                <Film size={16} color="rgba(255,255,255,0.6)" />
                <div className={styles.heroStatInfo}>
                  <span className={styles.heroStatValue}>{movies.length}</span>
                  <span className={styles.heroStatLabel}>Movies</span>
                </div>
              </div>
              
              <div className={styles.heroStat}>
                <Users size={16} color="rgba(255,255,255,0.6)" />
                <div className={styles.heroStatInfo}>
                  <span className={styles.heroStatValue}>{collection.members}</span>
                  <span className={styles.heroStatLabel}>Members</span>
                </div>
              </div>

              <div className={styles.heroStat}>
                <Heart size={16} color="rgba(255,255,255,0.6)" fill={isFavorited ? "#ec4899" : "none"} stroke={isFavorited ? "#ec4899" : "currentColor"} />
                <div className={styles.heroStatInfo}>
                  <span className={styles.heroStatValue}>{favoriteCount}</span>
                  <span className={styles.heroStatLabel}>Favorites</span>
                </div>
              </div>

              <div className={styles.heroStat}>
                <CheckCircle2 size={16} color="rgba(255,255,255,0.6)" />
                <div className={styles.heroStatInfo}>
                  <span className={styles.heroStatValue}>Curated</span>
                  <span className={styles.heroStatLabel}>by {collection.curator}</span>
                </div>
              </div>

              <div className={styles.heroStat}>
                <Clock size={16} color="rgba(255,255,255,0.6)" />
                <div className={styles.heroStatInfo}>
                  <span className={styles.heroStatValue}>Updated</span>
                  <span className={styles.heroStatLabel}>{collection.updatedAt}</span>
                </div>
              </div>
            </div>

            <p className={styles.heroDesc}>{collection.description}</p>

            <div className={styles.heroActionsRow}>
              {isOwner ? (
                <button className={styles.btnPrimary}>
                  <Plus size={16} /> Add to Collection
                </button>
              ) : (
                <button className={styles.btnPrimary} onClick={handleClone} disabled={isCloning}>
                  <Plus size={16} /> {isCloning ? "Cloning..." : "Clone Collection"}
                </button>
              )}
              <button 
                className={styles.btnDark} 
                onClick={handleToggleFavorite}
                style={{ color: isFavorited ? "#ec4899" : "inherit", borderColor: isFavorited ? "rgba(236,72,153,0.3)" : "inherit" }}
              >
                <Heart size={16} fill={isFavorited ? "currentColor" : "none"} /> {isFavorited ? "Favorited" : "Add to Favorites"}
              </button>
              <button className={styles.btnDark} onClick={() => setShowShareModal(true)}>
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>

          <div className={styles.heroBackground}>
            <div className={styles.heroPostersGrid}>
              {movies.slice(0, 16).map((m) => (
                <img key={m.id} src={IMG.poster(m.poster, "w300") ?? undefined} className={styles.heroPosterImg} alt="" />
              ))}
            </div>
          </div>
        </div>

        {/* COLLECTION STATS */}
        <h2 className={styles.sectionTitle}>Collection Stats</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statCardIcon}><Star size={24} /></div>
            <div className={styles.statCardInfo}>
              <span className={styles.statCardLabel}>Average Rating</span>
              <span className={styles.statCardValue}>{collection.stats.avgRating} <span className={styles.statCardSubValue}>/ 10</span></span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardIcon}><Calendar size={24} /></div>
            <div className={styles.statCardInfo}>
              <span className={styles.statCardLabel}>Oldest Movie</span>
              <span className={styles.statCardValue} style={{ fontSize: '14px', marginBottom: '2px' }}>{collection.stats.oldestMovie}</span>
              <span className={styles.statCardSubValue} style={{ fontSize: '11px' }}>{collection.stats.oldestYear}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardIcon}><Clock size={24} /></div>
            <div className={styles.statCardInfo}>
              <span className={styles.statCardLabel}>Total Runtime</span>
              <span className={styles.statCardValue}>{collection.stats.totalRuntime}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardIcon}><Hash size={24} /></div>
            <div className={styles.statCardInfo}>
              <span className={styles.statCardLabel}>Top Genre</span>
              <span className={styles.statCardValue}>{collection.stats.topGenre}</span>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className={styles.filterBar}>
          <div className={styles.filterTabs}>
            <span className={`${styles.tab} ${activeTab === 'All Movies' ? styles.tabActive : ''}`} onClick={() => setActiveTab('All Movies')}>All Movies ({movies.length})</span>
            <span className={`${styles.tab} ${activeTab === 'Watched' ? styles.tabActive : ''}`} onClick={() => setActiveTab('Watched')}>Watched ({watchedIds.size})</span>
            <span className={`${styles.tab} ${activeTab === 'Want to Watch' ? styles.tabActive : ''}`} onClick={() => setActiveTab('Want to Watch')}>Want to Watch ({watchlistIds.size})</span>
          </div>

          <div className={styles.filterRight}>
            <div className={styles.searchBox}>
              <Search size={14} color="rgba(255,255,255,0.4)" />
              <input type="text" placeholder="Search in collection..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div style={{ width: '160px' }}>
              <CustomDropdown
                value={sortBy}
                onChange={setSortBy}
                options={SORT_OPTIONS}
                align="right"
              />
            </div>
          </div>
        </div>

        {/* MOVIE GRID */}
        <div className={styles.movieGrid}>
          {displayMovies.map((m, index) => (
            <div key={m.id} className={styles.movieCard} onClick={() => router.push(`/${m.mediaType || 'movie'}/${m.tmdbId}`)}>
              {collection.isCurated && (
                <div className={styles.rankBadge}>{index + 1}</div>
              )}
              <img src={IMG.poster(m.poster, "w300") ?? undefined} className={styles.moviePoster} alt="" />
              <div className={styles.movieTitle}>{m.title}</div>
              <div className={styles.movieMeta}>
                {m.rating ? (
                  <div className={styles.movieRating}>
                    <Star size={12} className={styles.starIcon} fill="#FFD700" /> {m.rating.toFixed(1)}
                  </div>
                ) : <div />}
                <button className={styles.btnBookmark} onClick={(e) => { e.stopPropagation(); /* bookmark toggle */ }}>
                  <Bookmark size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>Edit Collection</h2>
            <input 
              type="text" 
              className={styles.modalInput} 
              placeholder="Collection Name" 
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            <textarea 
              className={styles.modalInput} 
              placeholder="Description (Optional)"
              rows={3}
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button className={styles.btnDark} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className={styles.shareModalOverlay} onClick={() => setShowShareModal(false)}>
          <div className={styles.shareModalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeShareBtn} onClick={() => setShowShareModal(false)}>
              <X size={20} />
            </button>
            <h3 className={styles.shareModalTitle}>Share this Collection</h3>
            <div className={styles.shareOptions}>
              <button className={styles.shareOption} onClick={async () => {
                navigator.clipboard.writeText(window.location.href);
                await showAlert("Link copied to clipboard!");
                setShowShareModal(false);
              }}>
                <div className={styles.shareIconWrapper} style={{ backgroundColor: '#4A7FA7' }}><Copy size={20} color="white" /></div>
                <span>Copy Link</span>
              </button>
              <a className={styles.shareOption} href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out ${collection.name} on Velune!`)}`} target="_blank" rel="noopener noreferrer">
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
    </div>
  );
}
