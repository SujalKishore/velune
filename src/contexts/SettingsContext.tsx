"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Settings {
  defaultLandingPage: string;
  language: string;
  dateFormat: string;
  contentOrder: string;
  ratingSystem: string;
  autoMarkEpisode: boolean;
  hideWatched: boolean;
  enableRecs: boolean;
  excludeWatched: boolean;
  
  // Appearance Settings
  accentColor: "teal" | "blue" | "pink" | "purple";
  fontSize: "small" | "medium" | "large";
  reducedMotion: boolean;
  borderRadius: "sharp" | "rounded" | "pill";
  cardStyle: "glass" | "solid" | "bordered";
  layoutDensity: "compact" | "default" | "spacious";
  
  // New Appearance Settings
  theme: "light" | "dark" | "system" | "oled" | "fifa";
  primaryFont: "inter" | "roboto" | "space-grotesk" | "system" | "playfair" | "poppins" | "fira-code";
  navigationLayout: "sidebar" | "topbar" | "minimal";
  posterStyle: "classic" | "cinematic" | "rounded";
  blurEffects: boolean;
  animationSpeed: "fast" | "normal" | "slow" | "off";
  highContrast: boolean;
  customCursor: boolean;
  scrollEffects: boolean;
  scrollbarStyle: "hidden" | "minimal" | "default";
  buttonStyle: "solid" | "outline" | "ghost" | "glass";
  pageTransition: "none" | "fade" | "slide" | "zoom";
  imageHoverEffect: "none" | "zoom" | "glow" | "grayscale";

  // 10 New Unique Effects
  scanlines: boolean;
  noiseOverlay: boolean;
  neonOutlines: boolean;
  holographic: boolean;
  tiltCards: boolean;
  glitchEffects: boolean;
  noirMode: boolean;
  glassReflection: boolean;
  focusDimmer: boolean;
  cursorTrail: boolean;

  // Playback Settings
  autoplayTrailers: boolean;
  autoplayNextEpisode: boolean;
  skipIntros: boolean;
  skipRecaps: boolean;
  resumePlayback: boolean;
  
  defaultVideoQuality: "auto" | "4k" | "1080p" | "720p" | "data-saver";
  hardwareAcceleration: boolean;
  limitDataUsage: boolean;
  playbackSpeed: "0.5x" | "1x" | "1.25x" | "1.5x" | "2x";
  volumeLevel: number;
  muteTrailersByDefault: boolean;
  
  preferredAudioLanguage: string;
  preferredSubtitleLanguage: string;
  subtitleSize: "small" | "medium" | "large" | "xlarge";
  subtitleColor: "white" | "yellow" | "cyan";
  subtitleBackground: "transparent" | "translucent" | "solid";
  
  showPlaybackControls: "auto" | "always";
  pictureInPicture: boolean;
  playInBackground: boolean;
  bufferSize: "minimal" | "auto" | "maximum";

  // Advanced Settings - System & App
  developerMode: boolean;
  betaFeatures: boolean;
  hardwareAccelerationUI: boolean;
  offlineMode: boolean;
  clearCacheOnExit: boolean;

  // Advanced Settings - Network
  apiEndpoint: string;
  networkTimeout: "5s" | "10s" | "30s";
  maxConcurrentFetches: number;
  telemetryOptOut: boolean;
  strictPrivacyMode: boolean;
  incognitoMode: boolean;
  stealthMode: boolean;

  // Advanced Settings - Data
  autoBackup: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
  exportDataFormat: "json" | "csv" | "pdf";
  showSystemMetadata: boolean;
  preloadImages: boolean;

  // Advanced Settings - Customization
  enableKeyboardShortcuts: boolean;
  experimentalVideoPlayer: boolean;
  sandboxMode: boolean;
  logLevel: "error" | "warn" | "info" | "debug";
  customCss: string;

  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  marketingEmails: boolean;
  newFollowerAlerts: boolean;
  watchlistReminders: boolean;

  // Extra Advanced
  bypassCdnCache: boolean;
  webSocketSync: boolean;
  strictCorsPolicy: boolean;

  // Integrations Settings
  traktSync: boolean;
  letterboxdSync: boolean;
  discordRichPresence: boolean;
  myAnimeListSync: boolean;
  simklSync: boolean;

  // About Settings
  autoUpdateApp: boolean;
  joinBetaProgram: boolean;
}

export const defaultSettings: Settings = {
  defaultLandingPage: "home",
  language: "en",
  dateFormat: "us",
  contentOrder: "recent",
  ratingSystem: "5",
  autoMarkEpisode: false,
  hideWatched: false,
  enableRecs: true,
  excludeWatched: false,
  
  // Appearance defaults
  accentColor: "teal",
  fontSize: "medium",
  reducedMotion: false,
  borderRadius: "rounded",
  cardStyle: "glass",
  layoutDensity: "default",

  // New Appearance defaults
  theme: "light",
  primaryFont: "space-grotesk",
  navigationLayout: "sidebar",
  posterStyle: "classic",
  blurEffects: true,
  animationSpeed: "normal",
  highContrast: false,
  customCursor: false,
  scrollEffects: true,
  scrollbarStyle: "default",
  buttonStyle: "solid",
  pageTransition: "fade",
  imageHoverEffect: "zoom",

  // 10 New Unique Effects defaults
  scanlines: false,
  noiseOverlay: false,
  neonOutlines: false,
  holographic: false,
  tiltCards: false,
  glitchEffects: false,
  noirMode: false,
  glassReflection: false,
  focusDimmer: false,
  cursorTrail: false,

  // Playback defaults
  autoplayTrailers: true,
  autoplayNextEpisode: true,
  skipIntros: false,
  skipRecaps: false,
  resumePlayback: true,
  
  defaultVideoQuality: "auto",
  hardwareAcceleration: true,
  limitDataUsage: false,
  playbackSpeed: "1x",
  volumeLevel: 80,
  muteTrailersByDefault: true,
  
  preferredAudioLanguage: "original",
  preferredSubtitleLanguage: "off",
  subtitleSize: "medium",
  subtitleColor: "white",
  subtitleBackground: "translucent",
  
  showPlaybackControls: "auto",
  pictureInPicture: false,
  playInBackground: false,
  bufferSize: "auto",

  // Advanced defaults
  developerMode: false,
  betaFeatures: false,
  hardwareAccelerationUI: true,
  offlineMode: false,
  clearCacheOnExit: false,
  apiEndpoint: "default",
  networkTimeout: "10s",
  maxConcurrentFetches: 4,
  telemetryOptOut: false,
  strictPrivacyMode: false,
  incognitoMode: false,
  stealthMode: false,
  autoBackup: false,
  backupFrequency: "weekly",
  exportDataFormat: "json",
  showSystemMetadata: false,
  preloadImages: true,
  enableKeyboardShortcuts: true,
  experimentalVideoPlayer: false,
  sandboxMode: false,
  logLevel: "error",
  customCss: "",

  // Notification defaults
  emailNotifications: true,
  pushNotifications: false,
  inAppNotifications: true,
  marketingEmails: false,
  newFollowerAlerts: true,
  watchlistReminders: true,

  // Extra Advanced defaults
  bypassCdnCache: false,
  webSocketSync: true,
  strictCorsPolicy: false,

  // Integrations defaults
  traktSync: false,
  letterboxdSync: false,
  discordRichPresence: true,
  myAnimeListSync: false,
  simklSync: false,

  // About defaults
  autoUpdateApp: true,
  joinBetaProgram: false,
};

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSetting: () => {},
  resetSettings: () => {},
  isLoaded: false,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("velune_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
        document.cookie = `velune_language=${parsed.language || defaultSettings.language}; path=/; max-age=31536000`;
        document.cookie = `velune_settings=${encodeURIComponent(JSON.stringify({ ...defaultSettings, ...parsed }))}; path=/; max-age=31536000`;
      } else {
        document.cookie = `velune_language=${defaultSettings.language}; path=/; max-age=31536000`;
        document.cookie = `velune_settings=${encodeURIComponent(JSON.stringify(defaultSettings))}; path=/; max-age=31536000`;
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
    setIsLoaded(true);
  }, []);

  // Effect to apply appearance settings globally
  useEffect(() => {
    if (!isLoaded) return;
    
    const body = document.body;

    // Handle Accent Color via data attribute
    body.setAttribute("data-accent", settings.accentColor);

    // Handle Font Size
    body.setAttribute("data-font-size", settings.fontSize);

    // Handle Border Radius
    body.setAttribute("data-radius", settings.borderRadius);

    // Handle Card Style
    body.setAttribute("data-card-style", settings.cardStyle);

    // Handle Layout Density
    body.setAttribute("data-density", settings.layoutDensity);

    // Handle Reduced Motion
    if (settings.reducedMotion) {
      body.classList.add("reduced-motion");
    } else {
      body.classList.remove("reduced-motion");
    }

    // Handle New Appearance
    body.setAttribute("data-theme", settings.theme);
    body.setAttribute("data-font", settings.primaryFont);
    body.setAttribute("data-nav", settings.navigationLayout);
    body.setAttribute("data-poster", settings.posterStyle);
    body.setAttribute("data-animation-speed", settings.animationSpeed);
    body.setAttribute("data-scrollbar", settings.scrollbarStyle);
    
    if (settings.blurEffects) body.classList.add("enable-blur");
    else body.classList.remove("enable-blur");

    if (settings.highContrast) body.classList.add("high-contrast");
    else body.classList.remove("high-contrast");

    if (settings.customCursor) body.classList.add("custom-cursor");
    else body.classList.remove("custom-cursor");

    if (settings.scrollEffects) body.classList.add("scroll-effects");
    else body.classList.remove("scroll-effects");

    body.setAttribute("data-button-style", settings.buttonStyle);
    body.setAttribute("data-page-transition", settings.pageTransition);
    body.setAttribute("data-image-hover", settings.imageHoverEffect);

    // 10 New Effects toggles
    if (settings.scanlines) body.classList.add("effect-scanlines"); else body.classList.remove("effect-scanlines");
    if (settings.noiseOverlay) body.classList.add("effect-noise"); else body.classList.remove("effect-noise");
    if (settings.neonOutlines) body.classList.add("effect-neon"); else body.classList.remove("effect-neon");
    if (settings.holographic) body.classList.add("effect-holographic"); else body.classList.remove("effect-holographic");
    if (settings.tiltCards) body.classList.add("effect-tilt"); else body.classList.remove("effect-tilt");
    if (settings.glitchEffects) body.classList.add("effect-glitch"); else body.classList.remove("effect-glitch");
    if (settings.noirMode) body.classList.add("effect-noir"); else body.classList.remove("effect-noir");
    if (settings.glassReflection) body.classList.add("effect-reflection"); else body.classList.remove("effect-reflection");
    if (settings.focusDimmer) body.classList.add("effect-dimmer"); else body.classList.remove("effect-dimmer");
    if (settings.cursorTrail) body.classList.add("effect-trail"); else body.classList.remove("effect-trail");
    
    if (settings.stealthMode) body.classList.add("stealth-mode"); else body.classList.remove("stealth-mode");

    // Handle Custom CSS
    let styleEl = document.getElementById("velune-custom-css");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "velune-custom-css";
      document.head.appendChild(styleEl);
    }
    
    // Inject custom cursor CSS based on accent color
    const accentHexMap: Record<string, string> = {
      blue: "%2300A3FF",
      pink: "%23FF3366",
      purple: "%237B61FF",
      teal: "%2300E5C5",
      orange: "%23FF7B00",
      red: "%23FF2222",
      green: "%2300CC44",
      yellow: "%23FFD500"
    };
    const accentHex = accentHexMap[settings.accentColor] || "%2300E5C5";
    const cursorCSS = `
body.custom-cursor, body.custom-cursor * {
  cursor: url('data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="${accentHex}" stroke="white" stroke-width="2"/></svg>') 12 12, auto !important;
}`;

    styleEl.innerHTML = settings.customCss + '\n' + cursorCSS;
    
  }, [settings, isLoaded]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("velune_settings", JSON.stringify(updated));
      document.cookie = `velune_settings=${encodeURIComponent(JSON.stringify(updated))}; path=/; max-age=31536000`;
      if (key === 'language') {
        document.cookie = `velune_language=${value}; path=/; max-age=31536000`;
      }
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem("velune_settings", JSON.stringify(defaultSettings));
    document.cookie = `velune_settings=${encodeURIComponent(JSON.stringify(defaultSettings))}; path=/; max-age=31536000`;
    document.cookie = `velune_language=${defaultSettings.language}; path=/; max-age=31536000`;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
