"use client";

import React from "react";
import styles from "./Universe.module.css";
import { Universe } from "@/data/universes";
import { useRouter } from "next/navigation";

export default function UniverseConnections({ universe }: { universe: Universe }) {
  const router = useRouter();

  if (!universe.connections || universe.connections.length === 0) return null;

  return (
    <div className={styles.contentContainer} style={{ marginTop: '60px', paddingBottom: '60px' }}>
      <h2 className={styles.sectionTitle} style={{ marginBottom: '24px' }}>Related Universes</h2>
      
      <div className={styles.networkContainer}>
        {universe.connections.map(conn => (
          <div 
            key={conn.id} 
            className={styles.networkItem}
            onClick={() => router.push(`/universes/${conn.id}`)}
          >
            <img src={conn.poster} alt={conn.name} className={styles.networkImage} />
            <div className={styles.networkName}>{conn.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
