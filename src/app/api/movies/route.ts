import { getTrending, getNowPlaying, getTopRated, getPopularTV } from "@/lib/tmdb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [trending, nowPlaying, topRated, popularTV] = await Promise.all([
      getTrending(),
      getNowPlaying(),
      getTopRated(),
      getPopularTV(),
    ]);
    return NextResponse.json({ trending, nowPlaying, topRated, popularTV });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
