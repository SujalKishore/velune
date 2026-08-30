"use client";

import React, { useState } from "react";
import { Star, StarHalf } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface RatingPickerProps {
  rating: number | null; // 0-10 or null
  onChange: (rating: number | null) => void;
  size?: number;
  fillColor?: string;
  emptyColor?: string;
}

export default function RatingPicker({ 
  rating, 
  onChange, 
  size = 24, 
  fillColor = "var(--dynamic-accent, var(--primary-accent))", 
  emptyColor = "rgba(255,255,255,0.4)" 
}: RatingPickerProps) {
  const { settings } = useSettings();
  const [hoverRating, setHoverRating] = useState<number>(0);
  const mode = settings.ratingSystem || "10";

  const currentRating = hoverRating > 0 ? hoverRating : (rating || 0);

  if (mode === "5") {
    // 5-star mode with half-star interaction
    const stars = [];
    for (let i = 0; i < 5; i++) {
      const fullThreshold = (i + 1) * 2;
      const halfThreshold = i * 2 + 1;

      let StarComponent;
      if (currentRating >= fullThreshold) {
        StarComponent = <Star size={size} fill={fillColor} color={fillColor} />;
      } else if (currentRating >= halfThreshold) {
        StarComponent = (
          <div style={{ position: 'relative', width: size, height: size }}>
            <Star size={size} fill="none" color={emptyColor} style={{ position: 'absolute', top: 0, left: 0 }} />
            <StarHalf size={size} fill={fillColor} color={fillColor} style={{ position: 'absolute', top: 0, left: 0 }} />
          </div>
        );
      } else {
        StarComponent = <Star size={size} fill="none" color={emptyColor} />;
      }

      stars.push(
        <div key={i} style={{ position: 'relative', display: 'inline-block', width: size, height: size, cursor: 'pointer' }} onMouseLeave={() => setHoverRating(0)}>
          {StarComponent}
          {/* Left half hit target */}
          <div 
            style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', zIndex: 1 }}
            onMouseEnter={() => setHoverRating(halfThreshold)}
            onClick={() => onChange(rating === halfThreshold ? null : halfThreshold)}
          />
          {/* Right half hit target */}
          <div 
            style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', zIndex: 1 }}
            onMouseEnter={() => setHoverRating(fullThreshold)}
            onClick={() => onChange(rating === fullThreshold ? null : fullThreshold)}
          />
        </div>
      );
    }
    return <div style={{ display: 'flex', gap: 4 }}>{stars}</div>;
  }

  // 10-star mode (default)
  const stars = [];
  for (let i = 0; i < 10; i++) {
    const starValue = i + 1;
    stars.push(
      <div 
        key={i}
        style={{ cursor: 'pointer', padding: '0 2px' }}
        onMouseEnter={() => setHoverRating(starValue)}
        onMouseLeave={() => setHoverRating(0)}
        onClick={() => onChange(rating === starValue ? null : starValue)}
      >
        <Star 
          size={size} 
          fill={currentRating >= starValue ? fillColor : "none"} 
          color={currentRating >= starValue ? fillColor : emptyColor} 
        />
      </div>
    );
  }
  return <div style={{ display: 'flex', gap: 2 }}>{stars}</div>;
}
