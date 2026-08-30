"use client";

import { useState, useRef, useEffect } from "react";
import styles from "@/app/profile/achievements/page.module.css";
import * as Icons from "lucide-react";
import Link from "next/link";
import DirectorJourneyCard from "./profile/DirectorJourneyCard";

const CustomSelect = ({ value, options, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const selectedOption = options.find((o: any) => o.value === value) || options[0];

  return (
    <div className={styles.customSelect} ref={dropdownRef}>
      <div className={styles.customSelectTrigger} onClick={() => setIsOpen(!isOpen)}>
        {selectedOption.label}
        <Icons.ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', opacity: 0.6 }} />
      </div>
      {isOpen && (
        <div className={styles.customSelectMenu}>
          {options.map((o: any) => (
            <div 
              key={o.value} 
              className={`${styles.customSelectOption} ${value === o.value ? styles.customSelectOptionActive : ''}`}
              onClick={() => { onChange(o.value); setIsOpen(false); }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AchievementsClient({
  allAchievements,
  unlockedData, // Array of [string, string] (ISO date strings)
  stats,
  totalScore,
  topPercent,
  recentlyUnlocked,
  categoryProgress,
  totalUnlocked,
  followedPeople,
  history,
  targetUsername
}: any) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const unlockedMap = new Map(unlockedData.map(([id, d]: any) => [id, new Date(d)]));
  const totalAch = allAchievements.length;

  const getDynamicProgress = (achId: string, max: number, conditionType: string) => {
    if (unlockedMap.has(achId)) return max;
    const currentVal = conditionType === 'total_score' ? totalScore : (stats[conditionType] || 0);
    return Math.min(currentVal, max);
  };

  const milestones = [
    { value: 0, label: "Beginner" },
    { value: totalAch, label: "Legend" },
  ];

  let fillPercent = 0;
  if (totalUnlocked <= 0) {
    fillPercent = 0;
  } else if (totalUnlocked >= totalAch) {
    fillPercent = 100;
  } else {
    fillPercent = (totalUnlocked / totalAch) * 100;
  }

  const filteredAchievements = allAchievements.filter((ach: any) => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!ach.name.toLowerCase().includes(q) && !ach.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    // Category
    if (categoryFilter !== "all" && ach.category !== categoryFilter) {
      return false;
    }
    // Status
    if (statusFilter !== "all") {
      const isUnlocked = unlockedMap.has(ach.id);
      if (statusFilter === "unlocked" && !isUnlocked) return false;
      if (statusFilter === "locked" && isUnlocked) return false;
    }
    return true;
  });

  // Unique categories for dropdown
  const uniqueCategories = Array.from(new Set(allAchievements.map((a:any) => a.category)));

  return (
    <div className={styles.container}>
      <div style={{marginBottom: 24}}>
        <Link href={targetUsername ? `/profile/${targetUsername}` : "/profile"} style={{textDecoration: 'none', color: 'rgba(255,255,255,0.6)', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 700}}>
          <Icons.ArrowLeft size={16} /> Back to Profile
        </Link>
      </div>
      
      {/* HEADER */}
      <div className={styles.headerWrapper}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Achievements</h1>
          <p className={styles.subtitle}>Celebrate your journey. Every movie makes you a better cinephile.</p>
          <div className={styles.tabs}>
            <div 
              className={`${styles.tab} ${activeTab === "Overview" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("Overview")}
            >
              Overview
            </div>
            <div 
              className={`${styles.tab} ${activeTab === "All Achievements" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("All Achievements")}
            >
              All Achievements
            </div>
            <div 
              className={`${styles.tab} ${activeTab === "Director Journeys" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("Director Journeys")}
            >
              Director Journeys
            </div>
          </div>
        </div>
        
        <div className={styles.scoreCard}>
          <div className={styles.scoreInfo}>
            <div className={styles.scoreIcon}>
              <Icons.Trophy size={24} color="#00E5C5" />
            </div>
            <div className={styles.scoreText}>
              <span className={styles.scoreLabel}>YOUR ACHIEVEMENT SCORE</span>
              <span className={styles.scoreValue}>{totalScore.toLocaleString()}</span>
              <span className={styles.scoreRank}>
                Top <span className={styles.scoreRankHighlight}>{topPercent}%</span> of Velune users
              </span>
            </div>
          </div>
          
          <div className={styles.donutWrapper}>
            <svg width="80" height="80" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle cx="18" cy="18" r="16" fill="transparent" stroke="#00E5C5" strokeWidth="3"
                strokeDasharray={`${(totalUnlocked / totalAch) * 100} ${100 - (totalUnlocked / totalAch) * 100}`} strokeDashoffset="0" />
            </svg>
            <div className={styles.donutCenter}>
              <div className={styles.donutValue}>{totalUnlocked}</div>
              <div className={styles.donutTotal}>/ {totalAch}</div>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "Overview" && (
        <>
          {/* PROGRESS OVERVIEW */}
          <div className={styles.progressOverview}>
            <div className={styles.progressLeft}>
              <div className={styles.progressLabel}>PROGRESS OVERVIEW</div>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 8}}>
                <span className={styles.progressCount}>{totalUnlocked}</span>
                <span className={styles.progressTotal}>/ {totalAch}</span>
              </div>
              <div className={styles.progressText}>Achievements unlocked</div>
              
              <div className={styles.timeline}>
                <div className={styles.timelineTrack} />
                <div className={styles.timelineFill} style={{ width: `${fillPercent}%` }} />
                <div className={styles.timelineMilestones}>
                  {milestones.map((m, i) => {
                    const isActive = totalUnlocked >= m.value;
                    const leftPos = (m.value / totalAch) * 100;
                    return (
                      <div key={i} className={styles.milestone} style={{ left: `${leftPos}%` }}>
                        <div className={`${styles.milestoneMarker} ${isActive ? styles.milestoneMarkerActive : ''}`} />
                        <div className={styles.milestoneValue}>{m.value}</div>
                        <div className={styles.milestoneName}>{m.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className={styles.progressRight}>
              <div className={styles.glowBg} />
              <img src="/trophy_star.png" alt="Star Trophy" className={styles.trophyImage} />
            </div>
          </div>

          {/* RECENTLY UNLOCKED */}
          {recentlyUnlocked.length > 0 && (
            <>
              <h3 className={styles.sectionTitle}>RECENTLY UNLOCKED</h3>
              <div className={styles.recentGrid}>
                {recentlyUnlocked.map((ach: any) => {
                  const Icon = (Icons as any)[ach.icon] || Icons.Trophy;
                  return (
                    <div key={ach.id} className={styles.recentCard}>
                      <div className={styles.newTag}>New</div>
                      <div className={styles.hexagon}>
                        <div className={styles.hexagonInner}>
                          {ach.icon.endsWith('.png') ? (
                            <img src={`/${ach.icon}`} alt="" style={{width: 32, height: 32, objectFit: 'contain'}} />
                          ) : (
                            <Icon size={32} color={ach.color} />
                          )}
                        </div>
                      </div>
                      <h4 className={styles.recentTitle}>{ach.name}</h4>
                      <p className={styles.recentDesc}>{ach.description}</p>
                      <div className={styles.recentDate}>
                        <Icons.Star size={10} color={ach.color}/> Unlocked on {(unlockedMap.get(ach.id) as Date)?.toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ACHIEVEMENT CATEGORIES */}
          <h3 className={styles.sectionTitle}>ACHIEVEMENT CATEGORIES</h3>
          <div className={styles.categoriesGrid}>
            {categoryProgress.map((cat: any, i: number) => {
              const Icon = (Icons as any)[cat.icon] || Icons.Folder;
              const pct = (cat.unlocked / cat.total) * 100;
              return (
                <div key={i} className={styles.categoryCard} onClick={() => { setActiveTab("All Achievements"); setCategoryFilter(cat.name); }} style={{cursor: 'pointer'}}>
                  <div className={styles.catBg} style={{backgroundImage: `url(https://image.tmdb.org/t/p/w500/${['qLmcSOH7BfUUSgXzG2e1c9eN2qZ.jpg','sAtoMqDVhNDQBc3QJL3RF6hlhGq.jpg','vL5LR6WdxWPjUUegMVouv5jI0M4.jpg','9Xw0I5RV2ZjmCB0Fxt01tAheXj3.jpg','5YZbUmjbMa3ClvSW1Wj3D6XGolb.jpg'][i%5]})`}} />
                  <Icon className={styles.catIcon} size={28} color="#fff" />
                  <h4 className={styles.catTitle}>{cat.name}</h4>
                  <div className={styles.catProgressText}>{cat.unlocked} / {cat.total}</div>
                  <div className={styles.catProgressBar}>
                    <div className={styles.catProgressFill} style={{ width: `${pct}%`, background: pct === 100 ? '#00E5C5' : '#14B8A6' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "All Achievements" && (
        <>
          {/* ALL ACHIEVEMENTS LIST */}
          <div className={styles.listControls}>
            <h3 className={styles.sectionTitle} style={{marginBottom: 0, alignSelf: 'flex-end'}}>ALL ACHIEVEMENTS</h3>
            <div style={{display: 'flex', gap: 16}}>
              <div style={{position: 'relative'}}>
                <Icons.Search size={14} color="rgba(255,255,255,0.5)" style={{position: 'absolute', left: 12, top: 12}}/>
                <input 
                  type="text" 
                  placeholder="Search achievements..." 
                  className={styles.searchInput} 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className={styles.dropdowns}>
                <CustomSelect 
                  value={categoryFilter} 
                  onChange={(v: string) => setCategoryFilter(v)}
                  options={[
                    { value: "all", label: "All Categories" },
                    ...uniqueCategories.map((c: any) => ({ value: c, label: c }))
                  ]} 
                />
                <CustomSelect 
                  value={statusFilter} 
                  onChange={(v: string) => setStatusFilter(v)}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "unlocked", label: "Unlocked" },
                    { value: "locked", label: "Locked" }
                  ]} 
                />
              </div>
            </div>
          </div>

          <div>
            {filteredAchievements.map((ach: any) => {
              const isUnlocked = unlockedMap.has(ach.id);
              const Icon = (Icons as any)[ach.icon] || Icons.Trophy;
              const progress = getDynamicProgress(ach.id, ach.maxProgress, ach.conditionType);
              const date = unlockedMap.get(ach.id);

              return (
                <div key={ach.id} className={styles.listRow}>
                  <div className={`${styles.listHex} ${!isUnlocked ? styles.listHexLocked : ''}`}>
                    <div className={`${styles.listHexInner} ${!isUnlocked ? styles.listHexInnerLocked : ''}`}>
                      {ach.icon.endsWith('.png') ? (
                        <img src={`/${ach.icon}`} alt="" style={{width: 24, height: 24, objectFit: 'contain', filter: !isUnlocked ? 'grayscale(100%) opacity(30%)' : 'none'}} />
                      ) : (
                        <Icon size={24} color={isUnlocked ? ach.color : "rgba(255,255,255,0.2)"} />
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.listInfo}>
                    <h4 className={styles.listTitle} style={{color: isUnlocked ? 'white' : 'rgba(255,255,255,0.6)'}}>
                      {ach.name} <span style={{fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginLeft: 8}}>{ach.score} pts</span>
                    </h4>
                    <p className={styles.listDesc}>{ach.description}</p>
                  </div>

                  <div className={styles.listStatus}>
                    {isUnlocked ? (
                      <>
                        <div className={styles.listUnlockedDate}>
                          Unlocked<br/>{(date as Date)?.toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})}
                        </div>
                        <div className={styles.checkCircle}>
                          <Icons.Check size={14} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.listProgressText}>{progress} / {ach.maxProgress}</div>
                        <div className={styles.listProgressBar}>
                          <div className={styles.catProgressFill} style={{ width: `${(progress/ach.maxProgress)*100}%`, background: 'rgba(255,255,255,0.3)' }} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredAchievements.length === 0 && (
              <div style={{textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '40px 0'}}>
                No achievements match your filters.
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "Director Journeys" && (
        <>
          <div className={styles.listControls} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className={styles.sectionTitle} style={{marginBottom: 0}}>DIRECTOR JOURNEYS</h3>
            {!targetUsername && followedPeople.length > 0 && (
              <Link href="/trending" style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: '20px',
                color: 'white',
                fontFamily: 'Space Grotesk',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{color: '#00E5C5'}}>+</span> Follow New Director
              </Link>
            )}
          </div>
          
          {followedPeople.length === 0 ? (
            <div style={{textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)'}}>
              <h4 style={{color: 'white', fontSize: 20, marginBottom: 8, fontFamily: 'Sora'}}>Start Your Journey</h4>
              <p style={{color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 14}}>Follow a famous director to start tracking your progress through their filmography.</p>
              
              <div style={{display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 600, margin: '0 auto'}}>
                {[
                  { id: 525, name: "Christopher Nolan" },
                  { id: 138, name: "Quentin Tarantino" },
                  { id: 1032, name: "Martin Scorsese" },
                  { id: 488, name: "Steven Spielberg" },
                  { id: 11248, name: "David Fincher" },
                  { id: 11674, name: "Denis Villeneuve" },
                  { id: 1, name: "George Lucas" },
                  { id: 5655, name: "Wes Anderson" }
                ].map(d => (
                  <Link key={d.id} href={`/person/${d.id}`} style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px 20px',
                    borderRadius: '30px',
                    textDecoration: 'none',
                    color: 'white',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 600,
                    fontSize: 14,
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s'
                  }}>
                    {d.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {followedPeople.map((person: any) => (
                <DirectorJourneyCard key={person.id} person={person} history={history} />
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}
