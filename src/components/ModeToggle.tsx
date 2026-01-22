import type { AppMode } from '../types';
import styles from './ModeToggle.module.css';

interface ModeToggleProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className={styles.container}>
      <button
        onClick={() => onChange('invite')}
        className={`${styles.button} ${mode === 'invite' ? styles.buttonActive : ''}`}
      >
        🍺 Ich lade ein
      </button>
      <button
        onClick={() => onChange('split')}
        className={`${styles.button} ${mode === 'split' ? styles.buttonActive : ''}`}
      >
        💸 Kosten teilen
      </button>
    </div>
  );
}
