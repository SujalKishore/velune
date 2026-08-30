"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTrending, getNowPlaying, getTopRated, getPopularTV, getOnThisDayMovie, getTop100Movies, type Movie, type TVShow, IMG } from "@/lib/tmdb";
import { getWatchedTmdbIds } from "@/app/actions/history";
import styles from "./page.module.css";
import { Play, Info, Eye, Heart, Star, ArrowRight } from "lucide-react";
import LandingPage from "./LandingPage";
import Navbar from "@/components/Navbar";

import { useSettings } from "@/contexts/SettingsContext";

export default function Home() {
  const router = useRouter();
  const { settings, isLoaded: settingsLoaded } = useSettings();

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Media data
  const [trending, setTrending] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [onThisDay, setOnThisDay] = useState<Movie | null>(null);
  const [top100, setTop100] = useState<Movie[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setIsLoggedIn(true);
        setAuthLoading(false);
      })
      .catch(() => { setAuthLoading(false); });
  }, []);

  // Default Landing Page Redirect
  useEffect(() => {
    if (isLoggedIn && settingsLoaded && settings.defaultLandingPage !== "home") {
      const redirected = sessionStorage.getItem("velune_redirected");
      if (!redirected) {
        sessionStorage.setItem("velune_redirected", "true");
        router.replace(`/${settings.defaultLandingPage}`);
      }
    }
  }, [isLoggedIn, settingsLoaded, settings.defaultLandingPage, router]);

  useEffect(() => {
    Promise.all([
      getTrending(),
      getTopRated(),
      getOnThisDayMovie(),
      getTop100Movies(),
      settings.hideWatched && isLoggedIn ? getWatchedTmdbIds() : Promise.resolve({ success: false, ids: [] as string[] })
    ]).then(([trend, top, otd, t100, watchedRes]) => {
      let filterIds = new Set<string>();
      if (watchedRes && watchedRes.success && watchedRes.ids) {
        filterIds = new Set(watchedRes.ids);
      }
      
      const filterFunc = (m: Movie) => !filterIds.has(m.id.toString());
      
      setTrending(trend.filter(filterFunc));
      setTopRated(top.filter(filterFunc));
      setOnThisDay(otd && !filterIds.has(otd.id.toString()) ? otd : null);
      setTop100(t100.filter(filterFunc));
    }).catch((err) => {
      console.error("Failed to load TMDB data. You may need a VPN if TMDB is blocked in your region:", err);
    });
  }, [settings.hideWatched, isLoggedIn]);

  if (authLoading || !settingsLoaded) return <div style={{ height: "100vh", backgroundColor: "#0A1931" }} />;

  return <LandingPage trending={trending} topRated={topRated} onThisDay={onThisDay} top100={top100} isLoggedIn={isLoggedIn} />;
}
