"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getCustomPosters } from "@/app/actions/posters";

interface CustomPosterContextType {
  customPosters: Record<string, string>;
  updateCustomPoster: (tmdbId: string, mediaType: string, posterUrl: string | null) => void;
  isLoaded: boolean;
}

const CustomPosterContext = createContext<CustomPosterContextType>({
  customPosters: {},
  updateCustomPoster: () => {},
  isLoaded: false,
});

export function CustomPosterProvider({ children }: { children: React.ReactNode }) {
  const [customPosters, setCustomPosters] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    getCustomPosters().then((posters) => {
      setCustomPosters(posters);
      setIsLoaded(true);
    });
  }, []);

  const updateCustomPoster = (tmdbId: string, mediaType: string, posterUrl: string | null) => {
    setCustomPosters((prev) => {
      const newPosters = { ...prev };
      const key = `${mediaType}-${tmdbId}`;
      if (posterUrl === null) {
        delete newPosters[key];
      } else {
        newPosters[key] = posterUrl;
      }
      return newPosters;
    });
  };

  return (
    <CustomPosterContext.Provider value={{ customPosters, updateCustomPoster, isLoaded }}>
      {children}
    </CustomPosterContext.Provider>
  );
}

export function useCustomPosters() {
  return useContext(CustomPosterContext);
}
