"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_for_local_dev");

async function getUser() {
  const c = await cookies();
  const sessionCookie = c.get("session");
  if (!sessionCookie) return null;
  try {
    const { payload } = await jwtVerify(sessionCookie.value, secret);
    return payload;
  } catch (err) {
    return null;
  }
}

export async function updateUserProfile(data: { 
  name?: string; email?: string; bio?: string; avatarUrl?: string; bannerUrl?: string; bannerMode?: string;
  username?: string; location?: string; website?: string; twitter?: string; instagram?: string; pronouns?: string;
  isPrivate?: boolean; showActivity?: boolean; twoFactorEnabled?: boolean; contentSensitivity?: boolean;
  showWatchlist?: boolean; showFavorites?: boolean; showWatchHistory?: boolean; showRatings?: boolean;
  showTVProgress?: boolean; showAchievements?: boolean; showFollowedPeople?: boolean; showJoinDate?: boolean;
  showLocation?: boolean; showSocialLinks?: boolean;
}) {
  const user = await getUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl;
    if (data.bannerMode !== undefined) updateData.bannerMode = data.bannerMode;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.twitter !== undefined) updateData.twitter = data.twitter;
    if (data.instagram !== undefined) updateData.instagram = data.instagram;
    if (data.pronouns !== undefined) updateData.pronouns = data.pronouns;
    if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;
    if (data.showActivity !== undefined) updateData.showActivity = data.showActivity;
    if (data.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = data.twoFactorEnabled;
    if (data.contentSensitivity !== undefined) updateData.contentSensitivity = data.contentSensitivity;
    if (data.showWatchlist !== undefined) updateData.showWatchlist = data.showWatchlist;
    if (data.showFavorites !== undefined) updateData.showFavorites = data.showFavorites;
    if (data.showWatchHistory !== undefined) updateData.showWatchHistory = data.showWatchHistory;
    if (data.showRatings !== undefined) updateData.showRatings = data.showRatings;
    if (data.showTVProgress !== undefined) updateData.showTVProgress = data.showTVProgress;
    if (data.showAchievements !== undefined) updateData.showAchievements = data.showAchievements;
    if (data.showFollowedPeople !== undefined) updateData.showFollowedPeople = data.showFollowedPeople;
    if (data.showJoinDate !== undefined) updateData.showJoinDate = data.showJoinDate;
    if (data.showLocation !== undefined) updateData.showLocation = data.showLocation;
    if (data.showSocialLinks !== undefined) updateData.showSocialLinks = data.showSocialLinks;

    await prisma.user.update({
      where: { id: user.userId as string },
      data: updateData
    });
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function deactivateAccount() {
  const user = await getUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await prisma.user.update({
      where: { id: user.userId as string },
      data: { isDeactivated: true }
    });
    const c = await cookies();
    c.delete("session");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to deactivate account" };
  }
}

export async function deleteAccount() {
  const user = await getUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    await prisma.user.delete({
      where: { id: user.userId as string }
    });
    const c = await cookies();
    c.delete("session");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to delete account" };
  }
}

export async function exportAllUserData() {
  const user = await getUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const [watched, watchlist, favorites] = await Promise.all([
      prisma.watched.findMany({ where: { userId: user.userId as string } }),
      prisma.watchlist.findMany({ where: { userId: user.userId as string } }),
      prisma.favorite.findMany({ where: { userId: user.userId as string } }),
    ]);

    return {
      success: true,
      data: {
        watched,
        watchlist,
        favorites
      }
    };
  } catch (err) {
    console.error("Failed to export user data:", err);
    return { success: false, error: "Database error during export" };
  }
}

export async function searchUsers(query: string) {
  if (!query || query.trim().length < 2) return { success: true, users: [] };
  try {
    const users = await prisma.user.findMany({
      where: {
        isDeactivated: false,
        OR: [
          { name: { contains: query.trim() } },
          { username: { contains: query.trim() } }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        bio: true,
        isPrivate: true
      },
      take: 10
    });
    return { success: true, users };
  } catch (err) {
    console.error("Failed to search users:", err);
    return { success: false, error: "Database error during search" };
  }
}

export async function getPublicProfile(username: string) {
  const cleanUsername = username.startsWith("@") ? username.substring(1) : username;
  
  try {
    const userProfile = await prisma.user.findFirst({
      where: { 
        OR: [
          { username: cleanUsername },
          { id: cleanUsername }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        bannerMode: true,
        location: true,
        website: true,
        isPrivate: true,
        showActivity: true,
        isDeactivated: true,
        showWatchlist: true,
        showFavorites: true,
        showWatchHistory: true,
        showRatings: true,
        showTVProgress: true,
        showAchievements: true,
        showFollowedPeople: true,
        showJoinDate: true,
        showLocation: true,
        showSocialLinks: true,
      }
    });

    if (!userProfile || userProfile.isDeactivated) {
      return { success: false, error: "User not found" };
    }

    if (userProfile.isPrivate) {
      return { success: true, user: userProfile, favorites: [], collections: [], recentActivity: [] };
    }

    const [favorites, collections, recentActivity] = await Promise.all([
      prisma.favorite.findMany({ where: { userId: userProfile.id }, orderBy: { addedAt: 'desc' }, take: 10 }),
      prisma.collection.findMany({ where: { userId: userProfile.id, isPublic: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
      userProfile.showActivity 
        ? prisma.watched.findMany({ where: { userId: userProfile.id }, orderBy: { watchedAt: 'desc' }, take: 10 }) 
        : Promise.resolve([])
    ]);

    return {
      success: true,
      user: userProfile,
      favorites,
      collections,
      recentActivity
    };
  } catch (err) {
    console.error("Failed to fetch public profile:", err);
    return { success: false, error: "Database error during profile fetch" };
  }
}
