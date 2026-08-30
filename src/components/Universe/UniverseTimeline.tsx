"use client";

import React, { useState } from "react";
import { Check, Film, Info } from "lucide-react";
import styles from "./Universe.module.css";
import { Universe, TimelineItem } from "@/data/universes";
import { useRouter } from "next/navigation";

function PosterImg({ src, alt, className }: { src: string, alt: string, className: string }) {
  const [error, setError] = useState(false);
  
  if (error || !src) {
    return (
      <div className={`${className} ${styles.posterFallback}`}>
        <Film size={32} opacity={0.5} />
        <span className={styles.posterFallbackText}>{alt}</span>
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setError(true)}
    />
  );
}

interface UniverseTimelineProps {
  universe: Universe;
  watchedIds: Set<string>;
}

export default function UniverseTimeline({ universe, watchedIds }: UniverseTimelineProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"release" | "chronological" | "phase">("phase");

  // Flatten all items
  const allItems = universe.sagas.flatMap(saga => saga.phases.flatMap(phase => phase.items));
  
  const renderTimelineTrack = (items: TimelineItem[]) => (
    <div className={styles.timelineWrapper}>
      <div className={styles.timelineTrack}>
        {items.map((item, idx) => {
          const isWatched = watchedIds.has(item.tmdbId);
          return (
            <div 
              key={`${item.tmdbId}-${idx}`} 
              className={styles.timelineItem}
              onClick={() => router.push(`/${item.mediaType}/${item.tmdbId}`)}
            >
              <div className={styles.timelineNode}>
                <PosterImg 
                  src={item.poster} 
                  alt={item.title} 
                  className={styles.timelinePoster} 
                />
                <div className={styles.watchedOverlay}>
                  {isWatched ? (
                    <Check size={24} className={styles.watchedCheck} />
                  ) : (
                    <Info size={24} color="white" />
                  )}
                </div>
              </div>
              <div className={styles.timelineMeta}>
                <div className={styles.timelineYear}>{item.releaseDate.slice(0, 4)}</div>
                <div className={styles.timelineTitle} title={item.title}>{item.title}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={styles.timelineSection}>
      <div className={styles.contentContainer}>
        <div className={styles.timelineHeader}>
          <h2 className={styles.sectionTitle}>Watch Order</h2>
          <div className={styles.toggleContainer}>
            <button 
              className={`${styles.toggleBtn} ${viewMode === "release" ? styles.toggleBtnActive : ""}`}
              onClick={() => setViewMode("release")}
            >
              Release Order
            </button>
            <button 
              className={`${styles.toggleBtn} ${viewMode === "chronological" ? styles.toggleBtnActive : ""}`}
              onClick={() => setViewMode("chronological")}
            >
              Chronological
            </button>
            <button 
              className={`${styles.toggleBtn} ${viewMode === "phase" ? styles.toggleBtnActive : ""}`}
              onClick={() => setViewMode("phase")}
            >
              Phase View
            </button>
          </div>
        </div>

        {viewMode === "release" && (
          renderTimelineTrack([...allItems].sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()))
        )}

        {viewMode === "chronological" && (
          renderTimelineTrack([...allItems].sort((a, b) => a.chronologicalOrder - b.chronologicalOrder))
        )}

        {viewMode === "phase" && (
          <div>
            {universe.sagas.map(saga => (
              <div key={saga.name}>
                {saga.phases.map(phase => (
                  <div key={phase.name} className={styles.phaseContainer}>
                    <div className={styles.phaseHeader}>
                      <h3 className={styles.phaseName}>{phase.name}</h3>
                      <div className={styles.phaseLine} />
                      <span style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>
                        {Math.round((phase.items.filter(i => watchedIds.has(i.tmdbId)).length / phase.items.length) * 100)}%
                      </span>
                    </div>
                    {renderTimelineTrack([...phase.items].sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
