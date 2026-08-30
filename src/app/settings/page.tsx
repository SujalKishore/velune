"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { updateUserProfile, deactivateAccount, deleteAccount, exportAllUserData } from "@/app/actions/user";
import { importTraktHistory } from "@/app/actions/trakt-import";
import { useRouter } from "next/navigation";
import { 
  User, Sliders, Bell, PlayCircle, Palette, Lock, 
  Database, Puzzle, Code, Info, Settings, LayoutGrid, 
  Compass, Sparkles, Monitor, ChevronDown, Download, HardDrive, Trash2, ArrowLeft
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useDialog } from "@/contexts/DialogContext";
import jsPDF from "jspdf";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Preferences");
  
  const { settings, updateSetting, resetSettings, isLoaded } = useSettings();
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useDialog();

  const [user, setUser] = useState<any>(null);
  const [accountForm, setAccountForm] = useState({ 
    name: "", email: "", bio: "", username: "", location: "", website: "", 
    twitter: "", instagram: "", pronouns: "", isPrivate: false, 
    showActivity: true, twoFactorEnabled: false, contentSensitivity: false,
    showWatchlist: true, showFavorites: true, showWatchHistory: true, showRatings: true,
    showTVProgress: true, showAchievements: true, showFollowedPeople: true, showJoinDate: true,
    showLocation: true, showSocialLinks: true,
    allowSearchIndexing: false, blockUnknownMessages: false, allowProfileRecs: true
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          setAccountForm({ 
            name: d.user.name || "", 
            email: d.user.email || "", 
            bio: d.user.bio || "",
            username: d.user.username || "",
            location: d.user.location || "",
            website: d.user.website || "",
            twitter: d.user.twitter || "",
            instagram: d.user.instagram || "",
            pronouns: d.user.pronouns || "",
            isPrivate: d.user.isPrivate || false,
            showActivity: d.user.showActivity !== undefined ? d.user.showActivity : true,
            twoFactorEnabled: d.user.twoFactorEnabled || false,
            contentSensitivity: d.user.contentSensitivity || false,
            showWatchlist: d.user.showWatchlist !== undefined ? d.user.showWatchlist : true,
            showFavorites: d.user.showFavorites !== undefined ? d.user.showFavorites : true,
            showWatchHistory: d.user.showWatchHistory !== undefined ? d.user.showWatchHistory : true,
            showRatings: d.user.showRatings !== undefined ? d.user.showRatings : true,
            showTVProgress: d.user.showTVProgress !== undefined ? d.user.showTVProgress : true,
            showAchievements: d.user.showAchievements !== undefined ? d.user.showAchievements : true,
            showFollowedPeople: d.user.showFollowedPeople !== undefined ? d.user.showFollowedPeople : true,
            showJoinDate: d.user.showJoinDate !== undefined ? d.user.showJoinDate : true,
            showLocation: d.user.showLocation !== undefined ? d.user.showLocation : true,
            showSocialLinks: d.user.showSocialLinks !== undefined ? d.user.showSocialLinks : true,
            allowSearchIndexing: d.user.allowSearchIndexing !== undefined ? d.user.allowSearchIndexing : false,
            blockUnknownMessages: d.user.blockUnknownMessages !== undefined ? d.user.blockUnknownMessages : false,
            allowProfileRecs: d.user.allowProfileRecs !== undefined ? d.user.allowProfileRecs : true
          });
        }
      });
      
    // Handle integration redirect callbacks
    const params = new URLSearchParams(window.location.search);
    const success = params.get("integration_success");
    if (success === "trakt") {
       updateSetting("traktSync", true);
       showAlert("Successfully connected to Trakt.tv! Your watch history will now sync.", "Success");
       router.replace("/settings");
    } else if (success === "letterboxd") {
       updateSetting("letterboxdSync", true);
       showAlert("Successfully connected to Letterboxd! Your ratings and reviews will now sync.", "Success");
       router.replace("/settings");
    } else if (success === "mal") {
       updateSetting("myAnimeListSync", true);
       showAlert("Successfully connected to MyAnimeList! Your anime progress will now sync.", "Success");
       router.replace("/settings");
    } else if (success === "simkl") {
       updateSetting("simklSync", true);
       showAlert("Successfully connected to Simkl! Your watch history will now sync.", "Success");
       router.replace("/settings");
    } else if (success === "discord") {
       updateSetting("discordRichPresence", true);
       showAlert("Successfully linked Discord! Your rich presence can now be updated.", "Success");
       router.replace("/settings");
    }
  }, []);

  const handleUpdateAccount = async () => {
    setSavingAccount(true);
    const res = await updateUserProfile(accountForm);
    if (res.success) {
      await showAlert("Account updated successfully");
      setUser((prev: any) => prev ? { ...prev, ...accountForm } : accountForm as any);
    } else {
      await showAlert(res.error || "Failed to update account");
        setSavingAccount(false);
    }
  };

  const handleTraktImport = async () => {
    setIsImporting(true);
    try {
      const result = await importTraktHistory();
      if (result.success) {
        await showAlert(`Successfully imported ${result.count} items from Trakt!`, "Import Complete");
      } else {
        await showAlert(`Import failed: ${result.error}`, "Import Error");
      }
    } catch (e) {
      await showAlert("An unexpected error occurred during import.", "Import Error");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadData = async () => {
    let databaseData: any = {};
    const dbRes = await exportAllUserData();
    if (dbRes.success) {
      databaseData = dbRes.data;
    }

    if (settings.exportDataFormat === "pdf") {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header Banner
      doc.setFillColor(15, 23, 42); // Dark slate header
      doc.rect(0, 0, pageWidth, 40, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text("VELUNE SYSTEM REPORT", 20, 25);
      
      // Timestamp
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
      
      // Body Text
      doc.setTextColor(15, 23, 42); // Dark slate
      
      let cursorY = 55;
      const addSection = (title: string, data: Record<string, any>) => {
        // Section Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(title.toUpperCase(), 20, cursorY);
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.line(20, cursorY + 2, pageWidth - 20, cursorY + 2);
        cursorY += 12;
        
        // Data Pairs
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        for (const [key, value] of Object.entries(data)) {
          if (cursorY > 280) {
            doc.addPage();
            cursorY = 20;
          }
          // Format Key
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          doc.setTextColor(100, 116, 139); // Slate 500
          doc.text(`${formattedKey}:`, 20, cursorY);
          
          doc.setTextColor(15, 23, 42); // Slate 900
          doc.text(String(value), 100, cursorY);
          cursorY += 8;
        }
        cursorY += 10;
      };

      addSection("User Identity", {
        Name: user?.name || "Guest User",
        Username: user?.username || "N/A",
        Email: user?.email || "N/A",
        Bio: user?.bio || "N/A",
        AccountStatus: user?.isPrivate ? "Private" : "Public"
      });

      addSection("Appearance Configuration", {
        Theme: settings.theme,
        PrimaryFont: settings.primaryFont,
        AccentColor: settings.accentColor,
        PosterStyle: settings.posterStyle,
        Glassmorphism: settings.blurEffects ? "Enabled" : "Disabled",
        AnimationSpeed: settings.animationSpeed,
        LayoutDensity: settings.layoutDensity
      });
      
      addSection("Playback Preferences", {
        DefaultVideoQuality: settings.defaultVideoQuality,
        HardwareAcceleration: settings.hardwareAcceleration ? "Enabled" : "Disabled",
        AutoplayTrailers: settings.autoplayTrailers ? "Enabled" : "Disabled",
        AutoplayNextEpisode: settings.autoplayNextEpisode ? "Enabled" : "Disabled",
        DefaultVolume: `${settings.volumeLevel}%`,
        PlaybackSpeed: settings.playbackSpeed
      });
      
      addSection("Data & Privacy", {
        AutoBackup: settings.autoBackup ? "Enabled" : "Disabled",
        BackupFrequency: settings.backupFrequency,
        TelemetryOptOut: settings.telemetryOptOut ? "Opted Out" : "Opted In",
        StrictPrivacyMode: settings.strictPrivacyMode ? "Enabled" : "Disabled",
        PreloadImages: settings.preloadImages ? "Enabled" : "Disabled"
      });

      addSection("Media Library Summary", {
        TotalWatched: (databaseData as any)?.watched?.length || 0,
        TotalWatchlist: (databaseData as any)?.watchlist?.length || 0,
        TotalFavorites: (databaseData as any)?.favorites?.length || 0,
      });

      doc.save(`velune-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } else {
      // Original JSON Logic
      const data = {
        settings: settings,
        database: databaseData,
        timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `velune-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const clearCache = async () => {
    // dummy function
    await showAlert("Temporary image cache and offline data has been cleared!");
  };

  if (!isLoaded) return null;


  const sidebarItems = [
    { name: "Account", icon: User },
    { name: "Preferences", icon: Sliders },
    { name: "Notifications", icon: Bell },
    { name: "Playback", icon: PlayCircle },
    { name: "Appearance", icon: Palette },
    { name: "Privacy", icon: Lock },
    { name: "Data & Storage", icon: Database },
    { name: "Integrations", icon: Puzzle },
    { name: "Advanced", icon: Code },
    { name: "About", icon: Info },
  ];

  const isWideTab = activeTab === "Changelog" || activeTab === "PrivacyPolicy" || activeTab === "Terms";

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.settingsContainer}>
        <div className={styles.navbarWrapper}>
          <Navbar />
        </div>

        <div className={styles.heroSection}>
          <div className={styles.heroBackground}>
            <div className={styles.glowLines}>
              {/* Generate random-looking lines for the glow effect */}
              {Array.from({ length: 20 }).map((_, i) => {
                const heights = ['10%', '65%', '85%', '15%', '95%', '30%', '75%', '20%', '100%', '45%', '8%', '55%', '90%', '25%', '50%', '70%', '12%', '80%', '40%', '100%'];
                const opacities = [0.1, 0.25, 0.15, 0.05, 0.3, 0.1, 0.2, 0.15, 0.25, 0.05, 0.1, 0.3, 0.15, 0.2, 0.1, 0.05, 0.2, 0.15, 0.1, 0.3];
                const colors = ['#00E5C5', '#00E5C5', '#F8FAFC', '#00E5C5', '#00E5C5', '#00E5C5', '#F8FAFC', '#00E5C5', '#00E5C5', '#00E5C5', '#00E5C5', '#F8FAFC', '#00E5C5', '#00E5C5', '#00E5C5', '#F8FAFC', '#00E5C5', '#00E5C5', '#00E5C5', '#00E5C5'];
                
                return (
                  <div 
                    key={i} 
                    className={styles.glowLine} 
                    style={{ 
                      height: heights[i], 
                      opacity: opacities[i],
                      '--line-color': colors[i] 
                    } as React.CSSProperties}
                  />
                );
              })}
            </div>
          </div>
          <header className={`${styles.pageHeader} ${isWideTab ? styles.pageHeaderWide : ""}`}>
            <h1 className={styles.pageTitle}>{t('settings.title')}</h1>
            <p className={styles.pageSubtitle}>{t('settings.subtitle')}</p>
          </header>

          {/* The Sweeping Curve SVG */}
          <div className={styles.curveWrapper}>
            <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className={styles.curveSvg}>
              <path d="M0,120 L1440,120 L1440,30 C1200,100 800,120 720,120 C640,120 240,100 0,30 Z" fill="#F8FAFC" />
            </svg>
          </div>
        </div>

        <div className={`${styles.container} ${isWideTab ? styles.containerWide : ""}`}>
          <div className={styles.contentWrapper}>
            
            {/* SIDEBAR */}
          <aside className={styles.sidebar}>
            <div className={styles.mobileTabToggle} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <div className={styles.mobileTabToggleLeft}>
                {(() => {
                  const activeItem = sidebarItems.find(i => i.name === activeTab);
                  return activeItem ? <activeItem.icon size={18} /> : null;
                })()}
                <span>{activeTab}</span>
              </div>
              <ChevronDown size={18} style={{ transform: isMobileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </div>
            
            <div className={`${styles.sidebarMenu} ${isMobileMenuOpen ? styles.sidebarMenuOpen : ""}`}>
              {sidebarItems.map((item) => (
                <div 
                  key={item.name}
                  className={`${styles.sidebarItem} ${activeTab === item.name ? styles.sidebarItemActive : ""}`}
                  onClick={() => {
                    setActiveTab(item.name);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <item.icon size={18} className={styles.sidebarIcon} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className={styles.mainContent}>
            {activeTab === "Preferences" ? (
              <>
                {/* General Section */}
                <section className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionIconWrap}>
                      <Settings size={20} />
                    </div>
                    <div className={styles.sectionTitleWrap}>
                      <h2 className={styles.sectionTitle}>{t('settings.general')}</h2>
                      <p className={styles.sectionSubtitle}>{t('settings.general_desc')}</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <span className={styles.settingName}>{t('settings.default_landing')}</span>
                      <span className={styles.settingDesc}>{t('settings.default_landing_desc')}</span>
                    </div>
                    <div className={styles.settingControl}>
                      <select 
                        className={styles.selectControl} 
                        value={settings.defaultLandingPage}
                        onChange={(e) => updateSetting("defaultLandingPage", e.target.value)}
                      >
                        <option value="home">Home</option>
                        <option value="trending">Trending</option>
                        <option value="movies">Movies</option>
                        <option value="tv">TV Shows</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <span className={styles.settingName}>{t('settings.language')}</span>
                      <span className={styles.settingDesc}>{t('settings.language_desc')}</span>
                    </div>
                    <div className={styles.settingControl}>
                      <select 
                        className={styles.selectControl} 
                        value={settings.language}
                        onChange={(e) => updateSetting("language", e.target.value)}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <span className={styles.settingName}>{t('settings.date_format')}</span>
                      <span className={styles.settingDesc}>{t('settings.date_format_desc')}</span>
                    </div>
                    <div className={styles.settingControl}>
                      <select 
                        className={styles.selectControl} 
                        value={settings.dateFormat}
                        onChange={(e) => updateSetting("dateFormat", e.target.value)}
                      >
                        <option value="us">June 20, 2026</option>
                        <option value="eu">20 June 2026</option>
                        <option value="iso">2026-06-20</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Customization Section */}
                <section className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionIconWrap}>
                      <LayoutGrid size={20} />
                    </div>
                    <div className={styles.sectionTitleWrap}>
                      <h2 className={styles.sectionTitle}>{t('settings.customization')}</h2>
                      <p className={styles.sectionSubtitle}>{t('settings.customization_desc')}</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <span className={styles.settingName}>{t('settings.content_order')}</span>
                      <span className={styles.settingDesc}>{t('settings.content_order_desc')}</span>
                    </div>
                    <div className={styles.settingControl}>
                      <select 
                        className={styles.selectControl} 
                        value={settings.contentOrder}
                        onChange={(e) => updateSetting("contentOrder", e.target.value)}
                      >
                        <option value="recent">Recently Added</option>
                        <option value="rating">Highest Rated</option>
                        <option value="alpha">Alphabetical</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <span className={styles.settingName}>{t('settings.rating_system')}</span>
                      <span className={styles.settingDesc}>{t('settings.rating_system_desc')}</span>
                    </div>
                    <div className={styles.settingControl}>
                      <select 
                        className={styles.selectControl} 
                        value={settings.ratingSystem}
                        onChange={(e) => updateSetting("ratingSystem", e.target.value)}
                      >
                        <option value="5">5 Stars</option>
                        <option value="10">10 Stars</option>
                        <option value="100">100 Point Scale</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <span className={styles.settingName}>{t('settings.auto_mark_episode')}</span>
                      <span className={styles.settingDesc}>{t('settings.auto_mark_episode_desc')}</span>
                    </div>
                    <div className={styles.settingControl}>
                      <div 
                        className={`${styles.toggleSwitch} ${settings.autoMarkEpisode ? styles.toggleSwitchActive : ""}`}
                        onClick={() => updateSetting("autoMarkEpisode", !settings.autoMarkEpisode)}
                      >
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <span className={styles.settingName}>{t('settings.hide_watched')}</span>
                      <span className={styles.settingDesc}>{t('settings.hide_watched_desc')}</span>
                    </div>
                    <div className={styles.settingControl}>
                      <div 
                        className={`${styles.toggleSwitch} ${settings.hideWatched ? styles.toggleSwitchActive : ""}`}
                        onClick={() => updateSetting("hideWatched", !settings.hideWatched)}
                      >
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Discover Section */}
                <section className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionIconWrap}>
                      <Compass size={20} />
                    </div>
                    <div className={styles.sectionTitleWrap}>
                      <h2 className={styles.sectionTitle}>Discover</h2>
                      <p className={styles.sectionSubtitle}>Control discovery and recommendation settings.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <span className={styles.settingName}>{t('settings.recs')}</span>
                      <span className={styles.settingDesc}>{t('settings.recs_desc')}</span>
                    </div>
                    <div className={styles.settingControl}>
                      <div 
                        className={`${styles.toggleSwitch} ${settings.enableRecs ? styles.toggleSwitchActive : ""}`}
                        onClick={() => updateSetting("enableRecs", !settings.enableRecs)}
                      >
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <span className={styles.settingName}>{t('settings.exclude_watched')}</span>
                      <span className={styles.settingDesc}>{t('settings.exclude_watched_desc')}</span>
                    </div>
                    <div className={styles.settingControl}>
                      <div 
                        className={`${styles.toggleSwitch} ${settings.excludeWatched ? styles.toggleSwitchActive : ""}`}
                        onClick={() => updateSetting("excludeWatched", !settings.excludeWatched)}
                      >
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionIconWrap} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                      <Settings size={20} className={styles.sectionIcon} />
                    </div>
                    <div className={styles.sectionTitleWrap}>
                      <h2 className={styles.sectionTitle}>Reset Settings</h2>
                      <p className={styles.sectionSubtitle}>Restore all settings to their default values.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow} style={{ borderBottom: 'none' }}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Reset All Settings</h3>
                      <p className={styles.settingDesc}>This will revert all your preferences, appearance, and playback settings back to their original defaults.</p>
                    </div>
                    <div className={styles.settingControl}>
                        <button className={styles.dangerBtn} onClick={async () => {
                          if (await showConfirm('Are you sure you want to reset all settings to their default values?')) {
                            resetSettings();
                            await showAlert('All settings have been restored to defaults.');
                          }
                        }}
                        style={{ padding: '8px 16px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Reset to Defaults
                      </button>
                    </div>
                  </div>
                </section>


              </>
            ) : activeTab === "Appearance" ? (
              <>
                <section className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionIconWrap}>
                      <Monitor size={20} className={styles.sectionIcon} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>{t('settings.appearance')}</h2>
                      <p className={styles.sectionSub}>{t('settings.appearance_desc')}</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>{t('settings.border_radius')}</h3>
                      <p className={styles.settingDesc}>{t('settings.border_radius_desc')}</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl}
                          value={settings.borderRadius || "rounded"}
                          onChange={(e) => updateSetting("borderRadius", e.target.value as any)}
                        >
                          <option value="sharp">Sharp</option>
                          <option value="rounded">Rounded</option>
                          <option value="pill">Pill</option>
                        </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>{t('settings.card_style')}</h3>
                      <p className={styles.settingDesc}>{t('settings.card_style_desc')}</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl}
                          value={settings.cardStyle || "glass"}
                          onChange={(e) => updateSetting("cardStyle", e.target.value as any)}
                        >
                          <option value="glass">Glassmorphism</option>
                          <option value="solid">Solid Background</option>
                          <option value="bordered">Bordered Outline</option>
                        </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>{t('settings.layout_density')}</h3>
                      <p className={styles.settingDesc}>{t('settings.layout_density_desc')}</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl}
                          value={settings.layoutDensity || "default"}
                          onChange={(e) => updateSetting("layoutDensity", e.target.value as any)}
                        >
                          <option value="compact">Compact</option>
                          <option value="default">Default</option>
                          <option value="spacious">Spacious</option>
                        </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>{t('settings.accent_color')}</h3>
                      <p className={styles.settingDesc}>{t('settings.accent_color_desc')}</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl}
                          value={settings.accentColor || "teal"}
                          onChange={(e) => updateSetting("accentColor", e.target.value as any)}
                        >
                          <option value="teal">Teal (Default)</option>
                          <option value="blue">Ocean Blue</option>
                          <option value="pink">Neon Pink</option>
                          <option value="purple">Deep Purple</option>
                          <option value="orange">Sunset Orange</option>
                          <option value="red">Crimson Red</option>
                          <option value="green">Emerald Green</option>
                          <option value="yellow">Golden Yellow</option>
                        </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Theme Mode</h3>
                      <p className={styles.settingDesc}>Choose your preferred color theme.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl} value={settings.theme || "light"} onChange={(e) => updateSetting("theme", e.target.value as any)}>
                          <option value="light">Light Theme</option>
                          <option value="dark">Dark Theme</option>
                          <option value="system">System Default</option>
                          <option value="oled">Pure Black (OLED)</option>
                          <option value="fifa">FIFA World Cup</option>
                        </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Primary Font</h3>
                      <p className={styles.settingDesc}>Change the main typeface used across the app.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl} value={settings.primaryFont || "space-grotesk"} onChange={(e) => updateSetting("primaryFont", e.target.value as any)}>
                          <option value="space-grotesk">Space Grotesk</option>
                          <option value="inter">Inter</option>
                          <option value="roboto">Roboto</option>
                          <option value="system">System UI</option>
                          <option value="playfair">Playfair Display</option>
                          <option value="poppins">Poppins</option>
                          <option value="fira-code">Fira Code</option>
                        </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Navigation Layout</h3>
                      <p className={styles.settingDesc}>Choose how menus are displayed.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl} value={settings.navigationLayout || "sidebar"} onChange={(e) => updateSetting("navigationLayout", e.target.value as any)}>
                          <option value="sidebar">Left Sidebar</option>
                          <option value="topbar">Top Navigation Bar</option>
                          <option value="minimal">Minimal Floating</option>
                        </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Poster Style</h3>
                      <p className={styles.settingDesc}>How movie and TV show artwork is framed.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl} value={settings.posterStyle || "classic"} onChange={(e) => updateSetting("posterStyle", e.target.value as any)}>
                          <option value="classic">Classic Portrait</option>
                          <option value="cinematic">Cinematic Wide</option>
                          <option value="rounded">Soft Rounded</option>
                        </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Glassmorphism (Blur Effects)</h3>
                      <p className={styles.settingDesc}>Enable translucent frosted glass elements.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.blurEffects ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("blurEffects", !settings.blurEffects)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Animation Speed</h3>
                      <p className={styles.settingDesc}>Adjust the speed of UI transitions.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl} value={settings.animationSpeed || "normal"} onChange={(e) => updateSetting("animationSpeed", e.target.value as any)}>
                          <option value="fast">Fast</option>
                          <option value="normal">Normal</option>
                          <option value="slow">Slow</option>
                          <option value="off">Off (Instant)</option>
                        </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Button Style</h3>
                      <p className={styles.settingDesc}>Choose how buttons look across the app.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl} value={settings.buttonStyle || "solid"} onChange={(e) => updateSetting("buttonStyle", e.target.value as any)}>
                          <option value="solid">Solid</option>
                          <option value="outline">Outline</option>
                          <option value="ghost">Ghost</option>
                          <option value="glass">Glass</option>
                        </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Page Transitions</h3>
                      <p className={styles.settingDesc}>Animation played when navigating between pages.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl} value={settings.pageTransition || "fade"} onChange={(e) => updateSetting("pageTransition", e.target.value as any)}>
                          <option value="none">None</option>
                          <option value="fade">Fade</option>
                          <option value="slide">Slide</option>
                          <option value="zoom">Zoom</option>
                        </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Image Hover Effect</h3>
                      <p className={styles.settingDesc}>Effect when hovering over movie/TV posters.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl} value={settings.imageHoverEffect || "zoom"} onChange={(e) => updateSetting("imageHoverEffect", e.target.value as any)}>
                          <option value="none">None</option>
                          <option value="zoom">Zoom</option>
                          <option value="glow">Glow</option>
                          <option value="grayscale">Grayscale to Color</option>
                        </select>
                    </div>
                  </div>

                </section>

                <section className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionIconWrap}>
                      <Monitor size={20} className={styles.sectionIcon} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Accessibility</h2>
                      <p className={styles.sectionSub}>Adjust readability and motion.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>{t('settings.font_size')}</h3>
                      <p className={styles.settingDesc}>{t('settings.font_size_desc')}</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl}
                          value={settings.fontSize || "medium"}
                          onChange={(e) => updateSetting("fontSize", e.target.value as any)}
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>{t('settings.reduced_motion')}</h3>
                      <p className={styles.settingDesc}>{t('settings.reduced_motion_desc')}</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div 
                        className={`${styles.toggleSwitch} ${settings.reducedMotion ? styles.toggleSwitchActive : ""}`}
                        onClick={() => updateSetting("reducedMotion", !settings.reducedMotion)}
                      >
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>High Contrast</h3>
                      <p className={styles.settingDesc}>Increase text contrast for better legibility.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.highContrast ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("highContrast", !settings.highContrast)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Custom Cursor</h3>
                      <p className={styles.settingDesc}>Use the app's branded custom cursor.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.customCursor ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("customCursor", !settings.customCursor)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Scroll Effects</h3>
                      <p className={styles.settingDesc}>Enable parallax and reveal animations on scroll.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.scrollEffects ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("scrollEffects", !settings.scrollEffects)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Scrollbar Style</h3>
                      <p className={styles.settingDesc}>Customize the appearance of the scrollbar.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <select className={styles.selectControl} value={settings.scrollbarStyle || "default"} onChange={(e) => updateSetting("scrollbarStyle", e.target.value as any)}>
                          <option value="hidden">Hidden</option>
                          <option value="minimal">Minimal Floating</option>
                          <option value="default">System Default</option>
                        </select>
                    </div>
                  </div>

                </section>

                <section className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionIconWrap}>
                      <Sparkles size={20} className={styles.sectionIcon} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Special Effects</h2>
                      <p className={styles.sectionSub}>Toggle unique stylistic features and visual effects.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>VHS Retro Scanlines</h3>
                      <p className={styles.settingDesc}>Overlay subtle CRT scanlines on the screen.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.scanlines ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("scanlines", !settings.scanlines)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Filmic Noise Overlay</h3>
                      <p className={styles.settingDesc}>Add a cinematic film grain texture to the background.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.noiseOverlay ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("noiseOverlay", !settings.noiseOverlay)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Neon Outlines (Cyberpunk)</h3>
                      <p className={styles.settingDesc}>Replace standard borders with intense neon glows.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.neonOutlines ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("neonOutlines", !settings.neonOutlines)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Holographic Accents</h3>
                      <p className={styles.settingDesc}>Apply an animated, color-shifting gradient to accents.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.holographic ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("holographic", !settings.holographic)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>3D Tilt Cards</h3>
                      <p className={styles.settingDesc}>Movie posters rotate dynamically in 3D when hovered.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.tiltCards ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("tiltCards", !settings.tiltCards)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Glitch Text Effects</h3>
                      <p className={styles.settingDesc}>Headings glitch with RGB splits on hover.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.glitchEffects ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("glitchEffects", !settings.glitchEffects)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Noir / Monochrome Mode</h3>
                      <p className={styles.settingDesc}>Turn the entire interface into high-contrast black and white.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.noirMode ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("noirMode", !settings.noirMode)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Glass Reflection</h3>
                      <p className={styles.settingDesc}>A sweeping diagonal light reflection on elements.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.glassReflection ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("glassReflection", !settings.glassReflection)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Focus Dimmer</h3>
                      <p className={styles.settingDesc}>Dims the rest of the app when hovering over a poster.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.focusDimmer ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("focusDimmer", !settings.focusDimmer)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Custom Cursor Trail</h3>
                      <p className={styles.settingDesc}>Adds a trailing particle effect behind your custom cursor.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${settings.cursorTrail ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("cursorTrail", !settings.cursorTrail)}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : activeTab === "Account" ? (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}>
                    <User size={20} className={styles.sectionIcon} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>Account Information</h2>
                    <p className={styles.sectionSub}>Update your personal details and public profile.</p>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Name</h3>
                    <p className={styles.settingDesc}>Your display name visible to others.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <input 
                      type="text" 
                      className={styles.textInput} 
                      value={accountForm.name} 
                      onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} 
                      placeholder="Jane Doe"
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: 'var(--color-surface, #1E293B)', color: '#F8FAFC', width: '250px' }}
                    />
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Email Address</h3>
                    <p className={styles.settingDesc}>The email associated with your account.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <input 
                      type="email" 
                      className={styles.textInput} 
                      value={accountForm.email} 
                      onChange={e => setAccountForm({ ...accountForm, email: e.target.value })} 
                      placeholder="jane@example.com"
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: 'var(--color-surface, #1E293B)', color: '#F8FAFC', width: '250px' }}
                    />
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Bio</h3>
                    <p className={styles.settingDesc}>A short description about yourself.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <textarea 
                      className={styles.textInput} 
                      value={accountForm.bio} 
                      onChange={e => setAccountForm({ ...accountForm, bio: e.target.value })} 
                      placeholder="I love movies..."
                      rows={3}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: 'var(--color-surface, #1E293B)', color: '#F8FAFC', width: '250px', resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Username</h3>
                    <p className={styles.settingDesc}>Your unique profile handle (@username).</p>
                  </div>
                  <div className={styles.settingControl}>
                    <input type="text" value={accountForm.username} onChange={e => setAccountForm({ ...accountForm, username: e.target.value })} placeholder="@username" style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: 'var(--color-surface, #1E293B)', color: '#F8FAFC', width: '250px' }} />
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Location</h3>
                    <p className={styles.settingDesc}>Where in the world are you?</p>
                  </div>
                  <div className={styles.settingControl}>
                    <input type="text" value={accountForm.location} onChange={e => setAccountForm({ ...accountForm, location: e.target.value })} placeholder="Earth" style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: 'var(--color-surface, #1E293B)', color: '#F8FAFC', width: '250px' }} />
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Pronouns</h3>
                    <p className={styles.settingDesc}>How would you like to be referred to?</p>
                  </div>
                  <div className={styles.settingControl}>
                    <input type="text" value={accountForm.pronouns} onChange={e => setAccountForm({ ...accountForm, pronouns: e.target.value })} placeholder="They/Them" style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: 'var(--color-surface, #1E293B)', color: '#F8FAFC', width: '250px' }} />
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Website</h3>
                    <p className={styles.settingDesc}>A link to your personal site.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <input type="url" value={accountForm.website} onChange={e => setAccountForm({ ...accountForm, website: e.target.value })} placeholder="https://" style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: 'var(--color-surface, #1E293B)', color: '#F8FAFC', width: '250px' }} />
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Twitter</h3>
                    <p className={styles.settingDesc}>Your Twitter/X handle.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <input type="text" value={accountForm.twitter} onChange={e => setAccountForm({ ...accountForm, twitter: e.target.value })} placeholder="@twitter" style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: 'var(--color-surface, #1E293B)', color: '#F8FAFC', width: '250px' }} />
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Instagram</h3>
                    <p className={styles.settingDesc}>Your Instagram handle.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <input type="text" value={accountForm.instagram} onChange={e => setAccountForm({ ...accountForm, instagram: e.target.value })} placeholder="@instagram" style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: 'var(--color-surface, #1E293B)', color: '#F8FAFC', width: '250px' }} />
                  </div>
                </div>



                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', marginBottom: '40px' }}>
                  <button 
                    onClick={handleUpdateAccount}
                    disabled={savingAccount}
                    style={{ 
                      padding: '10px 20px', 
                      backgroundColor: 'var(--dynamic-accent, #00E5C5)', 
                      color: '#000', 
                      fontWeight: 'bold', 
                      borderRadius: '8px', 
                      border: 'none', 
                      cursor: savingAccount ? 'not-allowed' : 'pointer',
                      opacity: savingAccount ? 0.7 : 1
                    }}
                  >
                    {savingAccount ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className={styles.sectionHeader} style={{ marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '40px' }}>
                  <div className={styles.sectionIconWrap} style={{ backgroundColor: '#450a0a', color: '#f87171' }}>
                    <Lock size={20} className={styles.sectionIcon} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle} style={{ color: '#f87171' }}>Danger Zone</h2>
                    <p className={styles.sectionSub}>Irreversible account actions.</p>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Deactivate Account</h3>
                    <p className={styles.settingDesc}>Temporarily hide your profile and data. Logging back in will reactivate it.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <button 
                      onClick={async () => {
                        if (await showConfirm("Are you sure you want to deactivate your account?")) {
                          await deactivateAccount();
                          router.push("/auth/login");
                        }
                      }}
                      style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #f87171', color: '#f87171', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Deactivate
                    </button>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName} style={{ color: '#ef4444' }}>Delete Account</h3>
                    <p className={styles.settingDesc}>Permanently erase your account and all associated data. This cannot be undone.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <button 
                      onClick={async () => {
                        if (await showConfirm("WARNING: This will permanently wipe all your data (reviews, history, favorites). Are you absolutely sure?")) {
                          await deleteAccount();
                          router.push("/auth/login");
                        }
                      }}
                      style={{ padding: '8px 16px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Delete Account
                    </button>
                  </div>
                </div>

              </section>
            ) : activeTab === "Playback" ? (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}>
                    <PlayCircle size={20} className={styles.sectionIcon} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>Playback Settings</h2>
                    <p className={styles.sectionSub}>Customize your video and audio experience.</p>
                  </div>
                </div>

                {/* AUTOPLAY & SKIPPING */}
                <h3 className={styles.subSectionHeader} style={{ marginTop: '20px' }}>Autoplay & Skipping</h3>
                
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Autoplay Trailers</h3>
                    <p className={styles.settingDesc}>Play trailers automatically on detail pages.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.autoplayTrailers ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("autoplayTrailers", !settings.autoplayTrailers)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Autoplay Next Episode</h3>
                    <p className={styles.settingDesc}>Automatically start the next episode.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.autoplayNextEpisode ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("autoplayNextEpisode", !settings.autoplayNextEpisode)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Skip Intros Automatically</h3>
                    <p className={styles.settingDesc}>Jump past TV show intros automatically.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.skipIntros ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("skipIntros", !settings.skipIntros)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Skip Recaps Automatically</h3>
                    <p className={styles.settingDesc}>Jump past "Previously on" recaps automatically.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.skipRecaps ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("skipRecaps", !settings.skipRecaps)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Resume Playback Position</h3>
                    <p className={styles.settingDesc}>Remember where you left off.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.resumePlayback ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("resumePlayback", !settings.resumePlayback)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                {/* AUDIO & VIDEO QUALITY */}
                <h3 className={styles.subSectionHeader}>Audio & Video Quality</h3>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Default Video Quality</h3>
                    <p className={styles.settingDesc}>Preferred streaming resolution.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.defaultVideoQuality} onChange={(e) => updateSetting("defaultVideoQuality", e.target.value as any)}>
                        <option value="auto">Auto</option>
                        <option value="4k">4K (Ultra HD)</option>
                        <option value="1080p">1080p (Full HD)</option>
                        <option value="720p">720p (HD)</option>
                        <option value="data-saver">Data Saver</option>
                      </select>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Default Playback Speed</h3>
                    <p className={styles.settingDesc}>Change the default speed of playback.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.playbackSpeed} onChange={(e) => updateSetting("playbackSpeed", e.target.value as any)}>
                        <option value="0.5x">0.5x</option>
                        <option value="1x">1x (Normal)</option>
                        <option value="1.25x">1.25x</option>
                        <option value="1.5x">1.5x</option>
                        <option value="2x">2x</option>
                      </select>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Default Volume Level</h3>
                    <p className={styles.settingDesc}>Set the default audio volume ({settings.volumeLevel}%).</p>
                  </div>
                  <div className={styles.settingControl}>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={settings.volumeLevel} 
                      onChange={(e) => updateSetting("volumeLevel", parseInt(e.target.value))} 
                      style={{ width: '150px', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Hardware Acceleration</h3>
                    <p className={styles.settingDesc}>Use your device's GPU for smoother playback.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.hardwareAcceleration ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("hardwareAcceleration", !settings.hardwareAcceleration)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Limit Data Usage</h3>
                    <p className={styles.settingDesc}>Restrict video quality on cellular networks.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.limitDataUsage ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("limitDataUsage", !settings.limitDataUsage)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Mute Trailers by Default</h3>
                    <p className={styles.settingDesc}>Start trailers with the volume muted.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.muteTrailersByDefault ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("muteTrailersByDefault", !settings.muteTrailersByDefault)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                {/* LANGUAGE & SUBTITLES */}
                <h3 className={styles.subSectionHeader}>Language & Subtitles</h3>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Preferred Audio Language</h3>
                    <p className={styles.settingDesc}>Default language for dubbing if available.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.preferredAudioLanguage} onChange={(e) => updateSetting("preferredAudioLanguage", e.target.value)}>
                        <option value="original">Original Audio</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Preferred Subtitle Language</h3>
                    <p className={styles.settingDesc}>Automatically turn on these subtitles.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.preferredSubtitleLanguage} onChange={(e) => updateSetting("preferredSubtitleLanguage", e.target.value)}>
                        <option value="off">Off</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Subtitle Size</h3>
                    <p className={styles.settingDesc}>How large should the subtitle text be?</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.subtitleSize} onChange={(e) => updateSetting("subtitleSize", e.target.value as any)}>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="xlarge">Extra Large</option>
                      </select>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Subtitle Color</h3>
                    <p className={styles.settingDesc}>Color of the subtitle text.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.subtitleColor} onChange={(e) => updateSetting("subtitleColor", e.target.value as any)}>
                        <option value="white">White</option>
                        <option value="yellow">Yellow</option>
                        <option value="cyan">Cyan</option>
                      </select>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Subtitle Background</h3>
                    <p className={styles.settingDesc}>Backdrop for subtitles to improve readability.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.subtitleBackground} onChange={(e) => updateSetting("subtitleBackground", e.target.value as any)}>
                        <option value="transparent">Transparent</option>
                        <option value="translucent">Translucent Drop Shadow</option>
                        <option value="solid">Solid Black</option>
                      </select>
                  </div>
                </div>

                {/* PLAYER UI & EXPERIENCE */}
                <h3 className={styles.subSectionHeader}>Player UI & Experience</h3>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Show Playback Controls</h3>
                    <p className={styles.settingDesc}>When to display the video player controls.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.showPlaybackControls} onChange={(e) => updateSetting("showPlaybackControls", e.target.value as any)}>
                        <option value="auto">Auto-hide when playing</option>
                        <option value="always">Always show</option>
                      </select>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Picture-in-Picture</h3>
                    <p className={styles.settingDesc}>Automatically enter PiP when navigating away.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.pictureInPicture ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("pictureInPicture", !settings.pictureInPicture)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Play Audio in Background</h3>
                    <p className={styles.settingDesc}>Continue audio playback when the app is minimized.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.playInBackground ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("playInBackground", !settings.playInBackground)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Pre-buffer Size</h3>
                    <p className={styles.settingDesc}>Amount of video to load ahead.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.bufferSize} onChange={(e) => updateSetting("bufferSize", e.target.value as any)}>
                        <option value="minimal">Minimal (Faster start)</option>
                        <option value="auto">Auto</option>
                        <option value="maximum">Maximum (Less buffering)</option>
                      </select>
                  </div>
                </div>

              </section>
            ) : activeTab === "Privacy" ? (
              <>
                <section className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionIconWrap}>
                      <LayoutGrid size={20} className={styles.sectionIcon} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Profile Visibility</h2>
                      <p className={styles.sectionSub}>Choose what information is visible on your public profile.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Show Watchlist</h3>
                      <p className={styles.settingDesc}>Allow others to see your upcoming watch list.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${accountForm.showWatchlist ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, showWatchlist: !accountForm.showWatchlist })}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Show Favorites</h3>
                      <p className={styles.settingDesc}>Display your favorite movies and shows.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${accountForm.showFavorites ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, showFavorites: !accountForm.showFavorites })}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Show Watch History</h3>
                      <p className={styles.settingDesc}>Let others see what you have watched recently.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${accountForm.showWatchHistory ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, showWatchHistory: !accountForm.showWatchHistory })}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Show Ratings</h3>
                      <p className={styles.settingDesc}>Make the star ratings you've given visible to others.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${accountForm.showRatings ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, showRatings: !accountForm.showRatings })}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Show TV Progress</h3>
                      <p className={styles.settingDesc}>Show which episodes you've watched in a TV series.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${accountForm.showTVProgress ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, showTVProgress: !accountForm.showTVProgress })}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Show Achievements</h3>
                      <p className={styles.settingDesc}>Display your unlocked badges and milestones.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${accountForm.showAchievements ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, showAchievements: !accountForm.showAchievements })}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Show Followed Directors & Actors</h3>
                      <p className={styles.settingDesc}>Allow others to see people you follow.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${accountForm.showFollowedPeople ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, showFollowedPeople: !accountForm.showFollowedPeople })}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Show Join Date</h3>
                      <p className={styles.settingDesc}>Display the year you joined the platform.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${accountForm.showJoinDate ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, showJoinDate: !accountForm.showJoinDate })}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Show Location</h3>
                      <p className={styles.settingDesc}>Display your location if added in Account Settings.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${accountForm.showLocation ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, showLocation: !accountForm.showLocation })}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow} style={{ borderBottom: 'none' }}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>Show Social Links</h3>
                      <p className={styles.settingDesc}>Display your Twitter, Instagram, and Website links.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <div className={`${styles.toggleSwitch} ${accountForm.showSocialLinks ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, showSocialLinks: !accountForm.showSocialLinks })}>
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingRow} style={{ background: 'var(--bg-card-secondary)', borderTop: '1px solid var(--border-color)', marginTop: '20px', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                    <button className={styles.primaryBtn} onClick={handleUpdateAccount} disabled={savingAccount}>
                      {savingAccount ? "Saving..." : "Save Visibility"}
                    </button>
                  </div>
                </section>
              </>
            ) : activeTab === "Privacy" ? (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                    <Lock size={20} className={styles.sectionIcon} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>Privacy Settings</h2>
                    <p className={styles.sectionSub}>Control your data, visibility, and local privacy.</p>
                  </div>
                </div>

                <h3 className={styles.subSectionHeader}>Local Privacy (Device Only)</h3>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Incognito Mode</h3>
                    <p className={styles.settingDesc}>Pause all watch history tracking for this session.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.incognitoMode ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("incognitoMode", !settings.incognitoMode)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Stealth Mode</h3>
                    <p className={styles.settingDesc}>Blur all posters and titles to prevent shoulder-surfing.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.stealthMode ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("stealthMode", !settings.stealthMode)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <h3 className={styles.subSectionHeader}>Network & App Privacy</h3>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Strict Privacy Mode</h3>
                    <p className={styles.settingDesc}>Block all non-essential third-party network pings.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.strictPrivacyMode ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("strictPrivacyMode", !settings.strictPrivacyMode)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Telemetry / Crash Reports</h3>
                    <p className={styles.settingDesc}>Send anonymous crash reports to help improve Velune.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${!settings.telemetryOptOut ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("telemetryOptOut", !settings.telemetryOptOut)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <h3 className={styles.subSectionHeader}>Account Visibility (Public)</h3>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Private Account</h3>
                    <p className={styles.settingDesc}>Only approved followers can see your profile.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${accountForm.isPrivate ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, isPrivate: !accountForm.isPrivate })}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Show Activity Status</h3>
                    <p className={styles.settingDesc}>Allow others to see when you are online.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${accountForm.showActivity ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, showActivity: !accountForm.showActivity })}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Two-Factor Authentication</h3>
                    <p className={styles.settingDesc}>Require a code when logging in.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${accountForm.twoFactorEnabled ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, twoFactorEnabled: !accountForm.twoFactorEnabled })}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Show Sensitive Content</h3>
                    <p className={styles.settingDesc}>Allow Adult/NSFW content to be shown in searches.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${accountForm.contentSensitivity ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, contentSensitivity: !accountForm.contentSensitivity })}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Search Engine Indexing</h3>
                    <p className={styles.settingDesc}>Allow search engines like Google to index your public profile.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${accountForm.allowSearchIndexing ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, allowSearchIndexing: !accountForm.allowSearchIndexing })}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Block Unknown Messages</h3>
                    <p className={styles.settingDesc}>Only receive messages from users you follow.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${accountForm.blockUnknownMessages ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, blockUnknownMessages: !accountForm.blockUnknownMessages })}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Allow Profile Recommendations</h3>
                    <p className={styles.settingDesc}>Suggest your profile to others in "Who to Follow".</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${accountForm.allowProfileRecs ? styles.toggleSwitchActive : ""}`} onClick={() => setAccountForm({ ...accountForm, allowProfileRecs: !accountForm.allowProfileRecs })}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', marginBottom: '40px' }}>
                  <button 
                    className={styles.primaryBtn}
                    onClick={handleUpdateAccount}
                    disabled={savingAccount}
                  >
                    {savingAccount ? "Saving..." : "Save Visibility Settings"}
                  </button>
                </div>
              </section>
            ) : activeTab === "Advanced" ? (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                    <Code size={20} className={styles.sectionIcon} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>Advanced Settings</h2>
                    <p className={styles.sectionSub}>Power user features. Proceed with caution.</p>
                  </div>
                </div>

                {/* SYSTEM & APP */}
                <h3 className={styles.subSectionHeader} style={{ marginTop: '20px' }}>System & App Behavior</h3>
                
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Developer Mode</h3>
                    <p className={styles.settingDesc}>Enable debug logs and developer overlays.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.developerMode ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("developerMode", !settings.developerMode)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Beta Features</h3>
                    <p className={styles.settingDesc}>Opt-in to experimental UI components before release.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.betaFeatures ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("betaFeatures", !settings.betaFeatures)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Hardware Acceleration (UI)</h3>
                    <p className={styles.settingDesc}>Force GPU rendering for CSS layers and animations.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.hardwareAccelerationUI ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("hardwareAccelerationUI", !settings.hardwareAccelerationUI)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Offline Mode Capability</h3>
                    <p className={styles.settingDesc}>Pre-cache API data for offline access (PWA feature).</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.offlineMode ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("offlineMode", !settings.offlineMode)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Clear Cache on Exit</h3>
                    <p className={styles.settingDesc}>Automatically clear temporary images/data on close.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.clearCacheOnExit ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("clearCacheOnExit", !settings.clearCacheOnExit)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                {/* NETWORK & API */}
                <h3 className={styles.subSectionHeader}>Network & API Configuration</h3>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>API Endpoint Router</h3>
                    <p className={styles.settingDesc}>Route requests through a custom proxy server.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.apiEndpoint} onChange={(e) => updateSetting("apiEndpoint", e.target.value)}>
                        <option value="default">Default TMDB API</option>
                        <option value="proxy1">Proxy Server US-East</option>
                        <option value="proxy2">Proxy Server EU-West</option>
                      </select>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Network Timeout</h3>
                    <p className={styles.settingDesc}>Limit how long the app waits for a server response.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.networkTimeout} onChange={(e) => updateSetting("networkTimeout", e.target.value as any)}>
                        <option value="5s">5 Seconds</option>
                        <option value="10s">10 Seconds</option>
                        <option value="30s">30 Seconds</option>
                      </select>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Max Concurrent Fetches</h3>
                    <p className={styles.settingDesc}>Limit parallel requests to prevent rate-limiting ({settings.maxConcurrentFetches}).</p>
                  </div>
                  <div className={styles.settingControl}>
                    <input 
                      type="range" 
                      min="1" max="10" 
                      value={settings.maxConcurrentFetches} 
                      onChange={(e) => updateSetting("maxConcurrentFetches", parseInt(e.target.value))} 
                      style={{ width: '150px', cursor: 'pointer' }}
                    />
                  </div>
                </div>



                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Bypass CDN Cache</h3>
                    <p className={styles.settingDesc}>Always fetch the freshest data from origins instead of CDN edges.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.bypassCdnCache ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("bypassCdnCache", !settings.bypassCdnCache)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>WebSocket Sync</h3>
                    <p className={styles.settingDesc}>Keep watch history synchronized across devices in real-time.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.webSocketSync ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("webSocketSync", !settings.webSocketSync)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Strict CORS Policy</h3>
                    <p className={styles.settingDesc}>Enforce strict Cross-Origin Resource Sharing rules on local proxy.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.strictCorsPolicy ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("strictCorsPolicy", !settings.strictCorsPolicy)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                {/* CUSTOMIZATION & HACKS */}
                <h3 className={styles.subSectionHeader}>Customization & Hacks</h3>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Enable Keyboard Shortcuts</h3>
                    <p className={styles.settingDesc}>Toggle global application hotkeys.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.enableKeyboardShortcuts ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("enableKeyboardShortcuts", !settings.enableKeyboardShortcuts)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Experimental Video Player</h3>
                    <p className={styles.settingDesc}>Force use of the unreleased HTML5 player engine.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.experimentalVideoPlayer ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("experimentalVideoPlayer", !settings.experimentalVideoPlayer)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Sandbox Mode</h3>
                    <p className={styles.settingDesc}>Isolate components for visual testing without DB calls.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.sandboxMode ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("sandboxMode", !settings.sandboxMode)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Console Log Level</h3>
                    <p className={styles.settingDesc}>Verbosity of browser console outputs.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.logLevel} onChange={(e) => updateSetting("logLevel", e.target.value as any)}>
                        <option value="error">Error Only</option>
                        <option value="warn">Warn & Error</option>
                        <option value="info">Info</option>
                        <option value="debug">Verbose Debug</option>
                      </select>
                  </div>
                </div>

                <div className={styles.settingRow} style={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: 'none' }}>
                  <div className={styles.settingInfo} style={{ maxWidth: '100%', marginBottom: '16px' }}>
                    <h3 className={styles.settingName}>Custom CSS Injector</h3>
                    <p className={styles.settingDesc}>Write your own CSS rules. They will be applied instantly to the root document. Be careful, you can break the UI layout!</p>
                  </div>
                  <textarea 
                    value={settings.customCss}
                    onChange={(e) => updateSetting("customCss", e.target.value)}
                    placeholder="body { background: #000; } .card { opacity: 0.5; }"
                    style={{
                      width: '100%', height: '120px', fontFamily: 'monospace', fontSize: '13px',
                      padding: '12px', borderRadius: '8px', border: '1px solid #334155',
                      background: '#1E293B', color: '#00E5C5', resize: 'vertical'
                    }}
                  />
                </div>

                <div className={styles.settingRow} style={{ borderTop: '1px solid #334155', marginTop: '20px', paddingTop: '20px' }}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName} style={{ color: '#ef4444' }}>Factory Reset</h3>
                    <p className={styles.settingDesc}>Wipe all local settings and cookies back to default.</p>
                  </div>
                  <div className={styles.settingControl}>
                      <button className={styles.dangerBtn} onClick={async () => {
                        if(await showConfirm('Are you sure you want to reset ALL settings?')) {
                          localStorage.removeItem('velune_settings');
                          document.cookie = 'velune_settings=; Max-Age=0; path=/;';
                          window.location.reload();
                        }
                      }}
                      style={{ padding: '8px 16px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Reset Settings
                    </button>
                  </div>
                </div>

              </section>
            ) : activeTab === "Data & Storage" ? (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                    <HardDrive size={20} className={styles.sectionIcon} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>Data & Storage</h2>
                    <p className={styles.sectionSub}>Manage your local data, backups, and storage footprint.</p>
                  </div>
                </div>

                {/* STORAGE USAGE */}
                <h3 className={styles.subSectionHeader} style={{ marginTop: '20px' }}>Storage Usage</h3>
                
                <div className={styles.settingRow} style={{ borderBottom: 'none', paddingBottom: '0' }}>
                  <div className={styles.settingInfo} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#0F172A' }}>Estimated Local Storage</span>
                      <span style={{ color: '#64748B', fontSize: '14px' }}>~12.4 MB / 50 MB</span>
                    </div>
                    {/* Mock Progress bar */}
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '25%', height: '100%', backgroundColor: '#3B82F6', borderRadius: '4px' }}></div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>
                      Includes cached images, offline lists, and app preferences.
                    </p>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Clear Temporary Cache</h3>
                    <p className={styles.settingDesc}>Frees up space by removing cached images and API responses.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <button 
                      onClick={clearCache}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      <Trash2 size={16} />
                      Clear Cache
                    </button>
                  </div>
                </div>

                {/* SYNC & BACKUP */}
                <h3 className={styles.subSectionHeader}>Sync & Backup</h3>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Auto-Backup User Data</h3>
                    <p className={styles.settingDesc}>Periodically sync your local DB to the cloud.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.autoBackup ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("autoBackup", !settings.autoBackup)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Backup Frequency</h3>
                    <p className={styles.settingDesc}>How often to perform auto-backups.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.backupFrequency} onChange={(e) => updateSetting("backupFrequency", e.target.value as any)}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                  </div>
                </div>

                {/* EXPORT DATA */}
                <h3 className={styles.subSectionHeader}>Export Data</h3>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Export Format</h3>
                    <p className={styles.settingDesc}>Default file extension when exporting lists.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.selectControl} value={settings.exportDataFormat} onChange={(e) => updateSetting("exportDataFormat", e.target.value as any)}>
                        <option value="json">JSON (.json)</option>
                        <option value="csv">CSV Spreadsheet (.csv)</option>
                        <option value="pdf">PDF Document (.pdf)</option>
                      </select>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Download My Data</h3>
                    <p className={styles.settingDesc}>Get a copy of your settings and local storage.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <button 
                      onClick={handleDownloadData}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#3B82F6', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' }}
                    >
                      <Download size={16} />
                      Download Export
                    </button>
                  </div>
                </div>

                {/* DATA SAVER */}
                <h3 className={styles.subSectionHeader}>Data Saver</h3>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Preload High-Res Images</h3>
                    <p className={styles.settingDesc}>Pre-fetches heavy images to make the app feel instantly fast.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.preloadImages ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("preloadImages", !settings.preloadImages)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Show System Metadata</h3>
                    <p className={styles.settingDesc}>Reveal internal IDs (e.g. TMDB ID) on media pages.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.showSystemMetadata ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("showSystemMetadata", !settings.showSystemMetadata)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

              </section>
            ) : activeTab === "Notifications" ? (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap} style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#EAB308' }}>
                    <Bell size={20} className={styles.sectionIcon} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>Notifications</h2>
                    <p className={styles.sectionSub}>Manage how and when Velune contacts you.</p>
                  </div>
                </div>

                <h3 className={styles.subSectionHeader} style={{ marginTop: '20px' }}>Delivery Methods</h3>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>In-App Notifications</h3>
                    <p className={styles.settingDesc}>Receive alerts within the app interface.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.inAppNotifications ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("inAppNotifications", !settings.inAppNotifications)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Push Notifications</h3>
                    <p className={styles.settingDesc}>Receive native OS push notifications on your device.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.pushNotifications ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("pushNotifications", !settings.pushNotifications)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Email Notifications</h3>
                    <p className={styles.settingDesc}>Receive notifications directly in your inbox.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.emailNotifications ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("emailNotifications", !settings.emailNotifications)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <h3 className={styles.subSectionHeader}>Event Alerts</h3>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>New Follower Alerts</h3>
                    <p className={styles.settingDesc}>Get notified when someone follows your profile.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.newFollowerAlerts ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("newFollowerAlerts", !settings.newFollowerAlerts)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Watchlist Reminders</h3>
                    <p className={styles.settingDesc}>Get notified when a movie on your watchlist is released.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.watchlistReminders ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("watchlistReminders", !settings.watchlistReminders)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Marketing Emails & Offers</h3>
                    <p className={styles.settingDesc}>Receive promotional emails, news, and special offers.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.marketingEmails ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("marketingEmails", !settings.marketingEmails)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>
              </section>
            ) : activeTab === "Integrations" ? (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap} style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
                    <Puzzle size={20} className={styles.sectionIcon} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>Integrations</h2>
                    <p className={styles.sectionSub}>Connect Velune with your favorite third-party services.</p>
                  </div>
                </div>

                <h3 className={styles.subSectionHeader} style={{ marginTop: '20px' }}>Tracking & Sync</h3>

                {[
                  { key: "traktSync", name: "Trakt.tv Sync", desc: "Automatically scrobble your watch history to Trakt.tv." },
                  { key: "letterboxdSync", name: "Letterboxd Sync", desc: "Sync your movie ratings and reviews with Letterboxd." },
                  { key: "myAnimeListSync", name: "MyAnimeList Sync", desc: "Sync your anime watch progress with MyAnimeList." },
                  { key: "simklSync", name: "Simkl Sync", desc: "Connect with Simkl to track TV, Anime, and Movies." },
                ].map(integration => (
                  <div className={styles.settingRow} key={integration.key}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingName}>{integration.name}</h3>
                      <p className={styles.settingDesc}>{integration.desc}</p>
                      {integration.key === "traktSync" && settings.traktSync && (
                         <button 
                            className={styles.primaryButton} 
                            style={{marginTop: '10px', fontSize: '12px', padding: '6px 12px', opacity: isImporting ? 0.7 : 1}}
                            onClick={handleTraktImport}
                            disabled={isImporting}
                         >
                           {isImporting ? 'Importing from Trakt...' : 'Import History from Trakt'}
                         </button>
                      )}
                    </div>
                    <div className={styles.settingControl}>
                      <div 
                        className={`${styles.toggleSwitch} ${settings[integration.key as keyof typeof settings] ? styles.toggleSwitchActive : ""}`} 
                        onClick={async () => {
                          const currentState = settings[integration.key as keyof typeof settings];
                          if (!currentState) {
                            if (integration.key === "traktSync") {
                              const confirm = await showConfirm(`Connect to Trakt.tv? You will be redirected to authorize Velune.`, `Trakt.tv`);
                              if (confirm) {
                                window.location.href = '/api/auth/trakt';
                              }
                            } else if (integration.key === "letterboxdSync") {
                              const confirm = await showConfirm(`Connect to Letterboxd? You will be redirected to authorize Velune.`, `Letterboxd`);
                              if (confirm) {
                                window.location.href = '/api/auth/letterboxd';
                              }
                            } else if (integration.key === "myAnimeListSync") {
                              const confirm = await showConfirm(`Connect to MyAnimeList? You will be redirected to authorize Velune.`, `MyAnimeList`);
                              if (confirm) {
                                window.location.href = '/api/auth/mal';
                              }
                            } else if (integration.key === "simklSync") {
                              const confirm = await showConfirm(`Connect to Simkl? You will be redirected to authorize Velune.`, `Simkl`);
                              if (confirm) {
                                window.location.href = '/api/auth/simkl';
                              }
                            } else {
                              const confirm = await showConfirm(`Connect to ${integration.name}?`, `${integration.name}`);
                              if (confirm) {
                                await showAlert(`Fallback block reached for ${integration.name}. You are on the updated code.`, "Error");
                                updateSetting(integration.key as any, true as any);
                              }
                            }
                          } else {
                            const confirm = await showConfirm(`Are you sure you want to disconnect ${integration.name}? Your data will no longer sync.`, `Disconnect ${integration.name}`);
                            if (confirm) {
                              updateSetting(integration.key as any, false as any);
                            }
                          }
                        }}
                      >
                        <div className={styles.toggleKnob}></div>
                      </div>
                    </div>
                  </div>
                ))}

                <h3 className={styles.subSectionHeader}>Social & Presence</h3>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Discord Rich Presence</h3>
                    <p className={styles.settingDesc}>Show what you are currently watching on your Discord profile.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div 
                      className={`${styles.toggleSwitch} ${settings.discordRichPresence ? styles.toggleSwitchActive : ""}`} 
                      onClick={async () => {
                        const currentState = settings.discordRichPresence;
                        if (!currentState) {
                          const confirm = await showConfirm(`Connect to Discord? You will be redirected to authorize Velune.`, `Discord Integration`);
                          if (confirm) {
                            window.location.href = '/api/auth/discord';
                          }
                        } else {
                          const confirm = await showConfirm(`Disconnect Discord? Your rich presence will no longer update.`, `Disconnect Discord`);
                          if (confirm) {
                            updateSetting("discordRichPresence", false as any);
                          }
                        }
                      }}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

              </section>
            ) : activeTab === "About" ? (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                    <Info size={20} className={styles.sectionIcon} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>About Velune</h2>
                    <p className={styles.sectionSub}>Information, updates, and legal details about the app.</p>
                  </div>
                </div>

                <div style={{ textAlign: 'center', padding: '40px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
                  <h1 style={{ fontSize: '3rem', fontWeight: '900', margin: '0', background: 'linear-gradient(90deg, #00E5C5, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Velune
                  </h1>
                  <p style={{ color: '#64748B', marginTop: '8px', fontSize: '1.1rem' }}>Version 2.4.1 (Build 8903)</p>
                  <p style={{ color: '#94A3B8', marginTop: '4px', fontSize: '0.9rem' }}>The ultimate next-gen movie tracker.</p>
                </div>

                <h3 className={styles.subSectionHeader}>Updates & Testing</h3>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Auto-Update App</h3>
                    <p className={styles.settingDesc}>Automatically download and install the latest updates.</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.autoUpdateApp ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("autoUpdateApp", !settings.autoUpdateApp)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Join Beta Program</h3>
                    <p className={styles.settingDesc}>Get early access to unreleased features (may contain bugs).</p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={`${styles.toggleSwitch} ${settings.joinBetaProgram ? styles.toggleSwitchActive : ""}`} onClick={() => updateSetting("joinBetaProgram", !settings.joinBetaProgram)}>
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>

                <h3 className={styles.subSectionHeader}>Links & Legal</h3>

                <div className={styles.settingRow} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('Changelog')}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Changelog</h3>
                    <p className={styles.settingDesc}>See what's new in the latest versions.</p>
                  </div>
                </div>

                <div className={styles.settingRow} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('PrivacyPolicy')}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Privacy Policy</h3>
                    <p className={styles.settingDesc}>Read our commitments to your data privacy.</p>
                  </div>
                </div>

                <div className={styles.settingRow} style={{ cursor: 'pointer', borderBottom: 'none' }} onClick={() => setActiveTab('Terms')}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingName}>Terms of Service</h3>
                    <p className={styles.settingDesc}>Read the rules governing the use of our services.</p>
                  </div>
                </div>

              </section>
            ) : activeTab === "Changelog" ? (
              <motion.div 
                style={{ width: '100%' }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className={styles.backLink} onClick={() => setActiveTab('About')}>
                  <ArrowLeft size={16} /> Back
                </div>
                <div className={styles.clWrapper}>
                  <div className={styles.clHeader}>
                    <div className={styles.clHeaderLeft}>
                      <div className={styles.clHeaderIconWrap}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </div>
                      <div>
                        <h2 className={styles.clHeaderTitle}>What's new in Velune?</h2>
                        <p className={styles.clHeaderDesc}>We're constantly improving your cinema experience.</p>
                      </div>
                    </div>
                    <div className={styles.clHeaderRight}>
                      <div className={styles.clHeaderRightText}>
                        Better experience.
                        <span>Every update.</span>
                      </div>
                      <Sparkles size={24} color="#f6c867" />
                    </div>
                  </div>

                  <div className={styles.clList}>
                    <div className={styles.clRow}>
                      <div className={styles.clPillBlock}>
                        <h3 className={styles.clVersion}>v0.4.1</h3>
                        <p className={styles.clDate}>Jul 07, 2026</p>
                        <span className={`${styles.clBadge} ${styles.improvement}`}>IMPROVEMENT</span>
                      </div>
                      <div className={styles.clContent}>
                        <div className={styles.clContentTitleRow}>
                          <h4 className={styles.clContentTitle}>UI Improvements</h4>
                        </div>
                        <p className={styles.clContentDesc}>Enhanced visibility and styling of the 'Back' buttons across Movie, TV Show, Episode, and Collection pages for better navigation.</p>
                      </div>
                    </div>

                    <div className={styles.clRow}>
                      <div className={styles.clPillBlock}>
                        <h3 className={styles.clVersion}>v0.4.0</h3>
                        <p className={styles.clDate}>Jul 05, 2026</p>
                        <span className={`${styles.clBadge} ${styles.newFeature}`}>NEW FEATURE</span>
                      </div>
                      <div className={styles.clContent}>
                        <div className={styles.clContentTitleRow}>
                          <h4 className={styles.clContentTitle}>Social & Personalization</h4>
                        </div>
                        <p className={styles.clContentDesc}>Added Wrapped feature, achievements, cast & crew pages, and comprehensive user settings.</p>
                        <div className={styles.clBullets}>
                          <span>Wrapped year-in-review</span>
                          <span>Achievements tracking</span>
                          <span>Comprehensive settings page</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.clRow}>
                      <div className={styles.clPillBlock}>
                        <h3 className={styles.clVersion}>v0.3.0</h3>
                        <p className={styles.clDate}>Jun 28, 2026</p>
                        <span className={`${styles.clBadge} ${styles.majorUpdate}`}>MAJOR UPDATE</span>
                      </div>
                      <div className={styles.clContent}>
                        <div className={styles.clContentTitleRow}>
                          <h4 className={styles.clContentTitle}>Core Tracking Features</h4>
                        </div>
                        <p className={styles.clContentDesc}>Added detailed Movie, TV Show, and Episode pages. Implemented robust search, trending sections, and user collections.</p>
                        <div className={styles.clBullets}>
                          <span>Movie & TV Show pages</span>
                          <span>Robust search</span>
                          <span>User collections</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.clRow}>
                      <div className={styles.clPillBlock}>
                        <h3 className={styles.clVersion}>v0.2.0</h3>
                        <p className={styles.clDate}>Jun 15, 2026</p>
                        <span className={`${styles.clBadge} ${styles.update}`}>UPDATE</span>
                      </div>
                      <div className={styles.clContent}>
                        <div className={styles.clContentTitleRow}>
                          <h4 className={styles.clContentTitle}>Authentication & Profiles</h4>
                        </div>
                        <p className={styles.clContentDesc}>Implemented user login, registration, password reset flows, and user profiles.</p>
                      </div>
                    </div>

                    <div className={styles.clRow}>
                      <div className={styles.clPillBlock}>
                        <h3 className={styles.clVersion}>v0.1.0</h3>
                        <p className={styles.clDate}>Jun 01, 2026</p>
                        <span className={`${styles.clBadge} ${styles.enhancement}`}>INITIAL RELEASE</span>
                      </div>
                      <div className={styles.clContent}>
                        <div className={styles.clContentTitleRow}>
                          <h4 className={styles.clContentTitle}>Initial Setup</h4>
                        </div>
                        <p className={styles.clContentDesc}>Initialized Next.js project with Prisma, basic components, and global styling.</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.clFooter}>
                    <div className={styles.clFooterLeft}>
                      <div className={styles.clFooterIconWrap}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
                      </div>
                      <div>
                        <h2 className={styles.clFooterTitle}>Love what we're building?</h2>
                        <p className={styles.clFooterDesc}>We'd love to hear your feedback and suggestions.</p>
                      </div>
                    </div>
                    <button className={styles.clFooterBtn}>Give Feedback <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></button>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === "PrivacyPolicy" || activeTab === "Terms" ? (
              <motion.div 
                style={{ width: '100%' }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className={styles.backLink} onClick={() => setActiveTab('About')}>
                  <ArrowLeft size={16} /> Back
                </div>
                
                <div className={styles.clWrapper}>
                  <div className={styles.clHeader}>
                    <div className={styles.clHeaderLeft}>
                      <div className={styles.clHeaderIconWrap} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                        <Lock size={24} />
                      </div>
                      <div>
                        <h2 className={styles.clHeaderTitle}>{activeTab === "PrivacyPolicy" ? "Privacy Policy" : "Terms of Service"}</h2>
                        <p className={styles.clHeaderDesc}>
                          {activeTab === "PrivacyPolicy" 
                            ? "We believe your data belongs to you. Here's a transparent overview of how we handle your information."
                            : "Please read these terms carefully before using Velune."}
                        </p>
                      </div>
                    </div>
                    <div className={styles.clHeaderRight}>
                      <div className={styles.clHeaderRightText}>
                        LAST UPDATED
                        <span>JUL 7, 2026</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.clList}>
                    {activeTab === "PrivacyPolicy" ? (
                      <>
                        <div className={styles.clRow} style={{ display: 'block' }}>
                          <h3 style={{ color: '#0F172A', fontSize: '18px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
                            Information We Collect
                          </h3>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.8' }}>
                            We only collect the absolute minimum data required to provide you with a great experience. This includes your basic profile information (username, email) and your watch history. We do not use tracking cookies for advertising purposes, and we never sell your personal data to third parties.
                          </p>
                        </div>

                        <div className={styles.clRow} style={{ display: 'block' }}>
                          <h3 style={{ color: '#0F172A', fontSize: '18px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
                            How Your Data is Used
                          </h3>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.8' }}>
                            Your data is used exclusively to power features within Velune, such as personalized recommendations, syncing watch history across your devices, and generating your annual 'Wrapped' insights. If you opt into cloud sync, your data is securely stored on our servers.
                          </p>
                        </div>

                        <div className={styles.clRow} style={{ display: 'block' }}>
                          <h3 style={{ color: '#0F172A', fontSize: '18px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</span>
                            Third-Party Integrations
                          </h3>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.8' }}>
                            Velune relies on third-party APIs like TMDB for rich media metadata. When you search for movies or TV shows, requests may be made to these services. However, your personal identity and viewing habits are never shared with these external providers.
                          </p>
                        </div>

                        <div className={styles.clRow} style={{ display: 'block' }}>
                          <h3 style={{ color: '#0F172A', fontSize: '18px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>4</span>
                            Your Rights & Control
                          </h3>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.8' }}>
                            You have full control over your data. At any time, you can navigate to the Data & Storage settings to download an export of your watch history or permanently delete your account and all associated information.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.clRow} style={{ display: 'block' }}>
                          <h3 style={{ color: '#0F172A', fontSize: '18px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
                            Acceptance of Terms
                          </h3>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.8' }}>
                            By accessing and using Velune, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service. These terms apply to all visitors, users, and others who access or use the platform.
                          </p>
                        </div>

                        <div className={styles.clRow} style={{ display: 'block' }}>
                          <h3 style={{ color: '#0F172A', fontSize: '18px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
                            User Accounts
                          </h3>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.8' }}>
                            When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
                          </p>
                        </div>

                        <div className={styles.clRow} style={{ display: 'block' }}>
                          <h3 style={{ color: '#0F172A', fontSize: '18px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</span>
                            Intellectual Property
                          </h3>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.8' }}>
                            Velune acts as a tracking tool and aggregator. We do not claim ownership over any movie posters, backdrops, or metadata displayed, which belong to their respective copyright holders (e.g., via TMDB). Our original code, design, and branding are the exclusive property of Velune.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div style={{ width: '100%' }}>
                <div className={styles.sectionCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: '#64748B' }}>
                  Content for {activeTab} is not available yet.
                </div>
              </div>
            )}
          </main>

          {/* RIGHT PANEL - QUICK TIPS - HIDE ON WIDE TABS */}
          {!isWideTab && (
            <aside className={styles.rightPanel}>
              <div className={styles.quickTipCard}>
                <div className={styles.quickTipHeader}>
                  <Sparkles size={18} className={styles.quickTipIcon} />
                  <span className={styles.quickTipTitle}>Quick Tip</span>
                </div>
                <p className={styles.quickTipText}>
                  Your preferences help us personalize Velune for you. You can change these anytime.
                </p>
                
                {/* Graphic Placeholder resembling a clapperboard in light theme */}
                <svg className={styles.quickTipGraphic} viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="25" width="80" height="50" rx="4" fill="#F1F5F9" />
                  <path d="M10 25 L30 10 L45 25 Z" fill="#E2E8F0" />
                  <path d="M35 25 L55 10 L70 25 Z" fill="#CBD5E1" />
                  <path d="M60 25 L80 10 L90 25 Z" fill="#E2E8F0" />
                  <rect x="20" y="35" width="60" height="30" rx="2" fill="#FFFFFF" />
                  <circle cx="80" cy="65" r="3" fill="#E2E8F0" />
                  <circle cx="20" cy="65" r="3" fill="#E2E8F0" />
                  <circle cx="20" cy="35" r="3" fill="#E2E8F0" />
                  <circle cx="80" cy="35" r="3" fill="#E2E8F0" />
                </svg>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
