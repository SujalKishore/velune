import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.redirect(new URL("/cinematic_login_hero.png", request.url));
  }

  try {
    const res = await fetch(`https://api.tmdb.org/3/${type}/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`);
    if (res.ok) {
      const details = await res.json();
      if (details && details.poster_path) {
        // Optimistically update the database asynchronously (fire and forget)
        prisma.watched.updateMany({
          where: { tmdbId: id, mediaType: type, poster: null },
          data: { poster: details.poster_path }
        }).catch(() => {});
        prisma.watchlist.updateMany({
          where: { tmdbId: id, mediaType: type, poster: null },
          data: { poster: details.poster_path }
        }).catch(() => {});
        prisma.favorite.updateMany({
          where: { tmdbId: id, mediaType: type, poster: null },
          data: { poster: details.poster_path }
        }).catch(() => {});
        
        return NextResponse.redirect(`https://image.tmdb.org/t/p/w500${details.poster_path}`);
      }
    }
  } catch (error) {
    console.error("Failed to fetch poster", error);
  }

  return NextResponse.redirect(new URL("/cinematic_login_hero.png", request.url));
}
