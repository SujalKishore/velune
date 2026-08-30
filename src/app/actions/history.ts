"use server";
// Refresh types

import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { evaluateAchievements } from "@/lib/achievements/engine";

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

async function isIncognito(): Promise<boolean> {
  const cookieStore = await cookies();
  const settingsCookie = cookieStore.get("velune_settings");
  if (!settingsCookie) return false;
  try {
    const settings = JSON.parse(decodeURIComponent(settingsCookie.value));
    return settings.incognitoMode === true;
  } catch {
    return false;
  }
}

async function getTraktSyncSetting(): Promise<boolean> {
  const cookieStore = await cookies();
  const settingsCookie = cookieStore.get("velune_settings");
  if (!settingsCookie) return false;
  try {
    const settings = JSON.parse(decodeURIComponent(settingsCookie.value));
    return settings.traktSync === true;
  } catch {
    return false;
  }
}

async function getLetterboxdSyncSetting(): Promise<boolean> {
  const cookieStore = await cookies();
  const settingsCookie = cookieStore.get("velune_settings");
  if (!settingsCookie) return false;
  try {
    const settings = JSON.parse(decodeURIComponent(settingsCookie.value));
    return settings.letterboxdSync === true;
  } catch {
    return false;
  }
}

async function getMalSyncSetting(): Promise<boolean> {
  const cookieStore = await cookies();
  const settingsCookie = cookieStore.get("velune_settings");
  if (!settingsCookie) return false;
  try {
    const settings = JSON.parse(decodeURIComponent(settingsCookie.value));
    return settings.myAnimeListSync === true;
  } catch {
    return false;
  }
}

async function getSimklSyncSetting(): Promise<boolean> {
  const cookieStore = await cookies();
  const settingsCookie = cookieStore.get("velune_settings");
  if (!settingsCookie) return false;
  try {
    const settings = JSON.parse(decodeURIComponent(settingsCookie.value));
    return settings.simklSync === true;
  } catch {
    return false;
  }
}

export async function getSessionUserId() {
  return await getUserId();
}

async function resolveUserId(targetUsername?: string) {
  if (targetUsername) {
    const cleanUsername = targetUsername.startsWith("@") ? targetUsername.substring(1) : targetUsername;
    const user = await prisma.user.findFirst({ where: { 
      OR: [
        { username: cleanUsername },
        { id: cleanUsername }
      ]
    } });
    if (!user || (user.isPrivate && user.id !== await getUserId())) {
      return null;
    }
    return user.id;
  }
  return await getUserId();
}

export async function getUserInteractions(tmdbId: string, mediaType: string) {
  const userId = await getUserId();
  if (!userId) return { watched: false, watchlist: false, favorite: false, rating: null, review: null };

  const watched = await prisma.watched.findUnique({
    where: { userId_tmdbId_mediaType: { userId, tmdbId, mediaType } }
  });

  const watchlist = await prisma.watchlist.findUnique({
    where: { userId_tmdbId_mediaType: { userId, tmdbId, mediaType } }
  });

  const favorite = await prisma.favorite.findUnique({
    where: { userId_tmdbId_mediaType: { userId, tmdbId, mediaType } }
  });

  return {
    watched: !!watched,
    watchlist: !!watchlist,
    favorite: !!favorite,
    rating: watched?.rating ?? null,
    review: watched?.review ?? null,
    reviewDate: watched?.watchedAt ? watched.watchedAt.toISOString() : null,
  };
}

export async function saveLog(
  tmdbId: string,
  mediaType: string,
  title: string,
  poster: string | null,
  isWatched: boolean,
  rating: number | null,
  review: string | null,
  watchedAtOverride?: string | Date | null
) {
  const userId = await getUserId();
  if (!userId) return { error: "Not logged in" };

  if (await isIncognito()) return { success: true, message: "Incognito mode active" };

  if (!isWatched) {
    // If unmarked as watched, delete the log entirely
    try {
      await prisma.watched.delete({
        where: { userId_tmdbId_mediaType: { userId, tmdbId, mediaType } }
      });
    } catch {} // ignore if not exists
    return { success: true };
  }

  // Fetch runtime
  let runtime: number | null = null;
  if (isWatched) {
    try {
      const { getDetails } = await import("@/lib/tmdb");
      const details = await getDetails(mediaType as "movie" | "tv", tmdbId);
      if (details) {
        if (mediaType === "movie" && details.runtime) {
          runtime = details.runtime;
        } else if (mediaType === "tv" && details.episode_run_time && details.episode_run_time.length > 0) {
          runtime = details.episode_run_time[0];
        } else if (mediaType === "tv") {
          runtime = 45;
        } else {
          runtime = 120;
        }
      }
    } catch (e) {
      console.error("Failed to fetch runtime for saveLog", e);
    }
  }

  // Upsert the watched log
  const watchedAt = watchedAtOverride ? new Date(watchedAtOverride) : new Date();
  const log = await prisma.watched.upsert({
    where: { userId_tmdbId_mediaType: { userId, tmdbId, mediaType } },
    update: { watchedAt, rating, review, ...(runtime !== null && { runtime }) },
    create: {
      userId,
      tmdbId,
      mediaType,
      title,
      poster,
      rating,
      review,
      runtime,
      watchedAt
    }
  });

  // Sync to Trakt
  if (isWatched && await getTraktSyncSetting()) {
    const userDb = await prisma.user.findUnique({ where: { id: userId }, select: { traktToken: true } });
    if (userDb?.traktToken) {
      const tmdbPayload = mediaType === "movie" 
        ? { movies: [{ ids: { tmdb: parseInt(tmdbId) }, watched_at: watchedAt.toISOString() }] }
        : { shows: [{ ids: { tmdb: parseInt(tmdbId) }, watched_at: watchedAt.toISOString() }] };
      
      try {
        await fetch("https://api.trakt.tv/sync/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userDb.traktToken}`,
            "trakt-api-version": "2",
            "trakt-api-key": process.env.TRAKT_CLIENT_ID || ""
          },
          body: JSON.stringify(tmdbPayload)
        });
      } catch (e) {
        console.error("Failed to sync with Trakt", e);
      }
    }
  }

  // Sync to Letterboxd
  if (isWatched && await getLetterboxdSyncSetting()) {
    const userDb = await prisma.user.findUnique({ where: { id: userId }, select: { letterboxdToken: true } });
    if (userDb?.letterboxdToken) {
      // Letterboxd API assumes log entries for movies (not episodes usually, but for this mock we'll send it)
      const letterboxdPayload = {
        tmdbId: parseInt(tmdbId),
        title,
        rating,
        review,
        watchedDate: watchedAt.toISOString().split('T')[0] // YYYY-MM-DD format commonly used
      };
      
      try {
        await fetch("https://api.letterboxd.com/api/v0/log-entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userDb.letterboxdToken}`,
          },
          body: JSON.stringify(letterboxdPayload)
        });
      } catch (e) {
        console.error("Failed to sync with Letterboxd", e);
      }
    }
  }

  // Sync to MyAnimeList
  if (isWatched && mediaType === "tv" && await getMalSyncSetting()) {
    const userDb = await prisma.user.findUnique({ where: { id: userId }, select: { malToken: true } });
    if (userDb?.malToken) {
      try {
        // We'd need to map TMDB ID to MAL ID here, but for demonstration we'll just mock the request
        const malId = tmdbId; 
        await fetch(`https://api.myanimelist.net/v2/anime/${malId}/my_list_status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${userDb.malToken}`,
          },
          body: new URLSearchParams({
            status: "completed",
            score: rating?.toString() || "0",
            num_watched_episodes: "1" // This would be dynamic in reality
          })
        });
      } catch (e) {
        console.error("Failed to sync with MAL", e);
      }
    }
  }

  // Sync to Simkl
  if (isWatched && await getSimklSyncSetting()) {
    const userDb = await prisma.user.findUnique({ where: { id: userId }, select: { simklToken: true } });
    if (userDb?.simklToken) {
      try {
        const payload = mediaType === "movie" 
          ? { movies: [{ ids: { tmdb: tmdbId } }] }
          : { shows: [{ ids: { tmdb: tmdbId } }] };
          
        await fetch(`https://api.simkl.com/sync/add-to-history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userDb.simklToken}`,
            "simkl-api-key": process.env.SIMKL_CLIENT_ID || ""
          },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.error("Failed to sync with Simkl", e);
      }
    }
  }

  // Run achievement engine in the background
  evaluateAchievements().catch(console.error);

  // If marked as watched, automatically remove from watchlist if it's there
  try {
    await prisma.watchlist.delete({
      where: { userId_tmdbId_mediaType: { userId, tmdbId, mediaType } }
    });
  } catch {} // ignore if not exists

  revalidatePath('/profile');
  return { success: true };
}

export async function toggleWatchlist(tmdbId: string, mediaType: string, title: string, poster: string | null) {
  const userId = await getUserId();
  if (!userId) return { error: "Not logged in" };

  const existing = await prisma.watchlist.findUnique({
    where: { userId_tmdbId_mediaType: { userId, tmdbId, mediaType } }
  });

  if (existing) {
    await prisma.watchlist.delete({ where: { id: existing.id } });
    return { success: true, watchlist: false };
  } else {
    await prisma.watchlist.create({
      data: { userId, tmdbId, mediaType, title, poster }
    });
    return { success: true, watchlist: true };
  }
}

export async function getWatchHistory(targetUsername?: string) {
  const userId = await resolveUserId(targetUsername);
  if (!userId) return { error: "Not logged in or private" };
  const history = await prisma.watched.findMany({ where: { userId }, orderBy: { watchedAt: "desc" } });

  const missingPosters = history.filter(h => !h.poster).slice(0, 20);
  if (missingPosters.length > 0) {
    try {
      const { getDetails } = await import("@/lib/tmdb");
      await Promise.allSettled(missingPosters.map(async (item) => {
        const details = await getDetails(item.mediaType as "movie" | "tv", item.tmdbId);
        if (details && details.poster_path) {
          item.poster = details.poster_path;
          await prisma.watched.update({
            where: { id: item.id },
            data: { poster: details.poster_path }
          });
        }
      }));
    } catch (e) {}
  }

  return { success: true, history };
}

export async function getWatchedTmdbIds() {
  const userId = await getUserId();
  if (!userId) return { error: "Not logged in" };
  const watched = await prisma.watched.findMany({ 
    where: { userId }, 
    select: { tmdbId: true } 
  });
  const tvProgress = await prisma.watchedEpisode.findMany({
    where: { userId },
    select: { tmdbId: true }
  });
  const watchedIds = new Set([
    ...watched.map(w => w.tmdbId),
    ...tvProgress.map(p => p.tmdbId)
  ]);
  return { success: true, ids: Array.from(watchedIds) };
}

export async function getWatchlist(targetUsername?: string) {
  const userId = await resolveUserId(targetUsername);
  if (!userId) return { error: "Not logged in or private" };
  const watchlist = await prisma.watchlist.findMany({ where: { userId }, orderBy: { addedAt: "desc" } });

  const missingPosters = watchlist.filter(w => !w.poster).slice(0, 20);
  if (missingPosters.length > 0) {
    try {
      const { getDetails } = await import("@/lib/tmdb");
      await Promise.allSettled(missingPosters.map(async (item) => {
        const details = await getDetails(item.mediaType as "movie" | "tv", item.tmdbId);
        if (details && details.poster_path) {
          item.poster = details.poster_path;
          await prisma.watchlist.update({
            where: { id: item.id },
            data: { poster: details.poster_path }
          });
        }
      }));
    } catch (e) {}
  }

  return { success: true, watchlist };
}

export async function toggleFavorite(tmdbId: string, mediaType: string, title: string, poster: string | null) {
  const userId = await getUserId();
  if (!userId) return { error: "Not logged in" };

  const existing = await prisma.favorite.findUnique({
    where: { userId_tmdbId_mediaType: { userId, tmdbId, mediaType } }
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { success: true, favorite: false };
  } else {
    await prisma.favorite.create({
      data: { userId, tmdbId, mediaType, title, poster }
    });
    return { success: true, favorite: true };
  }
}

export async function getCollectionFavoriteStats(collectionId: string) {
  const userId = await getUserId();
  
  const count = await prisma.favorite.count({
    where: { tmdbId: collectionId, mediaType: "collection" }
  });

  let isFavorited = false;
  if (userId) {
    const existing = await prisma.favorite.findUnique({
      where: { userId_tmdbId_mediaType: { userId, tmdbId: collectionId, mediaType: "collection" } }
    });
    isFavorited = !!existing;
  }

  return { success: true, count, isFavorited };
}

export async function cloneCollection(name: string, description: string, items: any[]) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not logged in" };
  
  try {
    const collection = await prisma.collection.create({
      data: {
        userId,
        name,
        description,
        items: {
          create: items.map(item => ({
            tmdbId: item.tmdbId.toString(),
            mediaType: item.mediaType || "movie",
            title: item.title,
            poster: item.poster
          }))
        }
      }
    });
    return { success: true, collection };
  } catch (error) {
    console.error("Clone collection error:", error);
    return { success: false, error: "Failed to clone collection" };
  }
}

// ================= COLLECTIONS =================

export async function createCollection(name: string, description?: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not logged in" };

  try {
    const collection = await prisma.collection.create({
      data: {
        userId,
        name,
        description
      }
    });
    return { success: true, collection };
  } catch (err: any) {
    console.error("Create collection error:", err);
    return { success: false, error: "Failed to create collection: " + err.message };
  }
}

export async function getUserCollections(targetUsername?: string) {
  const userId = await resolveUserId(targetUsername);
  if (!userId) return { success: false, error: "Not logged in or private" };

  try {
    const collections = await prisma.collection.findMany({
      where: { userId, ...(targetUsername ? { isPublic: true } : {}) },
      include: {
        _count: {
          select: { items: true }
        },
        items: {
          take: 4,
          orderBy: { addedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, collections };
  } catch (err) {
    return { success: false, error: "Failed to fetch collections" };
  }
}

export async function getCollectionDetails(collectionId: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not logged in" };

  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId, userId },
      include: {
        items: {
          orderBy: { addedAt: 'desc' }
        }
      }
    });
    return { success: true, collection };
  } catch (err) {
    return { success: false, error: "Failed to fetch collection details" };
  }
}

export async function addToCollection(collectionId: string, tmdbId: string, mediaType: string, title: string, poster: string | null) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not logged in" };

  try {
    // Verify collection belongs to user
    const collection = await prisma.collection.findUnique({ where: { id: collectionId, userId } });
    if (!collection) return { success: false, error: "Collection not found" };

    const item = await prisma.collectionItem.create({
      data: { collectionId, tmdbId, mediaType, title, poster }
    });
    return { success: true, item };
  } catch (err) {
    return { success: false, error: "Item may already exist in this collection" };
  }
}

export async function removeFromCollection(collectionId: string, tmdbId: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not logged in" };

  try {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId, userId } });
    if (!collection) return { success: false, error: "Collection not found" };

    // We have to delete the first item that matches collectionId and tmdbId since there's a unique constraint on collectionId+tmdbId+mediaType
    await prisma.collectionItem.deleteMany({
      where: { collectionId, tmdbId }
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to fetch watchlist" };
  }
}

export async function getUserAchievements(targetUsername?: string) {
  const userId = await resolveUserId(targetUsername);
  if (!userId) return { success: false, error: "Not logged in or private" };
  try {
    const achievements = await (prisma as any).userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' }
    });
    return { success: true, achievements };
  } catch (err) {
    return { success: false, error: "Failed to fetch achievements" };
  }
}

export async function getFavorites(targetUsername?: string) {
  const userId = await resolveUserId(targetUsername);
  if (!userId) return { error: "Not logged in or private" };
  const favorites = await prisma.favorite.findMany({ where: { userId }, orderBy: { addedAt: "desc" } });

  const missingPosters = favorites.filter(f => !f.poster).slice(0, 20);
  if (missingPosters.length > 0) {
    try {
      const { getDetails } = await import("@/lib/tmdb");
      await Promise.allSettled(missingPosters.map(async (item) => {
        const details = await getDetails(item.mediaType as "movie" | "tv", item.tmdbId);
        if (details && details.poster_path) {
          item.poster = details.poster_path;
          await prisma.favorite.update({
            where: { id: item.id },
            data: { poster: details.poster_path }
          });
        }
      }));
    } catch (e) {}
  }

  return { success: true, favorites };
}

// Trigger hot reload

export async function toggleWatchedEpisode(tmdbId: string, seasonNumber: number, episodeNumber: number, watchedAtOverride?: string | Date | null) {
  const userId = await getUserId();
  if (!userId) return { error: "Not logged in" };

  if (await isIncognito()) return { success: true, watched: true, message: "Incognito mode active" };

  const existing = await prisma.watchedEpisode.findUnique({
    where: { userId_tmdbId_seasonNumber_episodeNumber: { userId, tmdbId, seasonNumber, episodeNumber } }
  });

  if (existing) {
    if (watchedAtOverride) {
      const watchedAt = new Date(watchedAtOverride);
      await prisma.watchedEpisode.update({
        where: { id: existing.id },
        data: { watchedAt }
      });
      return { success: true, watched: true };
    }
    await prisma.watchedEpisode.delete({ where: { id: existing.id } });
    return { success: true, watched: false };
  } else {
    const watchedAt = watchedAtOverride ? new Date(watchedAtOverride) : new Date();
    
    // Fetch runtime
    let runtime: number | null = null;
    try {
      const { getTVEpisodeDetails, getDetails } = await import("@/lib/tmdb");
      const epDetails = await getTVEpisodeDetails(tmdbId, seasonNumber, episodeNumber);
      if (epDetails && epDetails.runtime) {
        runtime = epDetails.runtime;
      } else {
        const showDetails = await getDetails("tv", tmdbId);
        if (showDetails && showDetails.episode_run_time && showDetails.episode_run_time.length > 0) {
          runtime = showDetails.episode_run_time[0];
        } else {
          runtime = 45;
        }
      }
    } catch (e) {
      console.error("Failed to fetch runtime for episode", e);
    }

    await prisma.watchedEpisode.create({
      data: { userId, tmdbId, seasonNumber, episodeNumber, watchedAt, runtime }
    });
    return { success: true, watched: true };
  }
}

export async function markPreviousEpisodesWatched(tmdbId: string, currentSeason: number, currentEpisode: number) {
  const userId = await getUserId();
  if (!userId) return { error: "Not logged in" };
  
  if (await isIncognito()) return { success: true, message: "Incognito mode active" };
  
  const { getDetails } = await import("@/lib/tmdb");
  const showDetails = await getDetails("tv", tmdbId);
  if (!showDetails || !showDetails.seasons) return { error: "Could not fetch show details" };
  
  const episodesToMark: { seasonNumber: number, episodeNumber: number }[] = [];
  
  for (const season of showDetails.seasons) {
    if (season.season_number === 0) continue; // Skip specials
    if (season.season_number > currentSeason) continue;
    
    const isCurrentSeason = season.season_number === currentSeason;
    const maxEp = isCurrentSeason ? currentEpisode - 1 : season.episode_count;
    
    for (let e = 1; e <= maxEp; e++) {
      episodesToMark.push({ seasonNumber: season.season_number, episodeNumber: e });
    }
  }
  
  if (episodesToMark.length === 0) return { success: true };
  
  const existingEpisodes = await prisma.watchedEpisode.findMany({
    where: {
      userId,
      tmdbId,
      OR: episodesToMark.map(ep => ({ seasonNumber: ep.seasonNumber, episodeNumber: ep.episodeNumber }))
    },
    select: { seasonNumber: true, episodeNumber: true }
  });

  const existingSet = new Set(existingEpisodes.map(ep => `${ep.seasonNumber}-${ep.episodeNumber}`));
  const newEpisodes = episodesToMark.filter(ep => !existingSet.has(`${ep.seasonNumber}-${ep.episodeNumber}`));

  if (newEpisodes.length === 0) return { success: true };

  // Fetch show average runtime for fallback or use individual episode runtime
  let showAvgRuntime = 45;
  try {
    if (showDetails.episode_run_time && showDetails.episode_run_time.length > 0) {
      showAvgRuntime = showDetails.episode_run_time[0];
    }
  } catch (e) {}

  await prisma.$transaction(
    newEpisodes.map(ep => 
      prisma.watchedEpisode.create({
        data: {
          userId,
          tmdbId,
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
          watchedAt: new Date(),
          runtime: showAvgRuntime
        }
      })
    )
  );
  
  return { success: true };
}

export async function getWatchedEpisodes(tmdbId: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Not logged in", episodes: [] };
  const episodes = await prisma.watchedEpisode.findMany({
    where: { userId, tmdbId }
  });
  return { success: true, episodes };
}

export async function getUserTVProgress(targetUsername?: string) {
  const userId = await resolveUserId(targetUsername);
  if (!userId) return { error: "Not logged in or private" };
  
  const episodes = await prisma.watchedEpisode.findMany({ where: { userId } });
  
  const watchedShows = await prisma.watched.findMany({ 
    where: { userId, mediaType: 'tv' },
    select: { tmdbId: true, title: true, poster: true } 
  });
  const showMetaMap = new Map();
  watchedShows.forEach((ws: any) => showMetaMap.set(ws.tmdbId, { title: ws.title, poster: ws.poster }));
  
  // Group by tmdbId
  const tvShowsMap = new Map<string, any[]>();
  episodes.forEach((ep: any) => {
    const list = tvShowsMap.get(ep.tmdbId) || [];
    list.push(ep);
    tvShowsMap.set(ep.tmdbId, list);
  });
  
  const progressList: any[] = [];
  let totalEpisodesWatched = episodes.length;
  let totalPossibleEpisodes = 0;
  let completedShows = 0;
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let episodesThisMonth = 0;

  // For chart
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dailyData: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dailyData[d.toLocaleDateString("en-US", { month: "short", day: "numeric" })] = 0;
  }
  
  episodes.forEach((ep: any) => {
    const epDate = new Date(ep.watchedAt);
    if (epDate >= startOfMonth) episodesThisMonth++;
    if (epDate >= thirtyDaysAgo) {
      const key = epDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyData[key] !== undefined) dailyData[key]++;
    }
  });

  try {
    const { getBaseDetails, getTVEpisodeDetails } = await import("@/lib/tmdb");
    
    const showsEntries = Array.from(tvShowsMap.entries());
    
    // Sort shows by most recent episode to prioritize TMDB fetching for active shows
    showsEntries.sort((a, b) => {
      const aMax = Math.max(...a[1].map((e: any) => new Date(e.watchedAt).getTime()));
      const bMax = Math.max(...b[1].map((e: any) => new Date(e.watchedAt).getTime()));
      return bMax - aMax;
    });

    // We fetch TMDB details in batches to avoid rate limits (502 errors)
    // To prevent server timeouts on large imports, limit full details to top 20 active shows
    const showsToFetch = showsEntries.slice(0, 20);
    const showsToSkip = showsEntries.slice(20);
    const showsData = [];
    
    for (let i = 0; i < showsToFetch.length; i += 5) {
      const chunk = showsToFetch.slice(i, i + 5);
      const chunkResults = await Promise.all(
        chunk.map(async ([tmdbId, showEps]) => {
          try {
            const showDetails = await getBaseDetails("tv", tmdbId);
            if (!showDetails) return null;
            
            // Find most recent episode logically by season/episode number
            // instead of just watchedAt, so we know their "max" progress.
            let maxS = 0;
            let maxE = 0;
            let mostRecentEpRecord = showEps[0];
            
            showEps.forEach((e: any) => {
              if (e.seasonNumber > maxS || (e.seasonNumber === maxS && e.episodeNumber > maxE)) {
                maxS = e.seasonNumber;
                maxE = e.episodeNumber;
                mostRecentEpRecord = e;
              }
            });
            
            const totalEp = showDetails.number_of_episodes || 1;
            totalPossibleEpisodes += totalEp;
            if (showEps.length >= totalEp) completedShows++;

          // Fetch Most Recent and Next Episode basic info
          let mostRecentTitle = `Episode ${maxE}`;
          let nextTitle = "Completed";
          let nextS = maxS;
          let nextE = maxE + 1;
          let isCompleted = showEps.length >= totalEp;
          
          let mostRecentImage = null;
          let nextImage = null;
          
          // Try to get titles
          try {
            const recentEpData = await getTVEpisodeDetails(tmdbId, maxS, maxE);
            if (recentEpData) {
              if (recentEpData.name) mostRecentTitle = recentEpData.name;
              if (recentEpData.still_path) mostRecentImage = recentEpData.still_path;
            }
          } catch (e) {}

          if (!isCompleted) {
            try {
              // Try same season next episode
              let nextEpData = await getTVEpisodeDetails(tmdbId, maxS, maxE + 1);
              if (nextEpData) {
                if (nextEpData.name) nextTitle = nextEpData.name;
                if (nextEpData.still_path) nextImage = nextEpData.still_path;
              } else {
                // Try next season episode 1
                nextEpData = await getTVEpisodeDetails(tmdbId, maxS + 1, 1);
                if (nextEpData) {
                  nextS = maxS + 1;
                  nextE = 1;
                  if (nextEpData.name) nextTitle = nextEpData.name;
                  if (nextEpData.still_path) nextImage = nextEpData.still_path;
                }
              }
            } catch (e) {
              // Usually means season doesn't exist
              nextTitle = `Episode ${maxE + 1}`;
            }
          }

          return {
            tmdbId,
            title: ("name" in showDetails ? showDetails.name : showDetails.title) || "Unknown Show",
            poster: showDetails.poster_path,
            watchedCount: showEps.length,
            totalEpisodes: totalEp,
            isCompleted,
            mostRecent: {
              season: maxS,
              episode: maxE,
              title: mostRecentTitle,
              date: new Date(mostRecentEpRecord.watchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              timeAgo: getRelativeTime(new Date(mostRecentEpRecord.watchedAt)),
              timestamp: new Date(mostRecentEpRecord.watchedAt).getTime()
            },
            nextEpisode: isCompleted ? null : {
              season: nextS,
              episode: nextE,
              title: nextTitle
            },
            bgImage: isCompleted ? showDetails.backdrop_path : (nextImage || mostRecentImage)
          };
        } catch (e) {
          console.error("Failed to fetch show details for", tmdbId);
          return null;
        }
      })
    );
    showsData.push(...chunkResults);
    if (i + 5 < showsToFetch.length) await new Promise(r => setTimeout(r, 100));
  }

  // Fallback for skipped shows to avoid timeouts
  // We fetch only the base details to get the correct totalEpisodes and backdrop.
  for (let i = 0; i < showsToSkip.length; i += 10) {
    const chunk = showsToSkip.slice(i, i + 10);
    const chunkResults = await Promise.all(
      chunk.map(async ([tmdbId, showEps]) => {
        let maxS = 0;
        let maxE = 0;
        let mostRecentEpRecord = showEps[0];
        showEps.forEach((e: any) => {
          if (e.seasonNumber > maxS || (e.seasonNumber === maxS && e.episodeNumber > maxE)) {
            maxS = e.seasonNumber;
            maxE = e.episodeNumber;
            mostRecentEpRecord = e;
          }
        });
        const meta = showMetaMap.get(tmdbId);
        
        let totalEp = showEps.length;
        let showBanner = null;
        try {
          const { getBaseDetails } = await import("@/lib/tmdb");
          const showDetails = await getBaseDetails("tv", tmdbId);
          if (showDetails && showDetails.number_of_episodes) {
            totalEp = showDetails.number_of_episodes;
          }
          if (showDetails && showDetails.backdrop_path) {
            showBanner = showDetails.backdrop_path;
          }
        } catch(e) {}
        
        const isCompleted = showEps.length >= totalEp;

        return {
          tmdbId,
          title: meta?.title || "Unknown Show",
          poster: meta?.poster || null,
          watchedCount: showEps.length,
          totalEpisodes: totalEp,
          isCompleted,
          mostRecent: {
            season: maxS,
            episode: maxE,
            title: `Episode ${maxE}`,
            date: new Date(mostRecentEpRecord.watchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            timeAgo: getRelativeTime(new Date(mostRecentEpRecord.watchedAt)),
            timestamp: new Date(mostRecentEpRecord.watchedAt).getTime()
          },
          nextEpisode: isCompleted ? null : {
            season: maxS,
            episode: maxE + 1,
            title: `Episode ${maxE + 1}`
          },
          bgImage: showBanner || null
        };
      })
    );
    showsData.push(...chunkResults);
    totalPossibleEpisodes += chunkResults.reduce((sum, r) => sum + r.totalEpisodes, 0);
  }

  showsData.forEach(d => { if (d) progressList.push(d); });
    
  } catch (err) {
    console.error("Import error", err);
  }

  // Sort by most recently updated
  progressList.sort((a, b) => b.watchedCount - a.watchedCount);

  // Watch time calculation (estimate 45m per episode)
  const watchTimeMinsThisMonth = episodesThisMonth * 45;
  const watchTimeStr = `${watchTimeMinsThisMonth}m`;

  const overallProgressPct = totalPossibleEpisodes > 0 ? Math.round((totalEpisodesWatched / totalPossibleEpisodes) * 100) : 0;

  const chartData = Object.keys(dailyData).map(k => ({ date: k, count: dailyData[k] }));

  return { 
    success: true, 
    progress: progressList,
    stats: {
      overallProgress: overallProgressPct,
      tvShowsWatching: progressList.length - completedShows,
      episodesWatched: totalEpisodesWatched,
      watchTimeThisMonth: watchTimeStr,
      showsCompleted: completedShows,
      episodesThisMonth,
      chartData
    }
  };
}

function getRelativeTime(d: Date) {
  const diff = Math.floor((new Date().getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return `1d ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export async function getCollectionById(id: string) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true }
      },
      items: {
        orderBy: { addedAt: 'asc' }
      },
      _count: {
        select: { items: true }
      }
    }
  });
  return collection;
}

export async function getCollectionInteractions(tmdbIds: string[]) {
  const userId = await getUserId();
  if (!userId || tmdbIds.length === 0) return { watchedIds: [], watchlistIds: [] };

  const watched = await prisma.watched.findMany({
    where: { userId, tmdbId: { in: tmdbIds } },
    select: { tmdbId: true }
  });

  const watchlist = await prisma.watchlist.findMany({
    where: { userId, tmdbId: { in: tmdbIds } },
    select: { tmdbId: true }
  });

  return {
    watchedIds: watched.map(w => w.tmdbId),
    watchlistIds: watchlist.map(w => w.tmdbId)
  };
}

export async function updateCollection(id: string, name: string, description: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not logged in" };

  try {
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection || collection.userId !== userId) {
      return { success: false, error: "Unauthorized or not found" };
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: { name, description }
    });

    return { success: true, collection: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCollection(id: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not logged in" };

  try {
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection || collection.userId !== userId) {
      return { success: false, error: "Unauthorized or not found" };
    }

    await prisma.collection.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
