import React from 'react';
import styles from './MovieTickets.module.css';

export default function MovieTickets({ history }: { history: any[] }) {
  const movies = history.filter(h => h.mediaType === 'movie');

  // Generate a deterministic seat number from ID
  const getSeatNumber = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rowChar = String.fromCharCode(65 + (Math.abs(hash) % 26)); // A-Z
    const seatNum = (Math.abs(hash) % 50) + 1; // 1-50
    return `${rowChar}${seatNum}`;
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return "No Rating";
    // scale to 5 stars for display if it's out of 10
    const stars = Math.round(rating / 2);
    return "★".repeat(stars) + "☆".repeat(5 - stars);
  };

  if (movies.length === 0) {
    return (
      <div className={styles.ticketContainer}>
        <h2 className={styles.headerTitle}>🎟️ MOVIE TICKET COLLECTION</h2>
        <p className={styles.headerSub}>You haven't watched any movies yet!</p>
      </div>
    );
  }

  return (
    <div className={styles.ticketContainer}>
      <h2 className={styles.headerTitle} style={{color: 'var(--text-primary)'}}>🎟️ MOVIE TICKET COLLECTION</h2>
      <p className={styles.headerSub} style={{color: 'var(--text-secondary)'}}>Every watched movie becomes a collectible ticket.</p>
      
      <div className={styles.ticketsWrapper}>
        {movies.map(movie => (
          <div key={movie.id} className={styles.ticket}>
            <div className={styles.ticketStub}>
              {movie.poster ? (
                <img src={`https://image.tmdb.org/t/p/w200${movie.poster}`} alt={movie.title} />
              ) : (
                <div className={styles.admitOne}>ADMIT<br/>ONE</div>
              )}
            </div>
            <div className={styles.ticketBody}>
              <div className={styles.ticketHeader}>
                <h3 className={styles.ticketTitle} title={movie.title}>{movie.title}</h3>
                <div className={styles.ticketSeat}>Seat {getSeatNumber(movie.id)}</div>
              </div>
              <div className={styles.ticketDetails}>
                <div>
                  <div className={styles.ticketLabel}>Watched</div>
                  <div className={styles.ticketValue}>
                    {new Date(movie.watchedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className={styles.ticketStars}>
                  {renderStars(movie.rating)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
