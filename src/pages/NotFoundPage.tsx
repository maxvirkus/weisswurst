/**
 * NotFoundPage
 * 
 * 404 error page for unmatched routes.
 */

import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>🥨</div>
        <h1 className={styles.title}>404</h1>
        <p className={styles.message}>
          Da ist wohl eine Brezel durchs Netz gefallen!
        </p>
        <p className={styles.submessage}>
          Die Seite, die du suchst, existiert nicht.
        </p>
        <Link to="/" className={styles.homeLink}>
          ← Zur Startseite
        </Link>
      </div>
    </div>
  );
}
