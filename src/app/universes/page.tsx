"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { UNIVERSES } from "@/data/universes";
import Link from "next/link";
import { Play } from "lucide-react";

export default function UniversesDirectoryPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'white', paddingBottom: '100px' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-1px' }}>Universes</h1>
        <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', marginBottom: '48px', maxWidth: '600px' }}>
          Explore interactive franchise hubs. Track your progress across sprawling sagas, timelines, and connected worlds.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
          {UNIVERSES.map(universe => (
            <Link key={universe.id} href={`/universes/${universe.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ 
                position: 'relative', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                aspectRatio: '16/9',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(233,69,96,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
              }}
              >
                <img src={universe.backdrop} alt={universe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,46,0.9) 0%, rgba(26,26,46,0.2) 100%)' }} />
                
                <div style={{ position: 'absolute', inset: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {universe.movieCount + universe.showCount} Titles
                    </div>
                  </div>
                  
                  <div>
                    <img src={universe.logo} alt={universe.name} style={{ maxWidth: '180px', maxHeight: '60px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))', marginBottom: '16px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-accent)', fontWeight: 600 }}><Play size={14} fill="currentColor" /> Enter Hub</span>
                      <span>•</span>
                      <span>{universe.totalRuntimeHours} hrs</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
