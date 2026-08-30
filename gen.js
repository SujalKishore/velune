const fs = require('fs');

const trackers = [
  { id: 'total_watches', name: 'Cinephile', desc: 'Total items logged.', icon: 'Film', category: 'Milestones', targets: [1, 10, 50, 100, 250] },
  { id: 'tv_watches', name: 'Couch Potato', desc: 'TV shows logged.', icon: 'Tv', category: 'Milestones', targets: [1, 5, 20, 50, 100] },
  { id: 'movie_watches', name: 'Silver Screen', desc: 'Movies logged.', icon: 'Film', category: 'Milestones', targets: [1, 10, 50, 100, 250] },
  { id: 'reviews', name: 'The Critic', desc: 'Written reviews.', icon: 'PenTool', category: 'Ratings & Reviews', targets: [1, 5, 20, 50, 100] },
  { id: 'ten_stars', name: 'Masterpiece Hunter', desc: '10/10 ratings given.', icon: 'Heart', category: 'Ratings & Reviews', targets: [1, 5, 20, 50, 100] },
  { id: 'one_stars', name: 'Tough Crowd', desc: '1/10 ratings given.', icon: 'ThumbsDown', category: 'Ratings & Reviews', targets: [1, 5, 10, 25, 50] },
  { id: 'night_watches', name: 'Night Owl', desc: 'Items logged between Midnight and 4 AM.', icon: 'Moon', category: 'Activity', targets: [1, 5, 15, 30, 50] },
  { id: 'morning_watches', name: 'Early Bird', desc: 'Items logged between 5 AM and 9 AM.', icon: 'Sun', category: 'Activity', targets: [1, 5, 15, 30, 50] },
  { id: 'weekend_watches', name: 'Weekend Warrior', desc: 'Items logged on weekends.', icon: 'Calendar', category: 'Activity', targets: [1, 10, 25, 50, 100] },
  { id: 'max_in_one_day', name: 'Binge Watcher', desc: 'Items logged on the exact same day.', icon: 'Zap', category: 'Activity', targets: [3, 5, 7, 10, 15] },
  { id: 'watchlist_count', name: 'The Planner', desc: 'Items added to watchlist.', icon: 'List', category: 'Collections & Lists', targets: [1, 10, 50, 100, 250] },
  { id: 'favorites_count', name: 'Curator', desc: 'Items marked as favorite.', icon: 'Star', category: 'Collections & Lists', targets: [1, 5, 10, 25, 50] },
  { id: 'episodes_watched', name: 'Serial Binger', desc: 'Individual TV episodes watched.', icon: 'MonitorPlay', category: 'Milestones', targets: [10, 50, 100, 250, 500] },
  { id: 'collections_created', name: 'The Archivist', desc: 'Custom collections created.', icon: 'Folder', category: 'Collections & Lists', targets: [1, 3, 5, 10, 20] },
  { id: 'collection_items', name: 'Librarian', desc: 'Items added to collections.', icon: 'Library', category: 'Collections & Lists', targets: [10, 50, 100, 200, 500] }
];

const romans = ["I", "II", "III", "IV", "V"];

const achievements = [];
let idCounter = 1;

// 1. Generate 75 Interaction Achievements
for (let i = 0; i < trackers.length; i++) {
  const t = trackers[i];
  for (let j = 0; j < 5; j++) {
    const target = t.targets[j];
    
    // Scores scale exponentially per tier
    const scores = [10, 50, 150, 500, 1500];
    const achScore = scores[j];
    
    achievements.push({
      id: `ach_${idCounter}`,
      name: `${t.name} ${romans[j]}`,
      description: `Reach ${target} ${t.desc.toLowerCase()}`,
      icon: t.icon,
      category: t.category,
      color: `hsl(${(i * 24) % 360}, 80%, 60%)`,
      score: achScore,
      maxProgress: target,
      conditionType: t.id,
      target: target
    });
    idCounter++;
  }
}

// 2. Generate 5 Legendary Milestones
for (let j = 1; j <= 5; j++) {
  const target = 500 * j;
  achievements.push({
      id: `ach_${idCounter}`,
      name: `Cinema Legend ${romans[j-1]}`,
      description: `Reach ${target} total watches.`,
      icon: "Award",
      category: "Cinema Legend",
      color: `hsl(50, 100%, 50%)`,
      score: 5000,
      maxProgress: target,
      conditionType: 'total_watches',
      target: target
  });
  idCounter++;
}

// 3. Generate 10 Point-Based Milestones
const pointRomans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
for (let j = 1; j <= 10; j++) {
  const target = j * 2000;
  achievements.push({
      id: `ach_${idCounter}`,
      name: `Point Hoarder ${pointRomans[j-1]}`,
      description: `Reach a total achievement score of ${target}.`,
      icon: "Crown",
      category: "Cinema Legend",
      color: `hsl(300, 100%, 70%)`,
      score: 1000,
      maxProgress: target,
      conditionType: 'total_score',
      target: target
  });
  idCounter++;
}

const dataFileContent = `
export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  color: string;
  score: number;
  maxProgress: number;
  conditionType: string;
  target: number;
};

export const ACHIEVEMENTS: Achievement[] = ${JSON.stringify(achievements, null, 2)};

export function getAllAchievements(): Achievement[] {
  return ACHIEVEMENTS;
}

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}
`;

fs.writeFileSync('./src/lib/achievements/data.ts', dataFileContent);

console.log(`Generated ${achievements.length} achievements!`);
