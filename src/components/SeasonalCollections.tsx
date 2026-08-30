"use client";

import React from "react";
import styles from "./SeasonalCollections.module.css";
import { Sparkles } from "lucide-react";

export const SEASONAL_DATA = [
  {
    id: "summer",
    name: "SUMMER CINEMA",
    description: "Sun-drenched days and warm neon nights.",
    // A nice warm sunset or La La Land background
    bg: "https://image.tmdb.org/t/p/w780/qLmcSOH7BfUUSgXzG2e1c9eN2qZ.jpg", 
    posters: [
      "https://image.tmdb.org/t/p/w200/uDO8zWDhfWwoFdKS4fzkUJt0Vy0.jpg", // La La Land
      "https://image.tmdb.org/t/p/w200/tc5nBNeKtoDtvzH4Fk7988WJ5H4.jpg", // Call Me By Your Name
      "https://image.tmdb.org/t/p/w200/kf1Jb1c2ZAqJ4hjgLWKvt8ApgT6.jpg", // Before Sunrise
    ]
  },
  {
    id: "rainy",
    name: "RAINY NIGHTS",
    description: "Melancholic city lights and introspection.",
    // Blade Runner 2049 neon city background
    bg: "https://image.tmdb.org/t/p/w780/sAtoMqDVhNDQBc3QJL3RF6hlhGq.jpg", 
    posters: [
      "https://image.tmdb.org/t/p/w200/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", // Blade Runner 2049
      "https://image.tmdb.org/t/p/w200/1QeMWewk42JgQ22fG0S2G32F46L.jpg", // Her
      "https://image.tmdb.org/t/p/w200/6vD78Q8Rk8q53r3oQcnyD6p3y25.jpg", // Perfect Days
    ]
  }
];

export default function SeasonalCollections() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}><Sparkles size={16} color="var(--primary-accent)"/> Curated for You</h3>
      </div>
      <div className={styles.grid}>
        {SEASONAL_DATA.map(season => (
          <div key={season.id} className={styles.card}>
            <div className={styles.bg} style={{ backgroundImage: `url(${season.bg})` }} />
            <div className={styles.overlay}>
              <h4 className={styles.seasonName}>{season.name}</h4>
              <p className={styles.seasonDesc}>{season.description}</p>
              <div className={styles.posters}>
                {season.posters.map((url, i) => (
                  <img key={i} src={url} className={styles.poster} style={{ zIndex: 3 - i }} alt="" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
