"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { IMG, type Movie, type TVShow } from "@/lib/tmdb";
import { Star } from "lucide-react";
import styles from "./MediaCarousel.module.css";
import { useCustomPosters } from "@/contexts/CustomPosterContext";

interface MediaCarouselProps {
  title: string;
  items: (Movie | TVShow)[];
  mediaType: "movie" | "tv";
}

export default function MediaCarousel({ title, items, mediaType }: MediaCarouselProps) {
  const router = useRouter();
  const { customPosters } = useCustomPosters();

  if (!items || items.length === 0) return null;

  return (
    <div className={styles.carouselSection}>
      <div className={styles.carouselHeader}>
        <h2 className={styles.carouselTitle}>{title}</h2>
      </div>
      
      <div className={styles.carouselTrack}>
        {items.map((item, idx) => {
          const itemTitle = 'title' in item ? item.title : item.name;
          const year = 'release_date' in item 
            ? item.release_date?.slice(0, 4) 
            : item.first_air_date?.slice(0, 4);
            
          const customPosterUrl = customPosters[`${mediaType}-${item.id}`];

          return (
            <div 
              key={`${item.id}-${idx}`} 
              className={styles.mediaCard}
              onClick={() => router.push(`/${mediaType}/${item.id}`)}
            >
              <div className={styles.posterWrap}>
                {customPosterUrl || item.poster_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={IMG.poster(customPosterUrl || item.poster_path, "w500") ?? undefined} alt={itemTitle} className={styles.poster} />
                ) : (
                  <div className={styles.posterFallback}>No Image</div>
                )}
                {item.vote_average ? (
                  <div className={styles.ratingBadge}>
                    <Star size={12} fill="currentColor" /> {item.vote_average.toFixed(1)}
                  </div>
                ) : null}
              </div>
              <div className={styles.cardInfo}>
                <h3 className={styles.cardTitle}>{itemTitle}</h3>
                <p className={styles.cardYear}>{year || "Unknown"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
