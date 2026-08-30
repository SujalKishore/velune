import React from "react";
import { notFound } from "next/navigation";
import { getUniverseById } from "@/data/universes";
import Navbar from "@/components/Navbar";
import UniverseHero from "@/components/Universe/UniverseHero";
import UniverseTimeline from "@/components/Universe/UniverseTimeline";
import UniverseProgress from "@/components/Universe/UniverseProgress";
import UniverseConnections from "@/components/Universe/UniverseConnections";
import styles from "@/components/Universe/Universe.module.css";
import { getUserId } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";

export default async function UniversePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const universe = getUniverseById(resolvedParams.id);
  
  if (!universe) {
    notFound();
  }

  const userId = await getUserId();
  const watchedIds = new Set<string>();

  if (userId) {
    try {
      const allItems = universe.sagas.flatMap(s => s.phases.flatMap(p => p.items));
      const tmdbIds = allItems.map(i => i.tmdbId);
      
      const watched = await prisma.watched.findMany({
        where: {
          userId: userId,
          tmdbId: { in: tmdbIds }
        },
        select: { tmdbId: true }
      });
      
      watched.forEach(w => watchedIds.add(w.tmdbId));
    } catch (e) {
      console.error("Failed to load watched status for universe", e);
    }
  }

  const allItems = universe.sagas.flatMap(s => s.phases.flatMap(p => p.items));
  const totalWatched = allItems.filter(i => watchedIds.has(i.tmdbId)).length;
  const progressPercent = (totalWatched / (allItems.length || 1)) * 100;

  return (
    <main className={styles.pageWrapper}>
      <Navbar />
      
      <UniverseHero universe={universe} progressPercent={progressPercent} />
      
      <UniverseTimeline universe={universe} watchedIds={watchedIds} />
      
      <UniverseProgress universe={universe} watchedIds={watchedIds} />
      
      <UniverseConnections universe={universe} />
      
    </main>
  );
}
