import { prisma } from "@/lib/prisma";
import { getWatchHistory } from "@/app/actions/history";
import { ACHIEVEMENTS } from "./data";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_for_local_dev"
);

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie.value, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export function calculateStats(history: any[], extraStats: Record<string, number> = {}) {
  const stats: Record<string, number> = {
    total_watches: history.length,
    tv_watches: history.filter(h => h.mediaType === 'tv').length,
    movie_watches: history.filter(h => h.mediaType === 'movie').length,
    reviews: 0,
    ten_stars: 0,
    one_stars: 0,
    night_watches: 0,
    morning_watches: 0,
    weekend_watches: 0,
    max_in_one_day: 0,
    ...extraStats
  };
  
  const dayCounts = new Map<string, number>();

  for (const h of history) {
    if (h.review && h.review.trim() !== '') stats.reviews++;
    if (h.rating === 10) stats.ten_stars++;
    if (h.rating === 1) stats.one_stars++;

    const d = new Date(h.watchedAt);
    const hour = d.getHours();
    const dayOfWeek = d.getDay();
    const dateStr = d.toISOString().split('T')[0];

    // Midnight to 4:59 AM
    if (hour >= 0 && hour < 5) stats.night_watches++;
    // 5:00 AM to 9:59 AM
    if (hour >= 5 && hour < 10) stats.morning_watches++;
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) stats.weekend_watches++;

    dayCounts.set(dateStr, (dayCounts.get(dateStr) || 0) + 1);
  }

  for (const count of Array.from(dayCounts.values())) {
    if (count > stats.max_in_one_day) stats.max_in_one_day = count;
  }

  return stats;
}

export async function evaluateAchievements() {
  const userId = await getUserId();
  if (!userId) return { newUnlocks: [] };

  const historyRes = await getWatchHistory();
  if (!historyRes.success || !historyRes.history) return { newUnlocks: [] };

  const history = historyRes.history;
  const [
    watchlist_count,
    favorites_count,
    episodes_watched,
    collections_created,
    collection_items,
    unlocked
  ] = await Promise.all([
    (prisma as any).watchlist.count({ where: { userId } }),
    (prisma as any).favorite.count({ where: { userId } }),
    (prisma as any).watchedEpisode.count({ where: { userId } }),
    (prisma as any).collection.count({ where: { userId } }),
    (prisma as any).collectionItem.count({ where: { collection: { userId } } }),
    (prisma as any).userAchievement.findMany({ where: { userId } })
  ]);
  
  const unlockedIds = new Set(unlocked.map((u: any) => u.achievementId));

  const stats = calculateStats(history, {
    watchlist_count,
    favorites_count,
    episodes_watched,
    collections_created,
    collection_items
  });
  
  // Calculate Director Journey progress
  const historyTmdbIds = new Set(history.map(h => h.tmdbId));
  const { getPersonDirectedMovies } = await import("@/app/actions/person");
  
  const [nolanMovies, tarantinoMovies, spielbergMovies] = await Promise.all([
    getPersonDirectedMovies("525"),
    getPersonDirectedMovies("138"),
    getPersonDirectedMovies("488"),
  ]);

  stats.dir_nolan = nolanMovies.filter((m: any) => historyTmdbIds.has(m.id.toString())).length;
  stats.dir_tarantino = tarantinoMovies.filter((m: any) => historyTmdbIds.has(m.id.toString())).length;
  stats.dir_spielberg = spielbergMovies.filter((m: any) => historyTmdbIds.has(m.id.toString())).length;

  // Collection checks
  const mcuIds = new Set([1726, 1724, 10138, 10195, 1771, 24428, 68721, 76338, 100402, 118340, 99861, 102899, 271110, 284052, 283995, 315635, 284053, 284054, 299536, 363088, 299537, 299534, 429617].map(String));
  const hpIds = new Set([671, 672, 673, 674, 675, 767, 12444, 12445].map(String));
  const batmanIds = new Set([272, 155, 49026].map(String));
  const ghibliIds = new Set([129, 128, 493, 168, 10515, 12477, 12666, 149870, 81, 11621].map(String));

  stats.col_mcu = history.filter(h => mcuIds.has(h.tmdbId)).length;
  stats.col_hp = history.filter(h => hpIds.has(h.tmdbId)).length;
  stats.col_dark_knight = history.filter(h => batmanIds.has(h.tmdbId)).length;
  stats.col_ghibli = history.filter(h => ghibliIds.has(h.tmdbId)).length;

  let currentTotalScore = 0;
  for (const u of unlocked) {
    const a = ACHIEVEMENTS.find(x => x.id === u.achievementId);
    if (a) currentTotalScore += a.score;
  }

  const newUnlocks: string[] = [];

  // Phase 1: Evaluate interaction stats
  for (const ach of ACHIEVEMENTS) {
    if (!unlockedIds.has(ach.id) && ach.conditionType !== 'total_score') {
      const currentVal = stats[ach.conditionType] || 0;
      if (currentVal >= ach.target) {
        newUnlocks.push(ach.id);
        currentTotalScore += ach.score;
      }
    }
  }

  // Phase 2: Evaluate point-based milestones
  for (const ach of ACHIEVEMENTS) {
    if (!unlockedIds.has(ach.id) && ach.conditionType === 'total_score') {
      if (currentTotalScore >= ach.target) {
        newUnlocks.push(ach.id);
      }
    }
  }

  if (newUnlocks.length > 0) {
    await (prisma as any).userAchievement.createMany({
      data: newUnlocks.map(id => ({ userId, achievementId: id }))
    });
  }

  const unlockedDetails = newUnlocks.map(id => ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean);
  return { newUnlocks: unlockedDetails };
}
