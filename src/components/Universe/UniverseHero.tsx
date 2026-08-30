import React from "react";
import styles from "./Universe.module.css";
import { Universe } from "@/data/universes";
import { Play } from "lucide-react";

interface UniverseHeroProps {
  universe: Universe;
  progressPercent: number;
}

export default function UniverseHero({ universe, progressPercent }: UniverseHeroProps) {
  return (
    <div 
      className={styles.heroContainer}
      style={{ backgroundImage: `url(${universe.backdrop})` }}
    >
      <div className={styles.heroOverlay} />
      <div className={styles.heroContent}>
        <div className={styles.heroLeft}>
          <img src={universe.logo} alt={universe.name} className={styles.heroLogo} />
          <h1 className={styles.srOnly}>{universe.name}</h1>
          <p className={styles.heroDescription}>{universe.description}</p>
          <div className={styles.heroStats}>
            <span>{universe.movieCount} Movies</span>
            <span className={styles.dot}>•</span>
            <span>{universe.showCount} Shows</span>
            <span className={styles.dot}>•</span>
            <span>{universe.totalRuntimeHours} Hours</span>
            <span className={styles.dot}>•</span>
            <span>Started {universe.started}</span>
          </div>
          
          <div className={styles.heroActions}>
            <div className={styles.progressBadge}>
              Progress: <span className={styles.highlight}>{progressPercent.toFixed(0)}%</span>
            </div>
            {universe.recommendedEntry && (
              <button className={styles.continueBtn}>
                <Play size={16} fill="currentColor" /> Continue Watching
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.heroRight}>
          <div className={styles.heroPosterContainer}>
            <img src={universe.poster} alt={`${universe.name} Poster`} className={styles.heroMainPoster} />
          </div>
        </div>
      </div>
    </div>
  );
}
