import type { Colleague, AppMode } from '../types';
import { formatEuro } from '../utils/format';
import styles from './Summary.module.css';

interface SummaryProps {
  colleagues: Colleague[];
  mode: AppMode;
  pricePerWurst: number;
  pricePerBrezel: number;
  onResetAll: () => void;
}

export function Summary({ colleagues, mode, pricePerWurst, pricePerBrezel, onResetAll }: SummaryProps) {
  const totalWurst = colleagues.reduce((sum, c) => sum + c.count, 0);
  const totalBrezeln = colleagues.reduce((sum, c) => sum + (c.brezelCount || 0), 0);
  const totalPrice = (totalWurst * (pricePerWurst || 0)) + (totalBrezeln * (pricePerBrezel || 0));

  const handleResetAll = () => {
    if (window.confirm('Wirklich alle Zähler auf 0 setzen?')) {
      onResetAll();
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className="truncate">Zusammenfassung</span>
        </h3>
      </div>

      <div className={styles.stats}>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Gesamt Würste:</span>
          <span className={styles.statValue}>{totalWurst}</span>
        </div>

        <div className={styles.statRow}>
          <span className={styles.statLabel}>Gesamt Brezeln:</span>
          <span className={styles.statValue}>{totalBrezeln}</span>
        </div>

        {mode === 'split' && (
          <div className={`${styles.statRow} ${styles.divider}`}>
            <span className={styles.statLabel}>Gesamtkosten:</span>
            <span className={`${styles.statValue} ${styles.statValueGreen}`}>
              {formatEuro(totalPrice)}
            </span>
          </div>
        )}

        {colleagues.length > 0 && (
          <div className={styles.divider}>
            <span className={styles.avgText}>
              Ø {(totalWurst / colleagues.length).toFixed(1)} Würste pro Person
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
