"use client";

import React from "react";
import { Star, StarHalf } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface StarRatingProps {
  rating: number; // 0-10
  size?: number;
  fillColor?: string;
  emptyColor?: string;
}

export default function StarRating({ 
  rating, 
  size = 14, 
  fillColor = "var(--dynamic-accent, var(--primary-accent))", 
  emptyColor = "rgba(255,255,255,0.4)" 
}: StarRatingProps) {
  const { settings } = useSettings();
  const mode = settings.ratingSystem || "10";

  if (mode === "5") {
    // 5-star mode: max 5 stars, half stars allowed
    const stars = [];
    for (let i = 0; i < 5; i++) {
      const fullThreshold = (i + 1) * 2;
      const halfThreshold = i * 2 + 1;

      if (rating >= fullThreshold) {
        // Full Star
        stars.push(<Star key={i} size={size} fill={fillColor} color={fillColor} />);
      } else if (rating === halfThreshold) {
        // Half Star
        stars.push(
          <div key={i} style={{ position: 'relative', width: size, height: size }}>
            <Star size={size} fill="none" color={emptyColor} style={{ position: 'absolute', top: 0, left: 0 }} />
            <StarHalf 
              size={size} 
              fill={fillColor} 
              color={fillColor} 
              style={{ position: 'absolute', top: 0, left: 0 }} 
            />
          </div>
        );
      } else {
        // Empty Star
        stars.push(<Star key={i} size={size} fill="none" color={emptyColor} />);
      }
    }
    return <div style={{ display: 'flex', gap: 2 }}>{stars}</div>;
  }

  // 10-star mode (default)
  const stars = [];
  for (let i = 0; i < 10; i++) {
    if (i < rating) {
      stars.push(<Star key={i} size={size} fill={fillColor} color={fillColor} />);
    } else {
      stars.push(<Star key={i} size={size} fill="none" color={emptyColor} />);
    }
  }
  return <div style={{ display: 'flex', gap: 2 }}>{stars}</div>;
}
