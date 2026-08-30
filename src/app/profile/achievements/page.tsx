import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAllAchievements } from "@/lib/achievements/data";
import { evaluateAchievements, calculateStats } from "@/lib/achievements/engine";
import { getWatchHistory } from "@/app/actions/history";
import { getFollowedPeople } from "@/app/actions/person";
import Navbar from "@/components/Navbar";
import AchievementsClient from "@/components/AchievementsClient";

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

export default async function AchievementsPage() {
  const userId = await getUserId();
  if (!userId) redirect("/");

  await evaluateAchievements();

  const rawUnlockedRows = await (prisma as any).userAchievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' }
  });

  const allAchievements = getAllAchievements();
  const validAchievementIds = new Set(allAchievements.map((a: any) => a.id));
  
  const unlockedRows = rawUnlockedRows.filter((u: any) => validAchievementIds.has(u.achievementId));

  const unlockedArray = unlockedRows.map((u: any) => [u.achievementId, u.unlockedAt]);
  const unlockedMap = new Map(unlockedRows.map((u: any) => [u.achievementId, u.unlockedAt]));

  // Calculate Scores
  let totalScore = 0;
  allAchievements.forEach(a => {
    if (unlockedMap.has(a.id)) totalScore += a.score;
  });

  const topPercent = totalScore > 100000 ? 1 : totalScore > 50000 ? 5 : totalScore > 10000 ? 12 : 30;

  // Recently Unlocked (Top 4)
  const recentlyUnlockedIds = unlockedRows.slice(0, 4).map((u: any) => u.achievementId);
  const recentlyUnlocked = recentlyUnlockedIds.map((id: string) => allAchievements.find(a => a.id === id)).filter(Boolean);

  // Group by category dynamically based on existing data
  const categories = Array.from(new Set(allAchievements.map(a => a.category)));
  
  const historyRes = await getWatchHistory();
  const [
    watchlist_count,
    favorites_count,
    episodes_watched,
    collections_created,
    collection_items
  ] = await Promise.all([
    (prisma as any).watchlist.count({ where: { userId } }),
    (prisma as any).favorite.count({ where: { userId } }),
    (prisma as any).watchedEpisode.count({ where: { userId } }),
    (prisma as any).collection.count({ where: { userId } }),
    (prisma as any).collectionItem.count({ where: { collection: { userId } } })
  ]);

  const stats = calculateStats(historyRes.history || [], {
    watchlist_count,
    favorites_count,
    episodes_watched,
    collections_created,
    collection_items
  });

  const categoryProgress = categories.map(cat => {
    const catAchs = allAchievements.filter(a => a.category === cat);
    if (catAchs.length === 0) return null;
    const unlockedCount = catAchs.filter(a => unlockedMap.has(a.id)).length;
    return { name: cat, unlocked: unlockedCount, total: catAchs.length, icon: catAchs[0].icon };
  }).filter(Boolean);

  const totalUnlocked = unlockedRows.length;

  const followedRes = await getFollowedPeople();
  const followedPeople = followedRes.success ? followedRes.people : [];

  return (
    <div style={{ backgroundColor: "#050B14", minHeight: "100vh" }}>
      <Navbar />
      <AchievementsClient 
         allAchievements={allAchievements}
         unlockedData={unlockedArray} 
         stats={stats} 
         totalScore={totalScore} 
         topPercent={topPercent}
         recentlyUnlocked={recentlyUnlocked}
         categoryProgress={categoryProgress}
         totalUnlocked={totalUnlocked}
         followedPeople={followedPeople}
         history={historyRes.history || []}
      />
    </div>
  );
}
