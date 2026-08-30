import React, { useState } from 'react';
import { Check, Eye, Clock, Calendar } from 'lucide-react';
import styles from './MatchCard.module.css';

export interface MatchData {
  id: string;
  sport: string;
  tournament: string;
  status: string;
  time: string;
  team1: { name: string; shortName: string; logo: string; score: string | number | null };
  team2: { name: string; shortName: string; logo: string; score: string | number | null };
  events?: { time: string; type: string; team: string; player: string }[];
}

interface MatchCardProps {
  match: MatchData;
  isWatched: boolean;
  onToggleWatched: (matchId: string) => void;
}

export default function MatchCard({ match, isWatched, onToggleWatched }: MatchCardProps) {
  const [loading, setLoading] = useState(false);
  const isLive = match.status === 'LIVE' || match.status.includes('Q');

  const handleToggle = async () => {
    setLoading(true);
    await onToggleWatched(match.id);
    setLoading(false);
  };

  return (
    <div className={`${styles.card} ${isLive ? styles.liveCard : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.tournament}>
          {match.sport} • {match.tournament}
        </div>
        <div className={`${styles.statusBadge} ${isLive ? styles.liveBadge : styles.normalBadge}`}>
          {isLive && <span className={styles.pulseDot} />}
          {match.time}
        </div>
      </div>

      {/* Main Score Area */}
      <div className={styles.scoreArea}>
        {/* Team 1 */}
        <div className={styles.team}>
          <div className={styles.logoWrapper}>
            <img src={match.team1.logo} alt={match.team1.name} className={styles.logo} />
          </div>
          <span className={styles.teamName}>{match.team1.shortName}</span>
        </div>

        {/* Score */}
        <div className={styles.scoreCenter}>
          <div className={styles.scoreText}>
            {match.team1.score !== null ? match.team1.score : '-'}
            <span className={styles.scoreDivider}>:</span>
            {match.team2.score !== null ? match.team2.score : '-'}
          </div>
        </div>

        {/* Team 2 */}
        <div className={styles.team}>
          <div className={styles.logoWrapper}>
            <img src={match.team2.logo} alt={match.team2.name} className={styles.logo} />
          </div>
          <span className={styles.teamName}>{match.team2.shortName}</span>
        </div>
      </div>

      {/* Events (if any) */}
      {match.events && match.events.length > 0 && (
        <div className={styles.eventsArea}>
          {match.events.slice(-2).map((event, idx) => (
            <div key={idx} className={styles.eventItem}>
              <span className={styles.eventTime}>{event.time}</span>
              <span className={styles.eventPlayer}>{event.player}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer / Actions */}
      <div className={styles.footer}>
        <button 
          className={`${styles.watchedBtn} ${isWatched ? styles.isWatched : ''}`} 
          onClick={handleToggle}
          disabled={loading}
        >
          {isWatched ? (
            <>
              <Check size={14} className={styles.btnIcon} />
              Watched
            </>
          ) : (
            <>
              <Eye size={14} className={styles.btnIcon} />
              Mark as Watched
            </>
          )}
        </button>
      </div>
    </div>
  );
}
