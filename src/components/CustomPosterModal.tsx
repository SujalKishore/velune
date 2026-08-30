"use client";

import React, { useEffect, useState } from "react";
import styles from "./CustomPosterModal.module.css";
import { X, Check } from "lucide-react";
import { useCustomPosters } from "@/contexts/CustomPosterContext";
import { setCustomPoster, removeCustomPoster } from "@/app/actions/posters";
import { IMG, getMediaImages } from "@/lib/tmdb";

interface CustomPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tmdbId: string;
  mediaType: "movie" | "tv";
}

export default function CustomPosterModal({ isOpen, onClose, tmdbId, mediaType }: CustomPosterModalProps) {
  const [posters, setPosters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { customPosters, updateCustomPoster } = useCustomPosters();
  const currentCustomPoster = customPosters[`${mediaType}-${tmdbId}`];

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    
    // Fetch alternative posters from TMDB
    getMediaImages(mediaType, tmdbId)
      .then(data => {
        if (data && data.posters) {
          // Sort by vote count to show best ones first
          const sorted = data.posters.sort((a: any, b: any) => b.vote_count - a.vote_count);
          setPosters(sorted);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load posters", err);
        setLoading(false);
      });
  }, [isOpen, tmdbId, mediaType]);

  const handleSelectPoster = async (filePath: string) => {
    updateCustomPoster(tmdbId, mediaType, filePath);
    await setCustomPoster(tmdbId, mediaType, filePath);
    onClose();
  };

  const handleRemovePoster = async () => {
    updateCustomPoster(tmdbId, mediaType, null);
    await removeCustomPoster(tmdbId, mediaType);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Choose Custom Poster</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Loading posters...</div>
          ) : (
            <>
              <div className={styles.grid}>
                {posters.map((p) => {
                  const isSelected = currentCustomPoster === p.file_path;
                  return (
                    <div 
                      key={p.file_path} 
                      className={`${styles.posterItem} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleSelectPoster(p.file_path)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={IMG.poster(p.file_path, "w300") || ""} alt="Poster option" className={styles.image} loading="lazy" />
                      {isSelected && <Check size={20} className={styles.checkIcon} />}
                    </div>
                  );
                })}
              </div>
              
              {currentCustomPoster && (
                <button className={styles.removeBtn} onClick={handleRemovePoster}>
                  Remove Custom Poster
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
