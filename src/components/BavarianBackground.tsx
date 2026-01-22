import styles from './BavarianBackground.module.css';

/**
 * Dezenter Bayern-Rauten-Hintergrund
 * 
 * Anpassbare Parameter in BavarianBackground.module.css:
 * - --pattern-opacity: Sichtbarkeit der Rauten (0.06–0.12 empfohlen)
 * - --pattern-size: Größe einer Raute (30-50px)
 * - --pattern-blue: Blauton (entsättigt für subtilen Look)
 * - --pattern-white: Off-White Ton
 * - --base-bg: Dunkler Basis-Hintergrund
 */
export default function BavarianBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      {/* Layer 1: Bavarian Diamond Pattern */}
      <div className={styles.pattern} />
      
      {/* Layer 2: Vignette Overlay für Tiefe */}
      <div className={styles.vignette} />
    </div>
  );
}
