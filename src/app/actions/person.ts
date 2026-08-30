"use server";

import { prisma } from "@/lib/prisma";
import { getUserId } from "@/app/actions/auth";
import { getPublicProfile } from "@/app/actions/user";
import { revalidatePath } from "next/cache";

async function resolveUserId(targetUsername?: string) {
  if (targetUsername) {
    const cleanUsername = targetUsername.startsWith("@") ? targetUsername.substring(1) : targetUsername;
    const res = await getPublicProfile(cleanUsername);
    if (res.success && res.user) {
      return res.user.id;
    }
    return null;
  }
  return await getUserId();
}

export async function toggleFollowPerson(tmdbId: string, name: string, profilePath: string | null, job: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not logged in" };

  try {
    const existing = await (prisma as any).followedPerson.findUnique({
      where: { userId_tmdbId: { userId, tmdbId } }
    });

    if (existing) {
      await (prisma as any).followedPerson.delete({
        where: { id: existing.id }
      });
      revalidatePath(`/person/${tmdbId}`);
      revalidatePath('/profile/achievements');
      return { success: true, followed: false };
    } else {
      await (prisma as any).followedPerson.create({
        data: {
          userId,
          tmdbId,
          name,
          profilePath,
          job
        }
      });
      revalidatePath(`/person/${tmdbId}`);
      revalidatePath('/profile/achievements');
      return { success: true, followed: true };
    }
  } catch (err: any) {
    console.error("Failed to toggle follow person:", err);
    return { success: false, error: "Database error" };
  }
}

export async function getFollowedPeople(targetUsername?: string) {
  const userId = await resolveUserId(targetUsername);
  if (!userId) return { success: false, error: "Not logged in", people: [] };

  try {
    let people = await (prisma as any).followedPerson.findMany({
      where: { userId },
      orderBy: { followedAt: "desc" }
    });

    if (people.length === 0) {
      const defaultDirectors = [
        { tmdbId: '525', name: 'Christopher Nolan', profilePath: '/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg', job: 'Director' },
        { tmdbId: '138', name: 'Quentin Tarantino', profilePath: '/1gjcpAa99FAOWGnrUvHEXXsRs7o.jpg', job: 'Director' },
        { tmdbId: '488', name: 'Steven Spielberg', profilePath: '/tZxcg19YQ3e8fJ0pOs7hjlnmmr6.jpg', job: 'Director' },
      ];
      
      for (const d of defaultDirectors) {
        // use upsert or ignore if exists (though we know it's length 0)
        await (prisma as any).followedPerson.create({
          data: { ...d, userId }
        });
      }
      
      people = await (prisma as any).followedPerson.findMany({
        where: { userId },
        orderBy: { followedAt: "desc" }
      });
    }

    return { success: true, people };
  } catch (err: any) {
    console.error("Failed to fetch followed people:", err);
    return { success: false, error: "Database error", people: [] };
  }
}

export async function isFollowingPerson(tmdbId: string) {
  const userId = await getUserId();
  if (!userId) return false;

  const existing = await (prisma as any).followedPerson.findUnique({
    where: { userId_tmdbId: { userId, tmdbId } }
  });

  return !!existing;
}

export async function getPersonDirectedMovies(tmdbId: string) {
  const { getPersonDetails } = await import("@/lib/tmdb");
  const details = await getPersonDetails(tmdbId);
  if (!details) return [];

  const crew = details.combined_credits?.crew || [];
  // Filter for Director job, and movie type
  const directed = crew.filter((c: any) => c.job === "Director" && c.media_type === "movie");

  // Sort by release date descending
  directed.sort((a: any, b: any) => {
    const da = new Date(a.release_date || 0).getTime();
    const db = new Date(b.release_date || 0).getTime();
    return db - da;
  });

  // Deduplicate
  const uniqueIds = new Set();
  const result = [];
  for (const m of directed) {
    if (!uniqueIds.has(m.id)) {
      uniqueIds.add(m.id);
      result.push(m);
    }
  }

  return result;
}
