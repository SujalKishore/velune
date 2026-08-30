"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";
import { getUserCollections, createCollection } from "@/app/actions/history";
import { IMG } from "@/lib/tmdb";
import {
  Plus, ArrowRight, Shapes, Smile, CalendarDays, Globe, Video, Star,
  Heart, ChevronLeft, ChevronRight, BookOpen,
} from "lucide-react";

// ── Verified TMDB poster paths ──────────────────────────────────
// These are confirmed-working TMDB poster paths
const P = {
  godfather:    "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
  shawshank:    "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
  inception:    "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
  parasite:     "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  pulpFiction:  "/fIE3lAGcZDV1G6KFHNIG1hI4G0f.jpg",
  fightClub:    "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  spiritedAway: "/39wmItIWsg5sZMyRUHLkQlCEeG8.jpg",
  interstellar: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  darkKnight:   "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  infinityWar:  "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
  justiceLeague: "/eifGNCSDuxJeS1loAXil5bIGgvC.jpg",

  starWars: "/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
  cyberpunk: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
  lotr: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
  furyRoad: "/ulcAi4dKpAjHwYGS08vNyx9H6I9.jpg",
};

const INITIAL_VELUNE = [
  { id: "feel-everything", title: "Feel Everything",     desc: "Movies that stay with you long after the credits.", movies: "34 movies", poster: P.interstellar },
  { id: "beautiful-world", title: "Beautiful World",     desc: "Visually stunning. Emotionally unforgettable.",     movies: "28 movies", poster: P.spiritedAway },
  { id: "late-night-watches", title: "Late Night Watches",  desc: "Perfect for when the world is asleep.",             movies: "40 movies", poster: P.fightClub    },
  { id: "hidden-masterpieces", title: "Hidden Masterpieces", desc: "Underrated gems you need to see.",                  movies: "36 movies", poster: P.darkKnight   },
  { id: "mcu", title: "Marvel Cinematic Universe", desc: "The Infinity Saga and beyond.", movies: "80 items", poster: P.infinityWar },
  { id: "dceu", title: "DC Extended Universe", desc: "Heroes of the DCEU.", movies: "33 items", poster: P.justiceLeague },
  { id: "anime", title: "Anime Masterpieces", desc: "The best of Japanese animation.", movies: "100+ items", poster: P.spiritedAway },
  { id: "starwars", title: "Star Wars Saga", desc: "A long time ago in a galaxy far, far away...", movies: "30+ items", poster: P.starWars },
  { id: "cyberpunk", title: "Cyberpunk Worlds", desc: "High tech, low life.", movies: "50+ items", poster: P.cyberpunk },
  { id: "lotr", title: "Middle-earth", desc: "One ring to rule them all.", movies: "10+ items", poster: P.lotr },
  { id: "mindbending", title: "Mind-Bending Sci-Fi", desc: "Stories that challenge reality.", movies: "60+ items", poster: P.inception },
  { id: "postapoc", title: "Post-Apocalyptic", desc: "Survival in a fallen world.", movies: "80+ items", poster: P.furyRoad },
  { id: "superhero", title: "Superhero Epics", desc: "Masks, capes, and origins.", movies: "100+ items", poster: P.darkKnight },
];

const CATEGORIES = [
  { name: "By Genre",    icon: Shapes      },
  { name: "By Mood",     icon: Smile       },
  { name: "By Decade",   icon: CalendarDays},
  { name: "By Country",  icon: Globe       },
  { name: "By Theme",    icon: Star        },
  { name: "By Director", icon: Video       },
];

import { getTop100Movies, getTrending, getNowPlaying, getTopRated } from "@/lib/tmdb";

// Full-bleed poster background card image
function CardBg({ poster }: { poster: string }) {
  const url = IMG.poster(poster, "w500");
  return url ? (
    <img src={url} alt="" className={styles.cardBgImg} />
  ) : (
    <div className={styles.cardBgFallback} />
  );
}

export default function CollectionsPage() {
  const router = useRouter();
  const [userCollections, setUserCollections] = useState<any[]>([]);
  const [veluneCollections, setVeluneCollections] = useState(INITIAL_VELUNE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");

  useEffect(() => { 
    loadCollections(); 
    loadVelunePosters();
  }, []);

  const loadVelunePosters = async () => {
    try {
      const topRated = await getTopRated();
      const nowPlaying = await getNowPlaying();
      const trending = await getTrending();
      const top100 = await getTop100Movies();

      setVeluneCollections(prev => prev.map(c => {
        if (c.id === "feel-everything" && topRated[0]) return { ...c, poster: topRated[0].poster_path };
        if (c.id === "beautiful-world" && nowPlaying[0]) return { ...c, poster: nowPlaying[0].poster_path };
        if (c.id === "late-night-watches" && trending[0]) return { ...c, poster: trending[0].poster_path };
        if (c.id === "hidden-masterpieces" && top100[50]) return { ...c, poster: top100[50].poster_path };
        return c;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const loadCollections = async () => {
    const res = await getUserCollections();
    setUserCollections(res.success && res.collections ? res.collections : []);
  };

  const handleCreate = async () => {
    if (!newColName.trim()) return;
    await createCollection(newColName.trim());
    setNewColName("");
    setIsModalOpen(false);
    loadCollections();
  };

  return (
    <div className={styles.pageWrapper}>
      <Navbar />

      <div className={styles.container}>

        {/* ── HERO — one full-width pink card ────────────────── */}
        <div className={styles.heroPinkCard}>
          {/* Blobs stay inside the card */}
          <div className={styles.heroBlobLeft} />
          <div className={styles.heroBlobRight} />

          {/* Left: text */}
          <div className={styles.heroLeft}>
            <div className={styles.heroOverline}>
              <div className={styles.heroIconWrap}><BookOpen size={13} /></div>
              <span className={styles.heroOverlineText}>COLLECTIONS</span>
            </div>

            <h1 className={styles.heroTitle}>
              Handpicked stories<br />
              for every kind of{" "}
              <span className={styles.heroAccent}>cinephile.</span>
            </h1>

            <div className={styles.heroDivider} />

            <p className={styles.heroDesc}>
              Collections grouped by mood, theme, genre and more.<br />
              Find your next watchlist, curated with love.
            </p>

            <button className={styles.heroPrimaryBtn}>
              <span>Explore Collections</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Right: stacked poster deck — inside the pink card */}
          <div className={styles.heroDeck}>
            <div className={styles.deckWrap}>
              {/* Back */}
              <div className={`${styles.deckCard} ${styles.deckCard3}`}>
                <img src={IMG.poster(P.godfather, "w500") || undefined}    alt="" className={styles.deckPosterImg} />
                <div className={styles.deckGradient} />
                <div className={styles.deckContent}>
                  <h3 className={styles.deckCardTitle}>Oscar<br />Winners</h3>
                  <p className={styles.deckCardSub}>93 films</p>
                </div>
              </div>
              {/* Mid */}
              <div className={`${styles.deckCard} ${styles.deckCard2}`}>
                <img src={IMG.poster(P.shawshank, "w500") || undefined}    alt="" className={styles.deckPosterImg} />
                <div className={styles.deckGradient} />
                <div className={styles.deckContent}>
                  <h3 className={styles.deckCardTitle}>Feel Good<br />Classics</h3>
                  <p className={styles.deckCardSub}>32 films</p>
                </div>
              </div>
              {/* Front */}
              <div className={`${styles.deckCard} ${styles.deckCard1}`}>
                <img src={IMG.poster(P.interstellar, "w500") || undefined} alt="" className={styles.deckPosterImg} />
                <div className={styles.deckGradient} />
                <div className={styles.deckContent}>
                  <h3 className={styles.deckCardTitle}>Space<br />Odysseys</h3>
                  <p className={styles.deckCardSub}>24 films</p>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* ── CURATED BY VELUNE ──────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Curated by Velune</h2>
            <div className={styles.headerControls}>
              <span className={styles.viewAll}>View All</span>
              <button className={styles.navBtn}><ChevronLeft size={15} /></button>
              <button className={styles.navBtn}><ChevronRight size={15} /></button>
            </div>
          </div>
          <div className={styles.grid4}>
            {veluneCollections.map((item) => (
              <div key={item.id} className={styles.collCard} onClick={() => router.push(`/collections/${item.id}`)}>
                <CardBg poster={item.poster} />
                <div className={styles.cardOverlay} />
                <div className={styles.badgePurple}>VELUNE PICK</div>
                <div className={styles.collInfo}>
                  <h3 className={styles.collTitle}>{item.title}</h3>
                  <p className={styles.collDesc}>{item.desc}</p>
                  <span className={styles.collMovies}>{item.movies}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BROWSE BY CATEGORY ─────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Browse by Category</h2>
          </div>
          <div className={styles.categoryRow}>
            {CATEGORIES.map((cat, i) => (
              <button key={i} className={styles.catPill}>
                <cat.icon size={16} strokeWidth={1.8} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        <div className={styles.comingSoonBox}>
          <Star size={20} className={styles.comingSoonIcon} />
          <div className={styles.comingSoonText}>
            <h3>More Collections Coming Soon</h3>
            <p>Community and Popular collections are being curated. Check back later!</p>
          </div>
        </div>

      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>New Collection</h2>
            <input
              className={styles.modalInput}
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="Collection name…"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button className={styles.btnDark} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
