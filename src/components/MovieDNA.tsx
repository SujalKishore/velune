"use client";
import React, { useEffect, useState } from 'react';
import styles from '../app/profile/page.module.css';
import { getBaseDetails } from '@/lib/tmdb';

interface MovieDNAProps {
  history: any[];
}

export default function MovieDNA({ history }: MovieDNAProps) {
  const [mounted, setMounted] = useState(false);
  const [genres, setGenres] = useState<{ name: string; percentage: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    if (history && history.length > 0) {
        const fetchStats = async () => {
          setLoading(true);
          // Take top 20 recent items to compute DNA efficiently
          const recent = history.slice(0, 20);
          const genreCounts: Record<string, number> = {};
          let totalTags = 0;
          
          // Process in chunks of 5 to avoid TMDB rate limits (502 errors)
          for (let i = 0; i < recent.length; i += 5) {
            const chunk = recent.slice(i, i + 5);
            const promises = chunk.map(h => getBaseDetails(h.mediaType as any, h.tmdbId).catch(() => null));
            const details = await Promise.all(promises);
            
            details.forEach(d => {
              if (d && d.genres) {
                d.genres.forEach(g => {
                  genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
                  totalTags++;
                });
              }
            });
            
            // Short delay to respect API limits
            if (i + 5 < recent.length) {
              await new Promise(r => setTimeout(r, 100));
            }
          }
        
        if (totalTags > 0) {
          const sorted = Object.entries(genreCounts)
            .map(([name, count]) => ({ name, count, percentage: Math.round((count / totalTags) * 100) }))
            .sort((a, b) => b.percentage - a.percentage);
            
          setGenres(sorted);
        }
        setLoading(false);
      };
      
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [history]);

  if (!mounted) return null;

  const colors = ["var(--primary-accent)", "#E94560", "#3B82F6", "#A78BFA", "#FBBF24", "#111827", "#F97316", "#10B981"];
  
  let currentPercentage = 0;
  const conicStops = genres.map((genre, i) => {
    const start = currentPercentage;
    currentPercentage += genre.percentage;
    return `${colors[i % colors.length]} ${start}% ${currentPercentage}%`;
  });
  
  if (currentPercentage < 100) {
    conicStops.push(`#F3F4F6 ${currentPercentage}% 100%`);
  }
  
  const background = genres.length > 0 ? `conic-gradient(${conicStops.join(", ")})` : '#F3F4F6';

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '24px',
      padding: '32px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '500px',
      fontFamily: 'Manrope, sans-serif'
    }}>
      <h4 style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '12px',
        fontWeight: 800,
        color: '#111827',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        marginBottom: '32px'
      }}>
        GENRE BREAKDOWN
      </h4>

      {loading ? (
        <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: '14px' }}>
          Analyzing your Cinema DNA...
        </div>
      ) : genres.length === 0 ? (
        <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: '14px' }}>
          Log some movies to see your DNA!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
          
          {/* Donut Chart */}
          <div style={{
            position: 'relative',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <div style={{
              width: '124px',
              height: '124px',
              background: '#FFFFFF',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', color: '#111827', fontWeight: 800, lineHeight: '1.1' }}>
                {history.length}
              </span>
              <span style={{ fontSize: '13px', color: '#4B5563', fontWeight: 600 }}>
                Titles
              </span>
            </div>
          </div>

          {/* Legend */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            width: '100%'
          }}>
            {genres.map((genre, i) => (
              <div 
                key={genre.name} 
                title={`${genre.count} ${genre.count === 1 ? 'title' : 'titles'}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'default' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors[i % colors.length], flexShrink: 0 }} />
                  <span style={{ color: '#111827', fontSize: '14px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {genre.name}
                  </span>
                </div>
                <span style={{ color: '#4B5563', fontSize: '14px', fontWeight: 600 }}>
                  {genre.percentage}%
                </span>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
