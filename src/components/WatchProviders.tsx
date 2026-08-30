import React from 'react';
import styles from './WatchProviders.module.css';
import { ArrowRight } from 'lucide-react';

export default function WatchProviders({ watchData }: { watchData?: any }) {
  if (!watchData || !watchData.results) return null;

  // Defaulting to US for watch providers as it's the most comprehensive list usually.
  const usProviders = watchData.results.US;
  if (!usProviders) return null;

  // Consolidate flatrate, rent, and buy options uniquely by provider_id
  const allProvidersMap = new Map();
  if (usProviders.flatrate) {
    usProviders.flatrate.forEach((p: any) => allProvidersMap.set(p.provider_id, p));
  }
  if (usProviders.rent) {
    usProviders.rent.forEach((p: any) => allProvidersMap.set(p.provider_id, p));
  }
  if (usProviders.buy) {
    usProviders.buy.forEach((p: any) => allProvidersMap.set(p.provider_id, p));
  }

  const allProviders = Array.from(allProvidersMap.values());
  if (allProviders.length === 0) return null;

  const MAX_DISPLAY = 4;
  const displayProviders = allProviders.slice(0, MAX_DISPLAY);
  const remainingCount = allProviders.length - MAX_DISPLAY;
  const link = usProviders.link;

  return (
    <div className={styles.container}>
      <div className={styles.header}>WHERE TO WATCH</div>
      <div className={styles.providerList}>
        {displayProviders.map((provider: any) => (
          <a
            key={provider.provider_id}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.providerIcon}
            title={provider.provider_name}
          >
            <img 
              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
              alt={provider.provider_name} 
              className={styles.iconImage} 
            />
          </a>
        ))}
      </div>
      {remainingCount > 0 && link && (
        <a href={link} target="_blank" rel="noopener noreferrer" className={styles.morePlatforms}>
          and {remainingCount} more platforms <ArrowRight size={14} />
        </a>
      )}
    </div>
  );
}
