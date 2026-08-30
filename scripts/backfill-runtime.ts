import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

if (!API_KEY) {
  console.error("TMDB API Key missing. Please set NEXT_PUBLIC_TMDB_API_KEY.");
  process.exit(1);
}

async function fetchRuntime(mediaType: 'movie' | 'tv', tmdbId: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.tmdb.org/3/${mediaType}/${tmdbId}?api_key=${API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (mediaType === 'movie' && data.runtime) {
      return data.runtime;
    } else if (mediaType === 'tv' && data.episode_run_time && data.episode_run_time.length > 0) {
      return data.episode_run_time[0];
    }
    return mediaType === 'tv' ? 45 : 120;
  } catch (error) {
    console.error(`Error fetching runtime for ${mediaType} ${tmdbId}`, error);
    return mediaType === 'tv' ? 45 : 120;
  }
}

async function fetchEpisodeRuntime(tmdbId: string, season: number, episode: number): Promise<number | null> {
  try {
    const res = await fetch(`https://api.tmdb.org/3/tv/${tmdbId}/season/${season}/episode/${episode}?api_key=${API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.runtime) {
      return data.runtime;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching episode runtime for ${tmdbId} S${season}E${episode}`, error);
    return null;
  }
}

async function main() {
  console.log("Starting runtime backfill...");

  const watchedItems = await prisma.watched.findMany({
    where: { runtime: null }
  });

  console.log(`Found ${watchedItems.length} Watched items to backfill.`);

  for (const item of watchedItems) {
    const runtime = await fetchRuntime(item.mediaType as 'movie' | 'tv', item.tmdbId);
    if (runtime) {
      await prisma.watched.update({
        where: { id: item.id },
        data: { runtime }
      });
      console.log(`Updated Watched item ${item.title} (ID: ${item.tmdbId}) with runtime: ${runtime}m`);
    } else {
      console.log(`Could not find runtime for ${item.title} (ID: ${item.tmdbId})`);
    }
  }

  const episodes = await prisma.watchedEpisode.findMany({
    where: { runtime: null }
  });

  console.log(`Found ${episodes.length} WatchedEpisode items to backfill.`);

  for (const ep of episodes) {
    let runtime = await fetchEpisodeRuntime(ep.tmdbId, ep.seasonNumber, ep.episodeNumber);
    if (!runtime) {
      runtime = await fetchRuntime('tv', ep.tmdbId);
    }
    
    if (runtime) {
      await prisma.watchedEpisode.update({
        where: { id: ep.id },
        data: { runtime }
      });
      console.log(`Updated WatchedEpisode (Show ID: ${ep.tmdbId}, S${ep.seasonNumber}E${ep.episodeNumber}) with runtime: ${runtime}m`);
    } else {
      console.log(`Could not find runtime for WatchedEpisode (Show ID: ${ep.tmdbId})`);
    }
  }

  console.log("Backfill complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
