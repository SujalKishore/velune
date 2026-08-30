"use server";

import { prisma } from "@/lib/prisma";
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

export async function getCustomPosters() {
  const userId = await getUserId();
  if (!userId) return {};

  const posters = await prisma.customPoster.findMany({
    where: { userId }
  });

  const posterMap: Record<string, string> = {};
  posters.forEach(p => {
    posterMap[`${p.mediaType}-${p.tmdbId}`] = p.posterUrl;
  });

  return posterMap;
}

export async function setCustomPoster(tmdbId: string, mediaType: string, posterUrl: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not logged in" };

  try {
    await prisma.customPoster.upsert({
      where: { userId_tmdbId_mediaType: { userId, tmdbId, mediaType } },
      update: { posterUrl },
      create: { userId, tmdbId, mediaType, posterUrl }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to set custom poster:", error);
    return { success: false, error: "Failed to save poster to database" };
  }
}

export async function removeCustomPoster(tmdbId: string, mediaType: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not logged in" };

  try {
    await prisma.customPoster.delete({
      where: { userId_tmdbId_mediaType: { userId, tmdbId, mediaType } }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to remove custom poster:", error);
    return { success: false, error: "Failed to remove poster from database" };
  }
}
