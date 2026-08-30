import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { getAllAchievements } from "@/lib/achievements/data";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_for_local_dev");

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("session");

  if (!sessionCookie) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, secret);
    
    // Fetch fresh user data from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      include: { achievements: true }
    });

    if (!dbUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Don't send password
    const { password, achievements, ...safeUser } = dbUser;

    const allAchievements = getAllAchievements();
    const validAchievementIds = new Set(allAchievements.map((a: any) => a.id));
    
    const unlockedRows = achievements ? achievements.filter((u: any) => validAchievementIds.has(u.achievementId)) : [];
    const unlockedMap = new Map(unlockedRows.map((u: any) => [u.achievementId, u.unlockedAt]));

    let totalScore = 0;
    allAchievements.forEach((a: any) => {
      if (unlockedMap.has(a.id)) totalScore += a.score;
    });

    const topPercent = totalScore > 100000 ? 1 : totalScore > 50000 ? 5 : totalScore > 10000 ? 12 : 30;

    return NextResponse.json({ user: safeUser, stats: { totalScore, topPercent } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
