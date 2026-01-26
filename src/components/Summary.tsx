import type { Colleague, AppMode } from '../types';
import { formatEuro } from '../utils/format';
import styles from './Summary.module.css';

interface SummaryProps {
  colleagues: Colleague[];
  mode: AppMode;
  pricePerWurst: number;
  pricePerBrezel: number;
}

export function Summary({ colleagues, mode, pricePerWurst, pricePerBrezel }: SummaryProps) {
  const totalWurst = colleagues.reduce((sum, c) => sum + c.count, 0);
  const totalBrezeln = colleagues.reduce((sum, c) => sum + (c.brezelCount || 0), 0);
  
  // Senf-Berechnung: Pro 2 Würste ca. 45g Senf (Durchschnitt von 40-50g)
  const senfGramsNeeded = Math.ceil(totalWurst / 2) * 45;
  
  // Gläser optimiert berechnen (1ml ≈ 1g für Senf)
  // Bevorzuge 335ml Gläser wenn möglich
  const jar335ml = 335;
  const jar200ml = 200;
  const price335ml = 2.50;
  const price200ml = 2.00;
  
  let jars335 = 0;
  let jars200 = 0;
  let remainingGrams = senfGramsNeeded;
  
  // Fülle mit 335ml Gläsern soweit möglich
  jars335 = Math.floor(remainingGrams / jar335ml);
  remainingGrams = remainingGrams % jar335ml;
  
  // Rest mit 200ml Gläsern auffüllen
  if (remainingGrams > 0) {
    jars200 = Math.ceil(remainingGrams / jar200ml);
  }
  
  const senfPrice = (jars335 * price335ml) + (jars200 * price200ml);
  const totalPrice = (totalWurst * (pricePerWurst || 0)) + (totalBrezeln * (pricePerBrezel || 0)) + (mode === 'split' ? senfPrice : 0);

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

        {totalWurst > 0 && (
          <>
            <div className={`${styles.statRow} ${styles.senfSection}`}>
              <span className={styles.statLabel}>Süßer Senf benötigt:</span>
              <span className={styles.statValue}>{senfGramsNeeded}g</span>
            </div>
            
            {(jars335 > 0 || jars200 > 0) && (
              <div className={styles.senfDetails}>
                {jars335 > 0 && (
                  <div className={styles.senfItem}>
                    {jars335}× 335ml Glas ({formatEuro(jars335 * price335ml)})
                  </div>
                )}
                {jars200 > 0 && (
                  <div className={styles.senfItem}>
                    {jars200}× 200ml Glas ({formatEuro(jars200 * price200ml)})
                  </div>
                )}
              </div>
            )}
          </>
        )}

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
