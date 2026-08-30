"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/app/actions/history";

export async function importTraktHistory() {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: "Not logged in" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { traktToken: true }
  });

  if (!user?.traktToken) {
    return { success: false, error: "Trakt account not linked" };
  }

  const clientId = process.env.TRAKT_CLIENT_ID;
  if (!clientId) {
    return { success: false, error: "Server missing Trakt configuration" };
  }

  try {
    // Fetch user history from Trakt. Use a high limit to get as much as possible in one go.
    const response = await fetch("https://api.trakt.tv/sync/history?limit=10000", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.traktToken}`,
        "trakt-api-version": "2",
        "trakt-api-key": clientId,
        "User-Agent": "Velune App"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Trakt import error:", errorText);
      return { success: false, error: "Failed to fetch data from Trakt" };
    }

    const historyItems = await response.json();
    let importedCount = 0;

    for (const item of historyItems) {
      const watchedAt = new Date(item.watched_at);

      if (item.type === "movie" && item.movie?.ids?.tmdb) {
        const tmdbIdStr = item.movie.ids.tmdb.toString();
        
        await prisma.watched.upsert({
          where: {
            userId_tmdbId_mediaType: {
              userId,
              tmdbId: tmdbIdStr,
              mediaType: "movie"
            }
          },
          update: {
            // Only update date if we are importing
            watchedAt: watchedAt
          },
          create: {
            userId,
            tmdbId: tmdbIdStr,
            mediaType: "movie",
            title: item.movie.title || "Unknown Movie",
            watchedAt: watchedAt,
            // Poster will be missing but the app fetches it on-the-fly or uses fallbacks
          }
        });
        importedCount++;
      } else if (item.type === "episode" && item.show?.ids?.tmdb && item.episode) {
        const showTmdbIdStr = item.show.ids.tmdb.toString();
        
        // Upsert the episode
        await prisma.watchedEpisode.upsert({
          where: {
            userId_tmdbId_seasonNumber_episodeNumber: {
              userId,
              tmdbId: showTmdbIdStr,
              seasonNumber: item.episode.season,
              episodeNumber: item.episode.number
            }
          },
          update: {
            watchedAt: watchedAt
          },
          create: {
            userId,
            tmdbId: showTmdbIdStr,
            seasonNumber: item.episode.season,
            episodeNumber: item.episode.number,
            watchedAt: watchedAt
          }
        });

        // Ensure the parent show is marked as watched in the main grid
        await prisma.watched.upsert({
          where: {
            userId_tmdbId_mediaType: {
              userId,
              tmdbId: showTmdbIdStr,
              mediaType: "tv"
            }
          },
          update: {},
          create: {
            userId,
            tmdbId: showTmdbIdStr,
            mediaType: "tv",
            title: item.show.title || "Unknown Show",
            watchedAt: watchedAt,
          }
        });
        importedCount++;
      }
    }

    return { success: true, count: importedCount };
  } catch (error) {
    console.error("Trakt history import failed:", error);
    return { success: false, error: "Internal server error during import" };
  }
}
