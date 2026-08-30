import { getTVEpisodeDetails, getDetails, IMG } from "@/lib/tmdb";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Clock, Calendar, Star } from "lucide-react";
import Link from "next/link";
import styles from "./episode.module.css";

export default async function EpisodePage({ 
  params 
}: { 
  params: Promise<{ id: string; season_number: string; episode_number: string }>
}) {
  const { id, season_number, episode_number } = await params;
  
  const [tvShow, episode] = await Promise.all([
    getDetails("tv", id),
    getTVEpisodeDetails(id, parseInt(season_number), parseInt(episode_number))
  ]);

  if (!tvShow || !episode) {
    return (
      <main className={styles.main}>
        <Navbar />
        <div style={{ padding: '4rem', textAlign: 'center', color: 'white' }}>Media Unavailable</div>
      </main>
    );
  }

  const backdrop = episode.still_path ? IMG.backdrop(episode.still_path, "original") : (tvShow.backdrop_path ? IMG.backdrop(tvShow.backdrop_path, "original") : null);

  return (
    <main className={styles.main}>
      <Navbar />
      
      <div className={styles.heroSection}>
        {backdrop && (
          <div 
            className={styles.heroBg} 
            style={{ backgroundImage: `url(${backdrop})` }}
          />
        )}
        <div className={styles.heroGradient} />
        
        <div className={styles.heroContent}>
          <Link href={`/tv/${id}`} className={styles.backBtn}>
            <ArrowLeft size={16} /> Back to {("name" in tvShow ? tvShow.name : tvShow.title) || "Show"}
          </Link>
          
          <div className={styles.epMeta}>
            Season {season_number} • Episode {episode_number}
          </div>
          <h1 className={styles.title}>{episode.name}</h1>
          
          <div className={styles.statsRow}>
            {episode.vote_average > 0 && (
              <span className={styles.stat}>
                <Star size={16} color="#FFD700" fill="#FFD700" /> 
                {episode.vote_average.toFixed(1)}/10
              </span>
            )}
            {episode.air_date && (
              <span className={styles.stat}>
                <Calendar size={16} />
                {new Date(episode.air_date).toLocaleDateString()}
              </span>
            )}
            {episode.runtime > 0 && (
              <span className={styles.stat}>
                <Clock size={16} />
                {episode.runtime} min
              </span>
            )}
          </div>
          
          <p className={styles.overview}>{episode.overview || "No overview available for this episode."}</p>
        </div>
      </div>
    </main>
  );
}
