import styles from './BavarianBackground.module.css';

/**
 * Bayerisches Rauten-Muster (Bild-basiert)
 * 
 * Anpassbare Parameter in BavarianBackground.module.css:
 * - --pattern-size: Größe des Pattern-Tiles (150-300px, Standard: 200px)
 * - --scrim-opacity: Overlay-Transparenz (0.25-0.4, Standard: 0.3)
 * 
 * Größer/Kleiner: --pattern-size anpassen
 * Mehr Kontrast: --scrim-opacity verringern (z.B. 0.2)
 * Weniger Kontrast: --scrim-opacity erhöhen (z.B. 0.4)
 */
export default function BavarianBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      {/* Layer 1: Bayern-Rauten-Muster (Bild) */}
      <div className={styles.pattern} />
      
      {/* Layer 2: Weißes Scrim für bessere Lesbarkeit */}
      <div className={styles.vignette} />
    </div>
  );
}
