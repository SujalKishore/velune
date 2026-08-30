import { prisma } from "../src/lib/prisma";

// This should ideally match the key in your .env.local
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "YOUR_TMDB_API_KEY"; 

async function fetchDetails(mediaType: string, tmdbId: string) {
  try {
    const res = await fetch(`https://api.tmdb.org/3/${mediaType}/${tmdbId}?api_key=${API_KEY}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log("Starting backfill for missing posters...");
  
  // Find all watched records without a poster
  const items = await prisma.watched.findMany({
    where: { poster: null },
    select: { id: true, tmdbId: true, mediaType: true, title: true }
  });
  
  console.log(`Found ${items.length} items missing posters. Starting TMDB fetch...`);
  
  let count = 0;
  for (const item of items) {
    const data = await fetchDetails(item.mediaType, item.tmdbId);
    if (data) {
      const poster = data.poster_path || null;
      const title = data.title || data.name || item.title;
      
      await prisma.watched.update({
        where: { id: item.id },
        data: { poster, title }
      });
      console.log(`Updated [${count+1}/${items.length}] ${title}`);
    } else {
      console.log(`Skipped [${count+1}/${items.length}] ${item.tmdbId} (TMDB fetch failed)`);
    }
    
    count++;
    // Delay to respect rate limit (approx 20 req/sec)
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log("Done backfilling posters.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
